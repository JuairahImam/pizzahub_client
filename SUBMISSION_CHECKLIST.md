# PizzaHub — Assignment 9 (Category 009) Submission Checklist

> Final preparation notes. No credentials, tokens, secrets, or payment data are stored in this file.
> This checklist documents what is implemented, what was actually verified, and what remains blocked.

## 1. Submission fields

| Field | Value |
| --- | --- |
| Admin Email | `<set-by-owner-via-seed-admin>` — placeholder only; no credential is stored here |
| Admin Password | `<strong-temporary-password-set-by-owner>` — placeholder only; never commit or paste |
| Live Site Link | https://pizzahubclient.vercel.app |
| Live Backend API | https://pizzahub-server-toql.onrender.com |
| GitHub Repository (Server) | https://github.com/JuairahImam/pizzahub_server.git |
| GitHub Repository (Client) | https://github.com/JuairahImam/pizzahub_client.git |
| Additional Instructions for Testing | See sections 4–7 of this file and the READMEs in each repository |

Repository URLs are taken verbatim from `git remote -v` in each repository.

### Admin credential setup / verification (do not expose values)

1. In `pizzahub-server`, supply the owner-chosen `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` as environment values (never in Git).
2. Run `npm run seed:admin`. The script creates or updates that account through Better Auth and sets `role: "admin"`.
3. Sign in at `/login` with those owner-supplied values and confirm the Admin navigation is reachable.
4. If an admin was already seeded during deployment, the owner should reset/rotate the password using the same seed procedure with a new temporary value. Do not print the password in logs, reports, or documentation.
5. No new admin account was created during this preparation task, and no credential value is present in this checklist.

## 2. Technology stack (from `package.json`)

**Frontend (`pizzahub-client`)**

