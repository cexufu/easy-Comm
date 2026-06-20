# Decisions

Record important project decisions here.

## 2026-06-08: Initialize Codex Reconstruction Workspace

Context: The original ChatGPT Project URL is private and cannot be directly read from Codex.

Decision: Create a structured Codex workspace with import, specification, backlog, and decision tracking files.

Consequence: Reconstruction can begin as soon as the original project instructions, files, or conversation summaries are provided.

## 2026-06-13: Publish Coze Skills as Repository Skills

Context: The user provided five Coze project exports containing reusable skill instructions and reference material.

Decision: Preserve the original archives under `source-material/coze-exports/` and publish compatible copies under `.agents/skills/`.

Consequence: Codex can discover and iterate on the skills while the source exports remain available for comparison and recovery.

## 2026-06-13: Pass Company Context at Runtime

Context: The original PR skill expected users to edit and delete template files before use, which is incompatible with a multi-tenant web product.

Decision: Keep templates immutable and pass each user's company profile to skills at runtime.

Consequence: User data remains separate from skill definitions and can later be stored in the application database.

## 2026-06-13: Require Attributable Current-Event Data

Context: Hotspot and public-opinion features depend on changing external information, and some sources may be unavailable.

Decision: Require live source verification, allow documented source fallback, and prohibit invented popularity metrics.

Consequence: The product needs a production data-source and citation layer before its current-event features are complete.

## 2026-06-13: Rebuild the AI Orchestration Layer

Context: The imported Coze web application uses buffered pseudo-streaming, inconsistent client/server response shapes, incomplete upstream cancellation, and silent fallback behavior.

Decision: Preserve the imported application as source material and UI reference, but rebuild the production AI orchestration layer around shared schemas, a provider-neutral model gateway, explicit time budgets, real streaming or resumable jobs, caching, and observability.

Consequence: Migration will focus first on one stable end-to-end workflow rather than directly deploying the exported Coze backend.

## 2026-06-13: Separate Skills from Knowledge

Context: The imported skills bundled hundreds of kilobytes of rules, cases, templates, and reference material, making full-context invocation slow and difficult to maintain.

Decision: Keep `.agents/skills/` limited to lightweight workflows and retrieval instructions. Store reusable source knowledge under `knowledge/`, described by `knowledge/catalog.json`, and retrieve only task-relevant chunks within explicit context budgets.

Consequence: Knowledge can be indexed, updated, cached, permissioned, and audited independently of skill releases. Tenant-private and live data will use separate stores.

## 2026-06-13: Start with an Independently Runnable Next.js Application

Context: The Coze export is useful as product reference but its backend contracts and request lifecycle are not suitable for production.

Decision: Build a clean Next.js application under `apps/web/` with shared Zod schemas, a provider-neutral OpenAI-compatible model adapter, on-demand knowledge retrieval, explicit demo mode, and health checks.

Consequence: Product development can proceed independently of Coze. Real providers, persistence, live data, authentication, and billing can be added without replacing the user interface again.

## 2026-06-13: Preserve First-Release Work Locally

Context: Early users need to move between workflows without losing drafts or generated output, before account persistence is available.

Decision: Store the company profile, per-skill drafts, and the latest validated skill response in browser local storage. Allow users to copy or download results as Markdown.

Consequence: The MVP has a useful work-preservation loop without prematurely choosing a production database. Local storage remains a temporary single-browser solution and will be replaced by tenant-isolated persistence.

## 2026-06-19: Launch First as an Overseas Chinese Invite-Only Beta

Context: The product should keep a Chinese interface because the initial users are Chinese-speaking, but the first launch should avoid mainland filing and domestic app-store review work while the user count is below 100.

Decision: Treat the first accessible release as an overseas-hosted, invite-only Web Beta for Chinese-speaking users. Do not use mainland hosting, mainland CDN, domestic app stores, mini programs, open self-serve signup, or automated public content distribution during this phase.

Consequence: The product can validate demand with a smaller compliance surface. A separate mainland launch plan will be needed before domestic hosting, app distribution, large-scale mainland promotion, or public publishing/distribution features.

## 2026-06-19: Launch Career Development Overview as a Node Web App

Context: The user provided a separate career development product release package containing a Node server, static pages, DeepSeek integration, and launch documentation.

Decision: Preserve the release package as source material and publish the runnable product under `apps/career-overview/`. Use Render Web Service deployment first, with `render.yaml` defining the service root, build command, start command, and required environment variables.

Consequence: The product can be tested locally and deployed as a public web service without creating a native app or mobile app first. Public deployment still requires a Git remote, a Render account, and a server-side `DEEPSEEK_API_KEY`.
