# UX/UI Review — OmniPost

> **Document Status:** Phase 4 Discovery Output
> **Audit Date:** December 2024

---

## Executive Summary

This document captures UI/UX improvements identified during the Phase 4 audit, with focus on accessibility (WCAG 2.1 AA compliance), visual consistency, and interaction flow issues.

**Accessibility Issues:** 3 | **UX Flow Issues:** 3 | **Visual Consistency Issues:** 4 | **Total:** 10

---

## Accessibility Issues (WCAG 2.1 AA)

### A11Y-01: Hidden Checkboxes Break Keyboard Navigation

| Field             | Value                                            |
| ----------------- | ------------------------------------------------ |
| **ID**            | A11Y-01                                          |
| **Severity**      | Critical                                         |
| **Impact**        | Screen reader and keyboard users cannot interact |
| **Effort**        | M (Medium)                                       |
| **File**          | `components/campaigns/CampaignForm.tsx`          |
| **Lines**         | 255                                              |
| **WCAG Criteria** | 2.1.1 Keyboard, 4.1.2 Name, Role, Value          |

**Description:**
Checkboxes are hidden with `display: none`, which removes them from keyboard focus order and makes them invisible to screen readers.

**Evidence:**

```typescript
<input
  type="checkbox"
  checked={formData.seriesIds?.includes(s.id) || false}
  onChange={() => toggleSeries(s.id)}
  style={{ display: 'none' }}  // ACCESSIBILITY VIOLATION
/>
```

**Recommended Fix:**
Use visually hidden CSS that maintains accessibility:

```css
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

**Test Coverage Required:**

- Axe-core accessibility scan
- Keyboard navigation test
- Screen reader compatibility test

---

### A11Y-02: Missing ARIA Labels on Interactive Elements

| Field             | Value                                        |
| ----------------- | -------------------------------------------- |
| **ID**            | A11Y-02                                      |
| **Severity**      | High                                         |
| **Impact**        | Screen readers cannot convey element purpose |
| **Effort**        | S (Small)                                    |
| **Files**         | Multiple components                          |
| **WCAG Criteria** | 4.1.2 Name, Role, Value                      |

**Affected Components:**

| Component            | Issue                                | Line |
| -------------------- | ------------------------------------ | ---- |
| `ContentManager.tsx` | Pagination buttons lack aria-label   | 182  |
| `CampaignForm.tsx`   | Form fields missing aria-describedby | 120  |
| `LoadingState.tsx`   | Loading spinner needs aria-live      | 18   |

**Recommended Fix:**

```typescript
// Pagination buttons
<button aria-label="Go to next page" onClick={handleNextPage}>Next</button>

// Form fields
<input aria-describedby="email-error" />
<span id="email-error" role="alert">{error}</span>

// Loading state
<div aria-live="polite" aria-busy={isLoading}>
```

---

### A11Y-03: Color Contrast Issues

| Field             | Value                                       |
| ----------------- | ------------------------------------------- |
| **ID**            | A11Y-03                                     |
| **Severity**      | Medium                                      |
| **Impact**        | Text may be unreadable for low vision users |
| **Effort**        | S (Small)                                   |
| **File**          | `components/campaigns/CampaignForm.tsx`     |
| **Lines**         | 212-222                                     |
| **WCAG Criteria** | 1.4.3 Contrast (Minimum)                    |

**Description:**
Platform color backgrounds may not meet 4.5:1 contrast ratio requirement:

| Platform  | Background | Text Color | Ratio  | Status   |
| --------- | ---------- | ---------- | ------ | -------- |
| Instagram | #e4405f    | white      | ~3.8:1 | ❌ Fail  |
| Twitter   | #1da1f2    | white      | ~3.3:1 | ❌ Fail  |
| Facebook  | #1877f2    | white      | ~4.1:1 | ⚠️ Close |
| LinkedIn  | #0077b5    | white      | ~4.6:1 | ✅ Pass  |

**Recommended Fix:**
Either darken backgrounds or use darker text on light backgrounds.

---

## Interaction Flow Issues

### UX-01: Silent Error States Without Recovery

| Field        | Value                                           |
| ------------ | ----------------------------------------------- |
| **ID**       | UX-01                                           |
| **Severity** | High                                            |
| **Impact**   | Users don't understand failures or how to retry |
| **Effort**   | M (Medium)                                      |
| **File**     | `components/content/ContentManager.tsx`         |
| **Lines**    | 157                                             |

**Description:**
Error messages are generic with no actionable guidance:

```typescript
// Current
setError('Failed to load content');

