<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Fitmo Next.js App Router project. Here is a summary of all changes made:

**New files created:**
- `instrumentation-client.ts` — Initializes PostHog client-side using the `posthog-js` singleton pattern recommended for Next.js 15.3+. Enables session replay, exception capture, and automatic pageview tracking.
- `lib/posthog-server.ts` — Server-side PostHog client using `posthog-node` for future API route instrumentation.
- `.env.local` — Added `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` environment variables.

**Modified files:**
- `next.config.ts` — Added reverse proxy rewrites (`/ingest/*`) to route PostHog requests through the Next.js server, reducing ad-blocker interference.
- `app/page.tsx` — Added `posthog.identify()` on authenticated session load and `posthog.reset()` on sign-out.
- `components/auth/AuthForm.tsx` — Added `sign_in_started` and `sign_in_error` capture events with exception tracking.
- `app/onboarding/page.tsx` — Added `onboarding_completed` with `gym_goal` and `experience_level` properties.
- `app/pro/page.tsx` — Added `pro_page_viewed` on mount and `subscription_checkout_started` with `plan_type` property.
- `app/pro/exito/page.tsx` — Added `subscription_success_viewed` on page load (bottom of conversion funnel).
- `components/dashboard/Paywall.tsx` — Added `paywall_cta_clicked` when the free user taps "Ver Planes".
- `app/entrenar/page.tsx` — Added workout template lifecycle events, active session events, personal record tracking, and custom exercise catalog events.

| Event | Description | File |
|-------|-------------|------|
| `sign_in_started` | User clicks the Google sign-in button | `components/auth/AuthForm.tsx` |
| `sign_in_error` | An error occurs during the Google sign-in flow | `components/auth/AuthForm.tsx` |
| `onboarding_completed` | User submits the onboarding profile form | `app/onboarding/page.tsx` |
| `pro_page_viewed` | User views the Pro pricing page | `app/pro/page.tsx` |
| `subscription_checkout_started` | User clicks to begin Stripe checkout for a plan | `app/pro/page.tsx` |
| `subscription_success_viewed` | User lands on the success page after payment | `app/pro/exito/page.tsx` |
| `paywall_cta_clicked` | Free user clicks "Ver Planes" on the paywall banner | `components/dashboard/Paywall.tsx` |
| `workout_template_created` | User saves a new workout template | `app/entrenar/page.tsx` |
| `workout_template_updated` | User updates an existing workout template | `app/entrenar/page.tsx` |
| `workout_template_deleted` | User deletes a workout template | `app/entrenar/page.tsx` |
| `workout_session_started` | User starts an active workout session | `app/entrenar/page.tsx` |
| `workout_session_completed` | User finishes and saves a workout session | `app/entrenar/page.tsx` |
| `personal_record_achieved` | User beats a previous personal record | `app/entrenar/page.tsx` |
| `custom_exercise_added` | User adds a new custom exercise to the catalog | `app/entrenar/page.tsx` |

## Next steps

We've built a dashboard and five insights for you to monitor user behavior as soon as events start flowing in:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/382877/dashboard/1469824
- **Subscription Conversion Funnel** (sign-in → onboarding → pro page → checkout → success): https://us.posthog.com/project/382877/insights/s59M3qbQ
- **Workout Sessions Completed Over Time** (daily engagement trend): https://us.posthog.com/project/382877/insights/FBaeunIJ
- **Paywall CTA vs Checkout Started** (paywall-to-checkout drop-off): https://us.posthog.com/project/382877/insights/G3xczLwk
- **Subscription Plan Breakdown** (Mensual / Semestral / Anual preference): https://us.posthog.com/project/382877/insights/HreVZNq2
- **Personal Records Achieved** (records vs total sessions — retention signal): https://us.posthog.com/project/382877/insights/occ3WEvc

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
