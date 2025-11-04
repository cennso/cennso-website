# Research: Vercel Functions Migration

**Feature**: Refactor Email Sending to Vercel Functions  
**Date**: 2025-11-04  
**Purpose**: Research required to ensure successful migration from Next.js API routes to Vercel Functions

## Research Questions

### 1. Vercel Functions File Structure

**Question**: What is the correct file structure for Vercel Functions in a Next.js project?

**Decision**: Use `/api` directory at repository root (not `/pages/api`)

**Rationale**:

- Vercel automatically detects and deploys functions from `/api` directory
- Next.js 12+ supports both `/pages/api` (integrated API routes) and `/api` (standalone functions)
- `/api` directory follows Vercel's recommended serverless functions convention
- Allows same endpoint URLs (`/api/contact-form`) with zero frontend changes
- More explicit separation between page rendering and serverless functions

**Alternatives Considered**:

- Keep in `/pages/api`: Works but ties functions to Next.js routing; less portable
- Use Vercel CLI configuration: More complex, requires vercel.json configuration
- Separate repository: Overkill for 2 simple email endpoints

**References**:

- [Vercel Functions Documentation](https://vercel.com/docs/functions)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

### 2. Node.js Package Compatibility with Vercel Functions

**Question**: Is `node-mailjet@6.0.5` compatible with Vercel's serverless environment?

**Decision**: Yes, `node-mailjet` is fully compatible with Vercel Functions

**Rationale**:

- Vercel Functions run on Node.js runtime (14.x, 16.x, 18.x, 20.x supported)
- `node-mailjet` is a standard HTTP client library with no native dependencies
- No file system dependencies or persistent state requirements
- HTTP requests work identically in serverless environment
- Other Mailjet users successfully run on Vercel/AWS Lambda/Cloud Functions

**Alternatives Considered**:

- Switch to `@sendgrid/mail`: Would require rewriting email logic and templates
- Use Vercel's edge runtime: Not necessary for email sending (standard Node.js is fine)
- REST API directly: Reinventing the wheel, `node-mailjet` handles auth and formatting

**Testing Requirements**:

- Verify cold start performance (first request after deploy)
- Test with full 2MB job application payload
- Confirm environment variables work identically

---

### 3. Environment Variables in Vercel Functions

**Question**: Do environment variables work the same way in Vercel Functions as in Next.js API routes?

**Decision**: Yes, `process.env` works identically in Vercel Functions

**Rationale**:

- Vercel Functions use same Node.js `process.env` access pattern
- Environment variables configured in Vercel dashboard or `.env.local` (development)
- No code changes required for environment variable access
- Variables are encrypted at rest and in transit on Vercel
- Same variables used: `MJ_APIKEY_PUBLIC`, `MJ_APIKEY_PRIVATE`, `MJ_SENDER_EMAIL`, `MJ_RECEIVER_EMAIL`

**Migration Checklist**:

- ✅ Current variables in Vercel project settings (already configured)
- ✅ `.env.local` for local development (already exists)
- ✅ No hardcoded secrets in code (already verified)

---

### 4. Request Body Parsing in Vercel Functions

**Question**: Does body parsing (`bodyParser` config) work the same in Vercel Functions?

**Decision**: Vercel Functions use different body parsing configuration

**Rationale**:

- Next.js API routes use `export const config = { api: { bodyParser: { sizeLimit: '1mb' } } }`
- Vercel Functions use `export const config = { maxDuration: 10 }` for timeout configuration
- Body parsing happens automatically, no explicit configuration needed
- Size limits controlled by Vercel's platform limits (default: 4.5MB for Hobby/Pro plans)
- Our limits (1MB, 2MB) are well within platform limits

**Changes Required**:

- Remove `bodyParser` configuration from refactored functions
- Add `maxDuration` if needed for timeout control (default: 10s is sufficient)
- Verify request body is still parsed to JSON automatically

---

### 5. TypeScript Support in Vercel Functions

**Question**: Do Vercel Functions support TypeScript with same types as Next.js API routes?

**Decision**: Yes, Vercel Functions support TypeScript with compatible types

**Rationale**:

- Vercel Functions use `@vercel/node` package for type definitions
- Function signature: `export default function handler(req: VercelRequest, res: VercelResponse)`
- Types are compatible with Next.js: `NextApiRequest` extends `VercelRequest`, `NextApiResponse` extends `VercelResponse`
- TypeScript compilation handled by Vercel build process
- Same `tsconfig.json` applies to both pages and functions

**Migration Path**:

- Change imports from `import type { NextApiRequest, NextApiResponse } from 'next'`
- To: `import type { VercelRequest, VercelResponse } from '@vercel/node'`
- Function logic remains unchanged (request/response API is identical)

---

### 6. Cold Start Performance

**Question**: Will cold starts impact email delivery time?

**Decision**: Cold starts are acceptable for this use case

**Rationale**:

- Contact forms and job applications are infrequent (not high-traffic APIs)
- Vercel keeps functions warm for ~5 minutes after last invocation
- Cold start overhead: ~200-500ms for Node.js functions
- Total time budget: 5s (contact), 10s (job applications) - plenty of headroom
- Email delivery (Mailjet API call) is the dominant latency factor (2-4s typical)

**Optimization Strategies** (if needed):

- Keep functions small (<1MB) for faster cold starts
- Minimize dependencies (already minimal - just `node-mailjet`)
- Use `maxDuration` config to prevent timeout issues

---

### 7. Error Logging and Monitoring

**Question**: How does error logging work in Vercel Functions vs Next.js API routes?

**Decision**: Use same `console.log`/`console.error` approach, enhanced with Vercel logs

**Rationale**:

- Vercel automatically captures all `console.*` output to function logs
- Logs viewable in Vercel dashboard under "Functions" → "Logs"
- Real-time log streaming available during development (`vercel dev`)
- Same error handling code works (try/catch with console.error)
- Can integrate Sentry or other monitoring tools later if needed

**No Changes Required**:

- Existing `console.log('Error when sending...')` statements work as-is
- Error responses still return appropriate HTTP status codes
- Vercel provides automatic error tracking in dashboard

---

## Research Summary

**Ready for Implementation**: ✅ Yes

All research questions resolved. Migration path is straightforward:

1. Move files from `/pages/api/` to `/api/` directory
2. Update type imports from `next` to `@vercel/node`
3. Remove `bodyParser` config (Vercel handles automatically)
4. Test with same request payloads to verify identical behavior
5. No changes to `lib/mailjet.ts` or frontend code required

**Risk Assessment**: **Low**

- No breaking changes to API contracts
- No new dependencies
- Proven compatibility of all packages
- Straightforward file relocation

**Next Steps**: Proceed to Phase 1 (Design & Contracts)
