# OmniPost Tool Registry Overlay

Maps MarketingSkills tool references to OmniPost's actual integrations.
AI agents should check this before suggesting external tool integrations.

## Integrated Tools

### Social Publishing

| Tool          | OmniPost Component        | File Path                                              |
| ------------- | ------------------------- | ------------------------------------------------------ |
| Facebook API  | Platform adapter          | `lib/config/platforms.ts`, `lib/scheduler/adapters.ts` |
| Instagram API | Platform adapter          | `lib/config/platforms.ts`, `lib/scheduler/adapters.ts` |
| LinkedIn API  | Full client + prospecting | `lib/integrations/linkedin.ts`                         |
| Twitter API   | Platform adapter          | `lib/config/platforms.ts`, `lib/scheduler/adapters.ts` |

### Email & Messaging

| Tool          | OmniPost Component | File Path                               |
| ------------- | ------------------ | --------------------------------------- |
| Nodemailer    | Email sending      | `lib/services/` (nodemailer dependency) |
| Slack Web API | Team notifications | `@slack/web-api` dependency             |
| Twilio        | SMS notifications  | `twilio` dependency                     |

### CRM & Leads

| Tool               | OmniPost Component | File Path                             |
| ------------------ | ------------------ | ------------------------------------- |
| Lead Management    | Prisma Lead model  | `app/api/leads/`, `types/lead.ts`     |
| Lead Scoring       | Scoring engine     | `lib/scoring/lead-scorer.ts`          |
| Outreach Sequences | Sequence engine    | `lib/sequences/`, `types/sequence.ts` |
| Form Builder       | Prisma Form model  | `app/api/forms/`, `types/survey.ts`   |

### Analytics & Metrics

| Tool               | OmniPost Component      | File Path                                                  |
| ------------------ | ----------------------- | ---------------------------------------------------------- |
| Engagement Metrics | Built-in tracking       | `app/api/engagement-metrics/`, `data/engagementMetrics.ts` |
| Platform Analytics | Per-platform engagement | `types/campaign.ts` (PlatformEngagement)                   |
| Content Scoring    | Quality validator       | `data/automationTools.json` (quality-validator)            |

### AI Services

| Tool             | OmniPost Component         | File Path                                         |
| ---------------- | -------------------------- | ------------------------------------------------- |
| OpenAI           | Text parsing               | `app/api/parse/`, `lib/services/parse-service.ts` |
| DeepSeek         | Text parsing (alt)         | `lib/services/parse-service.ts`                   |
| Azure AI Foundry | Chat, images, embeddings   | `lib/clients/azure-ai-foundry.ts`                 |
| Hugging Face     | Image gen, summarization   | `lib/clients/huggingface.ts`                      |
| Sluice Gateway   | AI routing & cost tracking | `lib/clients/sluice-gateway.ts` (planned)         |

### Content Management

| Tool             | OmniPost Component   | File Path                                      |
| ---------------- | -------------------- | ---------------------------------------------- |
| Content Storage  | Prisma Content model | `app/api/content/store/`                       |
| Content Tracking | Airtable integration | `app/api/content/track/`                       |
| Scheduling       | Job scheduler        | `lib/scheduler/`, `app/api/scheduler/`         |
| Queue Management | Job queue            | `lib/scheduler/queue.ts`, `app/api/queue/`     |
| Review Workflow  | Review process       | `data/reviewConfig.json`, `components/review/` |

### Infrastructure

| Tool          | OmniPost Component | File Path                                        |
| ------------- | ------------------ | ------------------------------------------------ |
| Rate Limiting | Upstash Redis      | `app/api/_utils/rateLimit.ts`                    |
| Feature Flags | Flag system        | `lib/featureFlags.ts`, `data/feature-flags.json` |
| Audit Logging | Audit trail        | `app/api/_utils/audit.ts`                        |
| Auth          | JWT + bcrypt       | `app/api/_utils/auth.ts`, `lib/auth/`            |

## Not Yet Integrated

The following tools from the MarketingSkills registry are NOT yet available in OmniPost. Agents should note these as potential future integrations:

### Analytics

- Google Analytics 4 (GA4)
- Mixpanel, Amplitude, PostHog
- Hotjar, Plausible
- Segment, Supermetrics

### SEO

- Google Search Console
- Semrush, Ahrefs
- DataForSEO, Keywords Everywhere, SimilarWeb

### CRM (External)

- HubSpot, Salesforce, Close
- Apollo, ZoomInfo, Hunter
- Intercom

### Email Marketing

- Mailchimp, SendGrid, Customer.io
- Resend, Postmark, Klaviyo
- Beehiiv, Brevo, ActiveCampaign

### Advertising

- Google Ads, Meta Ads
- LinkedIn Ads, TikTok Ads

### Payments

- Stripe, Paddle

### Other

- Zapier, Calendly, Typeform
- Buffer, Clearbit, Optimizely
- G2, Trustpilot, Pendo

## Usage Notes

When a MarketingSkills skill references a tool:

1. Check this overlay first for an existing OmniPost integration
2. If integrated, reference the file path and use existing code patterns
3. If not integrated, note the gap and suggest it as a future enhancement
4. Use Sluice gateway for any new AI service integrations (when enabled)
