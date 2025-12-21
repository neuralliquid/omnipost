# Component Inventory — OmniPost

> **Document Status:** Phase 1 Discovery Output
> **Source:** Extracted from `/components/ui/` and `/styles/` directories

---

## UI Primitives (`/components/ui/`)

### Layout Components

| Component | File         | CSS Module          | Purpose                         | Classification  |
| --------- | ------------ | ------------------- | ------------------------------- | --------------- |
| Layout    | `Layout.tsx` | `Layout.module.css` | Page wrapper with header/footer | **Intentional** |
| Header    | `Header.tsx` | `Header.module.css` | Site navigation header          | **Intentional** |
| Footer    | `Footer.tsx` | `Footer.module.css` | Site footer                     | **Intentional** |
| Hero      | `Hero.tsx`   | (uses globals)      | Landing page hero section       | **Intentional** |

### Form Components

| Component      | File                 | CSS Module             | Purpose              | Classification  |
| -------------- | -------------------- | ---------------------- | -------------------- | --------------- |
| LoginForm      | `LoginForm.tsx`      | `LoginForm.module.css` | Authentication form  | **Intentional** |
| Authentication | `Authentication.tsx` | None                   | Auth wrapper/context | **Inferred**    |

### Feedback Components

| Component          | File                     | CSS Module                      | Purpose                    | Classification  |
| ------------------ | ------------------------ | ------------------------------- | -------------------------- | --------------- |
| LoadingState       | `LoadingState.tsx`       | `LoadingState.module.css`       | Loading spinner/indicator  | **Intentional** |
| ErrorMessage       | `ErrorMessage.tsx`       | `ErrorMessage.module.css`       | Error display              | **Intentional** |
| NotificationSystem | `NotificationSystem.tsx` | `NotificationSystem.module.css` | Toast/notification display | **Intentional** |

### Domain Components

| Component      | File                 | CSS Module                  | Purpose                     | Classification  |
| -------------- | -------------------- | --------------------------- | --------------------------- | --------------- |
| AuditTrail     | `AuditTrail.tsx`     | `AuditTrail.module.css`     | Activity/audit log display  | **Intentional** |
| WorkflowStage  | `WorkflowStage.tsx`  | `WorkflowStage.module.css`  | Workflow step visualization | **Intentional** |
| AdaptationCard | `AdaptationCard.tsx` | `AdaptationCard.module.css` | Content adaptation preview  | **Intentional** |

### Utility Components

| Component            | File                       | CSS Module | Purpose               | Classification |
| -------------------- | -------------------------- | ---------- | --------------------- | -------------- |
| NavigationLinks      | `NavigationLinks.tsx`      | None       | Nav link collection   | **Inferred**   |
| MobileResponsiveness | `MobileResponsiveness.tsx` | None       | Mobile layout handler | **Inferred**   |

---

## Feature Components (from CSS modules)

Components inferred from CSS module files in `/styles/`:

| Component         | CSS Module                     | Likely Location                  | Classification  |
| ----------------- | ------------------------------ | -------------------------------- | --------------- |
| Dashboard         | `dashboard.module.css`         | `/components/features/` or pages | **Intentional** |
| Campaign          | `Campaign.module.css`          | `/components/features/`          | **Intentional** |
| Series            | `Series.module.css`            | `/components/features/`          | **Intentional** |
| Sequences         | `Sequences.module.css`         | `/components/features/`          | **Intentional** |
| Leads             | `Leads.module.css`             | `/components/features/`          | **Intentional** |
| HumanReview       | `HumanReview.module.css`       | `/components/features/`          | **Intentional** |
| ContentAdaptation | `ContentAdaptation.module.css` | `/components/features/`          | **Intentional** |
| PlatformSelector  | `PlatformSelector.module.css`  | `/components/features/`          | **Intentional** |
| Automation        | `Automation.module.css`        | `/components/features/`          | **Intentional** |
| PhoenixDashboard  | `PhoenixDashboard.module.css`  | `/components/features/`          | **Inferred**    |
| MainLayout        | `MainLayout.module.css`        | `/components/layouts/`           | **Intentional** |
| ErrorBoundary     | `ErrorBoundary.module.css`     | `/components/`                   | **Intentional** |

---

## Component Patterns Observed

### Card Pattern

Used across multiple components with consistent structure:

