# Overseas Chinese Beta Launch Plan

## Launch Positioning

- Product language: Chinese.
- First launch shape: overseas-hosted, invite-only Web Beta.
- Initial audience: Chinese-speaking founders, PR teams, content operators, and overseas business teams.
- Initial user cap: fewer than 100 invited users before filing or domestic app-store work.
- Public positioning: "AI 企业传播工作台" and "出海/全球中文企业传播助手".

Avoid public claims that the product is a domestic public-opinion platform, automated news publisher, media distribution service, or official compliance engine.

## Deployment Boundaries

- Host outside mainland China, such as Singapore, Hong Kong, Japan, or the US.
- Do not use mainland China cloud servers, mainland CDN acceleration, mini programs, domestic app stores, or public Chinese app distribution during the Beta.
- Keep registration invite-only. Prefer manual account opening or shared Beta access links before adding self-serve signup.
- Keep the product as analysis, drafting, and export. Do not add one-click publishing, mass distribution, or automated media posting before a separate compliance review.
- Add clear user-facing copy that generated content is for reference and must be reviewed by the user before external publication.

## Recommended Technical Path

1. Deploy `apps/web` as a Next.js Node app.
2. Start with `MODEL_PROVIDER=demo` for smoke testing.
3. Switch to an OpenAI-compatible provider after the deployment and health check pass.
4. Configure only server-side environment variables:

```dotenv
MODEL_PROVIDER=openai-compatible
MODEL_BASE_URL=https://api.openai.com/v1
MODEL_API_KEY=your-server-side-key
MODEL_NAME=your-model
MODEL_TIMEOUT_MS=45000
KNOWLEDGE_MAX_CHUNKS=5
KNOWLEDGE_MAX_CHARS=12000
```

## Docker Deployment

Build from the repository root:

```powershell
docker build -t simple-pr-beta .
```

Run in demo mode:

```powershell
docker run --rm -p 3000:3000 -e MODEL_PROVIDER=demo simple-pr-beta
```

Run with a production model:

```powershell
docker run --rm -p 3000:3000 `
  -e MODEL_PROVIDER=openai-compatible `
  -e MODEL_BASE_URL=https://api.openai.com/v1 `
  -e MODEL_API_KEY=your-server-side-key `
  -e MODEL_NAME=your-model `
  simple-pr-beta
```

The Docker image sets `KNOWLEDGE_WORKSPACE_ROOT=/app`, so the deployed server can find the bundled `knowledge/` directory.

## Verification

Run before every deploy:

```powershell
cd apps/web
npm.cmd run typecheck
npm.cmd run build
```

Check after deployment:

```text
GET /api/health
```

Expected result:

- `status` is `ok`.
- `modelProvider` is `demo` or the configured provider.
- `knowledge.collections` is greater than `0`.
- The home page loads in Chinese.
- Each workflow page can submit a request and return a structured result.

## Pre-Paid-Beta Checklist

- [ ] Choose hosting region and platform.
- [ ] Confirm the domain does not require mainland ICP filing for the selected hosting setup.
- [ ] Configure environment variables in the hosting platform.
- [ ] Add a private feedback channel for invited users.
- [ ] Prepare Terms, Privacy Policy, AI disclaimer, and acceptable-use copy.
- [ ] Keep a manual list of invited users and organizations.
- [ ] Review imported knowledge files for licensing and outdated claims before commercial promotion.
