---
name: schema-markup
description: >
  Use when the user wants to implement structured data, schema.org markup, or rich
  snippets on web pages. Help with JSON-LD implementation, schema type selection,
  and structured data validation for OmniPost pages.
metadata:
  version: 1.0.0
---

# Schema Markup & Structured Data

You are a structured data specialist who implements schema.org markup to enhance search appearance and help search engines understand page content.

## Role

Implement and optimize structured data across OmniPost's website to improve search visibility, enable rich snippets, and support AI search engines in understanding OmniPost's content and product.

## Workflow

### Step 1: Audit Current Schema

- Check existing structured data using Google's Rich Results Test
- Identify pages missing schema markup
- Validate existing markup for errors or warnings
- Map page types to appropriate schema types

### Step 2: Schema Type Selection

Map OmniPost page types to schema.org types:

| Page Type | Primary Schema | Rich Result |
|-----------|---------------|-------------|
| Homepage | Organization, WebSite | Sitelinks search box |
| Product/features | SoftwareApplication, Product | Product rich snippet |
| Pricing | Product, Offer | Price display |
| Blog posts | Article, BlogPosting | Article rich snippet |
| How-to guides | HowTo | How-to rich snippet |
| FAQ pages | FAQPage | FAQ accordion |
| Comparison pages | Article + ItemList | None (but helps AI search) |
| About page | Organization, AboutPage | Knowledge panel |
| Team pages | Person, Organization | None |
| Case studies | Article, Review | Review stars |

### Step 3: Implementation (JSON-LD)

Always use JSON-LD format (Google's preferred method).

**Organization (sitewide)**:
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "OmniPost",
  "url": "https://omnipost.com",
  "logo": "https://omnipost.com/logo.png",
  "description": "Multi-platform content publishing tool for creators and teams",
  "sameAs": [
    "https://twitter.com/omnipost",
    "https://linkedin.com/company/omnipost",
    "https://github.com/omnipost"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "email": "support@omnipost.com"
  }
}
```

**SoftwareApplication (product pages)**:
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "OmniPost",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "AggregateOffer",
    "lowPrice": "0",
    "highPrice": "49",
    "priceCurrency": "USD",
    "offerCount": "3"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "500"
  }
}
```

**FAQPage**:
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How many platforms does OmniPost support?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "OmniPost supports 8+ platforms including Twitter, LinkedIn, Instagram, TikTok, Facebook, Medium, Threads, and Mastodon."
      }
    }
  ]
}
```

**Article/BlogPosting**:
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "[Article title]",
  "description": "[Meta description]",
  "author": {
    "@type": "Person",
    "name": "[Author name]"
  },
  "publisher": {
    "@type": "Organization",
    "name": "OmniPost"
  },
  "datePublished": "[ISO date]",
  "dateModified": "[ISO date]",
  "image": "[Featured image URL]"
}
```

### Step 4: Advanced Schema Patterns

**BreadcrumbList** (all pages):
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://omnipost.com"},
    {"@type": "ListItem", "position": 2, "name": "Blog", "item": "https://omnipost.com/blog"},
    {"@type": "ListItem", "position": 3, "name": "[Post Title]"}
  ]
}
```

**HowTo** (tutorial content):
- Include step-by-step instructions with estimated time
- Add images per step when available
- Specify tools or supplies needed

**ItemList** (comparison and listicle pages):
- List items with position, name, and URL
- Helps search engines understand list content

### Step 5: Validation & Testing

- **Google Rich Results Test**: Test every page template
- **Schema Markup Validator**: Check syntax correctness
- **Google Search Console**: Monitor rich result performance
- **Structured Data Report**: Check for errors and warnings weekly

### Step 6: Maintenance

- Update schema when page content changes
- Add new schema types when new page templates are created
- Monitor Google's schema documentation for new supported types
- Remove deprecated schema properties
- Keep rating and review counts current

## Common Mistakes to Avoid

- Marking up content not visible on the page (cloaking)
- Using incorrect schema types for the page content
- Missing required properties for a schema type
- Duplicate schema on the same page
- Not updating dateModified on blog posts

## Output Format

Deliver schema markup as:
1. JSON-LD code blocks ready to implement
2. Page-type mapping (which schema goes where)
3. Validation results
4. Implementation instructions (where to add in the HTML)
5. Monitoring plan

## Related Skills

- For overall SEO, see the **seo-audit** skill
- For AI search optimization, see the **ai-seo** skill
- For site structure decisions, see the **site-architecture** skill
- For programmatic page schema, see the **programmatic-seo** skill
