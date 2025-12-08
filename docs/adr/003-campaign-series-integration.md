# ADR 003: Campaign and Series Integration Architecture

> **Status**: Accepted
> **Date**: December 2025
> **Decision Makers**: Development Team
> **Technical Area**: Architecture / Feature Design

---

## Context

The OmniPost needs to support multi-platform social media campaigns (Twitter, LinkedIn, etc.) that distribute content from the existing Series infrastructure. The question is whether these should be:

1. **One unified feature** - Series includes built-in campaign management
2. **Separate features that combine** - Series manages content, Campaigns manage distribution

### Current State

```
Series (Content Organization)
├── title, description, topics
├── status: planning | in-progress | completed | paused
├── localStorage persistence
└── No connection to platforms

Platform Infrastructure (Distribution)
├── Twitter, LinkedIn, Facebook, Instagram, Custom
├── Queue system with batch publishing
├── API authentication framework
└── No connection to content organization
```

### Requirements

1. Create and manage Twitter/social media campaigns
2. Link campaigns to content series
3. Schedule posts across multiple platforms
4. Track engagement metrics per campaign
5. Support campaign templates and adaptation

---

## Decision

We will implement **separate features that combine** with a clear relationship model:

```
┌─────────────────────────────────────────────────────────────┐
│                        CAMPAIGN                             │
│  (Distribution Strategy)                                    │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │   Series    │    │   Series    │    │   Content   │    │
│  │  (linked)   │    │  (linked)   │    │   (direct)  │    │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    │
│         │                  │                  │            │
│         └──────────────────┴──────────────────┘            │
│                            │                               │
│                    ┌───────┴───────┐                       │
│                    │   Schedule    │                       │
│                    └───────┬───────┘                       │
│                            │                               │
│         ┌──────────────────┼──────────────────┐           │
│         ▼                  ▼                  ▼           │
│    ┌─────────┐       ┌─────────┐       ┌─────────┐       │
│    │ Twitter │       │LinkedIn │       │ Other   │       │
│    └─────────┘       └─────────┘       └─────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Rationale

1. **Single Responsibility**: Series manages content organization, Campaigns manage distribution
2. **Flexibility**: Can have campaigns without series (direct content) or series without campaigns
3. **Scalability**: Add new platforms without changing Series structure
4. **Reusability**: Campaign logic works for any content source
5. **Testability**: Each feature can be tested independently

---

## Data Model

### Campaign Type

```typescript
interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';

  // Content Sources
  seriesIds: string[]; // Links to Series
  contentItems: CampaignContent[]; // Direct content pieces

  // Platform Configuration
  platforms: CampaignPlatform[];

  // Scheduling
  schedule: CampaignSchedule;

  // Metrics
  metrics: CampaignMetrics;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

interface CampaignContent {
  id: string;
  type: 'series-article' | 'standalone' | 'thread' | 'announcement';
  sourceId?: string; // Reference to Series content
  title: string;
  body: string;
  adaptations: PlatformAdaptation[];
}

interface PlatformAdaptation {
  platformId: string;
  content: string; // Platform-specific version
  mediaUrls?: string[];
  hashtags?: string[];
  scheduledTime?: Date;
  status: 'pending' | 'scheduled' | 'published' | 'failed';
  publishedAt?: Date;
  engagementMetrics?: PlatformEngagement;
}

interface CampaignPlatform {
  platformId: string;
  enabled: boolean;
  config: {
    postFrequency: 'hourly' | 'daily' | 'weekly' | 'custom';
    bestTimes?: string[]; // Optimal posting times
    hashtagStrategy?: string[];
    threadEnabled?: boolean; // For Twitter threads
  };
}

interface CampaignSchedule {
  startDate: Date;
  endDate?: Date;
  timezone: string;
  posts: ScheduledPost[];
}

interface ScheduledPost {
  id: string;
  contentId: string;
  platformId: string;
  scheduledTime: Date;
  status: 'pending' | 'queued' | 'published' | 'failed';
}

interface CampaignMetrics {
  totalPosts: number;
  publishedPosts: number;
  failedPosts: number;
  platformMetrics: Record<string, PlatformEngagement>;
}

