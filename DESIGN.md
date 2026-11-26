# PizzaHub — Frontend Design System

> Brand direction: modern, warm, appetizing, trustworthy.  
> Stack: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui (Base UI, Nova preset).

## 1. Design goals

- Make browsing food and placing orders simple.
- Let food photography be the visual focus.
- Keep prices, availability, and order status clear.
- Give customers, vendors, and admins distinct experiences.
- Keep every page responsive, accessible, and consistent.
- Avoid generic dashboard-template styling on the customer-facing site.

## 2. Brand colors

| Token | Hex | Usage |
|---|---|---|
| Brand maroon | `#741F2B` | Primary buttons, links, active navigation |
| Maroon hover | `#5D1722` | Hover and pressed states |
| Soft maroon | `#F4E7E8` | Selected states and subtle panels |
| Warm yellow | `#F4C542` | Small highlights, promo accents, badges |
| Yellow hover | `#E5B52E` | Yellow accent hover |
| Soft yellow | `#FFF4CC` | Highlight backgrounds |
| Cream background | `#FFFDF8` | Main page background |
| White surface | `#FFFFFF` | Cards, dialogs, forms |
| Muted surface | `#F7F1E8` | Secondary sections |
| Main text | `#2A2020` | Primary text |
| Muted text | `#756A67` | Supporting text |
| Border | `#E9DED5` | Dividers and control borders |
| Success | `#247A50` | Successful/delivered states |
| Warning | `#A96712` | Pending/attention states |
| Danger | `#B42332` | Errors, destructive, rejected |
| Info | `#28658A` | Informational states |

### Color rules
- Maroon is the primary action color.
- Yellow is an accent, not a second primary color for every button.
- Use dark text on yellow; never white text on yellow.
- Cream is the default page background; use white cards for contrast.
- Status must include text, not color alone.
- Avoid huge blocks of saturated yellow or maroon.

### Suggested theme variables

Adapt these to the format already used by the installed Tailwind/shadcn version. Inspect `globals.css` before changing it.

```css
:root {
  --background: 40 60% 99%;
  --foreground: 10 13% 15%;
  --card: 0 0% 100%;
  --card-foreground: 10 13% 15%;
  --popover: 0 0% 100%;
  --popover-foreground: 10 13% 15%;
  --primary: 352 58% 29%;
  --primary-foreground: 0 0% 100%;
  --secondary: 36 43% 94%;
  --secondary-foreground: 10 13% 15%;
  --muted: 36 43% 94%;
  --muted-foreground: 15 7% 44%;
  --accent: 45 89% 61%;
  --accent-foreground: 10 13% 15%;
  --destructive: 355 69% 42%;
  --border: 28 27% 89%;
  --input: 28 27% 89%;
  --ring: 352 58% 29%;
  --radius: 0.75rem;
}
```

## 3. Typography

Use Geist/Geist Sans if already configured by Next.js; otherwise use Inter. Keep typography consistent.

- Hero: 40–56px desktop, 32–40px mobile.
- H1: 30–36px desktop, 26–30px mobile.
- H2: 24–28px.
- H3: 18–20px.
- Body: 14–16px with comfortable line-height.
- Metadata: 12–13px, still readable.
- Use no more than three font weights on one page.

## 4. Layout and spacing

- Center content in a container around 1280px maximum width.
- Use a 4px spacing scale: 4, 8, 12, 16, 24, 32, 48, 64px.
- Cards: 12–16px radius.
- Inputs/buttons: 8–10px radius.
- Use subtle borders; shadows should be soft and rare.
- Avoid excessive gradients, glassmorphism, and decorative animation.

## 5. Reusable components

Build shared components instead of duplicating UI.

### Global
`SiteHeader`, `SiteFooter`, `MobileNavigation`, `PageContainer`, `SectionHeading`, `SearchInput`, `Price`, `StatusBadge`, `EmptyState`, `ErrorState`, `LoadingSkeleton`, `ConfirmDialog`, `Pagination`, `FormField`, `ImageUploader`.

### Food/menu
`MenuItemCard`, `MenuGrid`, `CategoryChip`, `MenuFilters`, `MenuSort`, `RestaurantCard`, `QuantitySelector`, `OrderSummary`, `FoodImage`.

### Dashboard
`DashboardShell`, `DashboardSidebar`, `DashboardHeader`, `StatCard`, `DataTable`, `FilterBar`, `ProfileForm`.

Use the existing shadcn/ui Base UI + Nova preset. Do not introduce another component library without a clear reason.

## 6. Page specifications

### Public/customer

#### Home `/`
1. Header with logo, menu navigation, sign-in, and relevant order/cart entry point.
2. Hero with strong headline, supporting copy, CTA, and food visual.
3. Featured categories: Pizza, Sides, Drinks.
4. Popular menu section backed by real menu data.
5. Short “How it works” section.
6. Footer.

Suggested copy: “Your next favorite pizza is one click away.”  
CTA: “Explore Menu”.

Do not invent delivery estimates, discounts, ratings, restaurant counts, or popularity metrics.

#### Menu `/menu`
- Search, category, min/max price filters.
- Sort: newest, price low-to-high, price high-to-low.
- Responsive menu grid and pagination.
- Loading, empty, and error states.
- Keep filters in the URL where practical.

