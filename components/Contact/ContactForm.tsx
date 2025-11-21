import { useState, useCallback, FormEvent } from 'react'
import Link from 'next/link'

import { StatusModal } from '../common'
import {
  FormLabel,
  FormInput,
  FormTextarea,
  Button,
  FormSwitch,
} from '../common'

import type { FunctionComponent } from 'react'
import type { ContactFormBody } from '../../pages/api/contact-form'

interface ContactFormProps {
  receiverEmail: string
  content?: Record<string, any>
}

export const ContactForm: FunctionComponent<ContactFormProps> = ({
  receiverEmail,
  content,
}) => {
  const [action, setAction] = useState<
    'none' | 'sending' | 'success' | 'error'
  >('none')
  const [privacyPolicy, setPrivacyPolicy] = useState(false)
  const [formTimestamp] = useState(Date.now()) // Track when form was loaded

  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setAction('sending')
      const inputs = (e.target as any).elements as Record<
        string,
        HTMLInputElement
      >

      // collect data
      const data: ContactFormBody = {
        firstName: inputs['first-name'].value,
        lastName: inputs['last-name'].value,
        company: inputs['company'].value,
        email: inputs['email'].value,
        phoneCountryCode: inputs['country-code']?.value || '',
        phoneNumber: inputs['phone-number']?.value || '',
        message: inputs['message'].value,
        receiver: receiverEmail,
        // Anti-spam fields
        website: inputs['website']?.value || '', // Honeypot field
        formTimestamp: formTimestamp,
        submitTimestamp: Date.now(),
      }

      // send form to the api
      const response = await fetch('/api/contact-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      // add sending effect
      await new Promise((resolve) => {
        setTimeout(resolve, 1500)
      })

      if (response.status >= 200 && response.status < 300) {
        // success
        setAction('success')
        // reset values
        inputs['first-name'].value = ''
        inputs['last-name'].value = ''
        inputs['company'].value = ''
        inputs['email'].value = ''
        inputs['country-code'].value = ''
        inputs['phone-number'].value = ''
        inputs['message'].value = ''
        setPrivacyPolicy(false)
        return
      }

      setAction('error')
    },
    [setPrivacyPolicy, setAction, receiverEmail, formTimestamp]
  )

  return (
    <div className="isolate bg-gradient-to-b from-[#0f4f78] to-secondary-600 p-6 rounded-[32px] border border-secondary-600">
      <StatusModal
        action={action}
        setAction={setAction}
        kind="email"
        content={content}
      />

      <form className="mx-auto" onSubmit={onSubmit}>
        {/* Screen reader region for form status updates */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {action === 'sending' &&
            (content?.form?.statusMessages?.sending || 'Sending...')}
          {action === 'success' &&
            (content?.form?.statusMessages?.success ||
              'Message sent successfully.')}
          {action === 'error' &&
            (content?.form?.statusMessages?.error ||
              'An error occurred while sending message.')}
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          <div>
            <FormLabel htmlFor="first-name">First name:</FormLabel>
            <FormInput
              type="text"
              name="first-name"
              id="first-name"
              placeholder="Enter your first name"
              autoComplete="given-name"
              required
            />
          </div>
          <div>
            <FormLabel htmlFor="last-name">Last name:</FormLabel>
            <FormInput
              type="text"
              name="last-name"
              id="last-name"
              placeholder="Enter your last name"
              autoComplete="family-name"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <FormLabel htmlFor="company">Company:</FormLabel>
            <FormInput
              type="text"
              name="company"
              id="company"
              placeholder="Enter your company name"
              autoComplete="organization"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <FormLabel htmlFor="email">E-mail:</FormLabel>
            <FormInput
              type="email"
              name="email"
              id="email"
              placeholder="Enter the email to which the reply will be sent"
              autoComplete="email"
              required
            />
          </div>
          <fieldset className="sm:col-span-2">
            <legend className="block text-sm font-medium leading-6 text-gray-900 mb-2">
              Phone number (optional):
            </legend>
            <div className="flex gap-4">
              <div className="w-24">
                <FormLabel htmlFor="country-code" className="sr-only">
                  Country code
                </FormLabel>
                <FormInput
                  type="text"
                  name="country-code"
                  id="country-code"
                  placeholder="+49"
                  autoComplete="tel-country-code"
                />
              </div>
              <div className="flex-1">
                <FormLabel htmlFor="phone-number" className="sr-only">
                  Phone number
                </FormLabel>
                <FormInput
                  type="tel"
                  name="phone-number"
                  id="phone-number"
                  placeholder="Enter phone number"
                  autoComplete="tel-national"
                />
              </div>
            </div>
          </fieldset>
          <div className="sm:col-span-2">
            <FormLabel htmlFor="message">Message:</FormLabel>
            <FormTextarea
              name="message"
              id="message"
              rows={4}
              placeholder="Enter message content..."
              required
            />
          </div>
          {/* Honeypot field - completely hidden from all users and bots */}
          <div className="absolute -left-full -top-full opacity-0 pointer-events-none overflow-hidden h-0 w-0">
            <FormInput
              type="text"
              name="website"
              id="website"
              autoComplete="off"
              tabIndex={-1}
            />
          </div>
          <div className="flex gap-x-4 sm:col-span-2">
            <div className="flex h-6 items-center">
              <FormSwitch
                onChange={() => setPrivacyPolicy((old) => !old)}
                checked={privacyPolicy}
                name="privacy-policy"
                id="privacy-policy"
                required
              >
                <span className="sr-only">Agree to policies</span>
              </FormSwitch>
            </div>
            <label
              className="text-sm leading-6 text-gray-600"
              id="privacy-policy"
            >
              By selecting this, you agree to our{' '}
              <Link
                href="/privacy-policy"
                target="_blank"
                className="font-semibold text-secondary-200 underline hover:decoration-2"
              >
                privacy policy
              </Link>
              .
            </label>
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button variant="action" useArrow={false} className="text-sm">
              Send email
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