interface PlatformEngagement {
  impressions: number;
  engagements: number;
  clicks: number;
  shares: number;
  comments: number;
}
```

### Series Extension (Minimal Change)

```typescript
// Extend existing Series interface
interface Series {
  // ... existing fields

  // New optional field for campaign linking
  campaignIds?: string[];
}
```

---

## Architecture

### Component Structure

```
app/(dashboard)/
├── campaigns/
│   ├── page.tsx              # Campaign list
│   ├── [id]/
│   │   └── page.tsx          # Campaign detail/edit
│   ├── new/
│   │   └── page.tsx          # Create campaign
│   ├── CampaignList.tsx      # Client: List with filters
│   ├── CampaignForm.tsx      # Client: Create/Edit form
│   ├── CampaignDetail.tsx    # Client: Detail view
│   ├── ContentSelector.tsx   # Client: Select series/content
│   ├── PlatformConfig.tsx    # Client: Configure platforms
│   ├── ScheduleBuilder.tsx   # Client: Build schedule
│   └── actions.ts            # Server Actions

components/campaigns/
├── CampaignCard.tsx          # Display card
├── CampaignStatus.tsx        # Status badge
├── PlatformPreview.tsx       # Preview per platform
├── ContentAdaptation.tsx     # Edit adaptations
├── ScheduleCalendar.tsx      # Visual schedule
└── MetricsDashboard.tsx      # Campaign analytics
```

### State Management

```typescript
// hooks/useCampaign.ts
interface UseCampaignReturn {
  campaigns: Campaign[];
  selectedCampaign: Campaign | null;
  isLoading: boolean;
  error: string | null;

  // CRUD
  createCampaign: (campaign: Partial<Campaign>) => Promise<Campaign>;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<Campaign>;
  deleteCampaign: (id: string) => Promise<void>;

  // Content Management
  addSeriesToCampaign: (campaignId: string, seriesId: string) => Promise<void>;
  removeSeries: (campaignId: string, seriesId: string) => Promise<void>;
  addContent: (campaignId: string, content: CampaignContent) => Promise<void>;

  // Platform Management
  togglePlatform: (campaignId: string, platformId: string) => Promise<void>;
  updatePlatformConfig: (campaignId: string, platformId: string, config: any) => Promise<void>;

  // Scheduling
  schedulePost: (campaignId: string, post: ScheduledPost) => Promise<void>;
  reschedulePost: (campaignId: string, postId: string, newTime: Date) => Promise<void>;

  // Publishing
  publishNow: (campaignId: string, contentIds?: string[]) => Promise<void>;
  pauseCampaign: (campaignId: string) => Promise<void>;
  resumeCampaign: (campaignId: string) => Promise<void>;
}
```

### API Routes

| Route                          | Method | Purpose                     |
| ------------------------------ | ------ | --------------------------- |
| `/api/campaigns`               | GET    | List campaigns with filters |
| `/api/campaigns`               | POST   | Create campaign             |
| `/api/campaigns/[id]`          | GET    | Get campaign detail         |
| `/api/campaigns/[id]`          | PATCH  | Update campaign             |
| `/api/campaigns/[id]`          | DELETE | Delete campaign             |
| `/api/campaigns/[id]/publish`  | POST   | Publish campaign content    |
| `/api/campaigns/[id]/schedule` | POST   | Schedule posts              |
| `/api/campaigns/[id]/metrics`  | GET    | Get campaign metrics        |

---

## Integration Points

### Series → Campaign Flow

```
1. User creates Series with content
   └── Series stored in localStorage/backend

2. User creates Campaign
   └── Selects existing Series to include
   └── OR creates standalone content

3. User configures platforms
   └── Enable/disable Twitter, LinkedIn, etc.
   └── Set platform-specific settings

4. User creates content adaptations
   └── Auto-generate from series content
   └── Edit for platform-specific requirements
   └── Add hashtags, media, threads

5. User schedules posts
   └── Visual calendar interface
   └── Best-time suggestions
   └── Bulk scheduling

6. System publishes
   └── Queue items at scheduled times
   └── Use existing queue/approve system
   └── Track results and metrics
```

### Platform Connector Integration

```typescript
// Leverage existing infrastructure
import { publishQueue } from '@/lib/api-client';

