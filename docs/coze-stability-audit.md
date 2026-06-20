# Coze 项目稳定性审计

审计日期：2026-06-13  
审计对象：`source-material/files/coze-webapp-20260613/`

## 结论

当前项目的“卡住”并非单一模型性能问题，而是请求编排、前后端数据契约和故障处理共同造成的。

该版本适合保留页面结构和产品流程作为参考，但不建议直接作为付费产品后端上线。最稳妥的方案是保留前端意图，重新实现模型网关、任务编排、缓存、契约校验和可观测性。

## 主要根因

### P0：后端是假流式，用户长时间看不到进度

前端按流式响应读取：

- `src/hooks/use-api-stream.ts:79`

但 API 路由会先在服务端完整消费模型流，将全部内容拼接为字符串，再解析并一次性返回 JSON：

- `src/app/api/topics/route.ts:131`
- `src/app/api/topics/route.ts:134`
- `src/app/api/topics/route.ts:157`

其他模型接口使用相同模式。搜索和模型生成期间浏览器收不到任何数据，因此界面只能持续显示加载状态。

### P0：前后端响应契约不一致，成功结果也会被丢弃

热点选题后端返回 `{ "topics": [...] }`，前端只接受裸数组：

- `src/app/api/topics/route.ts:157`
- `src/app/topics/page.tsx:87`
- `src/app/topics/page.tsx:102`

策划接口输出对象形式的 `timeline`，前端只接受数组：

- `src/app/api/planning/route.ts:78`
- `src/app/planning/page.tsx:122`

策划页面发送 `requirements`，后端读取 `customRequirements`：

- `src/app/planning/page.tsx:175`
- `src/app/api/planning/route.ts:52`

受众反馈后端输出 `audienceGroups`，前端读取 `groupFeedbacks`：

- `src/app/api/audience/route.ts:107`
- `src/app/audience/page.tsx:112`

舆情后端输出 `overview.index`，前端读取 `overview.score`：

- `src/app/api/sentiment/route.ts:91`
- `src/app/sentiment/page.tsx:100`

舆情后端将 `relatedContent` 输出为对象，前端按数组处理。结果是部分字段始终为空。

### P0：上游调用没有可靠的服务端超时和取消传播

首页先等待网络搜索，再等待完整模型生成：

- `src/app/api/dashboard/route.ts:22`
- `src/app/api/dashboard/route.ts:91`

搜索和模型调用均没有明确的服务端截止时间。前端会在首页 30 秒、技能页 45 秒时中止：

- `src/app/page.tsx:80`
- `src/hooks/use-api-stream.ts:49`

浏览器中止请求后，取消信号没有传递给 Coze SDK，服务端仍可能继续搜索和生成，消耗连接、算力和额度。

### P1：客户端超时是总时长超时，不是无活动超时

`useApiStream` 在请求开始时设置固定计时器，不会在收到 chunk 后刷新。即使以后实现真实流式，只要总时间超过 45 秒，也会在正常输出过程中被强制中断。

### P1：缓存可能触发并发刷新风暴

`getPRKnowledge()` 在缓存失效时对每次请求都调用后台 `refreshCache()`：

- `src/lib/knowledge-helper.ts:56`

没有共享中的刷新 Promise 或互斥锁。多个用户同时请求时，可能并发触发相同知识库检索。

此外项目中同时存在 `knowledge-helper.ts` 与 `knowledge-cache.ts` 两套缓存实现，状态和刷新逻辑不统一。

知识库使用 `Promise.race` 实现表面超时：

- `src/lib/knowledge-helper.ts:88`

但它没有真正取消底层 SDK 请求，超时任务仍可能在后台占用资源。

### P1：首页自动执行高成本串行链路

用户资料加载后，首页立即执行“实时搜索 → 模型分析”。这使首次进入页面天然依赖两个外部服务，并增加冷启动、网络抖动和并发高峰的影响。

首页热点适合优先读取缓存结果，再在后台刷新，而不是让每位用户同步生成一份。

### P1：JSON 输出不稳定且错误被掩盖

所有接口依赖模型输出严格 JSON，然后直接 `JSON.parse(fullResponse)`。没有共享 Schema、结构化输出约束或可靠修复流程。

