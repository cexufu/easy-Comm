# Render 部署与 API Key 填写指南

## 目标

把 GitHub 仓库 `cexufu/easy-Comm` 部署成一个海外可访问的 Web Beta。

默认配置使用 DeepSeek 的 OpenAI-compatible 接口，创建 Blueprint 时只需要填写 `MODEL_API_KEY`。

## 一键导入部署

1. 打开 Render Dashboard。
2. 选择 `New`。
3. 选择 `Blueprint`。
4. 连接 GitHub 账号。
5. 选择仓库 `cexufu/easy-Comm`。
6. Render 会读取仓库根目录的 `render.yaml`。
7. 在 `MODEL_API_KEY` 中填写你的 DeepSeek API Key。
8. 等待构建完成，打开 Render 分配的服务 URL。

部署完成后访问：

```text
https://你的服务地址/api/health
```

正常结果应包含：

```json
{
  "status": "ok",
  "modelProvider": "openai-compatible"
}
```

## 填入 DeepSeek API Key

默认已经配置：

```dotenv
MODEL_PROVIDER=openai-compatible
MODEL_BASE_URL=https://api.deepseek.com
MODEL_NAME=deepseek-v4-flash
```

进入 Render Dashboard：

1. 打开服务 `easy-comm-beta`。
2. 进入 `Environment`。
3. 填写或更新以下变量。

```dotenv
MODEL_API_KEY=你的 API Key
MODEL_TIMEOUT_MS=90000
MODEL_MAX_TOKENS=12000
MODEL_RETRY_ATTEMPTS=2
KNOWLEDGE_MAX_CHUNKS=5
KNOWLEDGE_MAX_CHARS=12000
```

保存后，Render 会自动重新部署或提示手动 redeploy。

## OpenAI-Compatible 示例

OpenAI：

```dotenv
MODEL_PROVIDER=openai-compatible
MODEL_BASE_URL=https://api.openai.com/v1
MODEL_API_KEY=sk-...
MODEL_NAME=你的模型名
```

Kimi / Moonshot：

```dotenv
MODEL_PROVIDER=openai-compatible
MODEL_BASE_URL=https://api.moonshot.cn/v1
MODEL_API_KEY=你的 Moonshot API Key
MODEL_NAME=你的 Kimi 模型名
```

DeepSeek：

```dotenv
MODEL_PROVIDER=openai-compatible
MODEL_BASE_URL=https://api.deepseek.com
MODEL_API_KEY=你的 DeepSeek API Key
MODEL_NAME=deepseek-v4-flash
MODEL_TIMEOUT_MS=90000
MODEL_MAX_TOKENS=12000
MODEL_RETRY_ATTEMPTS=2
```

请以模型服务商控制台显示的最新模型名为准。

## 重要提醒

- 不要把真实 API Key 写进 GitHub。
- API Key 只填在 Render 的 Environment 里。
- 第一次部署直接使用 DeepSeek，确认 `MODEL_API_KEY` 填在 Render Environment 中。
- 如果切换真实模型后 `/api/health` 报错，优先检查 `MODEL_BASE_URL`、`MODEL_API_KEY`、`MODEL_NAME` 是否完整。

## 当前 Beta 边界

- 中文界面。
- 海外 Web Beta。
- 邀请制使用。
- 不做国内小程序、国内应用商店、公开自助注册或自动媒体分发。
