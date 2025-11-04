# Feature Specification: Refactor Email Sending to Vercel Functions

**Feature Branch**: `001-refactor-current-functionality`  
**Created**: 2025-11-04  
**Status**: Draft  
**Input**: User description: "refactor current functionality of sending email in contact form or job application to use Vercel functions"

## Context

This is a **refactoring task**, not new feature development. The email sending functionality already exists and works in production:

- **Contact form**: `pages/contact.tsx` (UI) → `pages/api/contact-form.ts` (handler)
- **Job application form**: `pages/jobs/[job].tsx` (UI) → `pages/api/job-submission-form.ts` (handler)
- **Email service**: `lib/mailjet.ts` (Mailjet integration)

The refactoring goal is to migrate these Next.js API routes to **Vercel Functions** (serverless functions) to ensure compatibility with Vercel's deployment infrastructure, while preserving all existing behavior.

## User Scenarios & Testing _(mandatory)_

### Regression Test 1 - Contact Form Remains Functional (Priority: P1)

After refactoring, the existing contact form must continue to work exactly as it does now.

**Why this priority**: Business-critical communication channel that cannot have downtime or behavior changes.

**Independent Test**: Submit contact form with all existing scenarios and verify identical behavior to current production.

**Acceptance Scenarios**:

1. **Given** the refactored code is deployed, **When** a visitor submits the contact form with all fields, **Then** emails are sent exactly as before (same recipients, CC, formatting, content)
2. **Given** the refactored code is deployed, **When** a visitor submits without optional phone field, **Then** email shows "not defined" as before
3. **Given** the refactored code is deployed, **When** a visitor submits with custom receiver email, **Then** email goes to custom receiver as before
4. **Given** the refactored code is deployed, **When** submission succeeds/fails, **Then** user receives same success/error feedback as before

---

### Regression Test 2 - Job Application Remains Functional (Priority: P1)

After refactoring, the existing job application form must continue to work exactly as it does now.

**Why this priority**: Critical talent acquisition channel that cannot have downtime or behavior changes.

**Independent Test**: Submit job application with CV attachment and verify identical behavior to current production.

**Acceptance Scenarios**:

1. **Given** the refactored code is deployed, **When** an applicant submits with CV attachment, **Then** email with attachment is sent exactly as before
2. **Given** the refactored code is deployed, **When** submission includes all job form fields, **Then** email formatting and content match current production
3. **Given** the refactored code is deployed, **When** submission succeeds/fails, **Then** user receives same success/error feedback as before

---

### Regression Test 3 - Error Handling Preserved (Priority: P2)

After refactoring, error handling and logging must work exactly as before.

**Why this priority**: Important for debugging and monitoring, but less critical than successful happy path.

**Independent Test**: Trigger error scenarios (missing env vars, service failures) and verify same error responses and logging.

**Acceptance Scenarios**:

1. **Given** the refactored code is deployed, **When** email service fails, **Then** same error response and logging occurs as before
2. **Given** the refactored code is deployed, **When** env vars are missing, **Then** same validation error occurs as before

---

### Edge Cases

All edge cases currently handled must continue to work:

- CV file at 2MB size limit
- Missing environment variables (sender/receiver emails)
- Email service non-2xx status codes
- Missing optional phone field
- Email service temporary unavailability
- Special characters or HTML in message content

## Requirements _(mandatory)_

### Functional Requirements (Preservation)

The refactoring MUST preserve all existing functionality:

- **FR-001**: System MUST maintain identical POST request handling for contact form endpoint (firstName, lastName, company, email, phone, message, receiver fields)
- **FR-002**: System MUST maintain identical POST request handling for job application endpoint (firstName, lastName, email, phone, message, position, cvData, cvName fields)
- **FR-003**: System MUST continue sending emails to configured receiver with CC to submitter (no behavior change)
- **FR-004**: System MUST continue formatting emails with both plain text and HTML versions (same templates)
- **FR-005**: System MUST preserve handling of optional phone field ("not defined" when missing)
- **FR-006**: System MUST preserve CV PDF attachment handling with original filename
- **FR-007**: System MUST maintain base64 encoding for CV data
- **FR-008**: System MUST preserve 1MB body size limit for contact form
- **FR-009**: System MUST preserve 2MB body size limit for job applications
- **FR-010**: System MUST return identical HTTP status codes (200, 405, 500) for same scenarios
- **FR-011**: System MUST maintain same error logging behavior
- **FR-012**: System MUST preserve environment variable validation (MJ_SENDER_EMAIL, MJ_RECEIVER_EMAIL)
- **FR-013**: System MUST continue rejecting non-POST requests with 405
- **FR-014**: System MUST preserve custom receiver email override functionality
- **FR-015**: System MUST return identical JSON responses with success boolean

### Refactoring Requirements

- **FR-016**: Email handlers MUST be compatible with Vercel Functions deployment
- **FR-017**: Refactored code MUST work with Vercel's serverless environment constraints
- **FR-018**: All existing environment variables MUST continue to work without changes

### Key Entities

No changes to entities - these remain the same:

- **Contact Form Submission**: firstName, lastName, company, email, phone (optional), message, receiver (optional)
- **Job Application Submission**: firstName, lastName, email, phone (optional), message, position, cvData (base64), cvName
- **Email Message**: from/to addresses, CC, subject, text/HTML content, optional attachments

## Success Criteria _(mandatory)_

### Measurable Outcomes

Since this is a refactoring, success is measured by **zero behavior change**:

- **SC-001**: 100% of contact form submissions work identically to current production (same emails sent, same timing)
- **SC-002**: 100% of job application submissions work identically to current production (same emails with attachments)
- **SC-003**: Email delivery success rate remains at current production levels (99.9%+)
- **SC-004**: User feedback (success/error messages) is identical to current production in all scenarios
- **SC-005**: Error logging provides same detail level as current production
- **SC-006**: All existing edge cases (missing phone, custom receiver, size limits, errors) behave identically
- **SC-007**: Deployment to Vercel Functions completes successfully with no runtime errors
- **SC-008**: Zero regression bugs reported in first 7 days post-deployment

## Assumptions

- Current functionality in `pages/api/contact-form.ts` and `pages/api/job-submission-form.ts` is working correctly in production
- Mailjet credentials and configuration (environment variables) will remain unchanged
- Vercel Functions support is available and configured for the deployment
- The `node-mailjet` npm package is compatible with Vercel Functions serverless environment
- Current email templates and formatting should be preserved exactly
- The refactoring only changes deployment/infrastructure, not business logic
- Frontend code (`pages/contact.tsx`, `pages/jobs/[job].tsx`) will continue to call the same API endpoints
