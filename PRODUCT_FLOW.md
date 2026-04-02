# Ajuma AI Product Flow

This document defines the agreed v1 user flow for Ajuma AI before implementation.

## Goal

Support both:

- users who already have a CV
- new graduates or early-career users who do not yet have a CV

The experience should stay lightweight, avoid boring users with too many steps, and still guide them toward a meaningful first outcome: matched jobs.

## Core Principles

- Onboarding should be a single page.
- Users with an existing CV should move quickly.
- Users without a CV should still get value immediately.
- Profile editing should be lightweight, not a full resume-builder experience.
- Jobs should appear after an intentional button click.

## End-to-End Flow

```text
Landing
  -> Auth
  -> Onboarding
  -> CV Branch
      -> Existing CV -> Upload CV
      -> No CV -> Generate Starter CV
  -> Profile Review
  -> Job Match Intro
  -> Jobs
```

## Screen-by-Screen Flow

### 1. Landing

Purpose:

- Explain Ajuma AI clearly
- Drive users into the product

Primary actions:

- `Get Started Free`
- `Sign In`

Transition:

- Opens auth modal

### 2. Auth Modal

Purpose:

- Sign in existing users
- Create accounts for new users

Fields:

- Email
- Password

Primary actions:

- `Sign In`
- `Create Account`

Success routing:

- First-time user -> Onboarding
- Returning user with completed setup -> Jobs or dashboard
- Returning user mid-flow -> Resume at last incomplete step

### 3. Onboarding Page

Purpose:

- Gather minimal data needed for personalization
- Determine whether the user already has a CV

Sections:

- Personal Info
  - Full name
  - Location
- Career Direction
  - Target role
  - Years of experience
  - Work preference: remote / hybrid / onsite
- Education / Background
  - Education level
- Skills
  - Key skills
- CV Status
  - `I already have a CV`
  - `I need help creating one`

Primary actions:

- If user has a CV: `Continue with My CV`
- If user does not have a CV: `Generate My Starter CV`

Notes:

- This must remain a single page.
- The CV choice should feel simple, not like a detour.

### 4A. Upload CV Screen

Purpose:

- Bring in an existing resume with as little friction as possible

Fields:

- File upload
- Optional paste-text fallback
- Optional note for emphasis or goals

Primary action:

- `Upload and Continue`

Success transition:

- Resume is uploaded
- AI extraction/parsing runs
- User proceeds to profile review

### 4B. Starter CV Generation Screen

Purpose:

- Help users who do not yet have a CV generate a usable first draft

Show:

- Summary of onboarding information
- Small set of editable fields for missing context:
  - School
  - Course / major
  - Projects
  - Internship / work experience
  - Strengths / interests

Primary action:

- `Generate My CV`

Success transition:

- AI creates starter CV/profile
- User proceeds to profile review

Notes:

- This should feel like completing a profile, not like another long onboarding form.

### 5. Profile Review Screen

Purpose:

- Build trust in the AI result
- Allow lightweight corrections before job matching

Display:

- Headline
- Professional summary
- Top skills
- Education
- Experience / projects

Editing level:

- Minimal inline editing
- No full-blown resume-builder complexity in v1

Primary actions:

- `Looks Good`
- `Edit Profile`

Secondary action:

- `Regenerate`

Success transition:

- User clicks `Looks Good`
- Moves to job match intro

### 6. Job Match Intro Screen

Purpose:

- Create a clear success transition before showing jobs
- Let the first payoff feel intentional

Display:

- Confirmation that the profile is ready
- Short summary of the user's target role and strengths
- Hint that matching jobs are ready

Primary action:

- `See Matching Jobs`

Success transition:

- Jobs screen loads

### 7. Jobs Screen

Purpose:

- Deliver the first major user value moment

Display:

- Matched jobs
- Role title
- Company
- Location
- Work mode
- Match score or relevance reason

Primary actions:

- `Save`
- `Track`
- `Apply`

Later actions:

- `Auto Apply`
- alerts
- personalization improvements

## Returning User Routing

Returning users should not be forced through completed setup again.

Routing rules:

- Onboarding incomplete -> return to onboarding
- CV path incomplete -> return to upload or starter CV step
- Profile incomplete -> return to profile review
- Profile complete -> go to jobs or dashboard

## Minimal State Model

Suggested app states:

- `auth`
- `onboardingComplete`
- `cvMode`
  - `existing`
  - `generate`
- `resumeUploaded`
- `starterCvGenerated`
- `profileGenerated`
- `profileReviewed`
- `jobsViewed`

## Implementation Order

Recommended coding order:

1. Auth routing
2. One-page onboarding
3. CV branch selection
4. Upload CV / starter CV generation step
5. Profile review
6. Job match intro
7. Jobs screen

## v1 Summary

Ajuma AI v1 should support both fast-moving experienced candidates and new graduates without CVs through one coherent path:

```text
Landing
-> Auth
-> Onboarding
-> Existing CV or Generate Starter CV
-> Profile Review
-> See Matching Jobs
-> Jobs
```
