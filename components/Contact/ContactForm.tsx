import { useState, useCallback, FormEvent, useId } from 'react'
import Link from 'next/link'

import { Button, Field, Input, Switch, Textarea } from '@cennso/ui'
import { Form } from '@base-ui/react/form'
import { isValidPhoneNumber, parsePhoneNumber } from 'react-phone-number-input'

import {
  StatusModal,
  CTA_ACTION,
  ButtonChevron,
  FORM_SWITCH,
} from '../common'
import { PhoneInput } from '../common/PhoneInput'

import type { FunctionComponent } from 'react'
import type { ContactFormBody } from '../../pages/api/contact-form'

interface ContactFormProps {
  receiverEmail: string
  content?: Record<string, any>
}

// Every control is `@cennso/ui`'s own (Field, Input, Textarea, PhoneInput,
// Switch), drawn with the design system's defaults. Labels are Regular 18px in
// `--foreground` (white in dark, #185f99 in light).
// 16px on mobile (2px under the frames' 18px, owner's call), 18px from sm up.
const labelClassName =
  'text-base sm:text-lg leading-7 font-normal text-foreground'

// Upper bounds on what a field accepts. Generous for a real answer, and they
// stop a pasted wall of text from reaching the e-mail it becomes.
const MAX = { name: 100, company: 150, email: 254, message: 5000 } as const
const MESSAGE_MIN = 10

// One @, something on both sides, and a dot in the domain - so "name@company"
// fails as well as "df". Deliberately loose past that: the reply is what
// proves an address, not a regex.
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

// 4px between a label and its control rather than Field's own 8px.
const fieldClassName = 'gap-1'

// The controls' own box, set once on the <form> by their data-slot rather than
// on each control: PhoneInput's outlined box is react-phone-number-input's
// container, which a className on PhoneInput does not reliably reach. Light
// outlines every box in --primary; dark keeps the design system's border and
// fills the box with the page plate. A box in its invalid state is left out,
// so the design system's red outline still shows.
// Written out in full, not assembled from a shared selector string: Tailwind
// only generates classes it finds as literals in the source.
const controlsClassName = [
  '[&_:is(:is([data-slot=input],[data-slot=textarea]):not([data-invalid]),[data-slot=phone-input]:not(:has([data-invalid])))]:border-primary',
  'dark:[&_:is(:is([data-slot=input],[data-slot=textarea]):not([data-invalid]),[data-slot=phone-input]:not(:has([data-invalid])))]:border-input',
  // Fill: light is the "Contact page light" frame's #F7FAFC (Figma 1:7563-
  // 1:7567, with the #185F99 border above); dark is #E5F4FF (owner's call).
  // Text is #001A2A in both. The phone field's inner number input and country
  // button inherit the text colour and sit transparent on the fill.
  // Placeholders use the same navy at 60% so they stay legible on either fill.
  '[&_:is([data-slot=input],[data-slot=textarea],[data-slot=phone-input])]:bg-[#f7fafc]',
  'dark:[&_:is([data-slot=input],[data-slot=textarea],[data-slot=phone-input])]:bg-[#e5f4ff]',
  '[&_:is([data-slot=input],[data-slot=textarea],[data-slot=phone-input],[data-slot=phone-input]_*)]:text-[#001a2a]',
  '[&_[data-slot=phone-input]_:is(input,button)]:bg-transparent',
  '[&_:is([data-slot=input],[data-slot=textarea],[data-slot=phone-input]_input)]:placeholder:text-[#001a2a]/60',
  // Text inputs match the phone field's height. PhoneInput's group is its
  // number box (control-height-lg) plus the group's own 1px border top and
  // bottom, where a plain Input is control-height-md, border included - 38px
  // against 32px side by side.
  '[&_[data-slot=input]]:h-[calc(var(--control-height-lg)+2px)]',
].join(' ')

