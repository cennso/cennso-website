import { useEffect, useState } from 'react'

export function useDeviceKind() {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')

  useEffect(() => {
    function reportWindowSize() {
      let newDevice: 'desktop' | 'mobile'
      if (window.innerWidth < 960) {
        newDevice = 'mobile'
      } else {
        newDevice = 'desktop'
      }

      if (device !== newDevice) {
        setDevice(newDevice)
      }
    }

    window.addEventListener('resize', reportWindowSize)
    reportWindowSize()
    return () => window.removeEventListener('resize', reportWindowSize)
  }, [setDevice, device])

  return { device }
}
