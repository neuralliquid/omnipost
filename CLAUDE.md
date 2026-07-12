# OmniPost — Claude Code Context

**Publish everywhere, manage anywhere.**

OmniPost is an AI-assisted content publishing product.

- Canonical repository: `neuralliquid/omnipost`
- Package manager: pnpm
- Deployment target: Azure Web Apps

## Startup

1. Read `AGENTS.md` and `QUALITY_GATES.md`.
2. Read `docs/agents/mvp-launch-engineer.md` for MVP, deployment, demo, telemetry, and funding-evidence work.
3. Check Baton for an existing OmniPost task before creating duplicate work.

## Quick Commands

```bash
pnpm dev
pnpm check-all
pnpm test
pnpm lint:fix
pnpm db:generate
```

## Architecture

- Next.js 16 App Router + React 19
- TypeScript strict mode; do not introduce `any`
- Prisma with PostgreSQL
- Zod validation
- JWT authentication; `isAuthenticated()` is asynchronous
- CSS Modules and functional components
- Jest and React Testing Library
- Azure Web Apps, Bicep, and GitHub Actions

## Critical Rules

1. Always `await isAuthenticated()`.
2. Validate external input with Zod.
3. Sanitize user-controlled content.
4. Apply rate limiting to public endpoints.
5. Never expose stack traces or credentials.
6. Use App Router conventions for new routes.
7. Run `pnpm check-all` before claiming completion.

## Specialist routing

- Product implementation and launch gate: repository-local MVP Launch Engineer.
- Funding applications and opportunity readiness: Baton Funding Operations Agent.
- Public claims, screenshots, links, demos, and evidence: Baton Evidence and Claims Auditor.
- AI/cloud spend and forecasts: Baton FinOps and Runway Analyst.

## MVP constraint

Prioritise one reliable workflow:

content input → AI adaptation → human review → one verified publish or export path → visible result and audit record.

Do not expand to broad platform parity, complex billing, enterprise SSO, or full unattended automation before the launch gate passes.

## Baton Integration

Baton is the shared task graph for cross-repository work. When available, check for existing work at the start, keep the task updated with meaningful findings and blockers, and record changed files, verification, deployment evidence, residual risk, next action, and funding impact before handoff.

## References

- `AGENTS.md`
- `AGENT_TEAMS.md`
- `QUALITY_GATES.md`
- `docs/agents/mvp-launch-engineer.md`
- `.agentkit/spec/`
- `.github/copilot-instructions.md`

Generated Cursor, Windsurf, Copilot, and Retort mirrors should be regenerated from their source specifications after authoritative guidance changes; do not maintain contradictory copies manually.
