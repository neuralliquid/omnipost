/**
 * Phoenix Rooivalk Outreach Sequence Templates
 * Pre-built sequences for SkySnare (Consumer) and AeroNet (Enterprise)
 */

import type { CreateSequenceInput, SequenceStep } from '@/types/sequence';

type StepInput = Omit<SequenceStep, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * SkySnare Consumer Sequences
 */
export const SKYSNARE_SEQUENCES: Record<string, CreateSequenceInput> = {
  /**
   * Cold outreach for sports enthusiasts and training facilities
   */
  coldOutreach: {
    name: 'SkySnare - Cold Outreach',
    description: 'Initial outreach sequence for new SkySnare prospects',
    steps: [
      {
        type: 'linkedin_view_profile',
        order: 0,
        name: 'View LinkedIn Profile',
        enabled: true,
        linkedinConfig: { type: 'view_profile' },
      },
      {
        type: 'wait',
        order: 1,
        name: 'Wait 1 day',
        enabled: true,
        waitConfig: { duration: 1, unit: 'days' },
      },
      {
        type: 'linkedin_connection',
        order: 2,
        name: 'Send connection request',
        enabled: true,
        linkedinConfig: {
          type: 'connection_request',
          message: `Hi {{firstName}}, I noticed you're involved in {{useCase}}. We've developed SkySnare™ - a new approach to drone training that's getting great results at facilities like yours. Would love to connect!`,
        },
      },
      {
        type: 'wait',
        order: 3,
        name: 'Wait 3 days',
        enabled: true,
        waitConfig: { duration: 3, unit: 'days' },
      },
      {
        type: 'email',
        order: 4,
        name: 'Initial email',
        enabled: true,
        emailConfig: {
          subject: 'Quick question about your training setup',
          body: `Hi {{firstName}},

I hope this finds you well! I reached out on LinkedIn - wanted to follow up here.

I'm curious about how you're currently handling drone training at {{company}}. We've been working with similar organizations to improve their training outcomes with SkySnare™.

Some quick wins we've seen:
• 40% faster skill development
• Safer training environment
• Lower equipment costs

Would you be open to a 15-minute call to see if this might be relevant for you?

Best,
{{senderName}}`,
          trackOpens: true,
          trackClicks: true,
        },
      },
      {
        type: 'wait',
        order: 5,
        name: 'Wait 3 days',
        enabled: true,
        waitConfig: { duration: 3, unit: 'days' },
      },
      {
        type: 'email',
        order: 6,
        name: 'Follow-up email',
        enabled: true,
        emailConfig: {
          subject: 'Re: Quick question about your training setup',
          body: `Hi {{firstName}},

Just bumping this up - I know you're busy!

I put together a quick demo video that shows SkySnare in action at a training facility similar to yours. Takes about 3 minutes to watch.

Would you like me to send it over?

{{senderName}}`,
          trackOpens: true,
          trackClicks: true,
        },
      },
      {
        type: 'wait',
        order: 7,
        name: 'Wait 4 days',
        enabled: true,
        waitConfig: { duration: 4, unit: 'days' },
      },
      {
        type: 'linkedin_message',
        order: 8,
        name: 'LinkedIn message',
        enabled: true,
        linkedinConfig: {
          type: 'message',
          message: `Hey {{firstName}}, just wanted to make sure my emails aren't going to spam! Let me know if you'd like to see how SkySnare could work for {{company}}.`,
        },
      },
      {
        type: 'wait',
        order: 9,
        name: 'Wait 5 days',
        enabled: true,
        waitConfig: { duration: 5, unit: 'days' },
      },
      {
        type: 'email',
        order: 10,
        name: 'Final email',
        enabled: true,
        emailConfig: {
          subject: 'Last try + special offer',
          body: `Hi {{firstName}},

I'll keep this short - I don't want to be a pest!

If training improvement is on your radar for this year, I'd love to show you what we're doing with SkySnare. We're offering a free trial for qualified facilities.

If the timing isn't right, no worries at all. Just let me know and I'll check back in a few months.

Thanks for your time either way!

{{senderName}}`,
          trackOpens: true,
          trackClicks: true,
        },
      },
    ] as StepInput[],
    schedule: {
      sendingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const,
      sendingHours: { start: '09:00', end: '17:00' },
      timezone: 'America/New_York',
      maxPerDay: 50,
    },
    stopOnReply: true,
    stopOnBounce: true,
  },

  /**
   * Demo follow-up sequence
   */
  demoFollowUp: {
    name: 'SkySnare - Demo Follow-up',
    description: 'Nurture sequence after demo request',
    steps: [
      {
        type: 'email',
        order: 0,
        name: 'Demo confirmation',
        enabled: true,
        emailConfig: {
          subject: 'Your SkySnare demo is confirmed!',
          body: `Hi {{firstName}},

Great news - your SkySnare demo is confirmed!

Here's what to expect:
• 20-minute live product walkthrough
• Q&A tailored to your specific needs
• No pressure, just information

In the meantime, here are some resources:
• Product overview: [Link]
• Customer success stories: [Link]
• FAQ: [Link]

See you soon!

{{senderName}}`,
          trackOpens: true,
          trackClicks: true,
        },
      },
      {
        type: 'wait',
        order: 1,
        name: 'Wait 1 day',
        enabled: true,
        waitConfig: { duration: 1, unit: 'days' },
      },
      {
        type: 'email',
        order: 2,
        name: 'Demo prep',
        enabled: true,
        emailConfig: {
          subject: 'Quick prep for your demo',
          body: `Hi {{firstName}},

Just wanted to send a quick note before your demo.

To make the most of our time together, it would help to know:
1. What's your current training setup like?
2. What challenges are you looking to solve?
3. Who else might benefit from seeing the demo?

Feel free to reply with any thoughts, or we can cover it live!

{{senderName}}`,
          trackOpens: true,
          trackClicks: true,
        },
      },
      {
        type: 'wait',
        order: 3,
        name: 'Wait 2 days',
        enabled: true,
        waitConfig: { duration: 2, unit: 'days' },
      },
      {
        type: 'task',
        order: 4,
        name: 'Conduct demo',
        enabled: true,
        taskConfig: {
          title: 'Conduct SkySnare demo for {{firstName}} at {{company}}',
          description: 'Demo scheduled - prepare personalized presentation',
        },
      },
    ] as StepInput[],
    schedule: {
      sendingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const,
      sendingHours: { start: '08:00', end: '18:00' },
      timezone: 'America/New_York',
      maxPerDay: 30,
    },
    stopOnReply: false,
    stopOnBounce: true,
  },

  /**
   * Post-demo nurture
   */
  postDemo: {
    name: 'SkySnare - Post-Demo Nurture',
    description: 'Follow-up after demo to close deal',
    steps: [
      {
        type: 'email',
        order: 0,
        name: 'Thank you email',
        enabled: true,
        emailConfig: {
          subject: 'Thanks for your time today!',
          body: `Hi {{firstName}},

Thanks for taking the time to see SkySnare in action today!

As promised, here's a quick recap:
• Product specs and pricing: [Link]
• ROI calculator: [Link]
• Implementation timeline: [Link]

Based on what we discussed, I think SkySnare would be a great fit for {{company}}. Happy to answer any questions that come up.

What are your thoughts on next steps?

{{senderName}}`,
          trackOpens: true,
          trackClicks: true,
        },
      },
      {
        type: 'wait',
        order: 1,
        name: 'Wait 2 days',
        enabled: true,
        waitConfig: { duration: 2, unit: 'days' },
      },
      {
        type: 'email',
        order: 2,
        name: 'Check-in email',
        enabled: true,
        emailConfig: {
          subject: 'Quick question',
          body: `Hi {{firstName}},

Hope you've had a chance to review the materials I sent over.

Any questions I can help answer? I'm also happy to jump on a quick call if that's easier.

{{senderName}}`,
          trackOpens: true,
          trackClicks: true,
        },
      },
      {
        type: 'wait',
        order: 3,
        name: 'Wait 3 days',
        enabled: true,
        waitConfig: { duration: 3, unit: 'days' },
      },
      {
        type: 'call',
        order: 4,
        name: 'Check-in call',
        enabled: true,
        callConfig: {
          duration: 15,
          script: `Check-in call after demo:
1. Any questions about the product?
2. Discuss implementation timeline
3. Address any concerns
4. Next steps / decision timeline`,
        },
      },
      {
        type: 'wait',
        order: 5,
        name: 'Wait 4 days',
        enabled: true,
        waitConfig: { duration: 4, unit: 'days' },
      },
      {
        type: 'email',
        order: 6,
        name: 'Special offer',
        enabled: true,
        emailConfig: {
          subject: 'Special offer for {{company}}',
          body: `Hi {{firstName}},

I wanted to reach out with something special for {{company}}.

For new customers this month, we're offering:
• 15% off your first order
• Free shipping
• Extended 60-day trial period

Let me know if you'd like to take advantage of this before it expires!

{{senderName}}`,
          trackOpens: true,
          trackClicks: true,
        },
      },
    ] as StepInput[],
    schedule: {
      sendingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const,
      sendingHours: { start: '09:00', end: '17:00' },
      timezone: 'America/New_York',
      maxPerDay: 30,
    },
    stopOnReply: true,
    stopOnBounce: true,
  },
};

