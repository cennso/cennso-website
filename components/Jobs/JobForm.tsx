import { useState, useCallback, FormEvent, useId } from 'react'
import Link from 'next/link'

import { Field, Input, Switch, Textarea } from '@cennso/ui'

import { StatusModal } from '../common/StatusModal'
import { PhoneInput } from '../common/PhoneInput'
import { Button, FORM_SWITCH } from '../common'

import type { FunctionComponent, ChangeEvent } from 'react'
import type { JobFormBody } from '../../pages/api/job-submission-form'

interface JobFormProps {
  position: string
  content?: Record<string, any>
}

export const JobForm: FunctionComponent<JobFormProps> = ({
  position,
  content,
}) => {
  const [action, setAction] = useState<
    'none' | 'sending' | 'success' | 'error'
  >('none')
  const [privacyPolicy, setPrivacyPolicy] = useState(false)
  // Checked by hand: a `required` Switch puts aria-required on role="switch",
  // which ARIA does not allow.
  const [consentInvalid, setConsentInvalid] = useState(false)
  // Label ids for aria-labelledby; unique per instance.
  const uid = useId()
  // PhoneInput reports an E.164 string, not an event, so it is controlled.
  const [phone, setPhone] = useState('')
  const [fileData, setFileData] = useState<File | undefined>(undefined)
  const [pdfCV, setPdfCV] = useState<Promise<string> | string>('')

  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
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

      // collect data
      const cvData = await pdfCV
      const data: JobFormBody = {
        firstName: inputs['first-name'].value,
        lastName: inputs['last-name'].value,
        email: inputs['email'].value,
        phone,
        message: inputs['message'].value,
        position,
        cvData,
        cvName: fileData?.name as string,
      }

      // send form to the api
      const response = await fetch('/api/job-submission-form', {
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
        inputs['email'].value = ''
        setPhone('')
        inputs['message'].value = ''
        setPrivacyPolicy(false)
        setFileData(undefined)
        setPdfCV('')
        return
      }

      setAction('error')
    },
    [
      privacyPolicy,
      setPrivacyPolicy,
      setPdfCV,
      pdfCV,
      setAction,
      position,
      fileData?.name,
      phone,
    ]
  )

  const onLoadCV = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) {
        return
      }

      setFileData(file)
      const reader = new FileReader()
      reader.readAsDataURL(file)
      const promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result?.toString()
          if (!result) {
            return
          }

          const [, base64Content] = result.split('base64,')
          resolve(base64Content)
        }
      })
      setPdfCV(promise)
    },
    [setPdfCV, setFileData]
  )

  return (
    <div className="isolate bg-linear-to-b/srgb from-secondary-400 to-secondary-600 p-6 rounded-[32px]">
      <StatusModal
        action={action}
        setAction={setAction}
        kind="job submission"
        content={content}
      />

      <form className="mx-auto" onSubmit={onSubmit}>
        {/* Screen reader region for form status updates */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {action === 'sending' &&
            (content?.form?.statusMessages?.sending || 'Sending...')}
          {action === 'success' &&
            (content?.form?.statusMessages?.success ||
              'Submission sent successfully.')}
          {action === 'error' &&
            (content?.form?.statusMessages?.error ||
              'An error occurred while sending your submission.')}
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          <Field>
            <Field.Label id={`${uid}-first-name-label`} className="text-white">
              First name:
            </Field.Label>
            <Input
              aria-labelledby={`${uid}-first-name-label`}
              type="text"
              name="first-name"
              placeholder="Enter your first name"
              autoComplete="given-name"
              required
            />
          </Field>
          <Field>
            <Field.Label id={`${uid}-last-name-label`} className="text-white">
              Last name:
            </Field.Label>
            <Input
              aria-labelledby={`${uid}-last-name-label`}
              type="text"
              name="last-name"
              placeholder="Enter your last name"
              autoComplete="family-name"
              required
            />
          </Field>
          <Field className="sm:col-span-2">
            <Field.Label id={`${uid}-email-label`} className="text-white">
              E-mail:
            </Field.Label>
            <Input
              aria-labelledby={`${uid}-email-label`}
              type="email"
              name="email"
              placeholder="Enter the email to which the reply will be sent"
              autoComplete="email"
              required
            />
          </Field>
          {/* A plain <label>, not a Field: PhoneInput is two controls and a
              Field would hand both the same id. */}
          <div className="sm:col-span-2 flex flex-col gap-2">
            <label
              htmlFor={`${uid}-phone`}
              className="w-fit text-sm font-medium leading-snug text-white"
            >
              Phone number (optional):
            </label>
            <PhoneInput
              id={`${uid}-phone`}
              name="phone"
              value={phone}
              onChange={setPhone}
              placeholder="Enter the phone number to which we will call you back"
              autoComplete="tel"
              countrySearchPlaceholder={
                content?.form?.phone?.countrySearchPlaceholder ||
                'Search country'
              }
              countryEmptyContent={
                content?.form?.phone?.countryEmptyContent || 'No country found.'
              }
            />
          </div>
          <Field className="sm:col-span-2">
            <Field.Label id={`${uid}-message-label`} className="text-white">
              Message
            </Field.Label>
            <Textarea
              aria-labelledby={`${uid}-message-label`}
              name="message"
              rows={4}
              placeholder="Briefly about yourself..."
              required
            />
          </Field>
          <div className="sm:col-span-2 flex items-center justify-center w-full">
            <label
              htmlFor="pdf-cv"
              className="flex flex-col items-center justify-center w-full border-2 border-gray-300 border-dashed rounded-[32px] cursor-pointer bg-[#ECF3F8] hover:bg-primary-100"
            >
              <div
                className={`flex flex-col items-center justify-center ${
                  fileData ? 'py-2' : 'py-5'
                }`}
              >
                {fileData ? (
                  <span>{fileData.name}</span>
                ) : (
                  <>
                    <svg
                      aria-hidden="true"
                      role="presentation"
                      className="w-10 h-10 mb-3 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      ></path>
                    </svg>
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload CV</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PDF (MAX. 1MB)
                    </p>
                  </>
                )}
              </div>
              <input
                name="pdf-cv"
                id="pdf-cv"
                type="file"
                className="sr-only"
                required
                accept=".pdf"
                onChange={onLoadCV}
              />
            </label>
          </div>
          <Field
            orientation="horizontal"
            className="sm:col-span-2 flex-wrap"
            invalid={consentInvalid}
          >
            <Switch
              className={FORM_SWITCH}
              name="privacy-policy"
              checked={privacyPolicy}
              onCheckedChange={(next) => {
                setPrivacyPolicy(next)
                setConsentInvalid(false)
              }}
            />
            <Field.Label className="text-sm leading-6 font-normal text-gray-600">
              <span>
                By selecting this, you agree to our{' '}
                <Link
                  href="/privacy-policy"
                  target="_blank"
                  className="font-semibold text-secondary-200 underline hover:decoration-2"
                >
                  privacy policy
                </Link>
                .
              </span>
            </Field.Label>
            <Field.Error match={consentInvalid} className="w-full">
              {content?.form?.validation?.privacyPolicy ||
                'Please accept the privacy policy to send the form.'}
            </Field.Error>
          </Field>
          <div className="sm:col-span-2 flex justify-end">
            <Button variant="action" useArrow={false} className="text-sm">
              Send submission
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
