# Deployment

## Vercel

Create the Vercel project from the repository root and use `vercel.json`. It installs with npm and builds the product app in `web/` with `npm run build:product`.

Required environment variables:

- `DATABASE_URL`
- `NEXTAUTH_URL` set to the public Vercel URL
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `YIELD_MODEL_API_URL` pointing to the Render yield-model service when enabled

Set these Google OAuth redirect URIs in Google Cloud Console:

- `https://YOUR_VERCEL_DOMAIN/api/auth/callback/google`
- `http://localhost:3000/api/auth/callback/google`

Google OAuth is disabled when credentials are absent; fake client credentials are never used.

## Render

`render.yaml` defines:

- `agrosaathi-api`: the same Next.js product app packaged as a Docker service. This keeps the API route surface available for a Render deployment and provides a fallback deployment target.
- `agrosaathi-yield-model`: the existing Python model service under `services/yield-model`.
- PostgreSQL and Redis resources.

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

Cloud Run supplies `PORT` to the container. The standalone server and `/api/health` endpoint are already configured for that runtime. Store Google OAuth credentials and other secrets in Secret Manager, not in the image or repository.

Run the production migration from a deploy shell or CI job before serving traffic:

```sh
npm ci
npm run db:migrate:deploy
```

The migration command is non-destructive and applies checked-in migrations from `packages/db/prisma/migrations`.

## Local database flow

```sh
docker compose up -d postgres redis
npm run db:generate
npm run db:migrate
npm run db:migrate:deploy
```

The existing feature API still supports its legacy data adapter for compatibility. New auth, notifications, buyer needs, and dispatch records have PostgreSQL/Prisma models and can be migrated independently while the legacy collections are retired.