解析失败时多数接口返回通用 fallback，前端仍会显示“生成完成”：

- `src/app/topics/page.tsx:125`
- `src/app/planning/page.tsx:161`
- `src/app/audience/page.tsx:132`
- `src/app/sentiment/page.tsx:133`

这会把真实故障伪装成成功，导致问题难以定位。

### P1：实时数据降级会生成不真实内容

搜索失败后，首页会返回模板化“近期热点”，但用户无法清楚区分它们与真实检索结果。实时热点和舆情产品不应将静态模板伪装成当前事实。

搜索词还硬编码了 `2026`：

- `src/app/api/dashboard/route.ts:21`
- `src/app/api/sentiment/route.ts:24`

跨年后会直接影响结果质量。

### P2：缺少生产运行保护

当前实现未体现以下生产能力：

- 用户级限流和并发限制
- 请求幂等与任务去重
- 429/5xx 分类重试与指数退避
- 熔断器和供应商健康状态
- 请求 ID、阶段耗时、错误类型和 Token 成本记录
- 异步任务队列和任务状态恢复
- 模型供应商切换及降级策略

付费用户增加后，这些缺口会放大卡顿、重复扣费和雪崩风险。

## 重构方案

### 1. 建立统一数据契约

- 为每个功能建立共享的 Zod 输入和输出 Schema。
- API、前端组件、模型结构化输出共用同一套类型。
- 返回统一信封：`{ requestId, status, data, warnings, sources }`。
- 只有通过 Schema 校验后才显示“完成”。

### 2. 分离实时数据和模型分析

- 数据层负责检索、去重、时间校验、来源保存和缓存。
- 模型只分析已经结构化的数据，不负责伪造或猜测热点。
- 搜索失败时返回 `degraded` 状态和缓存数据，不生成假热点。

### 3. 使用真实流式或异步任务

短任务使用真正的 SSE/NDJSON，服务器收到模型 chunk 后立即转发。

热点、舆情等复合任务优先使用异步任务：

1. 创建任务并立即返回 `jobId`。
2. 按阶段更新 `searching`、`analyzing`、`validating`、`completed`。
3. 页面订阅进度或轮询状态。
4. 刷新页面后可以恢复任务，不必重新扣费生成。

### 4. 为每一层设置预算

- 搜索：5-8 秒。
- 知识检索：2-3 秒。
- 模型首 Token：10-15 秒。
- 单次模型总时长：45-60 秒。
- 整体任务：按功能设置硬截止时间。
- 将取消信号从浏览器传到任务、搜索和模型客户端。

### 5. 有边界地重试和降级

- 仅对网络错误、429 和部分 5xx 重试。
- 最多重试两次，使用指数退避和随机抖动。
- JSON 校验失败只允许一次低温度修复。
- 供应商连续失败时触发熔断，并切换备用模型。
- 不对参数错误、内容安全拒绝和确定性 4xx 重试。

### 6. 缓存与并发控制

- 三日热点按日期、行业和地区缓存。
- 首页使用 stale-while-revalidate，优先秒开旧缓存。
- 同一缓存键只允许一个刷新任务，其他请求复用结果。
- 限制单用户和全局并发，避免刷新与重复点击产生任务风暴。

### 7. 建立模型网关

- 业务代码不直接依赖 Coze、Kimi 或 OpenAI SDK。
- 使用统一 Provider 接口管理模型、超时、重试、结构化输出和用量。
- 主模型失败时可切换 Kimi/OpenAI 兼容供应商。
- 模型名称和当前年份不得硬编码在业务路由中。

### 8. 增加可观测性

每次请求至少记录：

- `requestId`、用户和功能
- 搜索、知识库、排队、模型首 Token、模型总时长
- 模型、Token、估算成本和供应商请求 ID
- 超时、取消、重试、Schema 失败和降级原因

监控 P50/P95 延迟、成功率、超时率、fallback 率和单次成本。

## 推荐迁移顺序

1. 固化五个功能的输入输出 Schema。
2. 实现模型 Provider 网关和超时/取消机制。
3. 实现热点数据层、来源缓存和去重。
4. 先重建热点选题端到端链路。
5. 再重建舆情、受众和内容策划。
6. 最后增加账号、额度、支付和运营后台。

