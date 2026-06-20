# Project Specification

## Original Project

- Working name: 简单传播
- Source: User-provided prompt and five Coze skill exports.
- Import status: Initial prompt and skills imported on 2026-06-13.

## Purpose

Build a stable, sellable web application that helps companies discover relevant communication topics, assess public-opinion risk, analyze audiences, and create communication plans with large language models.

## Target Users

- Company founders, brand teams, PR teams, and content operators.
- Users need useful recommendations without mastering prompt engineering or public-relations frameworks.
- Initial onboarding collects company name, industry, city, and primary communication goal.

## Core Workflows

1. Onboard a company and persist its profile.
2. Show up to three current public-opinion risk alerts; hide the section when no material risk exists.
3. Generate the five best-fit topic opportunities by combining the hotspot pool with PR evaluation.
4. Analyze public opinion using current topic evidence and the public-opinion framework.
5. Analyze a target audience or proposed content using Chameleon.
6. Generate a communication/content plan from the user's requirements.
7. Show relevant industry hotspots from the latest three days, regardless of positive or negative sentiment.

## Features

- Dashboard with risk alerts, skill cards, and three-day industry hotspots.
- Dedicated subpage and structured result layout for each skill.
- Card-based topic presentation and sectioned audience-analysis presentation.
- Users can edit the active company profile without clearing their workspace.
- Skill inputs and the latest structured result are preserved locally per skill.
- Structured results can be copied or downloaded as Markdown.
- Initial skill set:
  - `trend-hotspot-pool`
  - `pr-expert`
  - `public-opinion-analyst`
  - `chameleon`
  - `content-creation-expert`
- Model-provider integration must support at least one production LLM and should allow Kimi/OpenAI provider switching.
- The first independent application lives in `apps/web/` and can run without external API keys in an explicitly labeled demo mode.

## Constraints

- Interface should be concise, practical, and lightly Apple-inspired rather than decorative.
- Skills must remain lightweight; large rules, cases, templates, and domain references live in the independent knowledge layer and are retrieved on demand.
- Current-event outputs require live, attributable sources and must not invent heat metrics.
- Audience simulation is predictive analysis, not a substitute for real user research.
- Public-opinion and compliance conclusions must separate facts, assumptions, and uncertain claims.
- API keys must remain server-side and outside source control.

## Assumptions

- The first release is a multi-page responsive web app, not a direct Coze runtime migration.
- Company profile data will be passed into skills at runtime rather than written into skill files.
- The five imported skills are domain instructions; the product still needs orchestration, data sourcing, persistence, authentication, billing, and deployment.
- General knowledge, tenant-private knowledge, and live data are separate stores with different permissions and freshness rules.
- The first public-accessible Beta can use a Chinese interface while being hosted outside mainland China as an invite-only overseas Web Beta.
- Before 100 invited users, the product will avoid mainland hosting, mainland CDN, domestic app stores, mini programs, open self-serve signup, and automated public content distribution.

## Open Questions

- Which model provider and deployment region should be the production default?
- What countries and languages are in scope for the first paid release?
- What payment method, pricing model, and usage limits should be used?
- Which live data providers are acceptable for social and news hotspot coverage?

## Career Development Overview Product

- Working name: 职业发展总览
- Source: User-provided release package and product documents imported on 2026-06-19 under `source-material/files/career-development/`.
- Implementation: `apps/career-overview/`
- Product shape: no-build Node.js web application with static pages and a server-side DeepSeek API proxy.

### Purpose

Help users turn resumes, goals, and career anxiety into a structured `career_profile`, then use that profile to generate a short overview and deeper analysis across career direction, study/major planning, and ability mapping.

### Core Workflows

1. Upload or paste a resume and provide age, current goal, target direction, and anxiety/context.
2. Generate a structured `career_profile` and short career development overview.
3. Open one of three deeper modules: career direction analysis, study and major recommendation, or ability map.
4. Ask follow-up questions using the generated profile and report context.

### Constraints

- API keys remain server-side and outside source control.
- Resume content is sensitive personal information and should not be stored long-term without explicit user authorization.
- Generated advice is for career development reference only and must not promise employment, admission, salary growth, transfer success, or psychological counseling outcomes.
- MVP launch uses manual or semi-manual payment validation before adding full payment automation.
