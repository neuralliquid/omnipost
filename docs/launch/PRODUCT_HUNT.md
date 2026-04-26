# OmniPost -- Product Hunt Submission Brief

---

## Tagline (60 chars max)

**AI-powered cross-platform content publishing** (48 chars)

## Description (260 chars max)

Write once, publish to Facebook, Instagram, LinkedIn, and Twitter. OmniPost's AI adapts your content for each platform -- adjusting tone, length, and images. Smart scheduling, unified analytics, and built-in CRM. Free, open source, MIT-licensed. (248 chars)

## Topics/Tags

- Artificial Intelligence
- Social Media Tools
- Content Creation
- Open Source
- Marketing

## Pricing

- Free tier available
- Pro: $19/month
- Team: $49/month
- Enterprise: Custom

## Links

- **Website:** https://nl-dev-omnipost-app-euw.azurewebsites.net
- **GitHub:** https://github.com/JustAGhosT/content_creation

---

## Maker's First Comment (200-300 words)

Hi Product Hunt! I'm the maker behind OmniPost.

I started building this after watching a friend -- a freelance content creator managing four brand accounts -- spend her entire Sunday afternoon reformatting the same five posts for different platforms. Same message, four different formats, four different image sizes, four different character limits. Every single week.

That felt like a problem software should have solved already. Tools like Buffer and Hootsuite handle scheduling, but they don't adapt your content. You still do the reformatting manually.

OmniPost takes a different approach. Write your content once in a single editor, and the AI engine rewrites it for each connected platform. It adjusts tone (professional for LinkedIn, conversational for Twitter), respects character limits, and generates platform-optimized images. Then you review, schedule, and publish from one dashboard.

A few things that make OmniPost different:

- **AI-native:** Content adaptation, image generation, and smart scheduling are core features, not afterthoughts
- **Open source (MIT):** Full transparency. Self-host if you want. Contribute if you're interested
- **Built-in CRM:** Connect content performance directly to lead generation
- **Modern stack:** Next.js 16, React 19, TypeScript, PostgreSQL

This is an alpha release. Rough edges exist. But the core workflow -- write once, adapt automatically, publish everywhere -- is live and working.

I'd love your feedback. What platforms should we support next? What features would make this essential for your workflow? Every suggestion shapes the roadmap.

---

## Gallery Image Descriptions

### Image 1 -- Hero

**Content:** OmniPost dashboard showing the content editor with a post being adapted for four platforms simultaneously. Split-screen view with the original text on the left and platform-specific previews (Twitter, LinkedIn, Instagram, Facebook) on the right.
**Caption:** Write once. Publish everywhere.

### Image 2 -- AI Adaptation

**Content:** Close-up of the AI adaptation panel showing a long-form paragraph being transformed into four platform-specific versions. Visual diff highlighting what changed for each platform.
**Caption:** AI adapts your tone, length, and format for each platform.

### Image 3 -- Scheduling

**Content:** Calendar view showing scheduled posts across platforms with color-coded indicators. Heatmap overlay showing optimal posting times.
**Caption:** Smart scheduling based on your audience's engagement patterns.

### Image 4 -- Analytics

**Content:** Unified analytics dashboard showing engagement metrics across all connected platforms. Charts comparing performance by platform, content type, and time period.
**Caption:** All your analytics in one place. No more switching dashboards.

### Image 5 -- Open Source

**Content:** GitHub repository page showing the OmniPost source code with contributor activity, stars, and MIT license badge. Terminal window showing the local development setup.
**Caption:** Fully open source. MIT-licensed. Built in the open.

---

## FAQ for Comments Section

**Q: How is this different from Buffer / Hootsuite / Later?**
A: Those tools are primarily schedulers -- you still write and format content for each platform manually. OmniPost's AI engine automatically adapts your content (tone, length, formatting, images) for each platform. Write once, the AI handles the rest.

**Q: Is it really free?**
A: Yes. The Free tier includes core publishing and AI content adaptation with no credit card required. Pro ($19/mo) adds advanced scheduling, AI image generation, and detailed analytics. Team ($49/mo) adds collaboration features.

**Q: What platforms are supported?**
A: Currently Facebook, Instagram, LinkedIn, and Twitter/X. We're actively working on adding TikTok, Pinterest, and YouTube based on user demand.

**Q: Can I self-host this?**
A: Absolutely. OmniPost is MIT-licensed. Clone the GitHub repo and deploy it on your own infrastructure. We have documentation for Azure deployment, and the community is working on Docker and Vercel guides.

**Q: What AI model do you use?**
A: We use a combination of models optimized for different tasks -- content adaptation, summarization, and image generation. The architecture is modular, so we can swap in better models as they become available.

**Q: Is my data safe?**
A: Your content data is stored in a PostgreSQL database with standard encryption. We don't use your content to train models. Since we're open source, you can audit the entire data handling pipeline yourself.

**Q: I found a bug. Where do I report it?**
A: GitHub Issues is the best place: github.com/JustAGhosT/content_creation/issues. We're actively monitoring and triaging during launch week.

**Q: Are you looking for contributors?**
A: Yes! We welcome contributions of all kinds -- code, documentation, bug reports, feature suggestions. Check the GitHub repo for open issues tagged "good first issue."
