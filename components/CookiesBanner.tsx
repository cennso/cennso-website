import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

import { Button } from './common'
import { getCookie, setCookie } from '../lib/cookie'

import type { FunctionComponent } from 'react'

export const CookiesBanner: FunctionComponent = () => {
  const [isCookie, setIsCookie] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const cookie = getCookie('accepts-cookies')
    if (cookie) {
      setIsCookie(true)
      return
    }

    setIsCookie(false)
  }, [setIsCookie])

  const acceptCookie = useCallback(() => {
    setCookie('accepts-cookies', 'true', 365)
    setIsCookie(true)
  }, [setIsCookie])

  if (isCookie === true) {
    return null
  }

  return (
    <aside
      role="complementary"
      aria-label="Cookie consent banner"
      className="fixed z-50 flex flex-col lg:flex-row justify-center gap-2 md:gap-4 bg-secondary-600 text-white py-3 bottom-4 right-4 left-4 sm:left-auto rounded-[32px] px-6 py-4 filter drop-shadow-[0px_15px_20px_rgba(68,141,200,0.35)]"
    >
      <div className="flex flex-row gap-4 items-center justify-between">
        <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlSpace="preserve"
            viewBox="0 0 120.23 122.88"
            className="w-16 h-16 fill-white"
          >
            <path
              d="M98.18 0c3.3 0 5.98 2.68 5.98 5.98 0 3.3-2.68 5.98-5.98 5.98-3.3 0-5.98-2.68-5.98-5.98.01-3.3 2.68-5.98 5.98-5.98zm1.6 52.08c5.16 7.7 11.69 10.06 20.17 4.85.28 2.9.35 5.86.2 8.86-1.67 33.16-29.9 58.69-63.06 57.02C23.94 121.13-1.59 92.9.08 59.75 1.74 26.59 30.95.78 64.1 2.45c-2.94 9.2-.45 17.37 7.03 20.15-6.78 21.78 8.36 36.03 28.65 29.48zm-69.75-4.29c4.97 0 8.99 4.03 8.99 8.99s-4.03 8.99-8.99 8.99c-4.97 0-8.99-4.03-8.99-8.99s4.03-8.99 8.99-8.99zm28.32 11.46a5.181 5.181 0 0 1 0 10.36c-2.86 0-5.18-2.32-5.18-5.18-.01-2.86 2.31-5.18 5.18-5.18zM35.87 80.59a6.32 6.32 0 1 1-6.32 6.32c0-3.5 2.83-6.32 6.32-6.32zm13.62-48.36c2.74 0 4.95 2.22 4.95 4.95 0 2.74-2.22 4.95-4.95 4.95-2.74 0-4.95-2.22-4.95-4.95s2.22-4.95 4.95-4.95zm26.9 50.57c4.59 0 8.3 3.72 8.3 8.3 0 4.59-3.72 8.3-8.3 8.3-4.59 0-8.3-3.72-8.3-8.3s3.72-8.3 8.3-8.3zm17.48-59.7c3.08 0 5.58 2.5 5.58 5.58s-2.5 5.58-5.58 5.58-5.58-2.5-5.58-5.58 2.5-5.58 5.58-5.58z"
              style={{
                fillRule: 'evenodd',
                clipRule: 'evenodd',
              }}
            />
          </svg>
        </div>
        <div className="flex flex-col gap-4">
          <p className="flex flex-col items-end text-sm text-right">
            <span className="md:py-1">
              We use cookies for the best online experience.
            </span>
            <Link
              title="Privacy policy"
              href="/privacy-policy"
              className="font-semibold text-secondary-200 underline hover:decoration-2"
              target="_blank"
            >
              Read our Privacy Policy
            </Link>
          </p>
          <div className="flex flex-row justify-end">
            <Button
              variant="tertiary"
              type="button"
              onClick={acceptCookie}
              className="text-sm"
            >
              Accept
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}
