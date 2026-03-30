# OmniPost Product Marketing Context

This document provides foundational product context for all marketing skills.
AI agents should read this before using any marketing skill.

## Product Identity

- **Name**: OmniPost
- **Tagline**: "Publish everywhere, manage anywhere"
- **Category**: SaaS Multi-Platform Content Publishing
- **Type**: B2B/B2C web application
- **License**: MIT (open-source)
- **Live Demo**: https://nl-dev-omnipost-app-euw.azurewebsites.net

## Target Users

| Segment | Description | Primary Need |
|---|---|---|
| Content Creators | Bloggers, writers, indie creators | Publish once, distribute everywhere |
| Marketing Teams | 2-10 person teams at startups/SMBs | Centralized content operations |
| SMBs | Small businesses managing social presence | Time savings, consistency |
| Social Media Managers | Freelancers and agencies | Multi-client, multi-platform management |

## Core Capabilities

### Content Publishing
- Multi-platform publishing (Facebook, Instagram, LinkedIn, Twitter, Custom)
- Platform-specific content adaptation (character limits, hashtags, threading)
- Campaign management (draft → scheduled → active → completed)
- Content scheduling and queue management
- Human review workflows with approval gates

### AI-Powered Features
- Text summarization (Hugging Face, Azure AI, OpenAI)
- Text parsing and extraction (DeepSeek, OpenAI, Azure)
- AI image generation (Hugging Face Stable Diffusion, DALL-E)
- Content quality scoring

### CRM & Growth
- Lead management with scoring and tagging
- Outreach sequences (email, LinkedIn, SMS)
- Form builder with lead capture
- Engagement analytics and metrics tracking

## Platform Constraints

| Platform | Character Limit | Capabilities | Rate Limit |
|---|---|---|---|
| Twitter | 280 chars | Text, images, threading | 300/15min, 2400/day |
| LinkedIn | 3,000 chars | Text, images, articles | 100/day |
| Facebook | 63,206 chars | Text, images, video | 200/hour |
| Instagram | 2,200 chars | Images, video, stories | 200/hour |
| Custom | Configurable | Configurable | 1000/hour |

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript (strict), CSS Modules
- **Backend**: Next.js API Routes, Express 5
- **Database**: Prisma 7 ORM, SQLite (dev) / PostgreSQL (prod)
- **Auth**: JWT with bcrypt
- **Validation**: Zod schemas
- **AI**: OpenAI, DeepSeek, Azure AI Foundry, Hugging Face
- **Infrastructure**: Azure Web Apps, Bicep IaC, GitHub Actions CI/CD
- **Notifications**: Slack, Twilio SMS, Nodemailer email

## Integrations

| Integration | Purpose | Status |
|---|---|---|
| Hugging Face | Image generation, summarization | Active |
| OpenAI | Text parsing | Active |
| DeepSeek | Text parsing (alternative) | Active |
| Azure AI Foundry | Chat completion, image gen, embeddings | Active |
| Airtable | Data storage and tracking | Active |
| Slack | Team notifications | Active |
| Twilio | SMS notifications | Active |
| Nodemailer | Email notifications | Active |
| Upstash Redis | Rate limiting cache | Active |
| Sluice Gateway | AI cost tracking and routing | Planned |

## Pricing Model

**Status: TBD** — Pricing strategy not yet defined.

Potential models to evaluate (use pricing-strategy skill):
- Freemium with platform limits
- Per-seat for teams
- Usage-based on AI generations
- Tiered by number of connected platforms

## Competitive Landscape

**Direct Competitors**: Buffer, Hootsuite, Later, Sprout Social
**Indirect Competitors**: Canva (content creation), Mailchimp (email), HubSpot (all-in-one)

**Differentiation**:
- AI-native content optimization (summarization, image gen, quality scoring)
- Open-source with self-hosting option
- Built-in CRM and lead management
- 34 marketing skills embedded in development workflow
- Developer-first extensibility

## Brand Voice

- **Tone**: Professional yet approachable, technically confident
- **Style**: Clear, direct, benefit-focused
- **Personality**: Efficient, empowering, modern
- **Avoid**: Jargon-heavy, overpromising, corporate-speak

## Current Goals

1. **Primary**: Drive developer adoption and community contributions
2. **Secondary**: Convert free users to paid plans (pricing TBD)
3. **Metric**: Monthly active publishers, content published per user
4. **Conversion Action**: Sign up → connect first platform → publish first content