```css
.card {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
```

**Found in:** `shared.module.css`, `dashboard.module.css`

### Section Pattern

```css
.section {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

**Found in:** `globals.css`, `shared.module.css`

### Button Pattern

Primary button styling:

```css
.button {
  background-color: #4a6491;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.button:hover {
  background-color: #3b5177;
}
```

**Found in:** `LoginForm.module.css`, `dashboard.module.css`, `globals.css`

### Error State Pattern

```css
.error {
  background-color: #fee2e2;
  border: 1px solid #fecaca;
  border-left: 4px solid #ef4444;
  color: #991b1b;
  padding: 1rem;
  border-radius: 4px;
}
```

**Found in:** `ErrorMessage.module.css`, `LoginForm.module.css`, `dashboard.module.css`

### Grid Pattern

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}
```

**Found in:** `shared.module.css`, `dashboard.module.css`, `globals.css`

---

## Component Variants

### Button Variants (Inferred)

| Variant   | Background    | Text  | Usage          |
| --------- | ------------- | ----- | -------------- |
| Primary   | `#4a6491`     | white | Main actions   |
| Info/Hero | `#3498db`     | white | CTAs, links    |
| Disabled  | (50% opacity) | -     | Inactive state |

### Input Variants (Inferred)

| State    | Border    | Background | Shadow                           |
| -------- | --------- | ---------- | -------------------------------- |
| Default  | `#d1d5db` | white      | none                             |
| Focus    | `#3b82f6` | white      | `0 0 0 2px rgba(59,130,246,0.2)` |
| Disabled | `#d1d5db` | `#f3f4f6`  | none                             |

---

## Missing/Recommended Components

Based on common UI patterns not found in inventory:

| Component          | Priority | Notes                                        |
| ------------------ | -------- | -------------------------------------------- |
| Button (primitive) | High     | Currently inline styles; should be extracted |
| Input (primitive)  | High     | Currently in LoginForm; should be extracted  |
| Select             | Medium   | No dropdown component found                  |
| Modal/Dialog       | Medium   | Not evident in CSS                           |
| Tooltip            | Low      | Not evident in CSS                           |
| Tabs               | Low      | Not evident in CSS                           |
| Badge              | Low      | Exists in shared.module.css but no component |
| Avatar             | Low      | Not evident in CSS                           |

---

## Component–CSS Coupling Analysis

### Well-Coupled (Component + Module Together)

| Component    | CSS Module              | Coupling |
| ------------ | ----------------------- | -------- |
| Header       | Header.module.css       | Good     |
| Footer       | Footer.module.css       | Good     |
| LoginForm    | LoginForm.module.css    | Good     |
| LoadingState | LoadingState.module.css | Good     |
| ErrorMessage | ErrorMessage.module.css | Good     |

### Loosely-Coupled (CSS without clear component)

| CSS Module                  | Component Status              |
| --------------------------- | ----------------------------- |
| workflow.module.css         | Component unclear             |
| PhoenixDashboard.module.css | Component unclear             |
| MainLayout.module.css       | Duplicates Layout.module.css? |

### Uncoupled (Component without dedicated CSS)

| Component            | CSS Source          |
| -------------------- | ------------------- |
| Hero                 | Uses globals.css    |
| Authentication       | Inline or inherited |
| NavigationLinks      | Inline or inherited |
| MobileResponsiveness | Inline or inherited |

---

## Accessibility Status per Component

| Component    | Focus States  | ARIA    | Keyboard              | Status               |
| ------------ | ------------- | ------- | --------------------- | -------------------- |
| Header       | Via nav links | Unknown | Partial (mobile menu) | Needs audit          |
| LoginForm    | Yes (inputs)  | Unknown | Unknown               | Needs audit          |
| LoadingState | N/A           | Unknown | N/A                   | Needs audit          |
| ErrorMessage | N/A           | Unknown | N/A                   | Needs audit          |
| All others   | Unknown       | Unknown | Unknown               | **Needs full audit** |

---

## Recommendations

1. **Extract UI Primitives:** Button, Input, Select should be standalone components
2. **Audit Component–CSS Coupling:** Resolve loose coupling issues
3. **Document Component Props:** No prop documentation found
4. **Add Storybook:** No component documentation/playground found
5. **Accessibility Audit:** All components need ARIA and keyboard audit
