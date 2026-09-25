# AgroVani Separation-of-Concerns Blueprint

## 1. Audit Basis and Executive Assessment

This audit covers the tracked repository at `0b07b79` and the current source tree. The repository is a Next.js modular monolith with three deployable concerns:

- Next.js web UI and HTTP API in one application.
- Node.js WebSocket location service.
- Python services for yield prediction and the LiveKit/Gemini voice agent.

The recommended end state is a **modular monorepo**, not two immediately decoupled repositories. The web app, realtime service, and Python services already have separate runtimes, but their shared contracts and deployment lifecycle are not formalized. A monorepo preserves atomic changes and Git history while allowing independent deployment.

### Implemented first phase

- Reusable frontend components and hooks now live under `web/src/components` and `web/src/hooks`.
- Server-only adapters, AI integration, services, database selection, and Supabase access now live under `backend/src`.
- Zod request contracts now live under `contracts/src` and validate farm, listing, and order writes.
- The Next route tree now lives under `web/app`; root scripts invoke the web package from its own project root.

### Immediate blockers found

1. The compatibility API remains a large catch-all controller at `web/app/api/[[...path]]/route.js`; it should eventually be split into explicit controllers.
2. The catch-all controller contains routing, validation, persistence selection, seed data, domain calculations, provider calls, AI prompts, payment logic, and response formatting.
3. The route contains duplicate route branches and duplicated object keys. Examples include an early and later `/mandi` branch and repeated `id`, `sellerId`, `priceInr`, and `stockUnits` fields in marketplace listing creation.
4. Persistence is not a single boundary: the API chooses Supabase, MongoDB, or an in-memory store at runtime. The in-memory implementation is embedded in the route and is process-local/non-durable.
5. The location service now has an independent boundary under `services/location`.
6. Authentication and authorization are not a distinct backend boundary. Several endpoints accept caller-supplied `ownerId`, `buyerId`, `sellerId`, or `userEmail`, and the server Supabase client uses the service-role key. Identity must be derived from a verified session before production use.
7. The deployment model is contradictory: Vercel/standalone Next.js, GitHub Pages static export, a Node WebSocket container, and local Python services are all present. Each deployment target needs an explicit capability matrix.
8. `backend/supabase/schema.sql` creates tables and enables RLS, but the audit found no corresponding policy definitions in the inspected file.

## 2. Current Inventory by Functional Domain

### Frontend: routes, views, styling, and client state

- `web/app/**`: Next.js landing, login, plans, admin, buyer, driver, farmer, seller, API, layout, providers, manifest, and global styling.
- `src/components/admin/LiveDriverTracker.js`, `src/components/buyer/BuyerFarmerMap.js`, `src/components/driver/GoogleDriverMap.js`: role-specific UI.
- `src/components/farmer/*.js`: farmer maps, booking, weather, voice, and spatial-field UI.
- `src/components/InstallAppButton.js`, `src/components/LanguageSwitcher.js`, `src/components/RazorpayButton.js`, `src/components/SupportDock.js`: shared application UI.
- `src/components/ui/*.jsx`: generated/shared Radix and shadcn-style presentation primitives. These have no domain or database imports.
- `src/hooks/use-mobile.jsx`, `src/hooks/use-toast.js`, `src/hooks/useLiveLocation.js`: client hooks; realtime transport should be isolated behind a client adapter.
- `web/public/*`: application icon and service worker assets.
- `web/src/lib/i18n/*`: client language state, dictionaries, and recommendation strings.
- `web/src/lib/data/*`: frontend plans and seed catalog data.
- `web/src/lib/constants/testIds/*`: UI test identifiers.

### Backend: HTTP, realtime, application services, and integrations

