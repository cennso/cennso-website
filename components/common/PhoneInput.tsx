import { forwardRef, useEffect, useState } from 'react'
import { PhoneInput as BasePhoneInput } from '@cennso/ui'

import type { PhoneInputProps } from '@cennso/ui'
import type { Flags } from 'react-phone-number-input'

/**
 * `@cennso/ui`'s phone field - a country selector joined to a number box that
 * formats as it is typed - with the country flags loaded lazily. Same wrapper
 * as cennso/cloud's cloud-portal (`components/common/Form/PhoneInput.tsx`).
 *
 * `@cennso/ui` deliberately imports no flags: the full set is ~250 inline
 * SVGs, 233 KB raw / 52 KB gzipped. They arrive through the `flags` prop, and
 * the dynamic `import()` below is a real split point, so they land in their
 * own chunk, fetched only once a phone field mounts. Until then the trigger
 * shows the country's ISO code in a box of the same size, so the swap costs no
 * reflow. That is also why `react-phone-number-input` is a direct dependency
 * of this site even though nothing imports a component from it: the flags and
 * the `Flags` type come from it.
 *
 * Loaded once, at module scope, rather than per component: the module promise
 * is memoised and the result cached, so a remount (or the second form on the
 * page) never drops back to ISO codes. Reading `cachedFlags` during render is
 * safe - it is always `undefined` on the server, and every render where it is
 * populated is a client-only one.
 */
let cachedFlags: Flags | undefined
let pendingFlags: Promise<Flags> | undefined

function useCountryFlags(): Flags | undefined {
  const [flags, setFlags] = useState<Flags | undefined>(cachedFlags)

  useEffect(() => {
    if (cachedFlags) {
      return
    }

    let live = true
    pendingFlags ??= import('react-phone-number-input/flags').then((module) => {
      cachedFlags = module.default
      return module.default
    })
    pendingFlags.then((loaded) => {
      if (live) {
        setFlags(loaded)
      }
    })

    return () => {
      live = false
    }
  }, [])

  return flags
}

export const PhoneInput = forwardRef<
  HTMLInputElement,
  Omit<PhoneInputProps, 'flags'>
>(function PhoneInput(props, ref) {
  const flags = useCountryFlags()

  return (
    <BasePhoneInput
      ref={ref}
      // With no country selected the library prefixes a bare `+` to whatever
      // is typed, so `030 1234` would become `+0301234`. Germany is where
      // Cennso is based; anyone else picks their country first.
      defaultCountry="DE"
      flags={flags}
      {...props}
    />
  )
})
