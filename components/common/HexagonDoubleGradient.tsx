import type { FunctionComponent, PropsWithChildren } from 'react'

interface HexagonDoubleProps extends PropsWithChildren {
  className?: string
  subClassName?: string
  gradient?: boolean
}

export const HexagonDoubleGradient: FunctionComponent<HexagonDoubleProps> = ({
  className = '',
  subClassName = 'bg-primary-100',
  gradient = false,
  children,
}) => {
  return (
    <div className="relative">
      <div
        className={`w-full h-full absolute top-[0px] left-[5%] ${
          gradient ? 'bg-gradient-to-t from-[#1b7dbe] to-[#1b7dbe]' : ''
        } mask mask-hexagon-2 flex flex-row items-center justify-center p-0.5 z-10`}
      >
        <div
          className={`mask mask-hexagon-2 w-full h-full bg-[#1b7dbe] ${subClassName}`}
        />
      </div>
      <div
        className={`relative ${className} shadow-lg shadow-white ${
          gradient ? 'bg-gradient-to-t from-primary-600 to-[#1b7dbe]' : ''
        } mask mask-hexagon-2 flex flex-row items-center justify-center z-20`}
      >
        {children}
      </div>
    </div>
  )
}