- `web/app/api/[[...path]]/route.js`: current unified HTTP compatibility controller.
- `backend/src/services/*.js`: backend application services.
- `backend/src/adapters/*.js`: weather, Cloud Next, and CEHub provider adapters.
- `backend/src/ai/gemini.js`: Gemini prompt/response mapping helpers.
- `backend/src/database.js`, `backend/src/supabase.js`: server database boundary.
- `web/src/lib/supabase/client.js`, `web/src/lib/api.js`: browser client utilities.
- `services/location/*`: Node HTTP health endpoint, WebSocket location service, and image.
- `services/voice-agent/*`: LiveKit/Gemini voice agent runtime and dependencies.
- `services/yield-model/*`: Flask yield model service, dependencies, templates, and static assets.

### Models, schemas, domain logic, and validation

- `backend/supabase/schema.sql`: PostgreSQL/Supabase tables, foreign keys, checks, and RLS enablement.
- `backend/data/advisory.schema.sql`: SQLite advisory snapshot tables and lookup index.
- `science/src/*.js`: crop stress, residue, agri-loop, and recommendation calculations.
- `backend/data/mandiDemo.js`: demo mandi rows, which are a data fixture rather than a service.
- `contracts/src/api.js`: shared request validation contracts.
- `science/model/README.md`: model artifact/documentation boundary.
- `tests/advisory.test.mjs`, `tests/agriLoop.test.js`, `tests/gemini.test.js`: JavaScript domain/service tests.
- `tests/test_yield_model_service.py`: Python yield service tests.
- `tests/__init__.py`: Python test package marker.
- `test_reports/.gitkeep`, `test_reports/pytest/.gitkeep`: test output directories.

There are no TypeScript DTOs or a shared runtime validation package today. `zod` is installed but the request boundary is mostly hand-validated.

### Infrastructure, configuration, deployment, and environment

- `package.json`: root Node dependencies and workspace commands.
- `package-lock.json`: npm lockfile; must be regenerated only after correcting the manifest and choosing npm or Yarn as the single package manager.
- `web/next.config.js`: Next output mode, image policy, server packages, and headers.
- `web/jsconfig.json`: web and cross-package path aliases.
- `web/components.json`, `web/postcss.config.js`, `web/tailwind.config.js`: web tooling configuration.
- `Dockerfile`: multi-stage Next standalone image.
- `vercel.json`: Vercel framework/install/build configuration.
- `.github/workflows/deploy-pages.yml`: GitHub Pages static build; temporarily moves `web/app/api` out before export.
- `.devcontainer/devcontainer.json`: development container configuration.
- `.dockerignore`: Docker build exclusions.
- `.gitignore`: ignored dependencies, environment files, build output, Python caches, and artifacts.
- `.env.example`: application environment contract for APIs, databases, maps, payments, AI, and realtime services.
- `.env`: local environment file; ignored and secret-bearing, never move into source control or documentation.
- `requirements.txt`: Python aggregate requirements, currently includes `services/yield-model/requirements.txt`.
- `memory/.gitkeep`: empty repository memory placeholder; not application runtime state.

### Shared/cross-cutting concerns

- `web/src/lib/utils.js`, `shared/advisory.js`: shared UI and advisory utilities.
- `web/src/lib/constants/testIds/*`: test cross-cutting support.
- `web/src/lib/i18n/*`: localization cross-cutting support.
- `web/src/lib/api.js`: HTTP client addressing support.
- `web/app/providers.js`: client state/provider composition.
- `web/public/sw.js`: offline/PWA cross-cutting behavior.
- `README.md`: product, local development, API, and deployment documentation; update after the move.

## 3. Target Monorepo Structure

