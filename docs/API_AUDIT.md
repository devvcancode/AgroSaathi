# Frontend API Audit

## Scope

Audited the active client code under `web/app` and `web/src` for `fetch`, `apiUrl`, WebSocket, and provider calls. The backend is currently exposed through the compatibility controller at `web/app/api/[[...path]]/route.js`, with backend modules under `backend/src`.

## Summary

- 56 frontend HTTP call sites were found.
- 52 backend route branches were found.
- Every observed frontend HTTP route has a backend handler.
- No missing HTTP endpoint was found in the current client/backend comparison.
- One realtime dependency exists: `NEXT_PUBLIC_LOCATION_WS_URL`, served by `services/location/server.js`.
- The main implementation gap is contract quality: many existing handlers still use inline coercion instead of shared schemas. Farm, marketplace listing, and marketplace order writes already use `contracts/src/api.js`.
- The API currently returns `{ error }` for most failures, but does not yet expose a versioned envelope such as `{ success: false, error, code }` consistently.

## Existing Endpoint Matrix

All paths below are relative to the configured API base URL and are currently implemented by the compatibility controller. `2xx` indicates the normal success response; `4xx/5xx` indicates current error behavior.

### Platform, advisory, and AI

| Method | Route | Request/query | Response | Status |
|---|---|---|---|---|
| GET | `/` or `/root` | none | `{ message, crops[] }` | 200 |
| GET | `/products` | `category`, `crop` | `{ products[], count }` | 200 |
| GET | `/mandi` | `commodity`, `state`, `market` | mandi service object with `latest`, `latestModalPrice`, `trend7Day`, `source`, freshness | 200; insufficient data in payload |
| GET | `/msp` | `commodity`, `modalPrice` | MSP comparison, signal, confidence, disclaimer | 200; insufficient data in payload |
| POST | `/yield-prediction` | `{ crop, areaInAcres, soilPh, nitrogenKgPerHa, rainfallMm, ... }` | observational yield prediction/range/confidence/risk | 200; 400 invalid crop/area |
| POST | `/yield-predict` | `{ soil_pH, nitrogen_ppm, seasonal_rainfall_mm, avg_temp_c, ndvi_peak }` | model prediction, features, source | 200; 400 invalid values; 502/503 provider failures |
| POST | `/recommendations` | `{ crop, state, areaInAcres, usedProducts[], diagnostic }` | recommendation, alternatives, rationale, safety | 200 |
| GET | `/weather-map` | none | weather map provider/version/points | 200 |
| GET | `/stress` | `farmId` or `lat`, `lon`, `crop`, `area`, `ph`, `n`, `state` | weather, diagnostic, spray window, hydric stress, location | 200; 404 farm missing |
| GET | `/residue` | `farmId` or `area`, `district`, `crop` | residue, field readiness, active listings/orders/bookings | 200; 404 farm missing |
| GET | `/agri-loop` | `farmId`, `areaInAcres`, `district`, `crop`, incentive/calendar inputs | farm, residue, crop economics, incentive, calendar, yield projection, network | 200; 404 farm missing |
| GET | `/geocode` | `query` | `{ results[] }` with coordinates | 200 |
| POST | `/crop-diagnose` | `{ image, mimeType, cropType, farmName, location }` | parsed diagnosis and mapped recommendation | 200; 400/502/503 |
| POST | `/assistant` | `{ message, locale, farmId, context }` | `{ reply }` | 200; 404/502/503 |
| POST | `/assistant/audio` | `{ audio, mimeType, farmId, locale, context }` | `{ reply }` | 200; 400/502/503 |
| POST | `/livekit/token` | none | `{ token, url, room }` | 200; 503 unconfigured |
| POST | `/translate` | `{ text, sourceLanguage, targetLanguage }` | original/translated text and source | 200 |
| GET | `/satellite` | none | provider configuration status; no synthetic reading | 200 |

### Farms, machinery, and field operations

| Method | Route | Request/query | Response | Status |
|---|---|---|---|---|
| GET | `/farms` | optional `id` | farm object or farm array | 200; 404 missing farm |
| POST | `/farms` | farm profile: owner, location, crop, area, soil | created farm | 200; 400 validation |
| GET | `/machinery` | optional `district`, `type` | machinery array | 200 |
| GET | `/bookings` | optional `farmId` | booking array | 200 |
| POST | `/bookings` | `{ farmId, farmerName, district, machineryType, acres, date }` | created booking | 200 |
| GET | `/tasks` | optional `ownerId` | task array | 200 |
| POST | `/tasks` | `{ title, instructions, dueDate, ownerId, source }` | created task | 201 |
| PATCH | `/tasks` | `{ id, status }` | updated task | 200; 404 missing task |
| GET | `/residue/profile` | `farmId` | profile or `{}` | 200 |
| POST | `/residue/profile` | `{ farmId, residueType, qualityGrade, quantityQuintals, moisturePercent, packaging, pickupReadyDate, notes }` | upserted profile | 200; 400 validation |
| GET | `/district-metrics` | optional `district` | one district metric or array | 200 |

### Marketplace, buyer, and logistics

