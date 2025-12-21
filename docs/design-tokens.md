# Design Tokens — OmniPost

> **Document Status:** Reverse-engineered from CSS analysis
> **Token Status:** These are EXTRACTED tokens, not officially sanctioned. See classification notes.

---

## Token Classification Legend

| Classification  | Meaning                                                               |
| --------------- | --------------------------------------------------------------------- |
| **Intentional** | Consistent usage across multiple files; likely deliberate             |
| **Inferred**    | Used consistently but could be coincidental                           |
| **Accidental**  | Inconsistent or one-off usage; should NOT be canonized without review |

---

## Colors

### Brand Primary

```css
--color-primary-dark: #2c3e50; /* Intentional */
--color-primary-accent: #4a6491; /* Intentional */
--color-primary-accent-hover: #3b5177; /* Inferred */
```

### Brand Secondary

```css
--color-info: #3498db; /* Intentional */
--color-info-hover: #2980b9; /* Inferred */
```

### Semantic — Error

```css
--color-error-bg: #fee2e2; /* Intentional */
--color-error-border: #fecaca; /* Intentional */
--color-error-border-alt: #ef4444; /* Accidental - needs consolidation */
--color-error-text: #991b1b; /* Intentional */
```

### Neutrals — Backgrounds

```css
--color-bg-page: #f9fafb; /* Intentional */
--color-bg-surface: #ffffff; /* Intentional */
--color-bg-surface-alt: #f8f9fa; /* Intentional */
--color-bg-muted: #f1f5f9; /* Intentional */
--color-bg-disabled: #f3f4f6; /* Inferred */
```

### Neutrals — Text

```css
--color-text-primary: #333333; /* Intentional */
--color-text-secondary: #666666; /* Inferred */
--color-text-muted: #718096; /* Accidental */
--color-text-label: #374151; /* Accidental */
```

### Neutrals — Borders

```css
--color-border-default: #d1d5db; /* Recommended consolidation */
--color-border-light: #eaeaea; /* Accidental */
--color-border-input: #ccc; /* Accidental */
--color-border-table: #ddd; /* Accidental */
```

> **Consolidation Recommendation:** Reduce border colors to 2 variants (default + light)

---

## Typography

### Font Family

```css
--font-family-base:
  -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
  'Helvetica Neue', sans-serif; /* Intentional */
```

### Font Sizes

```css
--font-size-xs: 0.8rem; /* 12.8px - Inferred */
--font-size-sm: 0.875rem; /* 14px - Inferred */
--font-size-base: 1rem; /* 16px - Intentional */
--font-size-md: 1.1rem; /* 17.6px - Inferred */
--font-size-lg: 1.2rem; /* 19.2px - Intentional */
--font-size-xl: 1.3rem; /* 20.8px - Inferred */
--font-size-2xl: 1.5rem; /* 24px - Intentional */
--font-size-3xl: 1.75rem; /* 28px - Intentional */
--font-size-4xl: 2.2rem; /* 35.2px - Intentional */
--font-size-5xl: 2.5rem; /* 40px - Intentional */
```

### Font Weights

```css
--font-weight-normal: 400; /* Intentional */
--font-weight-medium: 500; /* Inferred */
--font-weight-semibold: 600; /* Intentional */
--font-weight-bold: 700; /* Inferred */
```

### Line Heights

```css
--line-height-tight: 1.2; /* Intentional - headings */
--line-height-base: 1.6; /* Intentional - body */
```

---

## Spacing

```css
--space-0: 0;
--space-1: 0.25rem; /* 4px - Inferred */
--space-2: 0.5rem; /* 8px - Intentional */
--space-3: 0.75rem; /* 12px - Inferred */
--space-4: 1rem; /* 16px - Intentional */
--space-5: 1.2rem; /* 19.2px - Accidental */
--space-6: 1.5rem; /* 24px - Intentional */
--space-8: 2rem; /* 32px - Intentional */
--space-12: 3rem; /* 48px - Inferred */
```

---

## Border Radius

```css
--radius-sm: 0.25rem; /* 4px - Intentional */
--radius-md: 0.5rem; /* 8px - Intentional */
--radius-lg: 0.375rem; /* 6px - Accidental (Tailwind default?) */
--radius-full: 50%; /* Intentional */
```

> **Note:** `--radius-lg` value is smaller than `--radius-md` which is unusual. Likely copy-paste error.

---

## Shadows

```css
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.05); /* Intentional */
--shadow-md: 0 2px 4px rgba(0, 0, 0, 0.1); /* Intentional */
--shadow-lg: 0 4px 6px rgba(0, 0, 0, 0.1); /* Intentional */
```

---

## Layout

```css
--container-max-width: 1200px; /* Intentional */
--container-padding: 1rem; /* Intentional */
--grid-gap: 1.5rem; /* Intentional */
--grid-min-col-width: 300px; /* Intentional */
```

---

## Z-Index Scale

```css
--z-header: 100; /* Intentional */
--z-overlay: 1000; /* Intentional */
```

---

## Transitions

```css
--transition-fast: 0.15s; /* Inferred */
--transition-base: 0.2s; /* Intentional */
--transition-slow: 0.3s; /* Intentional */
```

---

## Breakpoints

```css
--breakpoint-mobile: 768px; /* Intentional - only breakpoint defined */
```

> **Gap:** No tablet breakpoint defined. Consider adding `--breakpoint-tablet: 1024px`.

---

## Usage Notes

### Current State

These tokens are **not implemented** as CSS custom properties in the codebase. They exist only as hardcoded values throughout various CSS files.

### Recommended Implementation

```css
/* styles/tokens.css - Proposed */
:root {
  /* Copy tokens from above */
}
```

### Migration Path

1. Create `styles/tokens.css` with custom properties
2. Import in `styles/globals.css`
3. Gradually replace hardcoded values with `var(--token-name)`
4. Remove accidental tokens; standardize on intentional ones
