import { useState, useCallback, FormEvent, useId } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Button } from '@cennso/ui'
import { StatusModal, FormInput, FormTextarea, FormSwitch } from '../common'

import type { FunctionComponent } from 'react'
import type { ContactFormBody } from '../../pages/api/contact-form'

interface ContactFormProps {
  receiverEmail: string
  content?: Record<string, any>
}

// The visible label text is written here as a plain <label>, not the shared
// FormLabel from components/common/Form.tsx: FormLabel hardcodes white text,
// which disappears against a light-theme form panel. FormInput/FormTextarea
// stay as the shared primitives below unstyled - the design keeps its fields
// white-on-dark-text in both palettes, which is what they already render.
const labelClassName = 'block text-sm leading-6 text-foreground mb-1'

export const ContactForm: FunctionComponent<ContactFormProps> = ({
  receiverEmail,
  content,
}) => {
  const [action, setAction] = useState<
    'none' | 'sending' | 'success' | 'error'
  >('none')
  const [privacyPolicy, setPrivacyPolicy] = useState(false)
  const [formTimestamp] = useState(Date.now()) // Track when form was loaded

  // This form is rendered once per contact section, so element ids must be
  // unique per instance. Names are untouched: the submit handler reads
  // form.elements by name.
  const uid = useId()

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
    <div className="isolate bg-card border border-border p-6 rounded-[32px] shadow-lg">
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
            <label className={labelClassName} htmlFor={`${uid}-first-name`}>
              First name:
            </label>
            <FormInput
              type="text"
              name="first-name"
              id={`${uid}-first-name`}
              placeholder="Enter your first name"
              autoComplete="given-name"
              required
            />
          </div>
          <div>
            <label className={labelClassName} htmlFor={`${uid}-last-name`}>
              Last name:
            </label>
            <FormInput
              type="text"
              name="last-name"
              id={`${uid}-last-name`}
              placeholder="Enter your last name"
              autoComplete="family-name"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClassName} htmlFor={`${uid}-company`}>
              Company:
            </label>
            <FormInput
              type="text"
              name="company"
              id={`${uid}-company`}
              placeholder="Enter your company name"
              autoComplete="organization"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClassName} htmlFor={`${uid}-email`}>
              E-mail:
            </label>
            <FormInput
              type="email"
              name="email"
              id={`${uid}-email`}
              placeholder="Enter the email to which the reply will be sent"
              autoComplete="email"
              required
            />
          </div>
          <fieldset className="sm:col-span-2">
            <legend className="block text-sm leading-6 text-foreground mb-2">
              Phone number (optional):
            </legend>
            <div className="flex gap-4">
              <div className="w-24">
                <label className="sr-only" htmlFor={`${uid}-country-code`}>
                  Country code
                </label>
                <FormInput
                  type="text"
                  name="country-code"
                  id={`${uid}-country-code`}
                  placeholder="+49"
                  autoComplete="tel-country-code"
                />
              </div>
              <div className="flex-1">
                <label className="sr-only" htmlFor={`${uid}-phone-number`}>
                  Phone number
                </label>
                <FormInput
                  type="tel"
                  name="phone-number"
                  id={`${uid}-phone-number`}
                  placeholder="Enter phone number"
                  autoComplete="tel-national"
                />
              </div>
            </div>
          </fieldset>
          <div className="sm:col-span-2">
            <label className={labelClassName} htmlFor={`${uid}-message`}>
              Message:
            </label>
            <FormTextarea
              name="message"
              id={`${uid}-message`}
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
              id={`${uid}-website`}
              autoComplete="off"
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>
          <div className="flex gap-x-4 sm:col-span-2">
            <div className="flex h-6 items-center">
              <FormSwitch
                onChange={() => setPrivacyPolicy((old) => !old)}
                checked={privacyPolicy}
                name="privacy-policy"
                id={`${uid}-privacy-policy`}
                required
              >
                <span className="sr-only">Agree to policies</span>
              </FormSwitch>
            </div>
            <label
              className="text-sm leading-6 text-foreground"
              htmlFor={`${uid}-privacy-policy`}
            >
              By selecting this, you agree to our{' '}
              <Link
                href="/privacy-policy"
                target="_blank"
                className="font-semibold text-primary underline hover:decoration-2"
              >
                privacy policy
              </Link>
              .
            </label>
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" variant="cta">
              {content?.form?.sendLabel || 'Send'}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