/**
 * AeroNet Enterprise Sequences
 */
export const AERONET_SEQUENCES: Record<string, CreateSequenceInput> = {
  /**
   * Enterprise cold outreach - multi-touch executive engagement
   */
  enterpriseColdOutreach: {
    name: 'AeroNet - Enterprise Cold Outreach',
    description: 'Strategic outreach for enterprise security decision-makers',
    steps: [
      {
        type: 'linkedin_view_profile',
        order: 0,
        name: 'View LinkedIn Profile',
        enabled: true,
        linkedinConfig: { type: 'view_profile' },
      },
      {
        type: 'wait',
        order: 1,
        name: 'Wait 1 day',
        enabled: true,
        waitConfig: { duration: 1, unit: 'days' },
      },
      {
        type: 'email',
        order: 2,
        name: 'Initial outreach',
        enabled: true,
        emailConfig: {
          subject: 'Drone security for {{company}}',
          body: `{{firstName}},

With the 47% annual growth in drone-related security incidents, infrastructure protection has become a board-level priority.

AeroNet™ is the enterprise counter-drone platform trusted by airports, critical infrastructure, and government facilities. Our key differentiators:

• Sub-200ms response times with human oversight
• Blockchain-anchored evidence for regulatory compliance
• Edge AI processing for privacy-first detection

I'd welcome the opportunity to brief you on how organizations like {{company}} are addressing this emerging threat vector.

Would you have 20 minutes for a confidential discussion?

{{senderName}}
{{senderTitle}}`,
          trackOpens: true,
          trackClicks: true,
        },
      },
      {
        type: 'wait',
        order: 3,
        name: 'Wait 4 days',
        enabled: true,
        waitConfig: { duration: 4, unit: 'days' },
      },
      {
        type: 'linkedin_connection',
        order: 4,
        name: 'LinkedIn connection',
        enabled: true,
        linkedinConfig: {
          type: 'connection_request',
          message: `{{firstName}}, I recently reached out regarding drone security solutions. Given your role at {{company}}, I thought you might find our approach to infrastructure protection valuable. Would be great to connect.`,
        },
      },
      {
        type: 'wait',
        order: 5,
        name: 'Wait 3 days',
        enabled: true,
        waitConfig: { duration: 3, unit: 'days' },
      },
      {
        type: 'email',
        order: 6,
        name: 'Case study follow-up',
        enabled: true,
        emailConfig: {
          subject: 'Re: Drone security for {{company}}',
          body: `{{firstName}},

Following up on my previous note about AeroNet.

I wanted to share a brief case study: A major airport recently deployed our system and achieved:
• 99.7% detection accuracy
• Full FAA compliance
• 60% reduction in false positives vs. previous solution

Would this be relevant for {{company}}'s security infrastructure?

{{senderName}}`,
          trackOpens: true,
          trackClicks: true,
        },
      },
      {
        type: 'wait',
        order: 7,
        name: 'Wait 5 days',
        enabled: true,
        waitConfig: { duration: 5, unit: 'days' },
      },
      {
        type: 'task',
        order: 8,
        name: 'Research company',
        enabled: true,
        taskConfig: {
          title: 'Research {{company}} security initiatives',
          description: 'Look for public announcements, RFPs, or news about security investments',
        },
      },
      {
        type: 'wait',
        order: 9,
        name: 'Wait 2 days',
        enabled: true,
        waitConfig: { duration: 2, unit: 'days' },
      },
      {
        type: 'email',
        order: 10,
        name: 'Technical brief',
        enabled: true,
        emailConfig: {
          subject: 'Technical brief: Counter-drone architecture',
          body: `{{firstName}},

I thought you might appreciate this technical brief on modern counter-drone architecture. It covers:

• Detection methodologies and their trade-offs
• Integration with existing security systems
• Compliance considerations for regulated industries
• ROI framework for security investments

[Download Technical Brief]

No strings attached - just hoping it's useful for your planning.

{{senderName}}`,
          trackOpens: true,
          trackClicks: true,
        },
      },
      {
        type: 'wait',
        order: 11,
        name: 'Wait 7 days',
        enabled: true,
        waitConfig: { duration: 7, unit: 'days' },
      },
      {
        type: 'linkedin_message',
        order: 12,
        name: 'LinkedIn message',
        enabled: true,
        linkedinConfig: {
          type: 'message',
          message: `{{firstName}}, I've sent a few emails about AeroNet's counter-drone capabilities. If drone security isn't a priority right now, I completely understand. But if you'd like a quick overview, I'm happy to arrange a confidential briefing at your convenience.`,
        },
      },
      {
        type: 'wait',
        order: 13,
        name: 'Wait 10 days',
        enabled: true,
        waitConfig: { duration: 10, unit: 'days' },
      },
      {
        type: 'email',
        order: 14,
        name: 'Closing email',
        enabled: true,
        emailConfig: {
          subject: 'Closing the loop',
          body: `{{firstName}},

I've reached out a few times about AeroNet and want to be respectful of your time.

If drone security is on your roadmap:
• I'm happy to arrange a technical briefing
• We can discuss your specific requirements
• No commitment required

If it's not a priority right now, just let me know and I'll reach out in a few quarters when timing might be better.

Either way, I appreciate your consideration.

{{senderName}}`,
          trackOpens: true,
          trackClicks: true,
        },
      },
    ] as StepInput[],
    schedule: {
      sendingDays: ['monday', 'tuesday', 'wednesday', 'thursday'] as const,
      sendingHours: { start: '08:00', end: '16:00' },
      timezone: 'America/New_York',
      maxPerDay: 25,
    },
    stopOnReply: true,
    stopOnBounce: true,
  },

  /**
   * Pilot program sequence
   */
  pilotProgram: {
    name: 'AeroNet - Pilot Program',
    description: 'Structured sequence for pilot program participants',
    steps: [
      {
        type: 'email',
        order: 0,
        name: 'Welcome email',
        enabled: true,
        emailConfig: {
          subject: 'Welcome to the AeroNet Pilot Program',
          body: `{{firstName}},

Thank you for your interest in the AeroNet pilot program. We're excited to work with {{company}} on this initiative.

Here's what happens next:

1. **Technical Requirements Review** - Our team will schedule a call to understand your specific needs
2. **Site Assessment** - We'll evaluate your facility for optimal deployment
3. **Pilot Deployment** - 90-day evaluation period with full support
4. **Success Metrics Review** - Joint assessment of results

Your dedicated success manager will be reaching out within 24 hours to begin the process.

In the meantime, please review:
• Pilot Program Overview: [Link]
• Technical Requirements: [Link]
• Security & Compliance Documentation: [Link]

Welcome aboard!

{{senderName}}
{{senderTitle}}`,
          trackOpens: true,
          trackClicks: true,
        },
      },
      {
        type: 'wait',
        order: 1,
        name: 'Wait 1 day',
        enabled: true,
        waitConfig: { duration: 1, unit: 'days' },
      },
      {
        type: 'task',
        order: 2,
        name: 'Schedule requirements call',
        enabled: true,
        taskConfig: {
          title: 'Schedule technical requirements call with {{firstName}}',
          description: 'Review technical requirements, integration needs, and site assessment scheduling',
        },
      },
      {
        type: 'wait',
        order: 3,
        name: 'Wait 3 days',
        enabled: true,
        waitConfig: { duration: 3, unit: 'days' },
      },
      {
        type: 'email',
        order: 4,
        name: 'Site assessment prep',
        enabled: true,
        emailConfig: {
          subject: 'Preparing for your site assessment',
          body: `{{firstName}},

As we prepare for your site assessment, here's what we'll need:

**Before the visit:**
• Site layout/floor plans
• Current security system documentation
• Key stakeholder availability

**During the visit:**
• 2-3 hours on-site
• Access to security operations center
• Discussion with technical team

Please let me know if you have any questions or need to adjust the schedule.

{{senderName}}`,
          trackOpens: true,
          trackClicks: true,
        },
      },
      {
        type: 'wait',
        order: 5,
        name: 'Wait 7 days',
        enabled: true,
        waitConfig: { duration: 7, unit: 'days' },
      },
      {
        type: 'email',
        order: 6,
        name: 'Post-assessment',
        enabled: true,
        emailConfig: {
          subject: 'Site assessment complete - next steps',
          body: `{{firstName}},

Thank you for hosting our team at {{company}}. Based on our assessment, we've prepared:

• **Deployment Proposal** - Custom configuration for your facility
• **Integration Plan** - How AeroNet connects with your existing systems
• **Success Metrics** - KPIs we'll track during the pilot

[View Full Proposal]

I'd like to schedule a call to walk through these recommendations with your team. What works best for your schedule?

{{senderName}}`,
          trackOpens: true,
          trackClicks: true,
        },
      },
    ] as StepInput[],
    schedule: {
      sendingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const,
      sendingHours: { start: '08:00', end: '17:00' },
      timezone: 'America/New_York',
      maxPerDay: 20,
    },
    stopOnReply: false,
    stopOnBounce: true,
  },

  /**
   * Government/Military specialized sequence
   */
  governmentOutreach: {
    name: 'AeroNet - Government/Military',
    description: 'Specialized outreach for government and military prospects',
    steps: [
      {
        type: 'email',
        order: 0,
        name: 'Initial outreach',
        enabled: true,
        emailConfig: {
          subject: 'Counter-UAS capabilities briefing request',
          body: `{{firstName}},

I'm reaching out regarding AeroNet™, our counter-unmanned aircraft system designed for government and defense applications.

AeroNet is purpose-built for sensitive environments requiring:
• ITAR-compliant architecture
• Air-gapped deployment options
• Full chain-of-custody evidence logging
• Integration with existing C4ISR systems

We're currently supporting several federal agencies and would welcome the opportunity to provide a classified briefing on our capabilities.

Would your office be open to scheduling a discussion?

Respectfully,
{{senderName}}
{{senderTitle}}`,
          trackOpens: true,
          trackClicks: true,
        },
      },
      {
        type: 'wait',
        order: 1,
        name: 'Wait 7 days',
        enabled: true,
        waitConfig: { duration: 7, unit: 'days' },
      },
      {
        type: 'task',
        order: 2,
        name: 'Follow up task',
        enabled: true,
        taskConfig: {
          title: 'Follow up with {{firstName}} - Government outreach',
          description: 'Attempt phone contact, research alternative contacts at agency',
        },
      },
      {
        type: 'wait',
        order: 3,
        name: 'Wait 7 days',
        enabled: true,
        waitConfig: { duration: 7, unit: 'days' },
      },
      {
        type: 'email',
        order: 4,
        name: 'Follow-up email',
        enabled: true,
        emailConfig: {
          subject: 'Re: Counter-UAS capabilities briefing request',
          body: `{{firstName}},

Following up on my previous message regarding AeroNet counter-UAS capabilities.

I understand timing and priorities shift. If a briefing isn't feasible now, I'd be happy to:

• Share our capabilities overview (unclassified)
• Connect you with our government sales director
• Provide references from similar agencies

Please let me know how I can best support your evaluation process.

{{senderName}}`,
          trackOpens: true,
          trackClicks: true,
        },
      },
      {
        type: 'wait',
        order: 5,
        name: 'Wait 14 days',
        enabled: true,
        waitConfig: { duration: 14, unit: 'days' },
      },
      {
        type: 'email',
        order: 6,
        name: 'Quarterly update',
        enabled: true,
        emailConfig: {
          subject: 'AeroNet quarterly update',
          body: `{{firstName}},

I wanted to share a brief update on AeroNet developments that may be relevant:

• New certifications achieved: [Details]
• Recent government deployments: [Overview]
• Upcoming industry events: [Schedule]

If counter-UAS becomes a priority for your organization, we'd welcome the opportunity to support your requirements process.

{{senderName}}`,
          trackOpens: true,
          trackClicks: true,
        },
      },
    ] as StepInput[],
    schedule: {
      sendingDays: ['monday', 'tuesday', 'wednesday', 'thursday'] as const,
      sendingHours: { start: '09:00', end: '15:00' },
      timezone: 'America/New_York',
      maxPerDay: 15,
    },
    stopOnReply: true,
    stopOnBounce: true,
  },

  /**
   * Re-engagement sequence for cold leads
   */
  reEngagement: {
    name: 'AeroNet - Re-engagement',
    description: 'Re-activate cold or dormant enterprise leads',
    steps: [
      {
        type: 'email',
        order: 0,
        name: 'Re-engagement email',
        enabled: true,
        emailConfig: {
          subject: 'Checking in - drone security update',
          body: `{{firstName}},

It's been a while since we last connected about counter-drone security for {{company}}.

A lot has changed in the threat landscape:
• Drone incidents up 47% year-over-year
• New regulatory requirements in effect
• Significant advances in detection technology

I'd love to brief you on what we've been building at AeroNet and see if your security priorities have evolved.

Would you have 15 minutes for a quick catch-up?

{{senderName}}`,
          trackOpens: true,
          trackClicks: true,
        },
      },
      {
        type: 'wait',
        order: 1,
        name: 'Wait 7 days',
        enabled: true,
        waitConfig: { duration: 7, unit: 'days' },
      },
      {
        type: 'email',
        order: 2,
        name: 'Case study email',
        enabled: true,
        emailConfig: {
          subject: 'New case study: {{segment}} drone security',
          body: `{{firstName}},

I thought you might find this relevant - we recently published a case study on how a major {{segment}} facility implemented AeroNet.

Key results:
• Deployed in 6 weeks
• Full integration with existing SIEM
• 99.5% detection accuracy

[Read Case Study]

Happy to discuss how this might apply to {{company}}'s environment.

{{senderName}}`,
          trackOpens: true,
          trackClicks: true,
        },
      },
      {
        type: 'wait',
        order: 3,
        name: 'Wait 10 days',
        enabled: true,
        waitConfig: { duration: 10, unit: 'days' },
      },
      {
        type: 'linkedin_message',
        order: 4,
        name: 'LinkedIn message',
        enabled: true,
        linkedinConfig: {
          type: 'message',
          message: `Hi {{firstName}}, hope you're doing well! I recently shared some updates about AeroNet's counter-drone platform. Would love to reconnect if drone security has moved up your priority list.`,
        },
      },
    ] as StepInput[],
    schedule: {
      sendingDays: ['tuesday', 'wednesday', 'thursday'] as const,
      sendingHours: { start: '10:00', end: '14:00' },
      timezone: 'America/New_York',
      maxPerDay: 20,
    },
    stopOnReply: true,
    stopOnBounce: true,
  },
};

/**
 * Get all sequence templates for a brand
 */
export function getSequenceTemplates(brand: 'skysnare' | 'aeronet'): Record<string, CreateSequenceInput> {
  return brand === 'skysnare' ? SKYSNARE_SEQUENCES : AERONET_SEQUENCES;
}

/**
 * Get a specific sequence template
 */
export function getSequenceTemplate(
  brand: 'skysnare' | 'aeronet',
  templateKey: string
): CreateSequenceInput | undefined {
  const templates = getSequenceTemplates(brand);
  return templates[templateKey];
}