#### Menu detail `/menu/[id]`
- Large image, name, description, category, price.
- Restaurant details if supplied by API.
- Availability and customer order action.
- Guests attempting protected actions should get a clear sign-in prompt.

#### Customer orders `/orders`
- Own orders only, status, date, detail link.
- Cancel action only when backend permits it.
- Loading, empty, error states.

#### Order detail `/orders/[id]`
- Items, quantities, total, delivery details, current status.
- Show rejection reason when returned.
- Do not invent timeline events.

#### Profile `/profile`
- Only editable profile fields supported by backend.
- Never allow changing role, blocked state, or subscription status.

### Authentication
- `/login`: email/password and Google login only if configured and working.
- `/register`: fields supported by Better Auth.
- Signup may send `accountType: "customer" | "vendor"`; the server derives the stored role from that allow-listed value. Never accept a client-supplied `role` (especially `admin`), and never trust client role checks alone.

### Become a vendor `/become-a-vendor`
- Available to signed-in customers; guests get a clear sign-in/create-account prompt.
- Collect only restaurant name and an optional message; the account identity comes from the session, not the form.
- Show the real request status: pending, approved (with a vendor dashboard link), or rejected (with the reason and a re-apply form).
- Vendor privileges are granted only by an admin approving the request on the server.
- Do not call it instant signup; approval is required.

### Vendor dashboard
Suggested navigation: Overview, Restaurant, Menu Items, Orders, Subscription, Profile.

- Overview: show only statistics returned by a real API.
- Restaurant: create/edit own restaurant profile.
- Menu: list/create/edit/delete own items; upload image and use returned ImgBB URL and image ID.
- Orders: list, accept/reject, update only allowed statuses.
- Subscription: show backend subscription state; never infer Premium from a checkout redirect.

Keep availability separate from moderation approval. They are not the same property.

### Admin dashboard
Suggested navigation: Overview, Users, Vendor Requests, Menu Moderation, Transactions, Profile.

Vendor Requests: review pending applications, show applicant and message, approve, or reject with a reason. Approval is the only UI path that grants the vendor role.

Only connect screens to endpoints that exist. Do not fake successful moderation, transactions, or dashboard statistics when the backend route is missing.

## 7. Images

- Use real, appetizing food photography.
- Keep menu card aspect ratios consistent.
- Use `object-fit: cover`.
- Use backend/ImgBB image URLs.
- Do not use emoji as menu photography or invent image URLs.
- Add meaningful alt text, e.g. `Chicken BBQ pizza`.

## 8. Interaction and feedback

- Every button must navigate or perform a real action.
- Disable submit buttons while requests are pending.
- Prevent duplicate submissions.
- Show field-level validation errors.
- Show success feedback only after server confirmation.
- Use useful error messages; never expose stack traces.
- Confirm destructive actions.
- Include loading skeletons and empty states.
- Do not use `alert()` for normal feedback.

## 9. Responsive behavior

- Mobile: single-column forms, compact header, accessible mobile navigation, menu grid of 1–2 columns.
- Tablet: two-column menu grid and compact dashboard navigation.
- Desktop: 3–4 menu columns and dashboard sidebar.
- Test at approximately 375px, 768px, 1024px, and 1440px.
- Prevent horizontal overflow.

## 10. Accessibility

- Semantic HTML and logical heading order.
- Labels associated with form controls.
- Visible keyboard focus.
- Sufficient color contrast.
- Never communicate status using color alone.
- Accessible names for icon-only buttons.
- Alt text for meaningful images.
- Keyboard-operable dialogs and menus.

## 11. Suggested project structure

Adapt to the existing initialized app; do not overwrite its structure blindly.

```text
src/
├── app/
│   ├── (public)/             # home, menu, menu/[id]
│   ├── (auth)/               # login, register
│   ├── (customer)/           # orders, profile
│   ├── vendor/               # dashboard, restaurant, menu, orders, subscription
│   ├── admin/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── layout/
│   ├── menu/
│   ├── forms/
│   ├── dashboard/
│   └── ui/
├── features/
│   ├── auth/
│   ├── menu/
│   ├── orders/
│   ├── vendor/
│   └── admin/
├── lib/
│   ├── api/
│   ├── auth/
│   ├── validations/
│   └── utils.ts
├── hooks/
└── types/
```

## 12. Page completion checklist

- [ ] Uses PizzaHub brand tokens.
- [ ] Consistent with other pages.
- [ ] Responsive on mobile, tablet, desktop.
- [ ] Loading, empty, error, and success states as applicable.
- [ ] All controls work.
- [ ] Uses real API data, not fake production data.
- [ ] Forms validate and show useful errors.
- [ ] Authentication and role rules are respected.
- [ ] No mobile horizontal overflow.
- [ ] Accessible labels, focus states, and image alt text.
- [ ] No browser console errors.
- [ ] TypeScript and production build pass.

## 13. Non-negotiable rules

1. Maroon is primary, warm yellow is a restrained accent, cream is the main background.
2. Food photography leads the customer experience.
3. Avoid generic template styling on the homepage.
4. Avoid excessive gradients, shadows, animations, and decorative icons.
5. Never invent API capabilities or business data.
6. Reuse components and consistent spacing.
7. Prioritize clarity and usability over decoration.
