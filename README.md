# 简单传播 Easy Comm

中文 AI 公关传播工作台，面向企业创始人、品牌团队、公关团队和内容运营，帮助用户完成热点选题、舆情分析、受众分析和内容策划。

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/cexufu/easy-Comm)

## 当前定位

- 中文界面。
- 海外部署优先。
- 100 个邀请用户以内先做 Web Beta。
- 不做国内应用商店、小程序、公开自助注册或自动媒体分发。

## 应用入口

```text
apps/web
```

核心能力：

- 企业资料入驻与本地保存
- 首页风险提示、能力入口和行业热点区域
- 热点选题、舆情分析、受众分析、内容策划
- 基于 `knowledge/` 的轻量知识召回
- OpenAI-compatible 模型接入，默认使用 DeepSeek `deepseek-v4-flash`
- `/api/health` 健康检查

## 本地运行

```powershell
cd apps/web
npm install
npm.cmd run dev
```

打开：

```text
http://localhost:3000
```

## 环境变量

复制 `.env.example` 为 `apps/web/.env.local`，或在部署平台配置同名环境变量。

```dotenv
MODEL_PROVIDER=openai-compatible

MODEL_BASE_URL=https://api.deepseek.com
MODEL_API_KEY=
MODEL_NAME=deepseek-v4-flash
MODEL_TIMEOUT_MS=45000
KNOWLEDGE_MAX_CHUNKS=5
KNOWLEDGE_MAX_CHARS=12000
```

切换真实模型时：

```dotenv
MODEL_PROVIDER=openai-compatible
MODEL_BASE_URL=https://api.openai.com/v1
MODEL_API_KEY=your-server-side-key
MODEL_NAME=your-model
```

不要把真实 API Key 提交到 GitHub。

## 验证

```powershell
cd apps/web
npm.cmd run typecheck
npm.cmd run build
```

部署后检查：

```text
GET /api/health
```

预期 `status` 为 `ok`，并且 `knowledge.collections` 大于 `0`。

## Docker 部署

从仓库根目录构建：

```powershell
docker build -t easy-comm-beta .
```

Demo 模式运行：

```powershell
docker run --rm -p 3000:3000 -e MODEL_PROVIDER=demo easy-comm-beta
```

生产模型运行：

```powershell
docker run --rm -p 3000:3000 `
  -e MODEL_PROVIDER=openai-compatible `
  -e MODEL_BASE_URL=https://api.openai.com/v1 `
  -e MODEL_API_KEY=your-server-side-key `
  -e MODEL_NAME=your-model `
  easy-comm-beta
```

## 上线说明

详见：

- [docs/launch-beta.md](docs/launch-beta.md)
- [docs/render-deploy.md](docs/render-deploy.md)
