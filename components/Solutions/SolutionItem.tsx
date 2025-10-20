import Link from 'next/link'
import Image from 'next/image'

import { Button, FeatureCard, HexagonDouble } from '../common'
import { useDeviceKind } from '../../lib/useDeviceKind'

import type { FunctionComponent } from 'react'
import type { SolutionItem as SolutionItemType } from '../../contexts'

interface SolutionItemProps {
  solution: SolutionItemType
  index: number
}

export const SolutionItem: FunctionComponent<SolutionItemProps> = ({
  solution,
  index,
}) => {
  const { device } = useDeviceKind()
  const { link, frontmatter } = solution
  const { title, description, logo } = frontmatter

  const even =
    device === 'mobile'
      ? index % 2 === 0
      : index === 1 ||
        index === 2 ||
        (index > 4 && (index % 4 === 1 || index % 4 === 2))

  const content = (
    <>
      <div className="flex flex-row items-center justify-center">
        <HexagonDouble
          gradient={true}
          className="flex-none p-12"
          subClassName={
            index === 1 || index === 2
              ? 'bg-secondary-600'
              : 'bg-secondary-600 lg:bg-secondary-400'
          }
        >
          <Image
            title={`${title} logo`}
            alt={`${title} logo`}
            src={logo}
            width={110}
            height={110}
          />
        </HexagonDouble>
      </div>

      <div className="flex flex-col items-center">
        <header className="flex flex-row justify-center mt-8 text-center">
          <h4 className="font-bold text-2xl text-secondary-200">{title}</h4>
        </header>

        <p className="my-4 mb-6 text-center text-white px-8 lg:px-16 text-sm">
          {description}
        </p>

        <div className="flex-none mt-8 mx-auto lg:mx-0">
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
