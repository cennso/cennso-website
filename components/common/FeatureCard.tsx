import {
  useEffect,
  useRef,
  type FunctionComponent,
  type PropsWithChildren,
} from 'react'

interface FeatureCardProps extends PropsWithChildren {
  className?: string
  useGlow?: boolean
  useHexagon?: boolean
  useShinyEffect?: boolean
}

export const FeatureCard: FunctionComponent<FeatureCardProps> = ({
  className = '',
  useGlow = false,
  useHexagon = false,
  useShinyEffect = false,
  children,
}) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current

    function onMouseMove(e: MouseEvent) {
      if (element) {
        const { x, y } = element.getBoundingClientRect()
        element.style.setProperty('--x', `${e.clientX - x}`)
        element.style.setProperty('--y', `${e.clientY - y}`)
      }
    }

    if (element) {
      element.addEventListener('mousemove', onMouseMove)
    }

    return () => {
      if (element) {
        element.removeEventListener('mousemove', onMouseMove)
      }
    }
  }, [])

  const glowClassName = useGlow ? 'feature-card-top-gradient' : ''
  const hexagonClassName = useHexagon ? 'feature-card-corner-hex' : ''
  const shinyEffectClassName = useShinyEffect ? 'feature-card-shiny' : ''

  return (
    <div
      ref={ref}
      className={`${glowClassName} ${hexagonClassName} ${shinyEffectClassName} relative overflow-hidden filter drop-shadow-[0px_2px_5px_rgba(68,141,200,0.35)] ${className}`}
    >
      {children}
    </div>
  )
}