```text
AgroVani/
  apps/
    web/                              # Next.js UI and thin route handlers
      app/                            # routes, layouts, loading/error boundaries
      src/
        features/
          farmer/ buyer/ seller/ driver/ admin/ advisory/ payments/
        components/ui/                 # presentation-only primitives
        lib/client/                    # API client, query hooks, realtime client
        providers/                     # React Query, i18n, theme
        styles/globals.css
      next.config.js
      package.json
    location-server/                  # Node WebSocket service
      src/server.js
      src/locationStore.js
      Dockerfile
      package.json
    yield-model/                      # Flask prediction service
      src/app.py
      src/domain/validation.py
      src/model/loader.py
      templates/
      static/
      requirements.txt
    voice-agent/                       # LiveKit/Gemini worker
      src/agent.py
      requirements.txt
  packages/
    contracts/                         # versioned API DTOs and Zod schemas
      src/{advisory,auth,farms,marketplace,payments,realtime}.js
    domain/                            # pure calculations and entities
      src/{crop,residue,agriLoop}.js
    server-core/                       # Node use cases, ports, auth, errors
      src/
        modules/{farms,marketplace,bookings,advisory,assistant,payments,dispatch}/
        ports/{repositories,providers}.js
        middleware/
    data-access/                       # Supabase implementation and migrations
      supabase/migrations/
      src/supabase/
    ui/                                # optional shared UI package
  infra/
    docker/{web,location-server,yield-model,voice-agent}/
    github/workflows/
    vercel/
  tests/
    contract/
    integration/
    e2e/
  docs/SEPARATION_OF_CONCERNS.md
```

### Dependency rules

1. `apps/web/app` may depend on `packages/contracts`, `packages/ui`, and client feature code. It may call `server-core` only through HTTP contracts, never through server-only imports in client components.
2. `server-core` may depend on `domain`, `contracts`, and ports. It must not import React, Next UI modules, browser Supabase, or provider SDKs directly.
3. `data-access` implements repository ports. Only composition roots and data-access may import Supabase/Mongo SDKs.
4. Provider adapters implement ports for weather, CEHub, Gemini, Razorpay, LiveKit, and the yield-model HTTP service. Provider keys remain server-side.
5. `domain` is pure and deterministic: no `fetch`, database, environment reads, framework imports, or logging side effects.
6. `packages/contracts` is the only source of request/response schemas and public error codes.
7. Each app owns its runtime-specific configuration and Dockerfile; shared environment names are documented in one contract.

## 4. Recommended Backend Module Shape

For each business module, use the same shape:

```text
packages/server-core/src/modules/marketplace/
  marketplace.routes.js       # route registration only
  marketplace.controller.js   # parse request, invoke use case, map response
  marketplace.use-cases.js    # orchestration and authorization checks
  marketplace.repository.js   # repository port/interface
  marketplace.schemas.js      # re-export contracts only if needed
  marketplace.mapper.js       # persistence/domain/DTO mapping
```

The Next catch-all route should become a small compatibility dispatcher while clients migrate. Prefer explicit route files such as `app/api/farms/route.js`, `app/api/marketplace/listings/route.js`, and `app/api/advisory/mandi/route.js`; retain the old paths temporarily with redirects or forwarding tests.

## 5. Migration Plan with History Preservation

Run from the repository root. Do not move `.env`; keep it ignored and copy values manually into the new app/service environment files.

### Phase 0: Stabilize and baseline

```bash
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"
git status --short
npm install --package-lock-only
npm run build
npm test --if-present
```

Before the first command can pass, repair `package.json`, remove duplicate keys, select npm as the package manager, and add explicit scripts for web, location, yield-model, voice-agent, lint, and tests. Capture the baseline failures in the migration issue.

### Phase 1: Create package boundaries

```bash
mkdir -p apps/web apps/location-server apps/yield-model apps/voice-agent
mkdir -p packages/contracts packages/domain packages/server-core packages/data-access packages/ui
mkdir -p infra/docker infra/github/workflows infra/vercel
mkdir -p tests/contract tests/integration tests/e2e
```

Add package manifests and workspace configuration only after the root manifest is valid. Keep the root lockfile strategy consistent with the chosen package manager.

### Phase 2: Move the web application with `git mv`

