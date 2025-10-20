import type { FunctionComponent, PropsWithChildren } from 'react'

interface HexagonDoubleProps extends PropsWithChildren {
  className?: string
  subClassName?: string
  gradient?: boolean
}

export const HexagonDouble: FunctionComponent<HexagonDoubleProps> = ({
  className = '',
  subClassName = 'bg-primary-100',
  gradient = false,
  children,
}) => {
  return (
    <div className="relative">
      <div
        className={`w-full h-full absolute top-[8%] left-[13%] ${
          gradient ? 'bg-gradient-to-t from-primary-600 to-[#04D3D6]' : ''
        } mask mask-hexagon-2 flex flex-row items-center justify-center p-0.5 z-10`}
      >
        <div className={`mask mask-hexagon-2 w-full h-full ${subClassName}`} />
      </div>
      <div
        className={`relative ${className} ${
          gradient ? 'bg-gradient-to-t from-primary-600 to-[#04D3D6]' : ''
        } mask mask-hexagon-2 flex flex-row items-center justify-center z-20`}
      >
        {children}
      </div>
    </div>
  )
}
