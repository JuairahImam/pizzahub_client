# pizzahub-client

PizzaHub is a Next.js App Router, React 19, TypeScript, Tailwind v4, and shadcn/Base UI Nova frontend for a pizza ordering and delivery platform. It powers the public storefront, customer ordering and order history, vendor dashboard and restaurant/menu/order management, vendor premium checkout, and admin management screens.

Repository: `https://github.com/JuairahImam/pizzahub_client.git`

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

- `NEXT_PUBLIC_API_URL` — public frontend API base URL, e.g. `https://pizzahub-server-toql.onrender.com`
  - Default locally: `http://localhost:5001`
  - It is public configuration; private secrets must not use this variable.

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
- `admin` — manages users, menu moderation, and transactions.

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
- Manual: open the dev server, sign up as customer/vendor/admin, browse menu, place order, vendor accept/reject, admin moderate/delete, theme toggle, dashboard charts, location filter, custom 404.
