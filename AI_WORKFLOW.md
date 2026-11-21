# PizzaHub — AI-Assisted Frontend Workflow

This guide explains how Cursor, OpenCode, or another repository-aware coding agent should work on the PizzaHub frontend.

## 1. Project context

- Client project: `pizzahub-client`
- Server project: `pizzahub-server` (separate project/repository)
- Frontend: Next.js App Router + TypeScript + Tailwind CSS
- UI: shadcn/ui with Base UI and Nova preset
- Brand: maroon, warm yellow, cream
- Backend: Express + TypeScript + MongoDB + Better Auth + JWT
- Production API: `https://pizzahub-server-toql.onrender.com`
- Design source of truth: `DESIGN.md`
- API source of truth: the latest backend API documentation and actual backend route/controller code

Do not assume the two projects are a monorepo. Do not move server files into the client.

## 2. Inspect before editing

At the start of each task:

1. Inspect `package.json`, `src/app`, `src/components`, `src/lib`, `globals.css`, `tsconfig.json`, and Tailwind configuration.
2. Identify installed framework and library versions.
3. Check which dependencies and UI components already exist.
4. Read `DESIGN.md` and API documentation.
5. Summarize the current structure and propose the smallest plan.
6. List the files expected to change.

Never reinitialize an already initialized project. Never overwrite configuration without inspecting it.

## 3. Source of truth

Use this priority:

1. Actual backend route/controller/service implementation.
2. Current backend API documentation.
3. Existing frontend types and conventions.
4. Assignment requirements.
5. AI assumptions (lowest priority).

If documentation and backend code disagree, report the mismatch. Never invent an endpoint, request field, response property, role, or status.

If a required endpoint is missing:
- Explain which UI feature depends on it.
- Do not fake a successful response.
- Ask before using a clearly labelled temporary development placeholder.
- Record the missing backend requirement separately.

## 4. Implement one feature at a time

Recommended sequence:

### Phase 1 — Foundation
1. Inspect initialized app.
2. Apply PizzaHub theme tokens to the existing theme.
3. Set global typography, page container, button and form styles.
4. Build public header and footer.
5. Verify responsive behavior.

### Phase 2 — Public experience
1. Home page.
2. Menu listing.
3. Search, category and price filters.
4. Sorting and pagination.
5. Menu item details.

### Phase 3 — Authentication
1. Login.
2. Registration.
3. Session persistence.
4. JWT retrieval and protected API requests.
5. Role-aware navigation and protected pages.

### Phase 4 — Customer
1. Place order.
2. Order history.
3. Order details.
4. Cancel eligible pending order.
5. Profile, if backend supports it.

### Phase 5 — Vendor
1. Vendor dashboard shell.
2. Restaurant profile.
3. Image upload.
4. Menu CRUD.
5. Incoming orders and status updates.
6. Premium checkout and subscription state.

### Phase 6 — Admin
1. Admin dashboard shell.
2. User/vendor management.
3. Menu moderation, when backend endpoints exist.
4. Transactions and statistics, when backend endpoints exist.

Do not ask the AI to build the entire application in one giant prompt.

## 5. Required cycle for every feature

1. **Inspect:** Read relevant files and API contract.
2. **Plan:** Explain behavior and list files to change.
3. **Implement:** Make the smallest coherent change.
4. **Explain:** Summarize what changed.
5. **Verify:** Run TypeScript/lint checks and build where available.
6. **Test:** Check success, validation, loading, empty, and error states.
7. **Review:** Check responsive layout, accessibility, and browser console.
8. **Git:** Show `git diff` and suggest a meaningful commit.

Do not call a feature complete until it has been tested.

## 6. API integration rules

Create one central API client. Do not scatter unrelated `fetch()` logic across components.

Suggested structure:

```text
src/lib/api/
├── client.ts
├── endpoints.ts
└── errors.ts
```

Rules:
- Read API base URL from `NEXT_PUBLIC_API_URL`.
- Do not hardcode production URLs in page components.
- Use actual endpoint paths and HTTP methods.
- Send the correct content type.
- Attach `Authorization: Bearer <JWT>` only to protected requests.
- Handle `401`, `403`, `404`, validation errors, and server errors distinctly.
- Never log passwords, cookies, JWTs, API keys, or payment secrets.
- Never expose server-only secrets with `NEXT_PUBLIC_`.
- Use the real backend response shape.
- Avoid duplicate requests and repeated submissions.
- Show success feedback only after server confirmation.

Example local environment configuration:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

Set the production API URL in the frontend hosting environment. Only public configuration belongs in `NEXT_PUBLIC_` variables.

## 7. Authentication and role safety

