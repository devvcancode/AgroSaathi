# Deployment

## Vercel

Create the Vercel project from the repository root and use `vercel.json`. It installs with `npm ci` and builds the product app in `web/` with `npm run build:product`. Configure Production, Preview, and Development environments separately; never commit populated env files.

### Required for the Vercel app

| Variable | Value / handling |
|---|---|
| `SUPABASE_URL` | Supabase project URL used by the server adapter. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase service key; never prefix with `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_BASE_URL` | Canonical Vercel origin, for example `https://app.example.com`. |
| `CORS_ORIGINS` | Exact allowed web origin; use the canonical URL, not `*`. |
| `NEXT_PUBLIC_LOCATION_WS_URL` | Render relay URL using `wss://`; needed at client build time. |
| `GROQ_API_KEY` | Preferred assistant, translation, vision, and audio provider. Keep secret. |
| `DISABLE_PWA` | Set to `true` for the documented deterministic build. |

`DATABASE_URL` is required when deploying/applying the Prisma schema; use the Supabase PostgreSQL connection string and add `sslmode=require`. `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are only needed if a browser Supabase client is introduced; the current API uses the server adapter. `LOCATION_WS_URL` is only needed on a server that serves `/api/location/config` (Render); Vercel clients use `NEXT_PUBLIC_LOCATION_WS_URL`.

### Optional provider variables

- `GEMINI_API_KEY`, `GEMINI_MODEL`, and `GEMINI_VISION_MODEL`: secondary AI provider and Gemini-backed features.
- `BHASHINI_ASR_ENDPOINT`, `BHASHINI_ASR_INFERENCE_KEY`, `BHASHINI_TTS_ENDPOINT`, and `BHASHINI_TTS_INFERENCE_KEY`: optional Bhashini voice recognition/synthesis; keep inference keys server-only.
- `YIELD_MODEL_API_URL`: public Render model URL ending in `/predict`.
- `CLOUD_NEXT_WEATHER_API_URL`, `CLOUD_NEXT_WEATHER_API_KEY`, and optionally `CLOUD_NEXT_WEATHER_API_VERSION`: live weather provider.
- `CEHUB_APIKEY`: Syngenta CE Hub; without it, spray-window estimates use the Open-Meteo fallback and hydric stress is unavailable.
- `METEOBLUE_APIKEY`: Meteoblue historical weather adapter.
- `DIGILOCKER_CLIENT_ID`, `DIGILOCKER_CLIENT_SECRET`, and `DIGILOCKER_REDIRECT_URI`: authorization handshake only; set the registered callback URL. Endpoint overrides default to the DigiLocker OAuth URLs in [.env.example](../.env.example).
- `TRANSLATION_API_URL` and `TRANSLATION_API_KEY`: optional internal translation provider; Groq and Gemini are tried afterward.
- `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`: voice-room tokens.
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `NEXT_PUBLIC_RAZORPAY_KEY_ID`: payments; use live credentials only after server-side session authorization is implemented.
- `VERTEX_AI_PROJECT_ID`, `VERTEX_AI_LOCATION`, and `VERTEX_AI_ENDPOINT_ID`: optional fine-tuned matchmaking endpoint.
- `ISRO_SATELLITE_API_URL` and `ISRO_SATELLITE_API_KEY`: reserved adapter configuration; the current endpoint does not fetch satellite observations.
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: only needed by the optional Google Maps driver-map component; the active route map uses Leaflet tiles.

`NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` apply only to the NextAuth-enabled app. The deployed product app currently uses demo/localStorage identity, so configuring these values alone does not replace its demo login.

### Supabase setup

1. Create a Supabase project and run [`backend/supabase/schema.sql`](../backend/supabase/schema.sql) in its SQL editor.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the browser client. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for server-side persistence; never expose the service-role key with a `NEXT_PUBLIC_` name.
3. Add the same server-only values to Render if deploying the API there. Supabase is selected by the server adapter when the URL and service-role key are present; `DATABASE_URL` remains available for Prisma-backed services.
4. Set `DATABASE_URL` to the Supabase PostgreSQL connection string used by Prisma migrations. Verify `/api/health` returns HTTP 200 with `status: "ok"` and `databaseStatus: "connected"`; production now returns 503 when storage is unavailable or only in prototype memory. Check `X-Persistence-Mode` and, on fallback reads, `X-Data-Source: prototype_fallback`. In-memory writes are volatile; fallback reads are seeded/calculated prototype data and do not claim to persist writes.

### Realtime location

The Render blueprint creates `agrosaathi-location` and connects its Redis resource. Set `CORS_ORIGINS` to the exact web origin. After Render assigns the relay URL, set `NEXT_PUBLIC_LOCATION_WS_URL` in Vercel and `LOCATION_WS_URL` in Render to `wss://YOUR_LOCATION_SERVICE.onrender.com`; use `ws://localhost:8787` locally. The app reads the Render URL at runtime, so no Docker build argument is needed. Driver GPS requires browser location permission and HTTPS in production. The current relay does not authenticate driver identities; restrict it to prototype use until a verified-session token is enforced for location publishing.

### DigiLocker consent