// Recommended
setError({
  message: 'Failed to load content',
  action: 'retry',
  details: 'Network connection issue detected',
});
```

**Recommended Fix:**
Implement structured error states with:

- Clear error description
- Suggested action (retry, contact support, etc.)
- Visual distinction between error types

---

### UX-02: Missing Loading Feedback

| Field        | Value                                  |
| ------------ | -------------------------------------- |
| **ID**       | UX-02                                  |
| **Severity** | Medium                                 |
| **Impact**   | Users uncertain if action was received |
| **Effort**   | S (Small)                              |
| **Files**    | `CampaignForm.tsx`, `InputStage.tsx`   |

**Issues:**

| Component        | Missing Feedback                          |
| ---------------- | ----------------------------------------- |
| `CampaignForm`   | No visual feedback during form submission |
| `InputStage`     | No indication parsing is in progress      |
| `ContentManager` | No skeleton loader matching content shape |

**Recommended Fix:**

- Add loading spinner or progress indicator during async operations
- Use skeleton loaders that match content shape
- Disable form controls during submission

---

### UX-03: Inconsistent Error Handling Across Components

| Field        | Value                     |
| ------------ | ------------------------- |
| **ID**       | UX-03                     |
| **Severity** | Medium                    |
| **Impact**   | Confusing user experience |
| **Effort**   | M (Medium)                |
| **Files**    | Multiple components       |

**Current Inconsistencies:**

| Component          | Error Handling                      |
| ------------------ | ----------------------------------- |
| `useReviewProcess` | Generic "An unknown error occurred" |
| `ContentManager`   | Shows error in UI                   |
| `API routes`       | Returns structured JSON error       |
| `CampaignForm`     | Uses toast notifications            |

**Recommended Fix:**
Standardize on a single error handling pattern:

1. Create error utility with consistent structure
2. Use toast notifications for transient errors
3. Use inline errors for form validation
4. Use error boundaries for component crashes

---

## Visual Consistency Issues

### Design-01: Inconsistent Button Styling

| Field        | Value                        |
| ------------ | ---------------------------- |
| **ID**       | Design-01                    |
| **Severity** | Medium                       |
| **Impact**   | Inconsistent visual language |
| **Effort**   | M (Medium)                   |

**Current State:**

| Component        | Button Approach          |
| ---------------- | ------------------------ |
| `CampaignForm`   | Custom CSS class names   |
| `ContentManager` | Tailwind utility classes |
| `ReviewStages`   | Inline styles            |

**Recommended Fix:**
Create shared Button component with variants:

```typescript
<Button variant="primary">Submit</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="danger">Delete</Button>
```

---

### Design-02: Spacing Inconsistencies

| Field        | Value                      |
| ------------ | -------------------------- |
| **ID**       | Design-02                  |
| **Severity** | Low                        |
| **Impact**   | Minor visual inconsistency |
| **Effort**   | S (Small)                  |

**Observations:**

- Forms use mix of `p-4`, `p-6`, `padding: 16px`
- Margins vary: `mb-4`, `mb-6`, `mt-8`
- No consistent spacing scale

**Recommended Fix:**
Adopt 4px/8px spacing scale documented in design-tokens.md.

---

### Design-03: Typography Inconsistencies

| Field        | Value                      |
| ------------ | -------------------------- |
| **ID**       | Design-03                  |
| **Severity** | Low                        |
| **Impact**   | Minor visual inconsistency |
| **Effort**   | S (Small)                  |

**Observations:**

- Headers alternate between `text-xl`, `text-2xl`, direct `font-size`
- Font weights inconsistent (`font-semibold`, `font-bold`, `500`)

---

### Design-04: Missing Focus States

| Field        | Value                                    |
| ------------ | ---------------------------------------- |
| **ID**       | Design-04                                |
| **Severity** | High                                     |
| **Impact**   | Keyboard users cannot see focus position |
| **Effort**   | S (Small)                                |

**Description:**
Several interactive elements lack visible focus indicators, violating WCAG 2.4.7 (Focus Visible).

**Affected Areas:**

- Custom checkbox implementations
- Platform selection cards
- Pagination controls

---

## Priority Summary

| Priority | Count | Category                   |
| -------- | ----- | -------------------------- |
| Critical | 1     | Accessibility (keyboard)   |
| High     | 3     | ARIA, focus states, errors |
| Medium   | 4     | Contrast, loading, styling |
| Low      | 2     | Spacing, typography        |

---

## Recommended Implementation Order

1. **Sprint 1:** Fix critical accessibility (A11Y-01, Design-04)
2. **Sprint 2:** Add ARIA labels and fix contrast (A11Y-02, A11Y-03)
3. **Sprint 3:** Standardize error handling (UX-01, UX-03)
4. **Sprint 4:** Visual consistency (Design-01 through Design-03)

---

## Test Coverage Requirements

| Finding   | Required Tests                                  |
| --------- | ----------------------------------------------- |
| A11Y-01   | Axe-core scan, keyboard nav test, screen reader |
| A11Y-02   | ARIA attribute validation, screen reader        |
| A11Y-03   | Color contrast checker (Lighthouse, axe)        |
| UX-01     | Error state visual regression, user flow test   |
| UX-02     | Loading state visual regression                 |
| Design-04 | Focus visibility test, keyboard navigation      |
