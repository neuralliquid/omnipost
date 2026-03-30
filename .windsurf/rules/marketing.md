# Marketing Team Rules

**Scope:** `.agents/skills/**`, `app/api/leads/**`, `app/api/forms/**`, `app/api/sequences/**`, `app/api/engagement-metrics/**`, `lib/scoring/**`, `lib/sequences/**`, `lib/engagement-worker/**`

Marketing automation -- lead scoring, email sequences, engagement metrics, and agent skills.

## API Endpoints

All marketing API routes follow the same security requirements as the backend team:

- ALWAYS use `await isAuthenticated()`.
- ALWAYS validate input with Zod schemas.
- ALWAYS sanitize user input with DOMPurify.
- ALWAYS apply rate limiting with `withRateLimit`.

## Lead Management

- Lead scoring algorithms live in `lib/scoring/`.
- Lead API endpoints in `app/api/leads/`.
- Form handling in `app/api/forms/`.
- All lead data must be validated and sanitized before storage.

## Email Sequences

- Sequence logic in `lib/sequences/`.
- Sequence API endpoints in `app/api/sequences/`.
- Support A/B testing, personalization, and timing optimization.
- Track delivery, open, and click metrics.

## Engagement

- Engagement metrics API in `app/api/engagement-metrics/`.
- Background processing in `lib/engagement-worker/`.
- Track scoring, triggers, retention, and reactivation.

## Agent Skills

Skills are defined as Markdown files in `.agents/skills/` organized by category:

- **Lead Management** (6 skills): scoring, qualification, routing, nurturing, enrichment, segmentation
- **Email Sequences** (6 skills): builder, optimization, ab-testing, personalization, timing, analytics
- **Content Strategy** (6 skills): calendar, ideation, repurposing, seo, distribution, performance
- **Engagement** (6 skills): scoring, triggers, retention, reactivation, feedback, surveys
- **Campaign Management** (5 skills): planning, execution, budgeting, reporting, attribution
- **Analytics** (5 skills): funnel-analysis, cohort-analysis, roi-calculator, dashboard, forecasting

## TypeScript

- Strict mode enforced. No `any` types.
- Define explicit types for scoring models and sequence configurations.
