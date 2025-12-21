# Design System Assessment — OmniPost

> **Document Status:** Phase 1 Discovery Output
> **Assessment Method:** Reverse-engineered from CSS files (no formal design system exists)

---

## Design Assets Status

| Asset Type | Status | Source Authority |
|------------|--------|------------------|
| Design System Document | **Missing** | N/A |
| Design Tokens File | **Missing** | N/A |
| Component Library | **Missing** | N/A |
| Style Guide | **Missing** | N/A |
| Figma/Sketch Files | **Unknown** | Not found in repository |

**Finding:** No formal design system documentation exists. All design patterns were reverse-engineered from CSS files in `/styles/` and component CSS modules.

---

## Color Palette (Extracted)

### Primary Colors

| Token Name | Hex Value | Usage | Classification |
|------------|-----------|-------|----------------|
| `primary-dark` | `#2c3e50` | Headers, headings, dark backgrounds | **Intentional** |
| `primary-accent` | `#4a6491` | Buttons, links, active states, borders | **Intentional** |
| `primary-accent-hover` | `#3b5177` / `#3a5481` | Button hover states | **Inferred** |

### Secondary / Accent Colors

| Token Name | Hex Value | Usage | Classification |
|------------|-----------|-------|----------------|
| `info-blue` | `#3498db` | Info tips, links, hero buttons | **Intentional** |
| `info-blue-hover` | `#2980b9` | Hover state for info elements | **Inferred** |
| `focus-blue` | `#3b82f6` | Input focus states | **Accidental** |

> **Risk Note:** `focus-blue` (`#3b82f6`) inconsistent with primary accent (`#4a6491`). May indicate Tailwind influence or copy-paste from external source.

### Status Colors

| Token Name | Hex Value | Usage | Classification |
|------------|-----------|-------|----------------|
| `error-bg` | `#fee2e2` | Error message backgrounds | **Intentional** |
| `error-border` | `#fecaca` / `#ef4444` | Error borders | **Intentional** |
| `error-text` | `#991b1b` / `#c53030` | Error text | **Accidental** |
| `error-alt-border` | `#f56565` | Alternative error border | **Accidental** |

> **Risk Note:** Multiple error red variations (`#991b1b`, `#c53030`, `#ef4444`, `#f56565`) indicate lack of standardization.

### Neutral Colors

| Token Name | Hex Value | Usage | Classification |
|------------|-----------|-------|----------------|
| `background` | `#f9fafb` | Page background | **Intentional** |
| `surface` | `#ffffff` | Cards, sections | **Intentional** |
| `surface-alt` | `#f8f9fa` | Alternate surfaces, highlights | **Intentional** |
| `surface-muted` | `#f1f5f9` | Info boxes | **Intentional** |
| `text-primary` | `#333` / `#333333` | Body text | **Intentional** |
| `text-secondary` | `#666` / `#374151` | Labels, subtitles | **Accidental** |
| `text-muted` | `#718096` | Loading indicators | **Accidental** |
| `border` | `#ccc` / `#d1d5db` / `#ddd` / `#eaeaea` | Various borders | **Accidental** |

> **Risk Note:** Border colors highly inconsistent (4+ variants). Needs consolidation.

---

## Typography Hierarchy

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
             Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