- Next.js `16.4.5`, React / React DOM `19.3.1`, TypeScript
- Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/postcss`), `tw-animate-css`, `class-variance-authority`, `cn`
- shadcn/ui `4.23.0` with `@base-ui/react` `1.9.0`, `lucide-react` `1.74.0`
- `next-themes` `0.4.6` for light/dark theme
- Better Auth integration through direct REST calls to `/api/auth/*` (there is no `better-auth` npm client package in the frontend)
- No `motion` / `framer-motion` dependency; animation is done with Tailwind/CSS classes

**Backend (`pizzahub-server`)**

- Express `5.3.0`, TypeScript, MongoDB driver `7.9.0`
- Better Auth `1.7.25` (email/password + JWT plugin), `jose` `6.2.17` for JWT verification
- Stripe `23.1.0`, ImgBB via HTTP upload in the image service, `multer` `2.5.0`
- `cors`, `dotenv`, `tsx` (local runner)

## 3. Implemented features

**Customer** — menu browsing with search/category/price/location filters and sorting; item detail page; localStorage cart with restaurant-mismatch confirmation; checkout validation and order creation; order history, details, rejection reason, pending cancellation; customer dashboard with real order statistics.

**Vendor** — restaurant profile; menu item create/edit/delete; ImgBB image upload through multipart `image` field; approval status and rejection feedback; free-plan active-item limit vs Premium entitlement; vendor order listing, accept/reject, and status progression; Premium checkout UI and subscription state.

**Admin** — dashboard analytics/charts; user listing, search, filters, pagination, detail dialog, block/unblock (optional per updated assignment); menu moderation listing, approve/reject with reason, delete; transaction listing, filters and details.

**Optional / extra** — dark/light theme (including keyboard shortcut), order progress timeline, toast notifications, reduced-motion support, custom 404 page, accessible responsive layouts.

User blocking is treated as **OPTIONAL** per the updated assignment, not a mandatory blocker.

## 4. Safe testing instructions

1. **Public menu** — open the live site, browse `/menu`, try search, category chips, location filter, min/max price, sort and pagination. Open any item's *View details* page.
   - *Verified locally*: search, category, location, price sorting, details, cart, 404, theme toggle and responsive layout passed against the local frontend using the production API.
   - *Live blocker*: the deployed frontend bundle currently points API calls at `http://localhost:5001`, so featured menu data does not load on the live site. Fix `NEXT_PUBLIC_API_URL` in Vercel, then re-run these checks.
2. **Customer** — use a throwaway account via `/register` (or a dedicated test account). Check `/customer`, `/orders`, cart → checkout → place a small test order only with isolated test data, then cancel a PENDING test order from `/orders`.
3. **Vendor** — sign in with a dedicated vendor account (an admin can promote a throwaway test user via Manage Users). Check `/vendor` dashboard, restaurant, menu CRUD, image upload, orders, `/vendor/premium`.
4. **Admin** — sign in with the seeded admin, open `/admin`, then Users / Menu Moderation / Transactions. Approve only clearly identified demo items. Never block or delete real users.
5. **Premium Stripe test mode** — only with Stripe **test** keys, a dedicated test vendor and a configured test webhook: `POST` checkout from `/vendor/premium`, use test card `4242 4242 4242 4242`, any future expiry, any CVC; confirm webhook-driven activation and a persisted transaction. Never use real cards or live keys.

**Actual verification status of this preparation round**

| Area | Status |
| --- | --- |
| Guest public flows, filters, cart controls, 404, theme, responsive (local frontend + production API) | PASS |
| Customer login with dedicated throwaway account (standalone browser check) | PASS |
| Complete customer order → history → cancellation flow | IMPLEMENTED / NOT TESTED (browser suite did not complete it reliably) |
| Vendor workflows | BLOCKED — no dedicated vendor test account available |
| Admin workflows | BLOCKED — no dedicated admin test account available |
| Stripe test checkout / webhook / entitlement | NOT TESTED — no test-mode credentials or webhook access |
| Live deployment data flow | FAIL — `NEXT_PUBLIC_API_URL` misconfigured; see section 7 |

## 5. Environment variables (names only — no values)

**`pizzahub-client`:** `NEXT_PUBLIC_API_URL`

**`pizzahub-server`:** `PORT`, `NODE_ENV`, `MONGODB_URI`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PREMIUM_PRICE_ID`, `IMGBB_API_KEY`, `CLIENT_URL`, `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `VENDOR_NAME`, `VENDOR_EMAIL`, `VENDOR_PASSWORD`, `CUSTOMER_NAME`, `CUSTOMER_EMAIL`, `CUSTOMER_PASSWORD`, `DEMO_VENDOR_EMAIL` (optional override for the demo-menu seed), `DEMO_SEED_TARGET` (required as `production`/`staging`/`local` only when committing the demo-menu seed).

Both repositories ignore `.env*` (verified with `git check-ignore`). No secret value is stored in this checklist or in Git.

## 6. Demo menu data population (prepared, not executed against production)

An idempotent seed is available at `pizzahub-server/src/scripts/seed-demo-menu.ts` (`npm run seed:demo-menu`). Its default mode is a **read-only dry run**; writes require `DEMO_SEED_COMMIT=1` plus `DEMO_SEED_TARGET=production|staging|local` and explicit owner approval. The client's `next.config.ts` permits `images.unsplash.com` so these demo images can render once approved.

- Target (read-only audit): demo vendor ID `6afd1fa707e4b2b03d15fb43`, restaurant ID `6afd1fa807e4b2b03d15fb49` — "PizzaHub Demo Restaurant", address "Dhanmondi, Dhaka, Bangladesh".
- 12 proposed items: Margherita Classic 499, Pepperoni Feast 699, BBQ Chicken Supreme 749, Four Cheese Delight 799, Spicy Beef Volcano 849, Garden Fresh Veggie Pizza 599, Hawaiian Chicken Pizza 729, Mushroom Alfredo Pizza 699 (Pizza); Garlic Bread 199, Loaded Cheesy Fries 249 (Sides); Chocolate Brownie 179 (Desserts); Fresh Lemonade 129 (Drinks).
- All images are verified public food photographs (HTTP 200 `image/jpeg`, visually checked). They are **not** ImgBB uploads.
- Every inserted item is `PENDING`, `isAvailable: true`, and must be approved through Admin → Menu Moderation before appearing publicly. The script never modifies users, restaurants, orders, transactions or existing menu items.
- Dry run result: 11 items would be inserted, "Garlic Bread" skipped as an existing duplicate (idempotency confirmed). **No production write was performed.**

## 7. Final requirement audit

| Requirement | Status | Note |
| --- | --- | --- |
| Customer browse/search/filter/detail/cart/checkout/orders/cancel | IMPLEMENTED / NOT TESTED | Parts verified locally; full order lifecycle not reliably verified in browser suite |
| Vendor restaurant/menu CRUD, upload, approval, order management, Premium | IMPLEMENTED / NOT TESTED | No dedicated vendor test account available |
| Admin analytics, users, moderation, transactions | IMPLEMENTED / NOT TESTED | No dedicated admin test account available |
| Role-based protected routes | IMPLEMENTED / NOT TESTED | Guest redirects verified locally; full customer/vendor/admin matrix not verified |
| Private route refresh / session persistence | IMPLEMENTED / NOT TESTED | Browser results inconsistent; recheck after deployment fix |
| Six featured approved items on homepage | FAIL | Only 5 approved items exist; live API misconfigured. Pending approved data population |
| Multiple images on item details | OPTIONAL | Single image per item implemented; multi-image gallery not implemented |
| Google OAuth | IMPLEMENTED / NOT TESTED | Social sign-in helper and backend env support exist; not exercised |
| ImgBB upload | IMPLEMENTED / NOT TESTED | Multipart `image` workflow present; not exercised with a test vendor |
| Stripe webhook activation / entitlement | IMPLEMENTED / NOT TESTED | Webhook handler present; no test-mode verification |
| Stripe expiry / cancellation | IMPLEMENTED / NOT TESTED | Subscription fields present; no test-mode verification |
| Responsive design | PASS | 1440×900 / 768×1024 / 390×844 layout checks passed locally, including overflow fix |
| User blocking | OPTIONAL | Per updated assignment |
| Frontend commit count (≥20) | PASS | 31 commits |
| Backend commit count (≥12) | PASS | 26 commits |
| Separate GitHub repositories | PASS | Two distinct origins recorded in section 1 |
| README completeness | PASS | Frontend and backend READMEs document setup, env, features and testing |
| Live deployment | FAIL | Frontend deployed but `NEXT_PUBLIC_API_URL` is baked as `http://localhost:5001`; live data flows are broken until the Vercel env var is corrected and redeployed |
| No secrets committed | PASS | `.env*` ignored; no credential values found in tracked docs/sources |

## 8. Remaining blockers before final submission

1. Correct `NEXT_PUBLIC_API_URL` in the Vercel deployment (exact steps: README → "Vercel configuration") and redeploy, then repeat live smoke tests. The production build now fails fast if this variable is missing on Vercel.
2. Obtain owner approval for the target database, then run the demo-menu seed in commit mode and approve the new PENDING items through the real admin moderation workflow.
3. Replace placeholder images on the five pre-existing demo items (requires an explicitly approved data update; not done here).
4. Supply dedicated throwaway vendor/admin test accounts to complete role and workflow verification, and Stripe test-mode credentials/webhook access for payment verification.
