# Project Context — OmniPost

> **Document Status:** Phase 0 Discovery Output
> **Confidence Summary:** High for explicit items, Medium for inferred items

---

## Project Purpose & Primary Business Goals

| Item | Source | Confidence |
|------|--------|------------|
| AI-powered multi-platform content publishing platform | Explicit (README) | High |
| Streamline content workflows from creation to publication | Explicit (README) | High |
| Enable seamless publishing across all major social platforms | Explicit (README) | High |
| Intelligent content adaptation per platform requirements | Explicit (README) | High |
| Enterprise-ready security and audit capabilities | Explicit (README) | High |

### Core Value Proposition
> "Publish everywhere, manage anywhere" — One platform for multi-platform content distribution with AI-powered automation.

---

## Target Users / Personas

| Persona | Description | Source |
|---------|-------------|--------|
| Content Creators | Individual creators managing presence across multiple platforms | Explicit (README) |
| Marketing Teams | Teams requiring coordinated multi-platform campaigns | Explicit (README) |
| SMBs | Small-to-medium businesses needing efficient content distribution | Explicit (README) |
| Social Media Managers | Professionals managing client accounts across platforms | Explicit (README) |

---

## Key User Journeys

### Primary Journeys (Explicit)
1. **Content Creation → Multi-Platform Publishing**
   - Create content once, adapt automatically for each platform
   - Review adaptations, approve, and publish simultaneously

2. **Human-in-the-Loop Review Workflow**
   - Draft → Review → Approval → Schedule → Publish
   - Quality control checkpoints before publication

3. **AI-Assisted Content Enhancement**
   - Text summarization for different platform character limits
   - Image generation via Hugging Face integration
   - Content optimization suggestions

### Supporting Journeys (Inferred)
- **Campaign/Series Management:** Organize related content into series (Medium confidence)
- **Performance Analytics:** Track engagement across platforms (Medium confidence)
- **Lead Management:** CRM-style outreach capabilities (Inferred from `/docs/CRM_OUTREACH.md`)

---

## Business Constraints

| Constraint | Details | Source |
|------------|---------|--------|
| Performance | API responses < 2 seconds | Explicit (CLAUDE.md) |
| Security | OWASP Top 10 compliance required | Explicit (CLAUDE.md) |
| Accessibility | WCAG 2.1 AA target (gaps exist) | Explicit (CLAUDE.md) |
| Browser Support | Modern browsers (last 2 versions) | Explicit (CLAUDE.md) |
| Mobile | Responsive design required | Explicit (CLAUDE.md) |
| Infrastructure | Azure-hosted, single-instance (no Redis) | Explicit (README) |

---

## Success Metrics

| Metric | Status | Notes |
|--------|--------|-------|
| Publishing efficiency (time saved) | _Hypothetical_ | No explicit KPIs documented |
| Platform coverage (# platforms) | Explicit | Facebook, Instagram, LinkedIn, Twitter, custom |
| Test coverage | Explicit | Currently 66% (target not specified) |
| API response time | Explicit | < 2 seconds |
| Uptime/availability | _Unknown_ | Not documented |
| User adoption/retention | _Unknown_ | Not documented |

---

## Technical Context Summary

- **Framework:** Next.js 14 (Hybrid Pages + App Router migration)
- **Language:** TypeScript 5.3 (strict mode)
- **Styling:** CSS Modules + Global CSS
- **Deployment:** Azure Web Apps with Bicep IaC
- **Authentication:** JWT-based with middleware
- **Data Storage:** Airtable (primary)

---

## Internal Reasoning Notes

**Assumptions:**
- Success metrics inferred as hypothetical due to absence of explicit KPIs
- CRM outreach capabilities inferred from docs directory presence
- Performance analytics inferred from "Performance Dashboard" feature mention

**Alternative Interpretations Considered:**
- "Enterprise-ready" could imply multi-tenant; however, no multi-tenancy evidence found
- Platform APIs could be direct integrations or aggregator service; appears to be direct

**Confidence Drivers:**
- README.md comprehensive and well-structured (High confidence for explicit items)
- CLAUDE.md provides detailed technical constraints (High confidence)
- Business KPIs not formally documented (Medium-Low confidence for metrics)
