# GoBhraman Premium Upgrade — Phased Plan

This is a large scope. To stay safe (no booking/payment/admin regressions) I'll ship it in **8 sequential phases**, each independently shippable and reversible. You approve this plan, then I execute one phase at a time and check in after each.

---

## Phase 1 — Payment + Booking Stabilization (highest priority)
Harden the existing flow without rearchitecting it.

- Audit `BookingModal`, `confirm_booking_after_payment` RPC, `verifyAdvancePayment`, screenshot upload path.
- Guarantee booking row exists **before** payment popup opens (already partially true) and survives popup close.
- Add screenshot upload fallback inside MyBookings for any booking stuck in `initiated`/`pending`.
- Ensure admin always sees `advance_screenshot_url` + `remaining_screenshot_url` (add empty-state + recovery action).
- Idempotency on `confirm_booking_after_payment` (already idempotent — verify).
- Reconcile seat counts via existing `recalculate_batch_seats` — add an admin "Resync seats" button per batch.
- Verify `send-booking-notification` (WhatsApp/email) is called on confirm + on admin verify; add retry log.
- Experiences: confirm `ExperienceBookingModal` reuses same booking table + RPC (it does) — remove any divergent logic.

## Phase 2 — Mobile-First Booking Cleanup
- Collapse trip detail sidebar on mobile into: Pricing → Departure → Add-ons → CTA → WhatsApp.
- Convert `BatchSelector` mobile view to **swipeable horizontal cards** (snap scroll).
- Remove residual duplicate spacing/sections; tighten paddings; ensure sticky `MobileBookingBar` is the single CTA on mobile.
- Thumb-zone audit: CTA ≥ 48px, bottom-safe-area aware.

## Phase 3 — Contextual Trust System (finish)
Already 80% done via `deriveTrustBadges`. Remaining:
- Audit every page that still renders `TrustIndicators`/static badges; remove duplicates.
- Tune badge rules per your matrix (camping/trek/long-trip lists you specified).
- Cap at 4, single placement per page (top of detail page only).

## Phase 4 — Social Proof + Gallery System
New reusable `<SocialProofStrip />` + `<TripGallery />`:
- Real photos (existing `images[]`), optional reels (new `videos[]` jsonb column on trips/experiences).
- "Recently joined" (last 5 confirmed bookings, first-name + city only).
- "Most booked this month" badge driven by booking counts.
- Review snippets carousel (reuse `reviews` table).
- Lightweight: lazy-loaded, no heavy lightbox lib.

DB: non-destructive `ALTER TABLE trips/experiences ADD COLUMN videos jsonb DEFAULT '[]'`.

## Phase 5 — Dynamic SEO + Sharing
- Add `react-helmet-async` for per-route head (currently using imperative `SeoMeta`).
- Per-trip OG image = first trip image; per-experience same.
- JSON-LD `TouristTrip` / `Event` schema on detail pages.
- Sitemap edge function: include experiences + blog posts + collection pages.
- WhatsApp preview test via canonical + og:image.

## Phase 6 — Discovery Collections
- New route `/collections/:slug` with rule-based filters:
  - `monsoon-escapes`, `weekend-treks`, `beginner-friendly`, `under-1999`, `camping`, `pune-experiences`.
- Rules live in `src/lib/collections.ts` (tag/price/duration/location predicates).
- Homepage strip + nav entry.
- No new DB table — derived from existing trips/experiences.

## Phase 7 — Experience Differentiation
- New `ExperienceDetail` layout variant: event-card hero, "Who's coming" social block, vibe gallery, urban map embed.
- Keep Trip layout (itinerary-focused) untouched.
- Shared primitives, different composition.

## Phase 8 — OCR Itinerary Helper (Admin)
- New admin tool inside `TripItineraryEditor`: "Extract from image".
- Edge function `extract-itinerary-ocr` using **Lovable AI Gateway** (`google/gemini-2.5-flash` — strong OCR + structured output, no extra key).
- Returns structured JSON `{ days: [{ title, items: [{ time, activity, location }] }] }`.
- Admin reviews + edits before save. No auto-publish.

---

## Technical guardrails (apply to all phases)
- Non-destructive migrations only (per project memory).
- No changes to `confirm_booking_after_payment` signature or seat semantics.
- Email/password auth only; no Google.
- Reuse `deriveTrustBadges`, `dynamicPricing`, `seatStatus`, existing RPCs.
- All new colors via HSL tokens in `index.css`.
- Mobile breakpoint `useIsMobile` (768px) consistent across new components.

## Files touched (high-level, per phase)
- P1: `BookingModal.tsx`, `ExperienceBookingModal.tsx`, `MyBookings.tsx`, `Admin.tsx`, `send-booking-notification/index.ts`
- P2: `TripDetail.tsx`, `BatchSelector.tsx`, `MobileBookingBar.tsx`
- P3: `TripDetail.tsx`, `ExperienceDetail.tsx`, `lib/trustBadges.ts`
- P4: new `SocialProofStrip.tsx`, `TripGallery.tsx`; migration for `videos` column
- P5: `main.tsx` (HelmetProvider), per-page `<Helmet>`, `sitemap/index.ts`
- P6: new `pages/Collection.tsx`, `lib/collections.ts`, `App.tsx` route, `Navbar.tsx`
- P7: `ExperienceDetail.tsx` (variant), new `ExperienceHero.tsx`, `WhosComingBlock.tsx`
- P8: new `extract-itinerary-ocr` edge function, `TripItineraryEditor.tsx` upload button

## Out of scope (explicitly)
- No rewrite of payment/booking RPCs.
- No new auth providers.
- No design-system overhaul — refinement only.
- No heavy animation libs beyond existing `framer-motion`.

---

**Approve this plan and I'll start with Phase 1 (Payment + Booking Stabilization).** I'll pause after each phase for your sign-off before moving on.