```
**Classification:** **Intentional** — System font stack for performance

### Font Sizes

| Element | Desktop | Mobile | Classification |
|---------|---------|--------|----------------|
| Hero H1 | `2.5rem` | - | **Intentional** |
| Header H1 | `2.2rem` | `1.75rem` | **Intentional** |
| Section H2 | `1.75rem` | `1.5rem` | **Intentional** |
| H3 | `1.3rem` | `1.25rem` | **Inferred** |
| H4 | `1.1rem` | - | **Inferred** |
| Body | `1rem` (16px) | - | **Intentional** |
| Small | `0.9rem` / `0.85rem` | - | **Accidental** |
| Label | `0.875rem` | - | **Inferred** |
| Badge | `0.8rem` | - | **Inferred** |

### Font Weights

| Weight | Usage | Classification |
|--------|-------|----------------|
| `400` (normal) | Body text | **Intentional** |
| `500` | Labels, buttons | **Inferred** |
| `600` | Headings, emphasis | **Intentional** |
| `700` (bold) | Strong emphasis | **Inferred** |

### Line Heights

| Value | Usage | Classification |
|-------|-------|----------------|
| `1.6` | Body text | **Intentional** |
| `1.2` | Headings | **Intentional** |

---

## Spacing System

### Base Spacing Values (rem)

| Token | Value | Pixel Equiv. | Usage | Classification |
|-------|-------|--------------|-------|----------------|
| `space-xs` | `0.25rem` | 4px | Badge padding, tight spacing | **Inferred** |
| `space-sm` | `0.5rem` | 8px | Input padding, small gaps | **Intentional** |
| `space-md` | `0.75rem` | 12px | Button padding, list items | **Inferred** |
| `space-base` | `1rem` | 16px | Standard padding, margins | **Intentional** |
| `space-lg` | `1.5rem` | 24px | Section padding, grid gaps | **Intentional** |
| `space-xl` | `2rem` | 32px | Large section margins | **Intentional** |
| `space-xxl` | `3rem` | 48px | Hero padding | **Inferred** |

> **Note:** No CSS custom properties defined. Values used inline throughout.

---

## Border & Radius

### Border Radius

| Token | Value | Usage | Classification |
|-------|-------|-------|----------------|
| `radius-sm` | `4px` | Buttons, badges, inputs | **Intentional** |
| `radius-md` | `8px` / `0.5rem` | Cards, sections | **Intentional** |
| `radius-lg` | `0.375rem` | Form inputs | **Accidental** |
| `radius-full` | `50%` | Stage numbers, avatars | **Intentional** |

> **Risk Note:** Inconsistency between `4px`, `8px`, `0.5rem`, and `0.375rem` for similar elements.

### Shadows

| Token | Value | Usage | Classification |
|-------|-------|-------|----------------|
| `shadow-sm` | `0 2px 4px rgba(0,0,0,0.05)` | Cards | **Intentional** |
| `shadow-md` | `0 2px 4px rgba(0,0,0,0.1)` | Header, loading | **Intentional** |
| `shadow-lg` | `0 4px 6px rgba(0,0,0,0.1)` | Sections, containers | **Intentional** |

---

## Layout Patterns

### Container
- Max width: `1200px`
- Horizontal padding: `1rem`
- Auto margins for centering

### Grid System
```css
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
gap: 1.5rem;
```
**Classification:** **Intentional** — Responsive grid with minimum column width

### Breakpoints

| Breakpoint | Value | Notes | Classification |
|------------|-------|-------|----------------|
| Mobile | `max-width: 768px` | Single defined breakpoint | **Intentional** |

> **Note:** Only one breakpoint defined. No tablet-specific breakpoint.

---

## Component Inventory

### UI Primitives (14 components in `/components/ui/`)

| Component | Has CSS Module | Classification |
|-----------|---------------|----------------|
| Header | Yes | **Intentional** |
| Footer | Yes | **Intentional** |
| Layout | Yes | **Intentional** |
| Hero | No (uses globals) | **Intentional** |
| LoginForm | Yes | **Intentional** |
| LoadingState | Yes | **Intentional** |
| ErrorMessage | Yes | **Intentional** |
| NotificationSystem | Yes | **Intentional** |
| AuditTrail | Yes | **Intentional** |
| WorkflowStage | Yes | **Intentional** |
| AdaptationCard | Yes | **Intentional** |
| Authentication | No | **Inferred** |
| NavigationLinks | No | **Inferred** |
| MobileResponsiveness | No | **Inferred** |

### Feature Components (inferred from CSS)
- Dashboard
- Campaign
- Series
- Sequences
- Leads
- HumanReview
- ContentAdaptation
- PlatformSelector
- Automation

---

## Design–Code Consistency Assessment

### Inconsistencies Found

| Category | Issue | Severity |
|----------|-------|----------|
| Colors | 4+ border gray variants | Medium |
| Colors | 2+ error text color variants | Low |
| Colors | Focus blue differs from brand accent | Medium |
| Spacing | No CSS variables; inline values | Medium |
| Radius | Mixed units (px, rem) for same purpose | Low |
| Typography | Multiple small text sizes (0.8-0.9rem) | Low |
| Shadows | Generally consistent | None |

### Recommendations (Not Implemented)

1. **Create CSS custom properties** for all tokens
2. **Consolidate border colors** to 2-3 variants
3. **Standardize error colors** to single palette
4. **Align focus states** with brand accent color
5. **Add intermediate breakpoints** for tablet

---

## Accessibility Baseline

| Aspect | Status | Notes |
|--------|--------|-------|
| Focus indicators | Present | Blue focus ring on inputs |
| Color contrast | Unknown | Not measured; text on gradients may fail |
| Keyboard navigation | Partial | Mobile menu has transitions |
| ARIA labels | Unknown | Requires component audit |
| Skip links | Unknown | Not evident in CSS |

---

## Internal Reasoning Notes

**Key Assumptions:**
- Design emerged organically rather than from formal spec
- Color palette influenced by both custom design and Tailwind defaults
- Components intentional; tokens accidental

**Confidence Drivers:**
- CSS files directly analyzed (High confidence for extracted values)
- No design tool files found (Cannot confirm original intent)
- Inconsistencies suggest lack of design system governance

**Tokens Marked Accidental:**
- Any value appearing once or with variation suggests copy-paste or ad-hoc decisions
- These should not be canonized without explicit design review