Register `https://YOUR_VERCEL_DOMAIN/api/verification/digilocker/callback` (and the Render callback URL if the Render app handles sign-in) with the DigiLocker application, then set the matching client ID, secret, and redirect URI. The current flow validates OAuth state and exchanges the authorization code, but does not retrieve or store documents or mark accounts verified. A secure document/reviewer workflow remains a separate production release gate.

Set these Google OAuth redirect URIs in Google Cloud Console:

- `https://YOUR_VERCEL_DOMAIN/api/auth/callback/google`
- `http://localhost:3000/api/auth/callback/google`

Google OAuth is disabled when credentials are absent; fake client credentials are never used.

After deployment, verify the public app and API from a shell:

```sh
curl -fsS https://YOUR_VERCEL_DOMAIN/api/health
curl -fsS -X POST https://YOUR_VERCEL_DOMAIN/api/translate \
	-H 'Content-Type: application/json' \
	-d '{"text":"30 kg rice today","sourceLanguage":"en","targetLanguage":"hi"}'
```

The health check must return `status: "ok"` and `databaseStatus: "connected"`. The translation check must return non-empty `translatedText`; `mode` identifies `groq`, `gemini`, `provider`, or `fallback`.

## Render

`render.yaml` defines:

- `agrosaathi-api`: the same Next.js product app packaged as a Docker service. This keeps the API route surface available for a Render deployment and provides a fallback deployment target.
- `agrosaathi-yield-model`: the existing Python model service under `services/yield-model`.
- `agrosaathi-location`: a Node WebSocket relay with Redis-backed recent positions and trail history.
- Redis for location persistence. Configure `DATABASE_URL` and Supabase credentials for the app's shared database.

The same `Dockerfile.product` can be deployed to Google Cloud Run. Build and deploy from the repository root:

```sh
gcloud builds submit --tag REGION-docker.pkg.dev/PROJECT_ID/agrosaathi/product-web
gcloud run deploy agrosaathi-product-web \
	--image REGION-docker.pkg.dev/PROJECT_ID/agrosaathi/product-web \
	--region REGION \
	--allow-unauthenticated \
	--set-env-vars NODE_ENV=production,NEXTAUTH_URL=https://YOUR_DOMAIN \
	--set-secrets NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest,DATABASE_URL=DATABASE_URL:latest
```

Cloud Run supplies `PORT` to the container. The container runs Prisma migration deploy before the standard Next server and exposes `/api/health` for runtime checks. Store `DATABASE_URL`, `NEXTAUTH_SECRET`, Google OAuth credentials, and provider keys in Secret Manager, not in the image or repository.

For a separate migration job or a Vercel database setup, run the production migration before serving traffic:

```sh
npm ci
npm run db:migrate:deploy
```

The migration command is non-destructive and applies checked-in migrations from `packages/db/prisma/migrations`.

Render service variables:

- For `agrosaathi-api`, set `DATABASE_URL` to the Supabase PostgreSQL URI, plus `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_BASE_URL`, `CORS_ORIGINS`, and `LOCATION_WS_URL`.
- The blueprint prompts for provider secrets as `sync: false`; fill only the optional providers you use. `PORT` is supplied by Render. Never put service-role or provider secrets into `NEXT_PUBLIC_*` variables.
- `agrosaathi-location` receives `REDIS_URL` from the managed Redis resource; set its `CORS_ORIGINS` to the deployed web origin. Set `NEXT_PUBLIC_LOCATION_WS_URL` on the Vercel build to the relay's public `wss://` URL.
- The yield-model URL must be the public Render service URL ending in `/predict`.

## Local database flow

```sh
docker compose up -d postgres redis location
npm run db:generate
npm run db:migrate
npm run db:migrate:deploy
```

The existing feature API still supports its legacy data adapter for compatibility. New auth, notifications, buyer needs, and dispatch records have PostgreSQL/Prisma models and can be migrated independently while the legacy collections are retired.

## Crop cycle and verification release gates

The crop-cycle fields and buyer product-type fields are defined in `backend/supabase/schema.sql`. Apply the reviewed SQL schema to the target Supabase/PostgreSQL database before deploying the API changes; `npm run db:migrate:deploy` applies Prisma migrations and does not apply that backend SQL file.

KYC requirements, source portals, and the secure implementation checklist are in [KYC and Production Readiness](./KYC_AND_PRODUCTION_READINESS.md). The current `web` login is a demo flow, and document collection is intentionally disabled. Do not enable uploads or label accounts verified until server-authenticated identity, private object storage, reviewer authorization, audit logging, and retention/deletion controls are implemented and tested.

The weather map uses the configured provider only. Included mandi values are explicitly demo data; a live authorized market-data feed must be integrated and verified before representing prices as official. Seller seed comparisons are active-listing asking prices, not transaction prices.

## Production blockers

The deployment manifests and database connectivity are not, by themselves, a production authorization system. The active product app still has demo/localStorage identity, compatibility API routes accept caller-supplied actor IDs, Supabase service-role requests bypass RLS, and the location relay does not authenticate driver publishers. Do not expose this deployment to real users or real personal/financial data until server-verified sessions, per-role authorization, explicit Supabase RLS policies, driver relay authentication, payment authorization, and the private DigiLocker document/review workflow are implemented and tested. Use the prototype fallback only for demos; the response headers make its data source visible.