async function publishCampaignContent(campaign: Campaign, contentIds: string[]) {
  const queueItems = contentIds.flatMap(contentId => {
    const content = campaign.contentItems.find(c => c.id === contentId);
    return (
      content?.adaptations
        .filter(a => a.status === 'scheduled')
        .map(adaptation => ({
          platform: getPlatformById(adaptation.platformId),
          content: {
            id: content.id,
            title: content.title,
            description: adaptation.content,
          },
        })) || []
    );
  });

  return publishQueue(queueItems);
}
```

---

## UI/UX Flow

### Campaign Creation Wizard

```
Step 1: Basic Info
├── Name, Description
├── Tags
└── Duration (start/end dates)

Step 2: Content Selection
├── Select from existing Series
├── Add standalone content
└── Import from external sources

Step 3: Platform Setup
├── Enable platforms (Twitter, LinkedIn, etc.)
├── Configure per-platform settings
└── Set posting frequency

Step 4: Content Adaptation
├── Auto-generate platform versions
├── Edit individual adaptations
├── Preview per platform
└── Add media/hashtags

Step 5: Scheduling
├── Calendar view
├── Drag-and-drop scheduling
├── Best time suggestions
└── Bulk schedule options

Step 6: Review & Launch
├── Preview all scheduled posts
├── Validate configurations
└── Launch or save as draft
```

### Series Page Integration

```
Series Page
├── Existing: List of series
├── NEW: "Create Campaign" button per series
├── NEW: Campaign status indicators
└── NEW: Quick metrics preview
```

---

## Migration & Rollout

### Phase 1: Foundation

- Create Campaign types and interfaces
- Implement useCampaign hook with localStorage
- Add feature flag: `campaignManagement`

### Phase 2: Basic UI

- Campaign list and detail pages
- Create/Edit campaign forms
- Series selection interface

### Phase 3: Platform Integration

- Content adaptation editor
- Platform-specific previews
- Publishing integration

### Phase 4: Scheduling

- Schedule builder UI
- Calendar visualization
- Automated publishing queue

### Phase 5: Analytics

- Campaign metrics dashboard
- Per-platform analytics
- Performance comparison

---

## Consequences

### Positive

- **Clear separation of concerns**: Content organization vs. distribution
- **Flexible**: Mix series content with standalone posts
- **Extensible**: Easy to add new platforms
- **Trackable**: Campaign-level metrics and analytics
- **Reusable**: Platform infrastructure already exists

### Negative

- **More complex data model**: Campaigns add a layer of abstraction
- **UI complexity**: Need campaign management interface
- **Storage requirements**: Campaign data needs persistence

### Risks & Mitigations

| Risk                  | Likelihood | Impact | Mitigation                       |
| --------------------- | ---------- | ------ | -------------------------------- |
| Data model complexity | Medium     | Medium | Start with MVP, iterate          |
| Platform API limits   | High       | High   | Implement rate limiting, queuing |
| Schedule conflicts    | Medium     | Low    | Validation in scheduler          |
| Storage growth        | Low        | Medium | Implement archiving              |

---

## Technical Considerations

### Storage Strategy

For MVP, use localStorage like Series:

```typescript
// Simple approach matching existing pattern
const STORAGE_KEY = 'content-campaigns';
```

For production, extend to Airtable:

```typescript
// Airtable tables
Campaigns: id, name, status, config, ...
CampaignContent: id, campaignId, content, adaptations, ...
CampaignSchedule: id, campaignId, platformId, scheduledTime, status, ...
```

### Feature Flag

```json
{
  "campaignManagement": {
    "enabled": true,
    "features": {
      "twitterThreads": true,
      "linkedInArticles": true,
      "scheduling": true,
      "analytics": true
    }
  }
}
```

---

## Related Documents

- [ADR 001: App Router Migration](./001-app-router-migration.md)
- [ADR 002: Airtable Backend](./002-airtable-backend.md)
- Platform Configuration: `lib/config/platforms.ts`
- Series Types: `types/series.ts`

---

## Changelog

| Date    | Author           | Change                          |
| ------- | ---------------- | ------------------------------- |
| 2025-12 | Development Team | Initial proposal and acceptance |
