# Original homepage restored, Phase 1 improvements retained

Implemented locally on 2 November 2026. No deployment, DNS/domain changes, environment-file changes, database writes or migrations.

This change supersedes the simplified homepage documented in `homepage-phase1-implementation.md`. The original architecture audit and Phase 1 artifacts remain as historical records.

## Restoration source and appearance

Used Git commit **`7305285`**, the existing pre-simplification HEAD, as the restoration source. The following components are now byte-for-byte identical to that revision: **Hero, WhySection, FounderSection, EnquiryForm, TravelByStyle and HowItWorks**. The latter two had remained in the repository throughout Phase 1. No blanket checkout/reset was used on the project.

Restored the original full-bleed hero, gradients, typography, poster/Ken Burns fallback, video implementation, entrance effects, category circles, featured carousel, curated inspiration carousel, destination carousel, travel-style cards, Why StayLocal cards, booking story, founder story and original enquiry presentation. Restored the original transparent/sticky navbar and full footer styling, adding Treks/Tours navigation rather than removing those new destinations. Original hover/lift/carousel/reveal effects and reduced-motion styling remain.

The original hero is **video-capable**, using `NEXT_PUBLIC_HERO_VIDEO_URL` and `NEXT_PUBLIC_HERO_POSTER`. Neither is configured locally, no video file exists in Git, and the original audited public HTML had no video/source element. Consequently screenshots show the original animated-poster fallback. Video source support is restored exactly; an actual video URL/asset is still needed to exercise playback. No unrelated replacement video or environment value was invented. A request for the intended existing asset/URL was sent while implementation continued.

## Only the broken founder destinations were excluded

The original founder section had seven experience cards. Four pointed at unavailable package pages: `/trip/billing`, `/trip/rishikesh`, `/trip/simlipal`, `/trip/jibhi-waterfalls`.

The original FounderSection component and layout are restored, including the **three working original cards** for Jibhi, Andaman and Darjeeling. Homepage loading now queries published Experiences whose slugs match actual published Trips. This excludes the four broken destinations without repairing or redirecting their links, and prevents future unavailable packages being linked there. No Experience record was deleted or altered.

The founder's exact first-person copy, Tapan Naik name and initial avatar are preserved. The original component has no founder photograph; none was fabricated or deleted.

## Phase 1 work retained

- `/treks` and `/tours`: distinct server-rendered landing pages, introductions, truthful current inventory, correct canonicals and metadata. Their package links still use `/trip/[slug]`.
- Published catalogue adapter and price/duration derivation: Jibhi ₹7,500/3D2N, Darjeeling ₹4,999/3D2N, Andaman ₹18,999 matched to 3N4D, and Kashmir ₹14,999/5D4N for the audited published snapshot. These are display derivations from existing offers, not database edits or changed quote arithmetic.
- The restored featured carousel receives those authoritative summaries. Matched Jibhi/Darjeeling/Andaman curated ideas also use their published title, duration and price, and open the existing package detail instead of showing conflicting hardcoded modal content. Other inspiration ideas retain their original indicative-content/modal behavior.
- Request-time sitemap, all published package URLs including Kashmir, and truthful package modification dates. Database errors still fail visibly rather than returning a successful incomplete sitemap.
- Improved homepage/social metadata and existing package metadata summaries; canonical host remains the existing configured Vercel domain.
- Responsive TripCard improvements and accessible sibling gallery buttons; numeric day parsing and combined `/trips` listing.
- Existing admin Builder, authentication, package renderers, bookings API, enquiry processing, customer records and pricing calculations remain unchanged. EnquiryForm itself is restored exactly from Git.

Outside the optional popup, a small, visible **Explore Treks / Explore Tours / All trips** link row complements the original design. It is server-rendered, works without JavaScript, and does not require opening the mobile menu or a planner. Navbar and footer also link to both hubs.

## Welcome popup behavior

`components/WelcomePopup.tsx` is mounted only by the homepage, not by the shared layout or any hub/detail page. It renders a closed native `<dialog>` on the server, then optionally opens 700ms after hydration:

- Heading: **What would you like to explore?**
- **Explore Treks** links to `/treks`.
- **Explore Tours** links to `/tours`.
- **Explore Everything** dismisses it and leaves the visitor on the homepage.
- A visible 44px close button, Escape, and backdrop click all dismiss it.

The component marks `staylocal:welcome-seen:v1` in **sessionStorage when shown**. It therefore stays closed on reload and navigation in the same tab's browser session; a fresh session can see it again. It does not set a permanent localStorage/cookie preference. If storage or modal-dialog support is unavailable, it leaves the page alone. It also avoids interrupting an already-open dialog or a visitor typing in a field.

Native modal focus handling is supplemented by explicit first/last Tab wrapping. Labels, initial close-button focus, focus restoration and scroll-state cleanup are supplied. The overlay enters the browser top layer, so it cannot be covered by the original sticky navigation. It adds no in-flow space; stable scrollbar gutters prevent the document width changing during scroll lock. The panel is responsive, internally scrollable on short screens, and honors reduced motion. It adds no image downloads or modal-library dependency.

Popup interaction is not an indexing gate. The full original homepage and package links are rendered in the initial HTML. Closed dialog markup does not hide the page. Reveal effects are progressively enhanced: content is visible by default and only enters pending animation after the observer is installed, preserving no-JavaScript access while retaining the original scroll reveal effect.

## Visual comparison with Git

`scripts/review-original-home.mjs` reconstructs the historical UI from Git `7305285` under ignored `.next/original-home-reference`, using a saved public-content snapshot, the production CSS/fonts and small Next link/navigation shims. It connects to no database and offers no write endpoints. Its reference is a local historical component harness, **not a separate deployed original build**. Founder reference data uses the original read-only public HTML audit snapshot, which contains all seven original cards.

`scripts/compare-home-restoration.mjs` captures reference and restored pages at **1440 × 1000 desktop** and **390 × 844 mobile**, with reduced motion enabled for stable comparison and the welcome dismissed/suppressed. Both versions have identical hero copy and measured hero dimensions. The mobile hero is pixel-identical; desktop mean absolute channel delta is **0.318 on a 0–255 scale**, including the intentionally changed navbar links. Full-page screenshots were also reviewed for section order, original storytelling, retained working founder cards and corrected published cards.

The reference uses the current generated stylesheet, so the comparison establishes restored component/layout fidelity rather than independently proving an old build's byte-identical CSS. See [comparison metrics and exact-source checks](../artifacts/homepage-restoration/visual-comparison.json).

| View | Desktop | Mobile |
| --- | --- | --- |
| Restored homepage, popup dismissed | [Screenshot](../artifacts/homepage-restoration/home-desktop.png) | [Screenshot](../artifacts/homepage-restoration/home-mobile.png) |
| Welcome popup | [Screenshot](../artifacts/homepage-restoration/welcome-desktop.png) | [Screenshot](../artifacts/homepage-restoration/welcome-mobile.png) |
| Original left / restored right, hero | [Comparison](../artifacts/homepage-restoration/comparison-desktop.png) | [Comparison](../artifacts/homepage-restoration/comparison-mobile.png) |
| Original Git reference, full page | [Screenshot](../artifacts/homepage-restoration/original-full-desktop.png) | [Screenshot](../artifacts/homepage-restoration/original-full-mobile.png) |
| Retained Treks hub | [Screenshot](../artifacts/homepage-restoration/treks-desktop.png) | [Screenshot](../artifacts/homepage-restoration/treks-mobile.png) |
| Retained Tours hub | [Screenshot](../artifacts/homepage-restoration/tours-desktop.png) | [Screenshot](../artifacts/homepage-restoration/tours-mobile.png) |

## Verification

