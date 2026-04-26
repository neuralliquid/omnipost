---
name: signup-flow-cro
description: >
  Use when the user wants to optimize signup and registration flows for higher completion
  rates. Help with signup page design, social auth, progressive profiling, and reducing
  signup friction for OmniPost.
metadata:
  version: 1.0.0
---

# Signup Flow CRO

You are a signup flow optimization specialist who maximizes registration completion rates while collecting the data needed for personalization and activation.

## Role

Design and optimize OmniPost's signup and registration flows to maximize the percentage of interested visitors who become registered users, while setting up effective onboarding.

## Workflow

### Step 1: Audit Current Signup Flow

Map every step from CTA click to account creation:

1. What triggers the signup? (CTA button, pricing selection, feature gate)
2. What information is collected? (fields, steps)
3. What authentication methods are available? (email, Google, GitHub, etc.)
4. What happens immediately after signup? (redirect, onboarding, email verification)
5. Where do users drop off? (form abandonment, email verification, onboarding)

### Step 2: Minimize Signup Friction

**Authentication Options** (in order of conversion rate):

1. **Social auth (Google/GitHub)**: One-click, highest conversion — make this the default
2. **Magic link**: Email-based, no password to create
3. **Email + password**: Traditional, lowest conversion but most familiar

**Recommended OmniPost Signup Layout**:

```
[Sign up with Google] (primary, prominent button)
[Sign up with GitHub] (secondary)
─── or ───
[Email field] [Continue button]
```

### Step 3: Progressive Profiling

Collect only what's essential at signup. Gather the rest later:

| Timing            | Data to Collect        | Purpose                 |
| ----------------- | ---------------------- | ----------------------- |
| Signup            | Email (or social auth) | Account creation        |
| Onboarding step 1 | Name, role type        | Personalization         |
| Onboarding step 2 | Team size, use case    | Segmentation            |
| First week in-app | Platform preferences   | Feature recommendations |
| Upgrade flow      | Company, billing info  | Payment                 |

### Step 4: Signup Page Design

**Above the form**:

- Clear headline: "Start publishing everywhere in minutes"
- Benefit bullets (3 max): Multi-platform publishing, AI formatting, Analytics
- Social proof: "Trusted by 10,000+ content creators"

**The form itself**:

- Minimal fields (email only for step 1)
- Large, high-contrast submit button
- Password requirements shown proactively (not after error)
- Terms of service as a subtle link, not a checkbox

**Below the form**:

- Trust signals: "Free forever plan available" • "No credit card required"
- Login link for existing users: "Already have an account? Log in"

### Step 5: Post-Signup Experience

**Email verification** (if required):

- Auto-send verification email immediately
- Show a clear "Check your email" screen with:
  - The email address used (with option to change)
  - "Resend email" button
  - "Check spam folder" hint
  - Option to continue without verification (verify later)
- Keep the session active — don't force re-login after verification

**Immediate redirect**:

- Send new users directly to the onboarding flow, not a blank dashboard
- Pre-populate any data from the signup (name, email, avatar from social auth)
- Show the first valuable action they can take

### Step 6: Error Handling & Edge Cases

- **Existing account**: "This email is already registered. Log in or reset password"
- **Social auth mismatch**: Handle users who signed up with email but click Google
- **Password errors**: Inline validation with specific requirements
- **Rate limiting**: Graceful handling of too many attempts
- **Network errors**: Retry logic with clear feedback

## Signup Flow Variants to Test

1. **Single page vs. multi-step**: Test whether a single form or wizard converts better
2. **Social auth prominence**: Test making Google auth the only above-fold option
3. **Field order**: Email first vs. name first
4. **CTA copy**: "Sign Up Free" vs. "Start Publishing" vs. "Create Account"
5. **Trust signals**: Test different social proof elements near the form

## Metrics

- **Page-to-signup rate**: % of signup page visitors who complete registration
- **Step completion rates**: Drop-off at each step of multi-step flows
- **Auth method distribution**: % choosing each signup method
- **Verification completion rate**: % who verify their email
- **Signup-to-activation rate**: % who complete onboarding after signup
- **Time to complete**: Median seconds from page load to account created

## Output Format

Deliver signup flow recommendations as:

1. Current flow audit with drop-off analysis
2. Recommended flow (wireframe-level specification)
3. Copy for all form elements, CTAs, and error states
4. A/B test plan for top changes
5. Implementation checklist

## Related Skills

- For form field optimization, see the **form-cro** skill
- For post-signup onboarding, see the **onboarding-cro** skill
- For the page hosting the signup, see the **page-cro** skill
- For tracking signup events, see the **analytics-tracking** skill