export const ContactForm: FunctionComponent<ContactFormProps> = ({
  receiverEmail,
  content,
}) => {
  const [action, setAction] = useState<
    'none' | 'sending' | 'success' | 'error'
  >('none')
  const [privacyPolicy, setPrivacyPolicy] = useState(false)
  // PhoneInput reports an E.164 string ("+4939166098560"), not an event, so it
  // is controlled rather than read off form.elements like the rest.
  const [phone, setPhone] = useState('')
  // Checked by hand on submit. PhoneInput is two controls (the country picker
  // and the number), so it cannot sit in a Field: Field hands its one control
  // id to both, which duplicates the id, and Base UI's Form skips its
  // validator. It gets a plain <label> and its own error line instead.
  const [phoneInvalid, setPhoneInvalid] = useState(false)
  // The consent switch is also checked by hand: a `required` Switch puts
  // aria-required on role="switch", which ARIA does not allow (axe fails it).
  const [consentInvalid, setConsentInvalid] = useState(false)
  const [formTimestamp] = useState(Date.now()) // Track when form was loaded

  // This form is rendered once per contact section, so element ids must be
  // unique per instance. Names are untouched: the submit handler reads
  // form.elements by name.
  const uid = useId()

  const v = content?.form?.validation ?? {}
  const msg = {
    required: v.required || 'This field is required.',
    tooLong: (max: number) =>
      (v.tooLong || 'Please use at most {max} characters.').replace(
        '{max}',
        String(max)
      ),
    email:
      v.email || 'Please enter a valid e-mail address, e.g. name@company.com.',
    phone:
      v.phone || 'Please enter a valid phone number for the selected country.',
    messageTooShort: (
      v.messageTooShort || 'Please write at least {min} characters.'
    ).replace('{min}', String(MESSAGE_MIN)),
    privacyPolicy:
      v.privacyPolicy || 'Please accept the privacy policy to send the form.',
  }

  // `required` alone lets a value of only spaces through; this closes that.
  // An empty field is left to `required` itself, so the message is not shown
  // twice.
  const notBlank = (value: unknown) => {
    const text = String(value ?? '')
    return text && !text.trim() ? msg.required : null
  }

  // Required text fields share one set of messages: empty, spaces only, or
  // over the length cap.
  const textErrors = (max: number) => (
    <>
      <Field.Error match="valueMissing">{msg.required}</Field.Error>
      <Field.Error match="tooLong">{msg.tooLong(max)}</Field.Error>
      <Field.Error match="customError" />
    </>
  )

  // Only ever called with every field valid: Base UI's Form validates each
  // Field on submit, focuses the first invalid one and stops the submission
  // before this runs, so nothing incomplete reaches the API.
  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      // Optional, but when something is typed it has to be a number that can
      // exist in the selected country.
      if (phone && !isValidPhoneNumber(phone)) {
        setPhoneInvalid(true)
        e.currentTarget
          .querySelector<HTMLInputElement>('[data-slot="phone-input-number"]')
          ?.focus()
        return
      }

      if (!privacyPolicy) {
        setConsentInvalid(true)
        e.currentTarget.querySelector<HTMLElement>('[role="switch"]')?.focus()
        return
      }

      setAction('sending')
      const inputs = (e.target as any).elements as Record<
        string,
        HTMLInputElement
      >

      // The API (and the e-mail it sends) keeps the dialling code and the
      // number apart, as the old two-box field did.
      const parsedPhone = phone ? parsePhoneNumber(phone) : undefined

      // collect data
      const data: ContactFormBody = {
        firstName: inputs['first-name'].value,
        lastName: inputs['last-name'].value,
        company: inputs['company'].value,
        email: inputs['email'].value,
        phoneCountryCode: parsedPhone
          ? `+${parsedPhone.countryCallingCode}`
          : '',
        phoneNumber: parsedPhone?.nationalNumber ?? '',
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
        setPhone('')
        inputs['message'].value = ''
        setPrivacyPolicy(false)
        return
      }

      setAction('error')
    },
    [
      setPrivacyPolicy,
      setAction,
      receiverEmail,
      formTimestamp,
      phone,
      privacyPolicy,
    ]
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
    // Light fills it white rather than `bg-card`: the theme's light --card is
    // an off-white that barely separates from the #E1EAF0 page plate, and the
    // light frame draws this panel pure white.
    //
    // 1:3937's `backdrop-blur-[7px]` is deliberately not carried over: it
    // exists because the frame fills the panel at 82% alpha, and `bg-card` is
    // opaque here, so a blur behind it would cost a compositing layer and
    // render nothing.
    <div className="isolate bg-white dark:bg-card border border-transparent dark:border-border px-8 pt-[26px] pb-9 rounded-3xl">
      <StatusModal
        action={action}
        setAction={setAction}
        kind="email"
        content={content}
      />

      {/* autoComplete="on" plus the per-field autocomplete tokens below let
          the browser offer what the visitor has entered before - name,
          company, e-mail, phone. */}
      <Form
        className={`mx-auto ${controlsClassName}`}
        onSubmit={onSubmit}
        // Runs before Form validates the other fields, so a bad phone number
        // and a missing consent are flagged in the same pass as everything
        // else, not on the retry.
        onSubmitCapture={() => {
          setPhoneInvalid(Boolean(phone) && !isValidPhoneNumber(phone))
          setConsentInvalid(!privacyPolicy)
        }}
        autoComplete="on"
      >
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
          <Field className={fieldClassName} validate={notBlank}>
            <Field.Label
              id={`${uid}-first-name-label`}
              className={labelClassName}
            >
              First name:
            </Field.Label>
            <Input
              aria-labelledby={`${uid}-first-name-label`}
              type="text"
              name="first-name"
              placeholder="Enter your first name"
              autoComplete="given-name"
              autoCapitalize="words"
              maxLength={MAX.name}
              required
            />
            {textErrors(MAX.name)}
          </Field>
          <Field className={fieldClassName} validate={notBlank}>
            <Field.Label
              id={`${uid}-last-name-label`}
              className={labelClassName}
            >
              Last name:
            </Field.Label>
            <Input
              aria-labelledby={`${uid}-last-name-label`}
              type="text"
              name="last-name"
              placeholder="Enter your last name"
              autoComplete="family-name"
              autoCapitalize="words"
              maxLength={MAX.name}
              required
            />
            {textErrors(MAX.name)}
          </Field>
          <Field
            className={`sm:col-span-2 ${fieldClassName}`}
            validate={notBlank}
          >
            <Field.Label id={`${uid}-company-label`} className={labelClassName}>
              Company:
            </Field.Label>
            <Input
              aria-labelledby={`${uid}-company-label`}
              type="text"
              name="company"
              placeholder="Enter your company name"
              autoComplete="organization"
              maxLength={MAX.company}
              required
            />
            {textErrors(MAX.company)}
          </Field>
          <Field
            className={`sm:col-span-2 ${fieldClassName}`}
            validate={(value) => {
              const text = String(value ?? '').trim()
              // Empty is left to `required`, so only one message shows.
              return text && !EMAIL.test(text) ? msg.email : null
            }}
          >
            <Field.Label id={`${uid}-email-label`} className={labelClassName}>
              E-mail:
            </Field.Label>
            {/* type="text", not "email": the browser's own address check and
                this one would both fail an address like "df" and show the same
                message twice. `autoComplete` and `inputMode` still give the
                saved-address suggestions and the e-mail keyboard. */}
            <Input
              aria-labelledby={`${uid}-email-label`}
              type="text"
              name="email"
              placeholder="Enter the email to which the reply will be sent"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={MAX.email}
              required
            />
            <Field.Error match="valueMissing">{msg.required}</Field.Error>
            <Field.Error match="customError" />
            <Field.Error match="tooLong">{msg.tooLong(MAX.email)}</Field.Error>
          </Field>
          <div className={`sm:col-span-2 flex flex-col ${fieldClassName}`}>
            <label
              htmlFor={`${uid}-phone`}
              className={`w-fit leading-snug ${labelClassName}`}
            >
              Phone number (optional):
            </label>
            <PhoneInput
              id={`${uid}-phone`}
              name="phone"
              value={phone}
              onChange={(next) => {
                setPhone(next)
                setPhoneInvalid(false)
              }}
              aria-invalid={phoneInvalid || undefined}
              aria-describedby={phoneInvalid ? `${uid}-phone-error` : undefined}
              placeholder="Enter phone number"
              autoComplete="tel"
              countrySearchPlaceholder={
                content?.form?.phone?.countrySearchPlaceholder ||
                'Search country'
              }
              countryEmptyContent={
                content?.form?.phone?.countryEmptyContent || 'No country found.'
              }
            />
            {/* Field.Error's own look: text-sm, --destructive-strong. */}
            {phoneInvalid ? (
              <p
                id={`${uid}-phone-error`}
                className="text-sm font-normal text-destructive-strong"
              >
                {msg.phone}
              </p>
            ) : null}
          </div>
          <Field
            className={`sm:col-span-2 ${fieldClassName}`}
            validate={(value) => {
              const text = String(value ?? '')
              if (!text) return null // left to `required`
              if (!text.trim()) return msg.required
              return text.trim().length < MESSAGE_MIN
                ? msg.messageTooShort
                : null
            }}
          >
            <Field.Label id={`${uid}-message-label`} className={labelClassName}>
              Message:
            </Field.Label>
            <Textarea
              aria-labelledby={`${uid}-message-label`}
              name="message"
              rows={6}
              placeholder="Enter message content..."
              maxLength={MAX.message}
              required
            />
            {textErrors(MAX.message)}
          </Field>
          {/* Honeypot field - completely hidden from all users and bots */}
          <div className="absolute -left-full -top-full opacity-0 pointer-events-none overflow-hidden h-0 w-0">
            <input
              aria-label="Website"
              type="text"
              name="website"
              id={`${uid}-website`}
              autoComplete="off"
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>
          <Field className="sm:col-span-2 gap-1" invalid={consentInvalid}>
            <div className="flex items-center gap-2">
              <Switch
                className={FORM_SWITCH}
                name="privacy-policy"
                checked={privacyPolicy}
                onCheckedChange={(next) => {
                  setPrivacyPolicy(next)
                  setConsentInvalid(false)
                }}
              />
              <Field.Label className="text-sm leading-6 font-normal text-foreground">
                <span>
                  By selecting this, you agree to our{' '}
                  <Link
                    href="/privacy-policy"
                    target="_blank"
                    className="font-semibold text-primary underline hover:decoration-2"
                  >
                    privacy policy
                  </Link>
                  .
                </span>
              </Field.Label>
            </div>
            <Field.Error match={consentInvalid}>
              {msg.privacyPolicy}
            </Field.Error>
          </Field>
          {/* The frames put Send at x=775 - flush with the left edge of the
              fields above it (1:3938 / 1:7550), not against the panel's right
              edge, which is where `justify-end` had it. */}
          <div className="sm:col-span-2 flex">
            {/* Hover matches the hero's "Book demo" pill (CTA_HERO): amber
                #FFB31B fill, dark navy #081927 label and chevron. */}
            <Button
              type="submit"
              variant="cta"
              className={`${CTA_ACTION} transition-colors hover:bg-[#ffb31b] hover:text-[#081927]`}
            >
              {content?.form?.sendLabel || 'Send'}
              <ButtonChevron />
            </Button>
          </div>
        </div>
      </Form>
    </div>
  )
}
