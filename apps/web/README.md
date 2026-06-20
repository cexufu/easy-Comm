# 简单传播 Web App

独立运行的“简单传播”第一版应用。

## 当前能力

- 企业资料入驻与本地保存
- 企业资料原地编辑、技能草稿和最近结果本地保存
- 分析结果复制与 Markdown 下载
- 首页舆情风险、技能卡片和近三日热点区域
- 热点选题、舆情分析、受众分析和内容策划页面
- 共享 Zod 输入输出 Schema
- 按任务召回项目根目录 `knowledge/` 中的少量知识片段
- `demo` 与 OpenAI-compatible 模型 Provider
- 服务端模型超时和可识别降级结果
- `/api/health` 知识与模型配置健康检查

## 本地运行

```powershell
cd apps/web
npm install
npm run dev
```

打开 `http://localhost:3000`。

默认 `MODEL_PROVIDER=demo`，无需 API Key。

## 接入模型

复制 `.env.example` 为 `.env.local`，配置：

```dotenv
MODEL_PROVIDER=openai-compatible
MODEL_BASE_URL=https://api.openai.com/v1
MODEL_API_KEY=your-key
MODEL_NAME=your-model
```

Kimi 等兼容 OpenAI Chat Completions 的服务可以通过对应的 Base URL 与模型名接入。API Key 只能保存在服务端环境变量中。

## 验证

```powershell
npm run typecheck
npm run build
npm audit
```

健康检查：

```text
GET /api/health
```

## 当前限制

- Dashboard 仍使用明确标记的演示热点，不代表实时事实。
- 文件检索器是第一版关键词检索，后续将替换为 PostgreSQL/pgvector 混合检索。
- 尚未加入账号、数据库、真实热点数据、支付和运营后台。
