# pizzahub-client

PizzaHub is a Next.js App Router, React 19, TypeScript, Tailwind v4, and shadcn/Base UI Nova frontend for a pizza ordering and delivery platform. It powers the public storefront, customer ordering and order history, vendor dashboard and restaurant/menu/order management, vendor premium checkout, and admin management screens.

Repository: `https://github.com/JuairahImam/pizzahub_client.git`

Server repository: `https://github.com/JuairahImam/pizzahub_server.git`

Production API: `https://pizzahub-server-toql.onrender.com`

Live storefront (verified by HTTP checks): `https://pizzahubclient.vercel.app`


## Features

- **Public storefront:**
  - Responsive PizzaHub brand home page.
  - Real-time menu browse with search, category, price, price sorting, pagination, and location filtering.
  - Menu item details page.
  - Cart and checkout flow.
  - Customer order history, order details, and pending cancellation.

- **Customer dashboard:**
  - Real-time order statistics.
  - Recent order list and links to order details.

- **Customer/vendor/admin profiles:**
  - Name and profile image update.
  - Better Auth email change disabled in UI; role, blocked, and premium fields are read-only and protected server-side.
  - Password change through Better Auth change-password endpoint.

- **Vendor dashboard:**
  - Restaurant, menu, orders, premium/subscription, and profile management.
  - Menu moderation status and rejection reasons.
  - Real dashboard charts and order progress timeline.

- **Admin dashboard:**
  - User, vendor, menu moderation, transaction, and statistics dashboards.
  - Real-time statistics and charts.
  - User details dialog and block/unblock controls.

- **Global UI:**
  - Toast notifications, dark/light theme toggle, reduced-motion support, custom 404 page, and subtle motion animations.

## Tech stack

- Framework: Next.js 16
- UI: React 19, Tailwind CSS v4, shadcn/Base UI, lucide-react
- Auth: Better Auth, Better Auth JWT plugin, `next-themes`
- Payments: Stripe
- Media: ImgBB

## Install and development

```bash
npm install
npm run dev
```

Development URL: `http://localhost:3000`

## Install and production build

```bash
npm ci
npm run build
npm start
```

Use `npm run typecheck`, `npm run lint`, and `npm run format` as needed.

## Environment variables

Set these in the hosting provider, not in commits:

- `NEXT_PUBLIC_API_URL` — public frontend API base URL
  - Local development (`.env.local` or the in-code fallback): `http://localhost:5001`
  - Production (Vercel build-time value): `https://pizzahub-server-toql.onrender.com`
  - It is public configuration; private secrets must not use this variable.

### Vercel configuration (required for the live site)

`NEXT_PUBLIC_API_URL` is inlined into the browser bundle at **build time**, so it must be set in the Vercel project that deploys this repository before the build runs:

1. Vercel dashboard → the project for `pizzahub-client` (the deployment serving `https://pizzahubclient.vercel.app`) → **Settings → Environment Variables**.
2. Add/ edit variable name `NEXT_PUBLIC_API_URL` with value `https://pizzahub-server-toql.onrender.com`.
3. Select all scopes: **Production**, **Preview**, and **Development**.
4. Save, then trigger a **new deployment** (Redeploy the latest deployment or push a commit). Changing an environment variable alone does not rebuild an existing deployment.
5. Verify the new deployment's browser Network tab has no request to `localhost:5001` and that homepage/menu data loads from `https://pizzahub-server-toql.onrender.com`.

The production build now fails fast if `NEXT_PUBLIC_API_URL` is missing on Vercel, preventing a silent fallback to the local API.

There are no other required client environment variables in the current source.

## API configuration

The client uses `lib/api/client.ts` and `lib/api/endpoints.ts` as the central API helpers.

Rules:
- Use `NEXT_PUBLIC_API_URL`; do not hardcode production URLs in pages.
- Send Better Auth session cookies to `/api/auth/get-session` and `/api/auth/token`.
- Send `Authorization: Bearer <JWT>` only to protected application APIs.
- Use the existing `apiGet`, `apiPost`, `apiPatch`, `apiDelete`, and `apiUpload` helpers.
- Do not invent endpoints; use endpoints defined in `lib/api/endpoints.ts`.

## Authentication and roles

PizzaHub uses Better Auth email/password. Google OAuth is configured in the backend through environment variables.

