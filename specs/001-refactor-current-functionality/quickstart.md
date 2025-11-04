# Quickstart: Email Refactoring Testing

This guide provides instructions for regression testing the email functionality before and after refactoring from Next.js API routes to Vercel Functions.

## Prerequisites

- Node.js 18+ installed
- Environment variables configured (see below)
- `curl` or HTTP testing tool (Postman, Thunder Client, etc.)

## Environment Variables

Both implementations require these environment variables:

```bash
MJ_APIKEY_PUBLIC=your_mailjet_public_key
MJ_APIKEY_PRIVATE=your_mailjet_private_key
MJ_SENDER_EMAIL=noreply@cennso.com
MJ_RECEIVER_EMAIL=hr@cennso.com
```

For local testing, create a `.env.local` file with these values.

## Testing Contact Form Endpoint

### Endpoint Details

- **URL**: `POST /api/contact-form`
- **Content-Type**: `application/json`
- **Max Request Size**: 1MB

### Test Case 1: Complete Contact Form Submission

```bash
curl -X POST http://localhost:3000/api/contact-form \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Smith",
    "company": "ACME Corp",
    "email": "john.smith@example.com",
    "phone": "+1-555-0123",
    "message": "I would like to schedule a consultation about your cloud migration services.",
    "receiver": "sales@cennso.com"
  }'
```

**Expected Response** (200 OK):

```json
{
  "success": true
}
```

**Expected Email**:

- **To**: `sales@cennso.com` (or MJ_RECEIVER_EMAIL if receiver not provided)
- **CC**: `john.smith@example.com`
- **Subject**: "New contact form submission from John Smith at ACME Corp"
- **Body**: Contains all submitted information (name, company, email, phone, message)

### Test Case 2: Minimal Contact Form (Optional Fields Omitted)

```bash
curl -X POST http://localhost:3000/api/contact-form \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane.doe@example.com",
    "message": "Please contact me about your services."
  }'
```

**Expected Response** (200 OK):

```json
{
  "success": true
}
```

**Expected Email**:

- **To**: MJ_RECEIVER_EMAIL (from environment)
- **CC**: `jane.doe@example.com`
- **Subject**: "New contact form submission from Jane Doe"
- **Body**: Shows "not defined" for missing company/phone/receiver fields

### Test Case 3: Invalid Method (GET Request)

```bash
curl -X GET http://localhost:3000/api/contact-form
```

**Expected Response** (405 Method Not Allowed):

```json
{
  "message": "Only POST requests allowed"
}
```

## Testing Job Submission Endpoint

### Endpoint Details

- **URL**: `POST /api/job-submission-form`
- **Content-Type**: `application/json`
- **Max Request Size**: 2MB

### Test Case 4: Complete Job Application with CV

First, create a base64-encoded PDF:

```bash
# Create or use an existing PDF file
base64 -i sample_resume.pdf -o resume_base64.txt
```

Then submit the application:

```bash
curl -X POST http://localhost:3000/api/job-submission-form \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Alice",
    "lastName": "Johnson",
    "email": "alice.johnson@example.com",
    "phone": "+1-555-0456",
    "message": "I am excited to apply for the Senior Cloud Engineer position. With over 8 years of experience in cloud infrastructure and DevOps, I believe I would be a great fit for your team.",
    "position": "Senior Cloud Engineer",
    "cvData": "'"$(cat resume_base64.txt)"'",
    "cvName": "alice_johnson_resume.pdf"
  }'
```

**Expected Response** (200 OK):

```json
{
  "success": true
}
```

**Expected Email**:

- **To**: MJ_RECEIVER_EMAIL (HR team)
- **CC**: `alice.johnson@example.com`
- **Subject**: "Job submission from Alice Johnson for Senior Cloud Engineer"
- **Body**: Contains applicant info (name, email, phone, message, position)
- **Attachment**: `alice_johnson_resume.pdf` (PDF file, content type: `application/pdf`)

### Test Case 5: Minimal Job Application (No Phone)

```bash
curl -X POST http://localhost:3000/api/job-submission-form \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Bob",
    "lastName": "Williams",
    "email": "bob.williams@example.com",
    "message": "Please find my resume attached for the DevOps Engineer position.",
    "position": "DevOps Engineer",
    "cvData": "'"$(cat resume_base64.txt)"'",
    "cvName": "bob_williams_cv.pdf"
  }'
```

