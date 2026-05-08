## Scope

Three operational upgrades using existing tables/components. No new tables — reuse `tags[]` (trips, experiences), `batches`, `audit_logs`, `referral_codes`, `referral_earnings`. No backend complexity beyond one tiny migration to add a `marketing_tags text[]` column to `batches` (trips/experiences already have `tags[]`).

---

## 1. Manual Urgency/Marketing Tags

**Single source of truth:** `src/lib/marketingTags.ts` (new)
- Constant list of 10 tags with label + emoji + tone class (token-based, no hex)
- Helpers: `getMarketingTags(tags[])`, `setMarketingTags(tags[], selected[])`, max 2 active
- Tags stored as prefixed strings inside existing `tags[]` array (`mkt:filling-fast`, etc.) → zero schema change for trips/experiences
- For batches: add `marketing_tags text[]` column (single small migration)

**New reusable UI:** `src/components/MarketingTagPicker.tsx`
- Chip selector with max-2 enforcement, used inside admin editors
- `src/components/MarketingTagBadge.tsx` — single badge renderer

**Integrations (read-only display):**
- `TripCard.tsx`, `ExperienceCard.tsx`, `DepartureStrip.tsx`, `BatchSelector.tsx`, `MobileBookingBar.tsx`, `HeroSection.tsx`/featured sections → render `<MarketingTagBadge>` if any present (top-left overlay or near price)
- Existing auto-computed badges (Filling Fast from seat math) stay as fallback only when no manual tag set

**Admin editors:**
- `TripEditor.tsx`, experience editor, `BatchManagement.tsx` → drop in `<MarketingTagPicker>`

---

## 2. SuperAdmin Sync + Visibility

**No new tables.** Surface what already exists.

- New tab in `Admin.tsx` (visible only to `super_admin`): **"SuperAdmin Console"**
  - **Activity Feed**: live query on `audit_logs` (already populated by every privileged action) with filters: actor, entity_type, action_type, date range
  - **Cross-section snapshot**: counts of bookings by status, pending payment proofs (uploaded but not verified), pending refunds, pending referrals, frozen wallets, recent fraud_flags — each linking to existing admin sub-pages
  - **Override tools**: 
    - manual booking status fix (already exists via `verifyAdvancePayment` skip-screenshot path → expose for any booking)
    - resync seats: recompute `seats_booked` for a batch from `bookings` table (one RPC)
    - force re-trigger WhatsApp/email notification for a booking
- Extend `SuperAdminResetTools.tsx` with: "Recalculate batch seats" and "Reprocess pending referrals" buttons (call existing `process_pending_referrals_for_booking` per pending row)
- Ensure all admin actions write to `audit_logs` (audit current admin code; add `create_audit_log` calls where missing — booking edits, refund processing, batch edits)

---

## 3. Referral Usage Flow

**Schema:** add nullable `referred_by_code text` and `referred_by_user_id uuid` to `profiles` (one tiny migration). `bookings.referral_code_used` already exists.

**Signup (`src/pages/Auth.tsx`):**
- New optional "Referral Code" input
- Auto-fill from `?ref=CODE` URL param (already used in share links via `useWallet.getReferralLink`)
- On successful signup → upsert into `profiles.referred_by_code` via new RPC `link_referral_on_signup(p_code)` that:
  - validates code exists, is not user's own
  - blocks if already linked
  - stores referrer link only (NO wallet credit)

**Booking flow:**
- When creating a booking, auto-copy `profiles.referred_by_code` into `bookings.referral_code_used` if blank
- After admin verifies advance payment (in `verifyAdvancePayment`) → call existing `credit_referral_reward(referral_code_used, user_id, booking_id)` — this already enforces trip-only, one-time, and wallet credit
- Already gated to `confirmed/completed` Trips in existing function

**Visibility:**
- User: `WalletTab.tsx` already shows referral code + link + earnings; add "Successful invites: N" + "Pending: M" counts (derived from `referral_earnings`)
- Admin: new compact section in admin `WalletManagement.tsx` (or new tab) showing all `referral_earnings` rows joined to bookings — code used, status, booking value, referrer/referred names

---

## Technical Details

- One DB migration: 
  - `ALTER TABLE batches ADD COLUMN marketing_tags text[] DEFAULT '{}';`
  - `ALTER TABLE profiles ADD COLUMN referred_by_code text, ADD COLUMN referred_by_user_id uuid;`
  - New RPC `link_referral_on_signup(p_code text)` — security definer, validates and links
  - New RPC `recalculate_batch_seats(p_batch_id uuid)` — sums confirmed bookings
- New files:
  - `src/lib/marketingTags.ts`
  - `src/components/MarketingTagPicker.tsx`
  - `src/components/MarketingTagBadge.tsx`
  - `src/components/admin/SuperAdminConsole.tsx`
- Edits: TripCard, ExperienceCard, DepartureStrip, BatchSelector, TripEditor, BatchManagement, experience editor, Admin.tsx (new tab), Auth.tsx (referral input), WalletTab.tsx (counts), useAuth.tsx (call link RPC after signup), MyBookings/booking creation (copy referral code), verifyAdvancePayment (trigger credit)

## Out of Scope
- No payment-system changes
- No new analytics infra (reuse existing AdminAnalytics)
- No redesign of existing components — pure additive layer
