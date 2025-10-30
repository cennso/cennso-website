import Image from 'next/image'

import type { FunctionComponent } from 'react'
import type { Author } from '../../contexts'

interface HexagonAvatarProps {
  src: string
  author: Author
  className?: string
}

export const HexagonAvatar: FunctionComponent<HexagonAvatarProps> = ({
  src,
  author,
  className = '',
}) => {
  return (
    <div
      className={`mask mask-hexagon-2 bg-gradient-to-b from-[#1D75BC] to-[#04D3D6] text-white flex flex-row items-center justify-center ${className}`}
    >
      <Image
        className="mask mask-hexagon-2 w-[calc(100%-14px)] h-[calc(100%-14px)] -ml-[14px]"
        src={src}
        title={`${author.name}, ${author.position} at ${author.company}`}
        alt={`${author.name}, ${author.position} at ${author.company}`}
        width={300}
        height={300}
        sizes="300px"
      />
    </div>
  )
}
