# Backlog

## Import

- [x] Add initial project instructions to `source-material/project-instructions.md`.
- [x] Preserve five Coze skill exports under `source-material/coze-exports/`.
- [x] Preserve career development overview release package and documents under `source-material/files/career-development/`.
- [x] Preserve and extract the Coze web application export.
- [x] Audit the Coze application for stability bottlenecks.
- [x] Publish compatible skill copies under `.agents/skills/`.
- [x] Separate heavy skill resources into the project `knowledge/` layer.
- [x] Add a knowledge catalog and retrieval architecture.
- [ ] Add future uploaded project files to `source-material/files/`.
- [ ] Add important conversation exports or summaries to `source-material/conversations/`.
- [x] Extract initial requirements into `docs/project-spec.md`.

## Reconstruction

- [x] Choose Next.js for the initial independent web application.
- [x] Create an independently runnable application under `apps/web/`.
- [x] Create an independently runnable career development overview application under `apps/career-overview/`.
- [x] Add Render deployment blueprint for the career development overview MVP.
- [x] Add shared Zod schemas for the initial profile, dashboard, and skill APIs.
- [x] Add a provider-neutral OpenAI-compatible model adapter with demo mode.
- [x] Add a first file-based on-demand knowledge retriever and health check.
- [x] Build the first onboarding, dashboard, and four skill pages.
- [x] Add in-place company profile editing with local validation.
- [x] Preserve per-skill drafts and latest results in the browser.
- [x] Add copy and Markdown export for structured skill results.
- [ ] Choose the production database, hosting, background job system, and live-data providers.
- [ ] Implement document ingestion, heading-aware chunking, metadata extraction, and embedding generation.
- [ ] Implement hybrid knowledge retrieval with filtering, reranking, deduplication, and token budgets.
- [ ] Add tenant-isolated knowledge storage and deletion.
- [ ] Add a separate TTL-based live-data store for news and hotspots.
- [ ] Add source-citation capture for topic selection, including source URL/name, publish time, platform, heat/rank when available, and verification status.
- [ ] Add a calendar/seasonal-window provider for festivals, solar terms, policy windows, industry events, and seasonal public-life scenes.
- [ ] Define shared Zod input/output schemas for each skill and API.
- [ ] Implement a provider-neutral Kimi/OpenAI model gateway.
- [ ] Add per-stage deadlines and propagate cancellation to all upstream calls.
- [ ] Choose true SSE streaming or resumable asynchronous jobs per workflow.
- [ ] Add request IDs, structured logs, latency metrics, fallback metrics, and cost tracking.
- [ ] Add bounded retries, exponential backoff, circuit breaking, and provider fallback.
- [ ] Add cache request coalescing and per-user/global concurrency limits.
- [x] Build first skill orchestration for evidence-led hotspot + PR top-five selection.
- [ ] Replace prompt-only topic evidence with live source retrieval, caching, and citation rendering.
- [ ] Build current-day risk alert orchestration with a maximum of three alerts.
- [ ] Add live news/social data providers with citations, caching, retries, and source fallback.
- [ ] Add company onboarding and profile persistence.
- [ ] Build dashboard and dedicated skill pages.
- [ ] Add Kimi/OpenAI-compatible server-side model adapters.
- [ ] Add authentication, plans, usage limits, billing, and an operator console.
- [ ] Create or restore the implementation structure.
- [ ] Rebuild original features.
- [ ] Add missing validation, tests, or QA workflow.

## Hardening

- [x] Document setup and run commands.
- [x] Add verification steps.
- [x] Record major decisions in `docs/decisions.md`.
- [x] Add overseas Chinese invite-only Beta launch plan.
- [ ] Connect a Git remote for the career development overview deployment.
- [ ] Configure Render `DEEPSEEK_API_KEY` and run a public smoke test.
- [ ] Add privacy policy, terms, refund note, and contact channel for the career development overview product.
- [ ] Add access-code or manual paid-unlock flow for deep career modules.
- [ ] Choose the actual overseas hosting provider and region for the first Beta deployment.
- [ ] Add Terms, Privacy Policy, AI disclaimer, and acceptable-use copy.
- [ ] Add invite-only access control before broader Beta promotion.
- [ ] Review imported reference material for outdated claims, licensing, and redistribution rights before commercial launch.
- [ ] Define privacy, retention, moderation, and incident-response policies.
- [ ] Clean up gaps from the imported material.