```bash
git mv app apps/web/app
git mv components apps/web/src/components
git mv hooks apps/web/src/hooks
git mv public apps/web/public
git mv next.config.js apps/web/next.config.js
git mv postcss.config.js apps/web/postcss.config.js
git mv tailwind.config.js apps/web/tailwind.config.js
git mv components.json apps/web/components.json
git mv jsconfig.json apps/web/jsconfig.json
```

Then update aliases from root-relative paths to the web package, or use a workspace-local `@/*` alias. Move only UI-facing files from `lib`; do not bulk-move the current mixed `lib` directory.

### Phase 3: Extract contracts and pure domain code

```bash
git mv lib/calculations packages/domain/src/calculations
git mv lib/constants packages/ui/src/constants
```

Create contracts from the current inline validation and response shapes. Copy first when a staged compatibility period is required; use `git mv` for files whose ownership is unambiguous. Add contract tests before changing API clients.

### Phase 4: Extract backend core and adapters

```bash
mkdir -p packages/server-core/src packages/data-access/src packages/server-core/src/adapters
# Move with git mv after each destination is created:
git mv lib/adapters packages/server-core/src/adapters
git mv lib/services packages/server-core/src/modules
```

Split each moved service into controller/use-case/port/adapter pieces. Move `lib/supabase/server.js` into `packages/data-access/src/supabase/`; keep `lib/supabase/client.js` in the web client package. Replace direct database calls in the route with repository ports.

### Phase 5: Split the catch-all API

Create explicit route handlers and migrate one bounded module at a time:

1. Health/root and error handling.
2. Farms and onboarding.
3. Advisory, weather, mandi, MSP, reports, and calculations.
4. Marketplace listings, buyer needs, and orders.
5. Bookings, tasks, dispatch, earnings, and notifications.
6. Assistant, crop diagnosis, LiveKit token, and payments.

For every module, keep the old catch-all branch until its contract and integration test pass. Then delete only that branch. This avoids a flag day and makes `git blame` meaningful.

### Phase 6: Move independent runtimes

```bash
git mv server/location-server.js apps/location-server/src/server.js
git mv server/Dockerfile apps/location-server/Dockerfile
git mv yield_model apps/yield-model
git mv agent apps/voice-agent
```

Update scripts, Docker contexts, environment documentation, and workflow references. Confirm there are no external deployment references to the old location-service path before deleting the now-empty `server/` directory.

### Phase 7: Database and deployment

```bash
mkdir -p packages/data-access/supabase/migrations
# Split the existing schema into timestamped migrations with git mv where useful.
git mv supabase/schema.sql packages/data-access/supabase/legacy-schema.sql
git mv data/advisory.schema.sql packages/data-access/supabase/advisory-schema.sql
```

Add explicit RLS policies, indexes, ownership constraints, and migration checks. Decide whether SQLite advisory snapshots remain a separate service database or are migrated to Supabase. Deploy `apps/web`, `apps/location-server`, and the two Python services independently, with health checks and separate secret scopes.

### Phase 8: Verify and remove compatibility code

```bash
npm ci
npm run lint
npm run test
npm run build
python -m pytest tests
```

Run contract, integration, and end-to-end tests against a disposable database. Remove the catch-all route, legacy aliases, duplicate location server, and temporary static-export workaround only after all consumers use explicit contracts.

## 6. Refactoring Checklist and Risks

### Correctness and build

- [ ] Repair invalid `package.json`; reconcile `package-lock.json` and package manager.
- [ ] Run syntax checks on every moved JavaScript module and `python -m compileall` on Python services.
- [ ] Fix imports after moving `app`, `components`, `hooks`, and `lib`; verify aliases in both Next build and tests.
- [ ] Add missing `package.json` scripts referenced by README, Docker, and CI.
- [ ] Ensure `next.config.js` `output: standalone` matches the Docker command and port behavior.
- [ ] Replace the GitHub Pages `mv app/api` workaround with a frontend build that has no server-only imports, or explicitly document Pages as frontend-only.