| Method | Route | Request/query | Response | Status |
|---|---|---|---|---|
| GET | `/buyer/farm-map` | none | `{ country, farms[] }` | 200 |
| GET | `/buyer/needs` | `buyerId` | buyer need array | 200 |
| POST | `/buyer/needs` | `{ buyerId, cropType, residueType, quantity, useCase, region, urgency, notes }` | created need | 201; 400 validation |
| GET | `/buyer/sellers` | none | active residue listing array | 200 |
| GET | `/marketplace/listings` | optional `sellerId` | listing array | 200 |
| POST | `/marketplace/listings` | seller/listing, price, stock, optional residue fields | created listing | 201; 400 contract validation |
| GET | `/marketplace/orders` | optional `sellerId` or `buyerId` | order array | 200 |
| POST | `/marketplace/orders` | `{ listingId, sellerId, buyerId, farmId, quantity, totalInr }` | created order | 201; 400/404/409 |
| PATCH | `/marketplace/orders` | `{ id, status }` | updated order | 200; 400/404 |
| GET | `/notifications` | `audience` | notification array | 200 |
| PATCH | `/notifications` | `{ id }` | read notification | 200; 404 |
| GET | `/messages` | none | message array | 200 |
| POST | `/messages` | `{ senderId, recipientId, text, sourceLanguage, targetLanguage }` | created message | 201 |
| GET | `/earnings` | optional `ownerId` | `{ source, earnings[], totalInr }` | 200 |
| GET | `/dispatch` | none | `{ source, dispatch[] }` | 200 |

### Payments, reports, and administration

| Method | Route | Request/query | Response | Status |
|---|---|---|---|---|
| POST | `/payments/razorpay/order` | `{ planId, userEmail, userRole }` | Razorpay order ID, amount, currency, key, plan | 200; 400/502/503 |
| POST | `/payments/razorpay/verify` | Razorpay IDs/signature plus `planId` | `{ verified, paymentId, orderId, planId }` | 200; 400/503 |
| POST | `/report/pdf` | farm report fields and assumptions | PDF bytes | 200 |
| POST | `/report/whatsapp` | report summary fields | `{ text }` | 200 |
| GET | `/admin/overview` | none | farmer/booking/diagnostic counts and districts | 200 |
| GET | `/admin/reviews` | none | review array with farm relation | 200 |
| PATCH | `/admin/reviews` | `{ id, status }` | updated review | 200; 404 |
| POST | `/seed` | none | seed operation result | 200 |

## Missing Endpoint Result

No missing route was found for a request currently emitted by the frontend. The following are **not missing** despite being implemented through the catch-all controller:

- `/api/weather-map`
- `/api/buyer/farm-map`
- `/api/residue/profile`
- `/api/marketplace/listings`
- `/api/marketplace/orders`
- `/api/payments/razorpay/order`
- `/api/payments/razorpay/verify`
- `/api/assistant/audio`

The next backend implementation step is to replace the catch-all branches with explicit route controllers while preserving these paths and payloads.

## Realtime Contract

`services/location/server.js` accepts JSON messages shaped as:

```json
{
  "type": "location_update",
  "id": "driver-id",
  "latitude": 30.3398,
  "longitude": 76.3869,
  "status": "active"
}
```

It emits `location_snapshot` on connection and `location_update` after validated coordinates. The service currently stores locations in process memory and has no authentication; production deployment needs an authenticated driver identity and durable or expiring presence storage.

## Data Model Mapping

The canonical relational schema is `backend/supabase/schema.sql`; the current Node adapter maps these tables to a Mongo-like collection interface:

| Model/table | Key relationships | Main consumers |
|---|---|---|
| `farms` | `owner_id`; referenced by bookings, diagnostics, orders, residue profiles, reviews | onboarding, farmer dashboard, buyer map, admin |
| `machinery` | district/type lookup | machinery booking and residue readiness |
| `district_metrics` | unique district | residue and admin analytics |
| `bookings` | `farm_id -> farms.id` | farmer, admin |
| `stress_diagnostic_logs` | `farm_id -> farms.id` | stress diagnostics, admin |
| `marketplace_listings` | `seller_id` | buyer/seller/farmer marketplace |
| `marketplace_orders` | `listing_id -> marketplace_listings.id`, `farm_id -> farms.id` | buyer, seller, farmer |
| `buyer_needs` | buyer identity | buyer sourcing |
| `residue_profiles` | `farm_id -> farms.id` | farmer residue operations |
| `tasks` | owner identity | farmer operations |
| `messages` | sender/recipient identities | support dock |
| `earnings` | owner identity | operations dashboard |
| `dispatch` | driver/farmer/buyer identities | logistics |
| `notifications` | optional `listing_id -> marketplace_listings.id` | farmer notifications |
| `admin_reviews` | `farm_id -> farms.id` | admin verification |

Advisory snapshots are separately defined in `backend/data/advisory.schema.sql`. The pure crop/residue/agri-loop logic is under `science/src`; it should remain database- and framework-independent.

## Required Backend Follow-up

- Add Zod schemas for buyer needs, residue profiles, bookings, tasks, messages, admin reviews, assistant, reports, and payment requests.
- Derive actor identity from authenticated Supabase sessions instead of trusting `ownerId`, `buyerId`, `sellerId`, or email fields from the browser.
- Replace process-memory fallback in production with an explicit test-only adapter.
- Split the compatibility route into explicit `web/app/api/**/route.js` controllers that call backend services.
- Standardize errors to `{ success: false, error: { code, message, details? } }` and preserve the current payloads during version migration.
- Add contract tests for every row in this matrix and integration tests for Supabase RLS policies.
- Add idempotency and transactional stock decrement for marketplace orders.
- Add authentication and expiry rules to the location WebSocket protocol.
