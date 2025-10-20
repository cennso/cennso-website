import Link from 'next/link'
import Image from 'next/image'

import { Button, FeatureCard } from '../common'
import { useDeviceKind } from '../../lib/useDeviceKind'

import type { FunctionComponent } from 'react'
import type { SuccessStoryItem as SuccessStoryItemType } from '../../contexts'

interface SuccessStoryItemProps {
  successStory: SuccessStoryItemType
  index: number
}

export const SuccessStoryItem: FunctionComponent<SuccessStoryItemProps> = ({
  successStory,
  index,
}) => {
  const { device } = useDeviceKind()
  const { link, frontmatter } = successStory
  const { title, company, excerpt } = frontmatter

  const even =
    device === 'mobile'
      ? index % 2 === 0
      : index === 1 ||
        index === 2 ||
        (index > 4 && (index % 4 === 1 || index % 4 === 2))

  const content = (
    <>
      <div className="flex flex-row items-center justify-center">
        <div className="bg-transparent flex flex-row items-center justify-center p-2 filter drop-shadow-[0px_15px_20px_rgba(68,141,200,0.35)]">
          <div className="bg-white mask mask-hexagon-2 p-2 min-w-[200px] min-h-[200px] max-w-[200px] max-h-[200px] flex flex-row justify-center items-center">
            <Image
              title={`${title} logo`}
              alt={`${title} logo`}
              src={company.logo}
              width={150}
              height={150}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col h-full">
        <header className="flex flex-row justify-center mt-8 text-center">
          <h4 className="font-bold text-2xl text-secondary-200">{title}</h4>
        </header>

        <div className="flex-1 flex flex-col items-center">
          <p className="my-4 mb-6 text-center text-white px-8 lg:px-16 text-sm">
            {excerpt}
          </p>

          <Link href={link}>
            <Button variant={even ? 'tertiary' : 'secondary'} useArrow={true}>
              More info
            </Button>
          </Link>
        </div>
      </div>
    </>
  )

  return (
    <FeatureCard
      className={`flex flex-col transition-all duration-300 rounded-[32px] h-full text-secondary-600 overflow-hidden px-6 py-12 ${even ? 'bg-secondary-600' : ''} `}
      useGlow={even}
      useHexagon={even}
    >
      {content}
    </FeatureCard>
  )
}