### API and domain separation

- [ ] Split `app/api/[[...path]]/route.js` into explicit route handlers and use cases.
- [ ] Centralize Zod request validation and response DTOs in `packages/contracts`.
- [ ] Remove duplicate `/mandi` branches and define one authoritative source-selection policy.
- [ ] Remove duplicated marketplace object keys and decide the canonical listing schema.
- [ ] Extract seed data from request handling into migrations/fixtures; make seeding idempotent and non-production-only.
- [ ] Move `createMemoryDb` out of the route and use a test repository adapter. Never silently fall back from production database failure to in-memory storage.
- [ ] Keep calculations pure and test them independently from HTTP and persistence.
- [ ] Define consistent error status codes, error IDs, validation messages, and logging/redaction rules.

### Security and authorization

- [ ] Add authentication middleware and derive actor identity from a verified Supabase session.
- [ ] Authorize every farm, order, listing, booking, message, earnings, dispatch, and notification query by actor and role.
- [ ] Restrict service-role Supabase usage to server-only data-access code.
- [ ] Add explicit Supabase RLS policies and test them with farmer, buyer, seller, driver, and admin identities.
- [ ] Validate upload size/type for base64 audio and image endpoints; consider object storage instead of request-body base64.
- [ ] Move payment order creation and verification into a payment module; persist idempotency keys and verified transaction state.
- [ ] Replace permissive `CORS_ORIGINS=*`, `X-Frame-Options: ALLOWALL`, and `Content-Security-Policy: frame-ancestors *` with environment-specific allowlists.
- [ ] Do not log provider payloads, credentials, raw audio, or crop images.

### Dependency direction and cycles

- [ ] UI components may call client hooks/API clients, never Mongo, server Supabase, filesystem, or secret-bearing adapters.
- [ ] Client code must not import `livekit-server-sdk`, Node crypto, `mongodb`, or server environment modules.
- [ ] `lib/i18n/LanguageContext.js` remains client-only; locale dictionaries should be data-only.
- [ ] `lib/ai/gemini.js` should contain provider-independent mapping in domain code and Gemini transport in an adapter.
- [ ] `lib/services/yieldModel.js` should not know Flask internals; depend on a model-provider port and a contract.
- [ ] `lib/api.js` should become a typed/validated client and should not contain server fallback policy.
- [ ] Enforce boundaries with ESLint import restrictions or workspace package visibility.
- [ ] Use dependency-graph tooling after extraction to detect cycles; the current catch-all route is the likely cycle amplifier.

### Data and operational readiness

- [ ] Choose Supabase as the system of record or document a deliberate Mongo compatibility adapter; do not silently switch stores.
- [ ] Add migrations for every schema change and remove `alter table` patching from the one-shot schema once migrations exist.
- [ ] Add timestamps/status transition rules and optimistic concurrency for orders, bookings, dispatch, and notifications.
- [ ] Add health/readiness endpoints for web dependencies, location server, yield model, and voice agent.
- [ ] Define observability: request IDs, structured logs, metrics, provider latency, and failed job handling.
- [ ] Add CI jobs for JavaScript build/tests, Python tests, contract compatibility, and Docker builds.
- [ ] Keep demo mandi data visibly non-production and fail closed for missing/stale government data.

## 7. Completion Criteria

The migration is complete when:

- The web app has no direct database/provider SDK imports in UI code.
- Every HTTP endpoint has a named route, a contract schema, an authorized use case, and an integration test.
- Domain calculations run without Next.js, Supabase, MongoDB, Flask, or environment dependencies.
- Database access has one selected production implementation behind repository ports.
- Realtime, yield-model, and voice-agent services can deploy and health-check independently.
- `npm ci`, JavaScript tests/build, Python tests, and Docker builds pass in CI.
- The old catch-all route, duplicate location server, permissive deployment workaround, and inline seed/database code are removed.
