import { useState, useCallback, FormEvent, useId } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Button } from '@cennso/ui'
import {
  StatusModal,
  FormInput,
  FormTextarea,
  FormSwitch,
  CTA_ACTION,
} from '../common'

import type { FunctionComponent } from 'react'
import type { ContactFormBody } from '../../pages/api/contact-form'

interface ContactFormProps {
  receiverEmail: string
  content?: Record<string, any>
}

// The visible label text is written here as a plain <label>, not the shared
// FormLabel from components/common/Form.tsx: FormLabel hardcodes white text,
// which disappears against a light-theme form panel.
//
// Figma 1:3949 / 1:7561 etc. draw the field labels as Regular 20px boxes
// exactly 32px tall, so the line box is `leading-8` rather than the 28px
// `leading-7` that was here. Their colour is white in the dark frames and
// #185f99 in the light ones, which is what `--foreground` already resolves to
// in each palette - no override needed.
//
// The label box then sits straight on top of its control: 1:3949 ends at 473
// and 1:3953 starts at 474, 1:3948 ends at 572 and 1:3951 starts at 573. One
// pixel, not the 4 that `mb-1` put there. The legend below matches.
const labelClassName = 'block text-xl leading-8 text-foreground mb-px'

// Every control in the frames is the same box: 489x42 at the frame's width,
// 8px radius, white fill (1:3951/1:3953/1:3954 dark, 1:7563/1:7565/1:7566
// light), and the message box is the same again at 180px tall (1:3955 /
// 1:7567). The height is pinned rather than left to the padding because the
// border below only exists in one palette, and a border-box height keeps both
// at the frame's 42px.
//
// `rounded-md` is the frames' 8px: @cennso/theme's radius scale is 2/4/8/12/16,
// not Tailwind's own, so `rounded-lg` would read like the right step and draw
// 12px.
//
// The outline is the one place the two frames disagree. Light outlines all
// four boxes with 1px #185f99 - `--primary` in that palette. Dark draws no
// outline on three of the four and a stray 1px black on the fourth (1:3953),
// so dark follows the three: transparent, matching the
// `border-transparent dark:border-border` idiom the Design 4.0 cards already
// use for the inverse case.
//
// Nothing here draws a shadow, so the jobs form's `shadow-sm` is simply not
// carried over: this is FormInput's `surface`, which replaces the default box
// rather than trying to override it.
const fieldSurface =
  'rounded-md border border-primary dark:border-transparent bg-white'

// The height rides on `className`, which is appended after the surface, so the
// two never compete.
const fieldClassName = 'h-[42px]'

// 1:3955 / 1:7567 - the message box, same treatment at the frames' 180px.
const textareaClassName = 'h-[180px]'

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
    // Figma 1:3937 / 1:7549: the form panel is a 24px-cornered card, not 32.
    //
    // Its insets are the frames' own: the fields start at x=775 inside a panel
    // that starts at 743 and are 489 wide inside 554, so 32px down each side,
    // not the 24 `p-6` gave. Vertically the frames are deliberately uneven -
    // the first label's box top is 26px below the panel top (415 -> 441) and
    // the Send pill's bottom is 36px above the panel bottom (1015 -> 1051).
    //
    // Only the dark frame outlines the panel (1:3937, 1px #0c426c); the light
    // one (1:7549) is a plain white plate on the #E1EAF0 page with no border
    // at all, so light keeps the border box and drops its colour - the same
    // `border-transparent dark:border-border` the 4.0 cards use.
    //
    // 1:3937's `backdrop-blur-[7px]` is deliberately not carried over: it
    // exists because the frame fills the panel at 82% alpha, and `bg-card` is
    // opaque here, so a blur behind it would cost a compositing layer and
    // render nothing.
    <div className="isolate bg-card border border-transparent dark:border-border px-8 pt-[26px] pb-9 rounded-3xl">
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
        {/* 24px between a control and the label under it, measured on the
            frames: 1:3953 ends at 516 and 1:3948 starts at 540, 1:3951 ends at
            615 and 1:3950 starts at 639, 1:3955 ends at 949 and the Send pill
            starts at 973. `gap-y-4` was 16. */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
          <div>
            <label className={labelClassName} htmlFor={`${uid}-first-name`}>
              First name:
            </label>
            <FormInput
              type="text"
              name="first-name"
              surface={fieldSurface}
              className={fieldClassName}
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
              surface={fieldSurface}
              className={fieldClassName}
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
              surface={fieldSurface}
              className={fieldClassName}
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
              surface={fieldSurface}
              className={fieldClassName}
              id={`${uid}-email`}
              placeholder="Enter the email to which the reply will be sent"
              autoComplete="email"
              required
            />
          </div>
          <fieldset className="sm:col-span-2">
            <legend className={labelClassName}>Phone number (optional):</legend>
            <div className="flex gap-4">
              <div className="w-24">
                <label className="sr-only" htmlFor={`${uid}-country-code`}>
                  Country code
                </label>
                <FormInput
                  type="text"
                  name="country-code"
                  surface={fieldSurface}
                  className={fieldClassName}
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
                  surface={fieldSurface}
                  className={fieldClassName}
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
              surface={fieldSurface}
              className={textareaClassName}
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
          {/* The frames put Send at x=775 - flush with the left edge of the
              fields above it (1:3938 / 1:7550), not against the panel's right
              edge, which is where `justify-end` had it. */}
          <div className="sm:col-span-2 flex">
            <Button type="submit" variant="cta" className={CTA_ACTION}>
              {content?.form?.sendLabel || 'Send'}
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
