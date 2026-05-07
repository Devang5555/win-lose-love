## Scope

Two upgrades, lightweight and reusable. Reuse existing `batches` + `experience_slots` tables, existing admin pages, existing analytics. No new tables.

---

## 1. Premium Departure Selector (Trips + Experiences)

**New component:** `src/components/DepartureStrip.tsx`
- Horizontal swipeable pill-cards (snap-x, overflow-x-auto, mobile-first)
- Shows next 3–5 upcoming batches only (filter `start_date >= today`, limit 5)
- Each card: date (large), seats-left chip, status badge, selected state with ring/glow
- Smart badges (computed client-side, no DB changes):
  - "This Weekend" — start_date is Sat/Sun within 7 days
  - "Filling Fast" / "Limited Seats" — reuses `getSeatStatus`
  - "New Batch" — created within last 3 days
  - "🔥 Popular" — highest seats_booked among visible
- Soft shadows, rounded-2xl, primary glow on active
- Realtime subscription preserved
- Reusable: accepts `source: "trips" | "experiences"` + IDs, queries correct table

**Integration:**
- `BatchSelector.tsx` → swap visual rendering to use `DepartureStrip` internally (keep existing API, so `TripDetail` and others don't break)
- `ExperienceDetail.tsx` / `ExperienceBookingModal.tsx` → wire same component for experience_slots
- Keep "Join Waitlist" / "Plan Your Own Date" fallback when all sold out

---

## 2. Admin Analytics + Cleanup

**Analytics fixes (`src/components/admin/AdminAnalytics.tsx` / `AdvancedAnalytics.tsx`):**
- Compute: total revenue (confirmed+completed), pending revenue (initiated/pending), confirmed bookings, refunds total, split by trips vs experiences (lookup via `trip_id` against `experiences.experience_id`), monthly breakdown (last 12 months)
- Add filters: status, type (trip/experience), date range
- Reuse existing chart components

**SuperAdmin Reset Tools (new section in admin):**
- "Clear Test Bookings" — delete bookings where `notes ILIKE '%test%'` or flagged `is_deleted=true` permanently — super_admin only via existing RLS
- Confirmation modal with typed phrase ("DELETE TEST DATA")
- Audit log every action via `create_audit_log`

**Bulk Booking Management (`src/components/admin/...` - extend existing booking list):**
- Add checkbox column + select-all
- Bulk action bar: Cancel, Soft Delete, Mark Refunded
- Calls existing `cancel_booking_with_seat_release` per booking (loop)
- Confirmation dialog with count

**Auto data sync:**
- Analytics already computed live from bookings table → no orphan data possible
- After bulk action, invalidate React Query caches

**Smart Admin Helper (lightweight):**
- In `TripItineraryEditor` / `ImageUpload`: when multiple images uploaded, auto-distribute first → hero, rest → gallery (only if those slots empty). Single small change.

---

## Technical Details

- No DB migration required (all data already exists)
- New file: `src/components/DepartureStrip.tsx` (~150 lines)
- Edits: `BatchSelector.tsx`, `ExperienceBookingModal.tsx`, `ExperienceDetail.tsx`, `AdminAnalytics.tsx`, admin booking management component, `ImageUpload.tsx`
- New file: `src/components/admin/SuperAdminResetTools.tsx`
- Permissions: gated via existing `usePermissions` (`super_admin` role only for reset tools)

---

## Out of Scope
- No changes to booking/payment lifecycle
- No new tables, no schema changes
- No changes to RLS policies
