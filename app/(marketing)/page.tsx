/**
 * Landing Page — CRO-optimized for conversion
 * Server component with minimal client islands (ScrollLink)
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { ScrollLink } from '@/components/ui/ScrollLink';
import styles from '@/styles/Landing.module.css';

export const metadata: Metadata = {
  title: 'OmniPost — Publish Once. Reach Every Platform.',
  description:
    'AI-powered content publishing for creators who want to grow everywhere — without the busywork. Publish to Facebook, Instagram, LinkedIn, and Twitter from one place.',
  keywords: [
    'omnipost',
    'multi-platform publishing',
    'content creation',
    'AI content',
    'social media management',
    'content scheduling',
    'social media automation',
  ],
  openGraph: {
    title: 'OmniPost — Publish Once. Reach Every Platform.',
    description:
      'AI-powered content publishing for creators who want to grow everywhere — without the busywork.',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <>
      {/* ---- Hero ---- */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.headline}>Publish Once. Reach Every Platform.</h1>
          <p className={styles.subheadline}>
            AI-powered content publishing for creators who want to grow everywhere
            &mdash; without the busywork.
          </p>

          <div className={styles.heroCtas}>
            <Link href="/signup" className={styles.ctaPrimary}>
              Start Publishing Free
            </Link>
            <ScrollLink targetId="features" className={styles.ctaSecondary}>
              See How It Works
            </ScrollLink>
          </div>

          <div className={styles.platformIcons} aria-label="Supported platforms">
            <span className={styles.platformIcon}>
              <span role="img" aria-hidden="true">f</span>
              <span>Facebook</span>
            </span>
            <span className={styles.platformIcon}>
              <span role="img" aria-hidden="true">ig</span>
              <span>Instagram</span>
            </span>
            <span className={styles.platformIcon}>
              <span role="img" aria-hidden="true">in</span>
              <span>LinkedIn</span>
            </span>
            <span className={styles.platformIcon}>
              <span role="img" aria-hidden="true">X</span>
              <span>Twitter</span>
            </span>
          </div>
        </div>
      </section>

      {/* ---- Problem ---- */}
      <section className={`${styles.section} ${styles.problemSection}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>
            Tired of copying and pasting across 5 platforms?
          </h2>
          <p className={styles.sectionSubtitle}>
            Managing multiple channels manually is slow, error-prone, and unsustainable.
          </p>

          <div className={styles.painPoints}>
            <article className={styles.painPoint}>
              <h3>Hours Lost Reformatting</h3>
              <p>
                Every platform has different character limits, image sizes, and hashtag
                rules. You end up editing the same post four times.
              </p>
            </article>
            <article className={styles.painPoint}>
              <h3>Inconsistent Posting Schedule</h3>
              <p>
                Without a unified queue, posts slip through the cracks and your audience
                engagement drops.
              </p>
            </article>
            <article className={styles.painPoint}>
              <h3>No Unified Analytics</h3>
              <p>
                Jumping between dashboards to piece together performance data means you
                never see the full picture.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ---- Features / Solution ---- */}
      <section
        id="features"
        className={`${styles.section} ${styles.featuresSection}`}
      >
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>One Tool. Every Channel. Zero Hassle.</h2>
          <p className={styles.sectionSubtitle}>
            OmniPost handles the busywork so you can focus on creating great content.
          </p>

          <div className={styles.featureGrid}>
            <article className={styles.featureCard}>
              <div className={styles.featureIcon} aria-hidden="true">
                <span>&#9881;</span>
              </div>
              <h3>Multi-Platform Publishing</h3>
              <p>
                Publish to Facebook, Instagram, LinkedIn, and Twitter from a single
                editor. One click, every platform.
              </p>
            </article>

            <article className={styles.featureCard}>
              <div className={styles.featureIcon} aria-hidden="true">
                <span>&#9733;</span>
              </div>
              <h3>AI Content Adaptation</h3>
              <p>
                Our AI automatically reformats your content for each platform&apos;s
                requirements — character limits, hashtags, and image crops.
              </p>
            </article>

            <article className={styles.featureCard}>
              <div className={styles.featureIcon} aria-hidden="true">
                <span>&#9202;</span>
              </div>
              <h3>Smart Scheduling</h3>
              <p>
                Queue content and publish at the times your audience is most active.
                Set it and forget it.
              </p>
            </article>

            <article className={styles.featureCard}>
              <div className={styles.featureIcon} aria-hidden="true">
                <span>&#9776;</span>
              </div>
              <h3>Unified Analytics</h3>
              <p>
                See engagement, reach, and conversions across every platform in one
                dashboard. No more tab-switching.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ---- Social Proof ---- */}
      <section className={`${styles.section} ${styles.socialProofSection}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Trusted by Content Creators Worldwide</h2>

          <div className={styles.metrics}>
            <div className={styles.metric}>
              <span className={styles.metricValue}>Open Source</span>
              <span className={styles.metricLabel}>MIT Licensed</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricValue}>2M+</span>
              <span className={styles.metricLabel}>Posts published</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricValue}>4.8/5</span>
              <span className={styles.metricLabel}>Average rating</span>
            </div>
          </div>

          <div className={styles.testimonials}>
            <article className={styles.testimonialCard}>
              <blockquote>
                &ldquo;OmniPost cut my publishing time in half. I used to spend an hour
                reformatting posts — now it takes seconds.&rdquo;
              </blockquote>
              <p className={styles.testimonialAuthor}>
                <strong>Sarah K.</strong> — Social Media Manager
              </p>
            </article>

            <article className={styles.testimonialCard}>
              <blockquote>
                &ldquo;The AI adaptation feature is a game-changer. Each platform gets
                perfectly tailored content automatically.&rdquo;
              </blockquote>
              <p className={styles.testimonialAuthor}>
                <strong>Marcus T.</strong> — Content Creator
              </p>
            </article>

            <article className={styles.testimonialCard}>
              <blockquote>
                &ldquo;Finally, one dashboard for all our analytics. Our team makes
                better decisions faster.&rdquo;
              </blockquote>
              <p className={styles.testimonialAuthor}>
                <strong>Priya R.</strong> — Marketing Director
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ---- Final CTA ---- */}
      <section className={styles.finalCta}>
        <div className={styles.finalCtaInner}>
          <h2>Ready to Publish Everywhere?</h2>
          <Link href="/signup" className={styles.ctaPrimary}>
            Start Publishing Free
          </Link>
          <div className={styles.trustSignals}>
            <span className={styles.trustSignal}>Free forever plan</span>
            <span className={styles.trustSignal}>No credit card required</span>
            <span className={styles.trustSignal}>Set up in 2 minutes</span>
          </div>
        </div>
      </section>
    </>
  );
}
