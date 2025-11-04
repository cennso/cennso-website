import { getMailJetClient } from '../lib/mailjet'

import type { VercelRequest, VercelResponse } from '@vercel/node'

export type ContactFormBody = {
  firstName: string
  lastName: string
  company: string
  email: string
  phone: string
  message: string
  receiver: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).send({ message: 'Only POST requests allowed' })
    return
  }
  const contactForm: ContactFormBody = req.body

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

function createSubject(contactForm: ContactFormBody): string {
  return `Cennso website contact form: ${contactForm.firstName} ${contactForm.lastName} (${contactForm.company}) - ${contactForm.email}`
}

function createTextPart(contactForm: ContactFormBody): string {
  return `---
Name: ${contactForm.firstName} ${contactForm.lastName}
Company: ${contactForm.company}
E-mail: ${contactForm.email}
Phone number: ${contactForm.phone || 'not defined'}
---

${contactForm.message}`
}

function createHtmlPart(contactForm: ContactFormBody): string {
  return `<div>
<p>
  <span><strong>Name</strong>: ${contactForm.firstName} ${
    contactForm.lastName
  }</span><br />
  <span><strong>Company</strong>: ${contactForm.company}</span><br />
  <span><strong>E-mail</strong>: ${contactForm.email}</span><br />
  <span><strong>Phone number</strong>: ${
    contactForm.phone || 'not defined'
  }</span><br />
</p>

<p>${contactForm.message}</p>
</div>`
}
