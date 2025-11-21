import { getMailJetClient } from '../../lib/mailjet'

import type { VercelRequest, VercelResponse } from '@vercel/node'

export type ContactFormBody = {
  firstName: string
  lastName: string
  company: string
  email: string
  phoneCountryCode?: string
  phoneNumber?: string
  message: string
  receiver: string
  // Anti-spam fields
  website?: string // Honeypot field
  formTimestamp?: number
  submitTimestamp?: number
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}

// Anti-spam validation function
function validateAntiSpam(form: ContactFormBody): {
  valid: boolean
  reason?: string
} {
  // 1. Honeypot check - if website field is filled, it's likely a bot
  if (form.website && form.website.trim().length > 0) {
    console.log('🔍 SPAM SUBMISSION DETAILS:', {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      company: form.company,
      phoneCountryCode: form.phoneCountryCode,
      phoneNumber: form.phoneNumber,
      messageLength: form.message?.length,
      formTimestamp: form.formTimestamp,
      submitTimestamp: form.submitTimestamp,
      website: form.website ? '[HIDDEN]' : undefined,
    })
    console.log(
      '❌ SPAM BLOCKED: Honeypot field filled - value length:',
      form.website.trim().length
    )
    return { valid: false, reason: 'Honeypot field filled' }
  }

  // 2. Timing check - forms submitted too quickly are suspicious
  if (form.formTimestamp && form.submitTimestamp) {
    const timeDiff = form.submitTimestamp - form.formTimestamp
    if (timeDiff < 3000) {
      // Less than 3 seconds
      console.log('🔍 SPAM SUBMISSION DETAILS:', {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        company: form.company,
        phoneCountryCode: form.phoneCountryCode,
        phoneNumber: form.phoneNumber,
        messageLength: form.message?.length,
        formTimestamp: form.formTimestamp,
        submitTimestamp: form.submitTimestamp,
        website: form.website ? '[HIDDEN]' : undefined,
      })
      console.log(
        '❌ SPAM BLOCKED: Form submitted too quickly -',
        timeDiff,
        'ms'
      )
      return { valid: false, reason: 'Form submitted too quickly' }
    }
  }

  return { valid: true }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).send({ message: 'Only POST requests allowed' })
    return
  }
  const contactForm: ContactFormBody = req.body

  // Anti-spam validation
  const spamCheck = validateAntiSpam(contactForm)
  if (!spamCheck.valid) {
    console.log('Spam detected:', spamCheck.reason)
    // Return success to avoid alerting spammers, but don't send email
    res.status(200).json({ success: true })
    return
  }

  try {
    const senderEmail = process.env.MJ_SENDER_EMAIL
    const receiverEmail = contactForm.receiver || process.env.MJ_RECEIVER_EMAIL
    if (!senderEmail || !receiverEmail) {
      throw new Error(
        'MJ_SENDER_EMAIL and/or MJ_RECEIVER_EMAIL envs is/are not defined.'
      )
    }

    const client = getMailJetClient()
    const { response, body: responseBody } = await client
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: senderEmail,
              Name: 'Cennso Website contact form',
            },
            To: [
              {
                Email: receiverEmail,
                Name: 'Cennso contact',
              },
            ],
            Cc: [
              {
                Email: contactForm.email,
                Name: `${contactForm.firstName} ${contactForm.lastName}`,
              },
            ],
            Subject: createSubject(contactForm),
            TextPart: createTextPart(contactForm),
            HTMLPart: createHtmlPart(contactForm),
          },
        ],
      })

    if (response.status >= 200 && response.status < 300) {
      res.status(200).json({ success: true })
      return
    }

    console.log('Error(s) when sending the contact message: ', responseBody)
    res.status(response.status).json({ success: false })
  } catch (err: unknown) {
    console.log('Error when sending the contact message: ', err)
    res.status(500).json({ success: false })
  }
}

function getPhoneDisplay(
  contactForm: ContactFormBody,
  defaultValue = 'no phone'
): string {
  return contactForm.phoneCountryCode && contactForm.phoneNumber
    ? `${contactForm.phoneCountryCode} ${contactForm.phoneNumber}`
    : defaultValue
}

function createSubject(contactForm: ContactFormBody): string {
  const phoneDisplay = getPhoneDisplay(contactForm)

  return `Cennso website contact form: ${contactForm.firstName} ${contactForm.lastName} (${contactForm.company}) - ${phoneDisplay} - ${contactForm.email}`
}

function createTextPart(contactForm: ContactFormBody): string {
  const phoneDisplay = getPhoneDisplay(contactForm, 'not defined')

  return `---
Name: ${contactForm.firstName} ${contactForm.lastName}
Company: ${contactForm.company}
E-mail: ${contactForm.email}
Phone number: ${phoneDisplay}
---

${contactForm.message}`
}

function createHtmlPart(contactForm: ContactFormBody): string {
  const phoneDisplay = getPhoneDisplay(contactForm, 'not defined')

  return `<div>
<p>
  <span><strong>Name</strong>: ${contactForm.firstName} ${
    contactForm.lastName
  }</span><br />
  <span><strong>Company</strong>: ${contactForm.company}</span><br />
  <span><strong>E-mail</strong>: ${contactForm.email}</span><br />
  <span><strong>Phone number</strong>: ${phoneDisplay}</span><br />
</p>

<p>${contactForm.message}</p>
</div>`
}
