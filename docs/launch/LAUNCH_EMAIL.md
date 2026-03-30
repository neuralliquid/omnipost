# OmniPost Alpha Launch Email

**Audience:** Waitlist subscribers
**Tone:** Personal, direct, excited but not hyperbolic
**Send timing:** Launch day, 9:00 AM ET

---

## Subject Lines (pick one)

1. OmniPost is live -- your multi-platform publishing starts now
2. Write once, publish everywhere: OmniPost alpha is here
3. You asked for it. OmniPost is ready.

## Preheader Text

Free alpha access. AI-powered content adaptation for Facebook, Instagram, LinkedIn, and Twitter.

---

## Email Body

Hi {{ first_name }},

You signed up for the OmniPost waitlist because you were tired of spending hours reformatting the same content for different social platforms. So were we.

**Today, OmniPost is live in alpha.** You can start using it right now.

Here's what you get:

- **Write once, publish everywhere.** Compose your content in a single editor. OmniPost's AI adapts it for Facebook, Instagram, LinkedIn, and Twitter -- adjusting tone, length, formatting, and image dimensions automatically.

- **Smart scheduling.** Our AI analyzes engagement patterns and suggests the best times to post on each platform. Set your schedule once and let it run.

- **AI image generation.** Describe the visual you need. OmniPost generates platform-optimized images in the right dimensions. No more resizing.

- **Unified analytics.** Track performance across every platform from one dashboard. See what's working without switching between four different tools.

**Getting started takes about 2 minutes:**

1. Go to [omnipost.app](https://nl-dev-omnipost-app-euw.azurewebsites.net)
2. Sign up (free, no credit card)
3. Connect your first platform
4. Create and publish your first cross-platform post

The Free tier gives you full access to core publishing and adaptation features. Pro ($19/mo) and Team ($49/mo) tiers are coming soon with advanced scheduling, AI image generation, and collaboration tools.

This is an alpha. We're shipping early because we'd rather build with real user feedback than guess in private. If something breaks, if something's confusing, if something's missing -- tell us. Every piece of feedback goes directly to the team building the product.

[Start Publishing Now](https://nl-dev-omnipost-app-euw.azurewebsites.net)

Thanks for being here from the beginning. You're the reason we built this.

-- The OmniPost Team

**P.S.** You're one of the first 500 people to get access. Early alpha users will be grandfathered into special pricing when we launch paid tiers. Your feedback now directly shapes what OmniPost becomes.

---

## Technical Notes

- **ESP:** Configure for plain-text fallback
- **Personalization:** `{{ first_name }}` with fallback to "there"
- **CTA button:** Primary blue (#2563EB), white text, 48px height
- **Unsubscribe:** Required footer with one-click unsubscribe
- **Tracking:** UTM params on all links: `utm_source=email&utm_medium=launch&utm_campaign=alpha_launch`
