# Data Model: Email Refactoring

**Feature**: Refactor Email Sending to Vercel Functions  
**Date**: 2025-11-04  
**Purpose**: Document data structures used in email sending functionality

**Note**: This is a refactoring task. No data model changes - documenting existing structures for reference.

## Entities

### ContactFormSubmission

Represents a contact inquiry submitted through the website contact form.

**Attributes**:

- `firstName` (string, required): Submitter's first name
- `lastName` (string, required): Submitter's last name
- `company` (string, required): Submitter's company name
- `email` (string, required): Submitter's email address (used for CC)
- `phone` (string, optional): Submitter's phone number (displays "not defined" if omitted)
- `message` (string, required): Message content from submitter
- `receiver` (string, optional): Custom receiver email (overrides default `MJ_RECEIVER_EMAIL` if provided)

**Validation Rules**:

- All required fields must be present in request body
- `email` should be valid email format (validated by frontend, backend accepts as-is)
- Request body size must not exceed 1MB

**State Transitions**: N/A (stateless - one-time submission)

**Relationships**: None (standalone submission)

---

### JobApplicationSubmission

Represents a job application submitted through the website job application form.

**Attributes**:

- `firstName` (string, required): Applicant's first name
- `lastName` (string, required): Applicant's last name
- `email` (string, required): Applicant's email address (used for CC)
- `phone` (string, optional): Applicant's phone number (displays "not defined" if omitted)
- `message` (string, required): Cover letter or application message
- `position` (string, required): Job position being applied for
- `cvData` (string, required): Base64-encoded PDF file content
- `cvName` (string, required): Original filename of uploaded CV

**Validation Rules**:

- All required fields must be present in request body
- `cvData` must be valid base64-encoded string
- `cvName` should end with `.pdf` (not strictly enforced)
- Request body size must not exceed 2MB (includes base64-encoded CV)
- Base64 overhead: ~33% larger than original file (1.5MB PDF → ~2MB base64)

**State Transitions**: N/A (stateless - one-time submission)

**Relationships**: None (standalone submission)

---

### EmailMessage

Represents the structured email sent via Mailjet API (not exposed to frontend).

**Attributes**:

- `From.Email` (string): Sender email address (from `MJ_SENDER_EMAIL`)
- `From.Name` (string): Sender display name ("Cennso Website contact form")
- `To[].Email` (string): Primary recipient email (from `MJ_RECEIVER_EMAIL` or custom `receiver`)
- `To[].Name` (string): Recipient display name ("Cennso contact")
- `Cc[].Email` (string): Carbon copy email (submitter's email for confirmation)
- `Cc[].Name` (string): CC display name (submitter's full name)
- `Subject` (string): Email subject line (generated from submission data)
- `TextPart` (string): Plain text email body
- `HTMLPart` (string): HTML email body
- `Attachments[]` (array, optional): PDF attachments for job applications
  - `ContentType` (string): MIME type ("application/pdf")
  - `Filename` (string): Original filename
  - `Base64Content` (string): Base64-encoded file data

**Validation Rules**:

- Environment variables (`MJ_SENDER_EMAIL`, `MJ_RECEIVER_EMAIL`, `MJ_APIKEY_PUBLIC`, `MJ_APIKEY_PRIVATE`) must be set
- Mailjet API must return 2xx status for success

**State Transitions**:

1. Created from submission data
2. Sent to Mailjet API
3. Success (2xx response) or Failure (non-2xx response)

**Relationships**:

- Generated from `ContactFormSubmission` or `JobApplicationSubmission`
- Sent via Mailjet client (`lib/mailjet.ts`)

---

## Email Templates

### Contact Form Email

**Subject Format**:

```
Cennso website contact form: {firstName} {lastName} ({company}) - {email}
```

**Text Body Format**:

```
---
Name: {firstName} {lastName}
Company: {company}
E-mail: {email}
Phone number: {phone || 'not defined'}
---

{message}
```

**HTML Body Format**:

```html
<div>
  <p>
    <span><strong>Name</strong>: {firstName} {lastName}</span><br />
    <span><strong>Company</strong>: {company}</span><br />
    <span><strong>E-mail</strong>: {email}</span><br />
    <span><strong>Phone number</strong>: {phone || 'not defined'}</span><br />
  </p>
  <p>{message}</p>
</div>
```

---

### Job Application Email

**Subject Format**:

```
Cennso job submission, {position}: {firstName} {lastName} - {email}
```

**Text Body Format**:

```
---
Position: {position}
Name: {firstName} {lastName}
E-mail: {email}
Phone number: {phone || 'not defined'}
---

{message}
```

**HTML Body Format**:

```html
<div>
  <p>
    <span><strong>Position</strong>: {position}</span><br />
    <span><strong>Name</strong>: {firstName} {lastName}</span><br />
    <span><strong>E-mail</strong>: {email}</span><br />
    <span><strong>Phone number</strong>: {phone || 'not defined'}</span><br />
  </p>
  <p>{message}</p>
</div>
```

**Attachment**:

- ContentType: `application/pdf`
- Filename: `{cvName}` (original filename preserved)
- Base64Content: `{cvData}` (base64-encoded PDF)

---

## Environment Variables

### Required Variables

All of these must be set in Vercel environment variables (production/preview/development):

- `MJ_APIKEY_PUBLIC` (string): Mailjet API public key
- `MJ_APIKEY_PRIVATE` (string): Mailjet API private key (secret)
- `MJ_SENDER_EMAIL` (string): Sender email address (must be verified in Mailjet)
- `MJ_RECEIVER_EMAIL` (string): Default receiver email address for submissions

### Validation

Missing environment variables trigger immediate error:

```typescript
throw new Error(
  'MJ_APIKEY_PUBLIC and/or MJ_APIKEY_PRIVATE envs is/are not defined.'
)
throw new Error(
  'MJ_SENDER_EMAIL and/or MJ_RECEIVER_EMAIL envs is/are not defined.'
)
```

---

## API Response Format

### Success Response

**HTTP Status**: 200 OK

**Body**:

```json
{
  "success": true
}
```

### Error Responses

**HTTP Status**: 405 Method Not Allowed (for non-POST requests)

**Body**:

```json
{
  "message": "Only POST requests allowed"
}
```

**HTTP Status**: 500 Internal Server Error (for email sending failures)

**Body**:

```json
{
  "success": false
}
```

**Note**: Specific error details are logged server-side but not exposed to client for security reasons.

---

## Data Flow

### Contact Form Flow

```
1. User fills contact form on pages/contact.tsx
2. Frontend sends POST to /api/contact-form with ContactFormSubmission
3. Vercel Function (api/contact-form.ts) receives request
4. Validates environment variables
5. Creates Mailjet client (lib/mailjet.ts)
6. Formats email (subject, text, HTML)
7. Sends to Mailjet API
8. Returns success/error response to frontend
9. Frontend shows StatusModal with result
```

### Job Application Flow

```
1. User fills job application form on pages/jobs/[job].tsx
2. User uploads CV (converted to base64 by frontend)
3. Frontend sends POST to /api/job-submission-form with JobApplicationSubmission
4. Vercel Function (api/job-submission-form.ts) receives request
5. Validates environment variables
6. Creates Mailjet client (lib/mailjet.ts)
7. Formats email (subject, text, HTML, attachment)
8. Sends to Mailjet API with PDF attachment
9. Returns success/error response to frontend
10. Frontend shows StatusModal with result
```

---

## No Changes Required

This refactoring does **not** change any data structures, validation rules, or email templates. All entities, formats, and flows remain identical. The only change is the file location of the API handlers (`pages/api/` → `api/`).
