# AgroSaathi

AgroSaathi is a monorepo scaffold for a role-based agricultural marketplace with three protected dashboards:

- Farmer dashboard at /farmer
- Buyer dashboard at /buyer
- Seller dashboard at /seller

It includes mock verification services for Govt Kisaan ID validation and company registry validation, JWT-based route protection, Prisma schema for role-aware users, and a minimal Next.js app shell.

## Monorepo structure

- apps/web -> Next.js app
- packages/auth -> JWT utilities and mock verification helpers
- packages/db -> Prisma schema and database client package
- packages/ui -> shared UI primitives

## Local development

1. Install dependencies:

   pnpm install

2. Start Postgres and Redis:

   docker compose up -d

3. Copy and fill environment variables:

   cp .env.example .env.local

4. Generate the Prisma client:

   pnpm db:generate

5. Start the app:

   pnpm dev

Then open http://localhost:3000.

## Role auth flow

### Farmer

- Login with Kisaan ID + mobile number
- Mock verification endpoint validates the inputs
- OTP is accepted in mock mode via 123456
- JWT is issued with a role of FARMER and optional kisaan_id
- Middleware restricts /farmer to FARMER only

### Buyer

- Google OAuth login is used first
- The middleware enforces company linkage before allowing access to /buyer
- Company ID validation is stubbed via a mock registry check and can be replaced by a real GST/company registry API later

### Seller

- Google OAuth login only
- JWT role is SELLER
- Middleware restricts /seller to SELLER only

## TODO for real integrations

- Replace mockVerifyKisaan with the real government Kisaan ID API
- Replace mockVerifyCompany with the real GST/company registry endpoint
- Configure Google OAuth credentials in your environment
- Connect Prisma to Postgres and push the schema

## Required environment variables

See .env.example for the full list. At minimum, set the following before running the app:

- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- NEXTAUTH_SECRET
- DATABASE_URL
- REDIS_URL
- KISAAN_ID_API_URL
- COMPANY_REGISTRY_API_URL

## Codespaces note

In GitHub Codespaces, the repo can be started with the usual Node environment and Docker support. If Docker is available, use the included docker-compose.yml for Postgres and Redis.
