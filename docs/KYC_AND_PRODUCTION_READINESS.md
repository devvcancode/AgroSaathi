# KYC and Production Readiness

## Current status

The active `web` application uses hard-coded demo credentials and a browser `localStorage` role value. Its compatibility API accepts actor identifiers from request bodies. The verification page is guidance only: there is no KYC submission API, authenticated reviewer workflow, private document bucket, or verified account status. Do not collect or transmit identity, land, tax, or bank documents through this demo.

The app must not display a government-certified or KYC-verified claim until an authorized provider or reviewer has completed the relevant checks and the result is durably recorded.

## Document checklist

Requirements vary by entity type, State, activity, transaction, and current law. Collect only documents required for the specific service and have Indian legal/compliance counsel confirm the final checklist.

| Account | Identity and entity | Trade/land evidence | Conditional requirements |
|---|---|---|---|
| Individual farmer | Government photo identity, PAN where required, payout account proof | State land record (such as RoR, 7/12, RTC/Pahani, or Patta) or valid lease/cultivation agreement and landholder consent | Parcel mismatch or non-owner cultivation needs manual review |
| FPO/collective | Registration/incorporation certificate, PAN, governing documents, address, current authorized-signatory/board resolution | Member/farm roster with member consent and the entity's land/cultivation basis | CIN for a Producer Company; GSTIN when registered or legally required; entity bank proof for settlement |
| Buyer | PAN, business constitution proof, address, authorized signatory, payout/settlement account | Declared commodity and intended use | GSTIN validation when registered or required; FSSAI license/registration for applicable food activities; other activity-specific permits |
| Seed seller | PAN, business constitution, address, authorized signatory, settlement account | State seed-dealer license/registration where required; manufacturer/distributor authorization; lot source, label, quality/germination, and expiry records | GSTIN when registered or required; additional licenses for separately regulated product categories |

Use an authorized identity-verification provider if Aadhaar-based verification is legally appropriate; obtain informed consent and do not retain Aadhaar numbers/scans without a reviewed lawful basis. A GSTIN format check is not a GST registration-status check; verify status and legal-name/address match with an authorized GST source.

## Required secure workflow

1. Replace demo login with a maintained identity provider and server-validated sessions. Derive owner and reviewer identities from the verified session, never from browser-supplied email or role fields.
2. Create KYC applications with explicit entity type, consent record, document type, issuing jurisdiction, expiry where applicable, and state (`draft`, `submitted`, `in_review`, `action_required`, `verified`, `rejected`, `expired`). Keep reviewer identity, timestamp, reason, and every status transition in an audit log.
3. Store files only in a private encrypted object-storage bucket. Issue short-lived, single-purpose upload/download URLs after authorization; enforce size/type limits, malware scanning, retention/deletion policy, and access logging. Never return service-role keys to the browser or store document bytes in database rows.
4. Restrict document and reviewer APIs by account ownership and reviewer role, add rate limits and idempotency, and test unauthorized cross-account reads/writes. Redact document identifiers from application logs and analytics.
5. Gate marketplace actions by server-verified status and the relevant license/registration, not by a client-controlled badge. Support expiry, renewal, rejection reasons, appeal/re-review, and account suspension.
6. Complete a privacy impact review and publish purpose limitation, consent, retention, deletion, grievance, and incident-response procedures before collecting personal data.

## Market, weather, and pricing integrity

- Farmer mandi observations currently use demo-shaped records. The source metadata explicitly marks them unofficial. Connect and validate an authorized current government/market-data feed before calling any price official; show market, commodity, unit, observation time, source, and freshness.
- Seed comparisons use active AgroSaathi listing asking prices, not completed transactions or government data. Keep the package/quantity unit visible and do not call the median a market-clearing price.
- Weather map points are populated only by `CLOUD_NEXT_WEATHER_API_URL` and `CLOUD_NEXT_WEATHER_API_KEY`. Without a provider, the API returns unavailable observations instead of generated values. The current service is not a government portal.
- Farmer plans are zero-priced in the UI and payment API. This is not enforceable against a caller that can spoof `userRole`; enforce pricing against the authenticated server-side session before accepting production payments.

## Production release gates

1. Disable demo credentials and verify role authorization on every API write and read; derive `farmerId`, `buyerId`, and `sellerId` from server sessions.
2. Apply reviewed database migrations to the production database, configure backups/PITR, least-privilege service accounts, RLS where appropriate, and test migration rollback/restore.
3. Configure private document storage and KYC reviewer controls before enabling any upload or verification claim.
4. Configure `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, OAuth credentials, `DATABASE_URL` (or the documented Supabase server settings), `CORS_ORIGINS`, `NEXT_PUBLIC_BASE_URL`, weather provider credentials, and the production mandi provider. Store secrets in the hosting platform's secret manager.
5. Set `DISABLE_PWA=true` for the documented serverless build where required; run `npm ci`, `npm run db:generate`, `npm run db:migrate:deploy`, and `npm run build:product` in CI.
6. Run API contract/integration tests, dependency and vulnerability scans, accessibility checks, and end-to-end tests for farmer, buyer, seller, notifications, payments, and admin review before release.
7. After deploy, verify `/api/health`, authenticated role isolation, provider source/freshness reporting, notification delivery, payment webhook/signature handling, and monitoring/alerting. Keep rollback and incident-response runbooks available.

## Official reference portals

- GST portal: <https://www.gst.gov.in/>
- GST taxpayer search: <https://services.gst.gov.in/services/searchtp>
- India Code (central legislation, including seed laws/orders): <https://www.indiacode.nic.in/>
- Small Farmers' Agribusiness Consortium (FPO resources): <https://sfacindia.com/>
- FSSAI FoSCoS licensing portal: <https://foscos.fssai.gov.in/>
- UIDAI: <https://uidai.gov.in/>
