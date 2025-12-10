# CRM & Outreach Module Documentation

This document describes the new CRM, Lead Management, and Outreach Sequence features added to OmniPost for the Phoenix Strategy implementation.

## Table of Contents

1. [Overview](#overview)
2. [Lead Management](#lead-management)
3. [Outreach Sequences](#outreach-sequences)
4. [Survey & Form Collection](#survey--form-collection)
5. [LinkedIn Prospecting](#linkedin-prospecting)
6. [API Reference](#api-reference)
7. [Configuration](#configuration)

---

## Overview

The Phoenix Strategy requires a comprehensive lead generation and nurturing system. OmniPost now includes:

| Feature | Status | Description |
|---------|--------|-------------|
| Lead Database/CRM | ✅ Implemented | Full lead management with scoring and tagging |
| Cold Outreach Sequences | ✅ Implemented | Multi-step drip campaigns |
| LinkedIn Prospecting | ✅ Implemented | Profile import and automation |
| Survey/Form Collection | ✅ Implemented | Lead capture forms with scoring |
| Lead Scoring/Tagging | ✅ Implemented | Automatic and manual scoring |
| Drip Campaign Automation | ✅ Implemented | Time-based sequence execution |

---

## Lead Management

### Data Model

Each lead contains:

```typescript
interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  title?: string;
  contact: {
    email?: string;
    phone?: string;
    linkedinUrl?: string;
    twitterHandle?: string;
  };
  company?: {
    name: string;
    industry?: string;
    size?: string;  // '1-10', '11-50', '51-200', '201-500', '500+'
  };
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost' | 'nurturing';
  temperature: 'cold' | 'warm' | 'hot';
  score: LeadScore;
  source: LeadSource;
  tags: string[];
  interactions: LeadInteraction[];
  activeSequences: string[];
}
```

### Lead Scoring

Leads are automatically scored on a 0-100 scale based on:

| Category | Max Points | Factors |
|----------|------------|---------|
| Demographic | 25 | Contact info completeness, company data, industry match |
| Behavioral | 30 | Email engagement, LinkedIn activity, calls, meetings |
| Engagement | 25 | Content views, form submissions, survey responses |
| Recency | 20 | Time since last interaction |

Score grades:
- **A (80-100)**: Hot lead, prioritize immediately
- **B (60-79)**: Warm lead, follow up soon
- **C (40-59)**: Needs nurturing
- **D (20-39)**: Low engagement
- **F (0-19)**: Cold or inactive

### API Endpoints

```
GET    /api/leads              - List leads with filters
POST   /api/leads              - Create new lead
GET    /api/leads/:id          - Get lead details
PATCH  /api/leads/:id          - Update lead
DELETE /api/leads/:id          - Delete lead
POST   /api/leads/:id/interactions - Add interaction
GET    /api/leads/tags         - List tags
POST   /api/leads/tags         - Create tag
POST   /api/leads/bulk         - Bulk operations
```

---

## Outreach Sequences

### Sequence Structure

A sequence is a series of automated steps executed over time:

```typescript
interface Sequence {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  steps: SequenceStep[];
  schedule: {
    sendingDays: string[];  // ['monday', 'tuesday', ...]
    sendingHours: { start: '09:00', end: '17:00' };
    maxPerDay: number;
  };
  stopOnReply: boolean;
  stopOnBounce: boolean;
}
```

### Step Types

| Type | Description | Configuration |
|------|-------------|---------------|
| `email` | Send automated email | Subject, body, tracking |
| `linkedin_connection` | Send connection request | Optional message |
| `linkedin_message` | Send LinkedIn message | Message template |
| `linkedin_view_profile` | View prospect's profile | (no config needed) |
| `wait` | Pause for specified time | Duration, unit (days/hours) |
| `task` | Create manual task | Title, assignee, due date |
| `call` | Schedule call reminder | Script, duration |
| `condition` | Branch based on action | Condition type, branches |

### Sequence Templates

Pre-built templates available:

1. **Cold Outreach**
   - LinkedIn profile view
   - Wait 1 day
   - LinkedIn connection request
   - Wait 3 days
   - Email introduction
   - Wait 2 days
   - Follow-up email
   - Wait 3 days
   - LinkedIn message

2. **Warm Follow-up**
   - Email check-in
   - Wait 2 days
   - Call task
   - Wait 3 days
   - Email with value proposition

3. **Re-engagement**
   - Email "We miss you"
   - Wait 5 days
   - LinkedIn message
   - Wait 7 days
   - Final email

### API Endpoints

```
GET    /api/sequences              - List sequences
POST   /api/sequences              - Create sequence
GET    /api/sequences/:id          - Get sequence details
PATCH  /api/sequences/:id          - Update sequence
DELETE /api/sequences/:id          - Delete sequence
GET    /api/sequences/:id/enrollments - List enrollments
POST   /api/sequences/:id/enrollments - Enroll leads
```

---

## Survey & Form Collection

### Form Types

| Type | Use Case |
|------|----------|
| `form` | Lead capture, contact forms |
| `survey` | Customer feedback, NPS |
| `quiz` | Assessment, qualification |
| `poll` | Quick opinions |

### Field Types

- Text, Email, Phone, Number, Textarea
- Select, Multi-select, Radio, Checkbox
- Date, Time, DateTime
- Rating, NPS Scale, Matrix
- File Upload
- Hidden fields

### Lead Capture Integration

Forms can automatically:
1. Create a new lead from submissions
2. Add tags based on responses
3. Enroll in sequences
4. Update existing lead data

### API Endpoints

```
GET    /api/forms              - List forms
POST   /api/forms              - Create form
GET    /api/forms/:id          - Get form (supports ?public=true)
PATCH  /api/forms/:id          - Update form
DELETE /api/forms/:id          - Delete form
GET    /api/forms/:id/submissions - List submissions
POST   /api/forms/:id/submissions - Submit form (public)
```

---

## LinkedIn Prospecting

### Features

1. **Profile Import**: Import leads from LinkedIn profiles
2. **Search Integration**: Search and import from LinkedIn (requires Sales Navigator)
3. **Connection Automation**: Automated connection requests (with safety limits)
4. **Message Automation**: Personalized message sequences

### Configuration

```typescript
// Initialize LinkedIn client
import { linkedInClient } from '@/lib/integrations/linkedin';

linkedInClient.initialize({
  accessToken: process.env.LINKEDIN_ACCESS_TOKEN,
  clientId: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  redirectUri: 'https://omnipost.nexamesh.ai/api/auth/linkedin/callback',
});
```

### Safety Limits

| Action | Daily Limit | Notes |
|--------|-------------|-------|
| Profile Views | 100 | Configurable |
| Connection Requests | 25 | LinkedIn enforced |
| Messages | 50 | Only to connections |

### Data Captured

- Profile ID, name, headline
- Current position and company
- Location, connections count
- Skills, education
- Profile picture URL

---

## API Reference

### Authentication

All API endpoints require authentication via JWT token:

```
Authorization: Bearer <token>
```

### Common Response Format

```json
{
  "data": { ... },
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "hasMore": true
  }
}
```

### Error Response

```json
{
  "error": "Error message",
  "errors": ["Additional details"]  // For validation errors
}
```

### Filtering Examples

```bash
# Filter leads by status
GET /api/leads?status=qualified&status=proposal

# Filter by temperature and score
GET /api/leads?temperature=hot&scoreMin=80

# Search leads
GET /api/leads?search=john

# Filter sequences by status
GET /api/sequences?status=active
```

---

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Airtable Tables for CRM
AIRTABLE_LEADS_TABLE=Leads
AIRTABLE_TAGS_TABLE=LeadTags
AIRTABLE_LISTS_TABLE=LeadLists
AIRTABLE_INTERACTIONS_TABLE=LeadInteractions
AIRTABLE_SEQUENCES_TABLE=Sequences
AIRTABLE_STEPS_TABLE=SequenceSteps
AIRTABLE_ENROLLMENTS_TABLE=SequenceEnrollments
AIRTABLE_EMAIL_TEMPLATES_TABLE=EmailTemplates
AIRTABLE_LINKEDIN_TEMPLATES_TABLE=LinkedInTemplates
AIRTABLE_FORMS_TABLE=Forms
AIRTABLE_FORM_FIELDS_TABLE=FormFields
AIRTABLE_SUBMISSIONS_TABLE=FormSubmissions

# LinkedIn Integration (Optional)
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_ACCESS_TOKEN=your_access_token
```

### Feature Flags

Control features via `data/feature-flags.json`:

```json
{
  "leadManagement": {
    "enabled": true,
    "scoring": true,
    "tagging": true,
    "lists": true
  },
  "outreachSequences": {
    "enabled": true,
    "emailAutomation": true,
    "linkedinAutomation": false,
    "maxSequences": 10,
    "maxStepsPerSequence": 20
  },
  "surveyForms": {
    "enabled": true,
    "leadCapture": true,
    "nps": true,
    "maxFormsPerUser": 50
  },
  "linkedinProspecting": {
    "enabled": false,
    "searchEnabled": false,
    "importEnabled": true,
    "automationEnabled": false
  }
}
```

### Airtable Schema

Create these tables in your Airtable base:

#### Leads Table
| Field | Type | Notes |
|-------|------|-------|
| FirstName | Single line text | Required |
| LastName | Single line text | Required |
| Email | Email | |
| Phone | Phone | |
| LinkedInUrl | URL | |
| CompanyName | Single line text | |
| Status | Single select | new, contacted, qualified, etc. |
| Temperature | Single select | cold, warm, hot |
| ScoreData | Long text | JSON |
| Tags | Long text | Comma-separated |
| CreatedAt | Date | ISO string |

#### Sequences Table
| Field | Type | Notes |
|-------|------|-------|
| Name | Single line text | Required |
| Description | Long text | |
| Status | Single select | draft, active, paused, etc. |
| Schedule | Long text | JSON |
| Metrics | Long text | JSON |
| CreatedAt | Date | |
| CreatedBy | Single line text | |

---

## Next Steps

1. **UI Components**: Build React components for lead management and sequence builder
2. **Email Integration**: Connect with SendGrid/Mailgun for email automation
3. **Analytics Dashboard**: Create reporting views for sequence performance
4. **LinkedIn OAuth**: Implement full OAuth flow for LinkedIn integration