Client authentication:
- `signUp`, `signIn`, `signOut`, `getSession`, `getToken`, `changePassword`, and `signInWithGoogle` are in `lib/auth/auth-client.ts`.
- `AuthProvider` restores the Better Auth session, obtains a JWT, and keeps the API client token current.
- Protected pages use `ProtectedRoute` with required roles.

Roles:
- `customer` — browses menu, creates orders, manages own orders and profile.
- `vendor` — manages restaurant, menu, orders, and premium subscription.
- `admin` — manages users, vendor signup requests, menu moderation, and transactions.

Signup offers a Customer / Vendor (restaurant owner) choice via `accountType`. The server derives the stored `role` from that allow-listed value in a database hook, so public registration still cannot create an admin. Customers may also submit an upgrade request from `/become-a-vendor`, which an admin approves in trusted server code.

## Admin test access

Do not create or commit production credentials. Use the backend seed script with explicitly supplied environment values:

```bash
ADMIN_EMAIL=<enter-a-safe-admin-email> \
ADMIN_PASSWORD=<enter-a-strong-temporary-password> \
npm run seed:admin
```

Do not print the values in README or commit them. The evaluator should supply a throwaway test account or use a secure deployment-specific test account.

Admin workflows:
- Users: search, role/status filters, pagination, details dialog, block/unblock, self-block prevention.
- Vendor requests: pending/approved/rejected lists, search/status filters, pagination, details dialog, approve, reject with reason validation.
- Menu moderation: pending/approved/rejected lists, search/category filters, pagination, approve/reject with reason validation, delete.
- Transactions: list, search, status/type filters, pagination, details dialog, paid amount/currency display.
- Premium: checkout session creation, webhook-verified activation, transaction persistence.

## Customer workflows

- Sign up/sign in/sign out and profile update.
- Browse menu and place orders from the public menu and cart.
- View customer dashboard with real order statistics and recent orders.
- View order history, order details, rejection reasons, and pending cancellation.

## Vendor workflows

- Create/update restaurant profile.
- Upload menu images to ImgBB, create/edit menu items, admin moderation status and rejection reasons.
- View incoming vendor orders and accept/reject/update fulfillment status.
- View order details, delivery address/phone, rejection reason, and order totals.
- Manage Premium subscription and subscription status.

## Vendor signup workflow

- Signed-in customers apply at `/become-a-vendor` with a restaurant name and optional message.
- The server stores a pending request; duplicates are rejected while one is pending.
- The customer page shows the live status (pending, approved, or rejected with a reason) and allows re-applying after rejection.
- Approval is handled by an admin at `/admin/vendor-requests`; only the server changes the user's role to `vendor`.
- After approval, the client refreshes its session so the new role appears in the header and route guards.
- Sign in/register links carry `?next=/become-a-vendor` so applicants return to the form after authenticating.

## Premium checkout and Stripe

- Vendor clicks Premium on `/vendor/premium`; frontend calls `POST /api/vendor/premium/checkout`.
- Backend creates a Stripe Checkout session using `STRIPE_PREMIUM_PRICE_ID`.
- Success/cancel redirects go to `/vendor/premium/success` and `/vendor/premium/cancel`.
- Stripe webhooks are signature-verified; Premium activation occurs only on authoritative payment events.
- Transactions are persisted in the backend `transactions` collection.
- Do not make real charges in local testing; use Stripe test mode or mock Stripe SDK responses.

## Testing instructions

- `npm run typecheck` — TypeScript type checking.
- `npm run lint` — ESLint.
- `npm run build` — production build.
- `npm run format` — Prettier formatting.
- Manual: open the dev server, register with the Customer or Vendor role, browse the menu, place an order, and use the matching dashboard. Admin test accounts come from the seed script; they are never created by public registration.

## Challenge implementation notes

- **Advanced search and sorting:** the menu page sends `q`, `category`, `location`, `minPrice`, `maxPrice`, `sort=newest|price_asc|price_desc|premium_first`, `page`, and `limit` to `GET /api/menu-items`. `premium_first` is used by the homepage featured section so verified Premium vendors appear first. The server controller validates each parameter and passes them to `customer-menu.service`, which builds the MongoDB query and sort order. The public API also returns `isPremium`, `location`, `itemName`, and `status` so the UI can render Premium badges and location labels.
- **JWT verification:** protected APIs read `Authorization: Bearer <token>`, `jwt.middleware.ts` verifies the token against Better Auth's JWKS (issuer/audience), re-reads the user's role and blocked state from MongoDB on every request, then `role.middleware.ts` returns 401 for missing sessions and 403 for wrong roles.
