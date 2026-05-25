# Security Best Practices Report - Originally Store

## Executive Summary

The application follows several important secure defaults: service-role Supabase usage stays server-side, `.env.local` is ignored, admin mutations generally call server-side admin checks, and upload APIs generate storage paths with size/MIME limits. The main gap to fix first is Supabase RLS for `product_images`, which currently exposes image rows publicly regardless of product publication status.

## Medium

### SBP-001 - Public RLS exposes product images for draft products

`products` and `product_variants` correctly model the "public sees published content only" rule, but `product_images` is public for every row.

References:

- `supabase/migrations/001_initial_schema.sql:102`
- `supabase/migrations/001_initial_schema.sql:105`
- `supabase/migrations/20260521184603_add_originally_import_metadata.sql:64`

Fix: change the `product_images` select policy to require either admin access or a published parent product. Consider private storage/signed URLs if draft media must never be accessible by direct URL.

## Low

### SBP-002 - Validate public-facing URLs saved from admin forms

Instagram tile links are accepted as free text and later rendered as public anchors.

References:

- `src/app/admin/(dashboard)/instagram/page.tsx:35-37`
- `src/app/admin/actions.ts:116-118`
- `src/app/page.tsx:464-466`

Fix: parse and allowlist only `https:`, `http:`, or site-relative URLs before saving.

### SBP-003 - Add network controls to image import fetches

The importer fetches lower-trust upstream image URLs without an allowlist, timeout, redirect cap, private-IP guard, or max response-byte limit.

References:

- `src/lib/import/originally.ts:338-351`
- `src/lib/import/supabase.ts:248-258`
- `scripts/originally-catalog.ts:136-146`

Fix: allowlist expected hosts, reject private/reserved IPs, and enforce timeout/redirect/size limits.

### SBP-004 - Address `npm audit` PostCSS advisory through Next

`npm audit --audit-level=moderate` reports `GHSA-qx2v-qp2m-jg93` through `next@16.2.6` vendoring `postcss@8.4.31`.

References:

- `package.json:22`
- `package-lock.json:6845-6855`
- `package-lock.json:6898-6901`

Fix: update to a compatible fixed Next.js release that bundles `postcss >= 8.5.10`; do not apply the suggested force fix if it downgrades Next.

## Hardening

### SBP-005 - Fail closed for admin when Supabase config is missing in production

`src/app/admin/(dashboard)/layout.tsx:5-7` skips `requireAdmin()` when Supabase env is absent. That is useful locally, but production should not render admin screens without real auth configuration.

### SBP-006 - Add Origin checks for custom admin Route Handlers

The admin upload/delete endpoints authenticate with cookies and server-side admin checks. Add explicit same-origin checks to `POST`, `PATCH`, and `DELETE` handlers for defense in depth.

References:

- `src/app/api/admin/products/[id]/images/route.ts:11-20`
- `src/app/api/admin/products/[id]/images/route.ts:76-84`
- `src/app/api/admin/products/[id]/images/route.ts:122-130`
- `src/app/api/admin/instagram/route.ts:11-19`

### SBP-007 - Add security headers at Next/Vercel layer

`next.config.ts` currently only sets dev/Turbopack options. If Vercel is not already adding them elsewhere, add `Content-Security-Policy`, `X-Frame-Options` or `frame-ancestors`, `Referrer-Policy`, and `X-Content-Type-Options`.