- **346 tests passed in 21 files**, including new popup timing/session/storage/focus/dismissal cases and restored-content/published-experience query checks.
- **TypeScript passed** with `npx tsc --noEmit`.
- **Production webpack build passed** (`npm run build -- --webpack`), including compilation, TypeScript, prerendering and traces.
- Default `npm run build` was attempted and retried outside the sandbox. It remains blocked by the existing machine-specific Turbopack CSS worker port-binding restriction. No default-builder success is claimed; CI should verify it before release.
- `npm run lint` ran through ESLint and reports **21 existing errors / 34 warnings**. All remaining error files are byte-identical to Git HEAD: BookingModal, TripForm, UniversalTrip, legacy-universal, universal-backfill and staging-tests/admin. The prior Reveal effect error was removed by the progressive-enhancement implementation. No rule was disabled to hide baseline errors.
- ESLint across **30 new/modified JS/TS source/test/script files**: **zero errors**, four raw-image warnings in existing image patterns. Exact counts and baseline error locations are saved in [engineering checks](../artifacts/homepage-restoration/checks.json).
- `git diff --check` passed.

Read-only browser verification passed for homepage, hubs, combined listing and all four current package details: 200 status, one server-rendered H1, description, index/follow and self-canonical. Unknown package returned 404. Sitemap included both hubs and all four packages, including Kashmir.

At desktop/mobile, no horizontal overflow, broken images or browser runtime errors were detected. A 320px fit check passed. Native modal state and repeated Tab containment passed; popup opening left hero x-position and width unchanged. All six actions—Treks, Tours, Everything, X, Escape, backdrop—were exercised. Reload/home-return suppression and fresh-session display passed. Fresh direct hub/detail visits contained no welcome dialog. JavaScript-disabled navigation/content discovery passed.

The existing enquiry UI was checked with an intercepted success response, with no request forwarded for persistence. All browser API writes are blocked or intercepted by the verifier. See [route/session/browser evidence](../artifacts/homepage-restoration/verification.json). No production enquiry/customer record was created and no field CWV result is claimed.

## Files for this change request

| Files | Responsibility |
| --- | --- |
| `app/page.tsx` | Original section composition, authoritative catalogue, safe matching Experience query, direct discovery links and homepage-only welcome |
| `components/Hero.tsx`, `WhySection.tsx`, `FounderSection.tsx`, `EnquiryForm.tsx` | Restored exact historical component sources |
| `components/Navbar.tsx`, `Footer.tsx` | Original styling with retained Home/Treks/Tours navigation and footer hub links |
| `components/Discover.tsx`, `CuratedTrips.tsx` | Restored carousel composition; use published summaries for matching package ideas |
| `components/Reveal.tsx`, `app/globals.css` | Original effect with visible default content; stable scrollbar gutter |
| New `components/DiscoveryLinks.tsx` | Visible server-rendered category links outside the popup |
| New `components/WelcomePopup.tsx`, `WelcomePopup.module.css` | Lightweight native session dialog |
| `__tests__/welcome-popup.test.tsx`, `discovery-routes.test.tsx` | Session, dismissal, storage fallback and restored-architecture tests |
| `scripts/verify-home-restoration.mjs`, `review-original-home.mjs`, `compare-home-restoration.mjs` | Local browser checks, Git reference and visual comparison |
| `scripts/verify-discovery.mjs` | Compatibility entrypoint to current verification, rather than obsolete no-popup expectations |
| `artifacts/homepage-restoration/*`, this document | Screenshots, public reference snapshot, evidence and decisions |

The Phase 1 sitemap, route, summary and metadata implementation files were retained without being rolled back. No detail-route migration was attempted.

## Local reproduction

```sh
npm run build -- --webpack
npm run start -- --hostname 127.0.0.1 --port 3116
# Separate terminals:
node scripts/verify-home-restoration.mjs http://127.0.0.1:3116
node scripts/review-original-home.mjs http://127.0.0.1:3116
node scripts/compare-home-restoration.mjs http://127.0.0.1:3116
```

Verification/reference tools refuse non-localhost targets for data acquisition and block browser API writes. The reference server was stopped after comparison; the restored production-build preview is available on localhost port 3116. Publishing and any actual video-source configuration remain separate from this local implementation.