- A frontend role check is for UI behavior, not security; backend authorization is mandatory.
- Never let a client form grant vendor/admin privileges.
- Inspect the existing Better Auth session and JWT flow before implementing token handling.
- Never invent cookie names or token response properties.
- Restore authentication through the supported session mechanism.
- Handle `401` as unauthenticated/session-expired and `403` as forbidden.
- Do not redirect every API error to login.

## 8. Forms

- Reuse installed form and validation libraries if present.
- Do not add duplicate libraries without need.
- Client validation improves usability; backend validation remains authoritative.
- Show field errors beside controls.
- Disable submit while pending.
- Preserve values after recoverable errors.
- Confirm destructive actions.
- Match field names and types to the backend contract.

## 9. UI rules

Read `DESIGN.md` before styling a page.

- Maroon is primary; yellow is restrained accent; cream is main background.
- Use semantic theme tokens, not random hex values per component.
- Keep typography, spacing, radius, and status badges consistent.
- Use real backend data.
- Never invent ratings, reviews, discounts, delivery estimates, order counts, or restaurant data.
- Include loading, empty, and error states.
- All controls must work.
- Use accessible labels, keyboard focus, and image alt text.
- Test mobile widths.

## 10. Image upload rules

For vendor menu images:

1. Use the documented vendor image upload endpoint.
2. Send `multipart/form-data` with field name `image`.
3. When using browser `FormData`, do not manually set the multipart boundary header.
4. Read image URL and ID from the actual response.
5. Use those returned values when creating/updating the menu item.
6. Handle upload failure and retry.
7. Never silently substitute a fake image URL.

## 11. Prompt template for each task

Copy this prompt and change only the task description:

```text
You are working on the PizzaHub frontend.

Before coding:
1. Inspect the existing project structure and package versions.
2. Read DESIGN.md and the backend API documentation.
3. Inspect the relevant existing components and files.
4. Do not reinitialize the project or overwrite configuration.
5. Do not invent API endpoints, payload fields, response fields, or business rules.

Task:
[Describe exactly ONE feature.]

Requirements:
- Follow the PizzaHub maroon, warm yellow, and cream design system.
- Use the existing Next.js, TypeScript, Tailwind, and shadcn/Base UI Nova setup.
- Reuse existing components and dependencies.
- Keep the implementation responsive and accessible.
- Connect to the real backend API where the endpoint exists.
- Include loading, empty, validation, and error states.
- Do not use mock data in production behavior.
- Do not change unrelated files.

Process:
1. First give me a short plan and list files to change.
2. Then implement only this task.
3. Run relevant checks and production build.
4. Explain how I can test it manually.
5. Show changed files and a suggested Git commit message.

If a required backend endpoint or field is missing, stop and tell me exactly what is missing instead of making one up.
```

## 12. Example prompts

### Build homepage

```text
Read DESIGN.md. Inspect the existing Next.js app and dependencies.
Build only the PizzaHub public homepage.
Use the maroon, warm yellow, and cream theme.
Create a responsive hero, category section, featured menu section,
how-it-works section, and footer.
Do not invent product data, ratings, or discounts.
First show the plan and files to change.
```

### Build menu listing

```text
Implement only the public menu listing page.
Read the API documentation and inspect the existing API client.
Use the real GET /api/menu-items endpoint and its supported query parameters.
Implement search, category, min/max price, sorting, pagination,
loading, empty, and error states.
Keep filters in sync with the URL where appropriate.
Do not invent response fields. Show the plan before coding.
```

### Build vendor menu creation

```text
Implement only the vendor create-menu-item flow.
Inspect the actual vendor authentication flow and API response types.
Use the documented image upload endpoint with multipart field "image".
After a successful upload, use the returned imageUrl and image ID
in the menu creation request.
Handle upload and create errors separately.
Do not claim an item is approved unless the backend returns that status.
Show the plan before editing.
```

## 13. Git rules

- Use focused, meaningful commits.
- Never commit `.env`, credentials, tokens, or secrets.
- Before committing, inspect:

```bash
git status --short
git diff --check
git diff
```

Example commit messages:

```text
feat: build responsive PizzaHub homepage
feat: integrate public menu search and filters
feat: add customer order history page
fix: handle expired customer sessions
```

## 14. Definition of done

- [ ] Follows `DESIGN.md`.
- [ ] Uses existing project conventions.
- [ ] Uses verified API contract or reports missing endpoint.
- [ ] Has loading, empty, and error states where relevant.
- [ ] Buttons and forms work.
- [ ] Authentication and role behavior are safe.
- [ ] Responsive layout works.
- [ ] TypeScript/lint checks pass.
- [ ] Production build passes.
- [ ] Manual test steps are documented.
- [ ] Git diff contains no unrelated changes.

**Core principle:** AI should accelerate implementation, not silently make architecture decisions. Inspect first, plan one feature, implement, test, review, then commit.
