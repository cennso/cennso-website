import { getMailJetClient } from '../../lib/mailjet'

import type { NextApiRequest, NextApiResponse } from 'next'

export type JobFormBody = {
  firstName: string
  lastName: string
  email: string
  phone: string
  message: string
  position: string
  // saved in base64
  cvData: string
  cvName: string
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.status(405).send({ message: 'Only POST requests allowed' })
    return
  }
  const jobForm: JobFormBody = req.body

  try {
    const senderEmail = process.env.MJ_SENDER_EMAIL
    const receiverEmail = process.env.MJ_RECEIVER_EMAIL
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
              Name: 'Cennso website contact form',
            },
            To: [
              {
                Email: receiverEmail,
                Name: 'Cennso contact',
              },
            ],
            Cc: [
              {
                Email: jobForm.email,
                Name: `${jobForm.firstName} ${jobForm.lastName}`,
              },
            ],
            Attachments: createAttachments(jobForm),
            Subject: createSubject(jobForm),
            TextPart: createTextPart(jobForm),
            HTMLPart: createHtmlPart(jobForm),
          },
        ],
      })

    if (response.status >= 200 && response.status < 300) {
      res.status(200).json({ success: true })
      return
    }

    console.log('Error(s) when sending the job submission: ', responseBody)
    res.status(response.status).json({ success: false })
  } catch (err: unknown) {
    console.log('Error when sending the job submission: ', err)
    res.status(500).json({ success: false })
  }
}

function createSubject(jobForm: JobFormBody): string {
  return `Cennso job submission, ${jobForm.position}: ${jobForm.firstName} ${jobForm.lastName} - ${jobForm.email}`
}

function createTextPart(jobForm: JobFormBody): string {
  return `---
Position: ${jobForm.position}
Name: ${jobForm.firstName} ${jobForm.lastName}
E-mail: ${jobForm.email}
Phone number: ${jobForm.phone || 'not defined'}
---

${jobForm.message}`
}

function createHtmlPart(jobForm: JobFormBody): string {
  return `<div>
<p>
  <span><strong>Position</strong>: ${jobForm.position}</span><br />
  <span><strong>Name</strong>: ${jobForm.firstName} ${
    jobForm.lastName
  }</span><br />
  <span><strong>E-mail</strong>: ${jobForm.email}</span><br />
  <span><strong>Phone number</strong>: ${
    jobForm.phone || 'not defined'
  }</span><br />
</p>

<p>${jobForm.message}</p>
</div>`
}

function createAttachments(jobForm: JobFormBody): any[] {
  return [
    {
      ContentType: 'application/pdf',
      Filename: jobForm.cvName,
      Base64Content: jobForm.cvData,
    },
  ]
}
