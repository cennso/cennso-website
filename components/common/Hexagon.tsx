import type { FunctionComponent, PropsWithChildren } from 'react'

interface HexagonProps extends PropsWithChildren {
  className?: string
  gradient?: boolean
}

export const Hexagon: FunctionComponent<HexagonProps> = ({
  className = '',
  gradient = false,
  children,
}) => {
  return (
    <div
      className={`${className} ${
        gradient ? 'bg-gradient-to-t from-primary-600 to-[#04D3D6]' : ''
      } mask mask-hexagon-2 flex flex-row items-center justify-center`}
    >
      {children}
    </div>
  )
}