**Expected Response** (200 OK):

```json
{
  "success": true
}
```

**Expected Email**:

- **To**: MJ_RECEIVER_EMAIL
- **CC**: `bob.williams@example.com`
- **Subject**: "Job submission from Bob Williams for DevOps Engineer"
- **Body**: Shows "not defined" for phone field
- **Attachment**: `bob_williams_cv.pdf`

### Test Case 6: Invalid Method (GET Request)

```bash
curl -X GET http://localhost:3000/api/job-submission-form
```

**Expected Response** (405 Method Not Allowed):

```json
{
  "message": "Only POST requests allowed"
}
```

## Verification Checklist

After running all test cases, verify:

- [ ] All successful requests return `{ "success": true }` with 200 status
- [ ] All invalid method requests return 405 with appropriate error message
- [ ] Emails arrive at correct recipients (To: receiver, CC: sender)
- [ ] Email subjects match expected format
- [ ] Email bodies contain all submitted information
- [ ] Optional fields show "not defined" when omitted
- [ ] Job submission attachments arrive as PDF files with correct filenames
- [ ] Error handling returns `{ "success": false }` with 500 status on failures
- [ ] Response times are acceptable (< 5s for contact form, < 10s for job submission)

## Before/After Comparison

| Aspect                    | Before (Next.js API Routes)                                           | After (Vercel Functions)                       | Expected Difference              |
| ------------------------- | --------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------- |
| **File Location**         | `pages/api/*.ts`                                                      | `api/*.ts`                                     | Different directory              |
| **Type Imports**          | `import { NextApiRequest } from 'next'`                               | `import { VercelRequest } from '@vercel/node'` | Different package                |
| **Body Parsing Config**   | `export const config = { api: { bodyParser: { sizeLimit: '1mb' } } }` | Uses `vercel.json` config                      | Different configuration approach |
| **Response Format**       | `{ success: true/false }`                                             | `{ success: true/false }`                      | **Identical**                    |
| **Email Content**         | Subject/body/attachments                                              | Subject/body/attachments                       | **Identical**                    |
| **Status Codes**          | 200/405/500                                                           | 200/405/500                                    | **Identical**                    |
| **Environment Variables** | `process.env.MJ_*`                                                    | `process.env.MJ_*`                             | **Identical**                    |
| **Behavior**              | All test cases pass                                                   | All test cases pass                            | **Zero difference**              |

## Regression Testing Process

1. **Baseline Testing** (Before Refactoring):

   - Run all 6 test cases against current implementation
   - Document all response times, email content, attachment sizes
   - Save email screenshots/samples for comparison

2. **Refactored Testing** (After Migration):

   - Run identical 6 test cases against Vercel Functions
   - Compare response times (should be within ±500ms due to cold starts)
   - Compare email content byte-for-byte (should be identical)
   - Compare attachment filenames/sizes (should match exactly)

3. **Success Criteria**:
   - All 6 test cases produce identical responses (status codes, JSON bodies)
   - All emails have identical subjects, bodies, and attachments
   - Response times remain under thresholds (5s contact, 10s job submission)
   - No console errors or warnings in logs

## Troubleshooting

### Email Not Received

- Check environment variables are set correctly
- Verify Mailjet API credentials are valid
- Check spam folder for test emails
- Review server logs for Mailjet API errors

### 500 Error on Submission

- Verify all required fields are present in request body
- Check request size is under limits (1MB contact, 2MB job submission)
- Ensure base64 encoding is valid for CV data
- Check server logs for detailed error messages

### Attachment Not Opening

- Verify `cvData` is valid base64-encoded PDF
- Check `cvName` has `.pdf` extension
- Ensure original PDF is under ~1.5MB (leaves room for base64 overhead)

## Next Steps

After successful regression testing:

1. Run full quality gates: `yarn check:all`
2. Run Lighthouse audit: `yarn lighthouse` (requires `yarn dev` in separate terminal)
3. Verify deployment on Vercel preview environment
4. Repeat all 6 test cases on preview URL
5. Approve PR if all tests pass with zero behavior changes
