import Image from 'next/image'

import type { FunctionComponent } from 'react'
import type { Author } from '../../contexts'

interface CircleAvatarProps {
  src: string
  author: Author
  className?: string
}

export const CircleAvatar: FunctionComponent<CircleAvatarProps> = ({
  src,
  author,
  className = '',
}) => {
  return (
    <div
      className={`rounded-full bg-gradient-to-b from-[#1D75BC] to-[#04D3D6] text-white flex flex-row items-center justify-center ${className}`}
    >
      <Image
        className="w-[calc(100%-14px)] h-[calc(100%-14px)] rounded-full -ml-[14px]"
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
