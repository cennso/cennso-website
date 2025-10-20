import Link from 'next/link'
import { BriefcaseIcon, MapPinIcon } from '@heroicons/react/24/solid'

import { Button, FeatureCard } from '../common'

import type { FunctionComponent } from 'react'
import type { JobItem as JobItemType } from '../../contexts'

interface JobItemProps {
  job: JobItemType
}

export const JobItem: FunctionComponent<JobItemProps> = ({ job }) => {
  const { link, frontmatter } = job
  const { position, kind, mode } = frontmatter

  return (
    <FeatureCard
      className="flex flex-col items-center justify-between rounded-[32px] px-12 py-6 bg-secondary-600 h-full"
      useGlow={true}
    >
      <header className="flex-none flex flex-row justify-center text-center">
        <h4 className="font-bold text-2xl text-secondary-200">{position}</h4>
      </header>

      <ul className="flex-1 flex flex-col gap-1 my-4 text-white">
        <li className="flex flex-row gap-3">
          <BriefcaseIcon className="w-5 h-5" />
          <span>{kind}</span>
        </li>
        <li className="flex flex-row gap-3">
          <MapPinIcon className="w-5 h-5" />
          <span>{mode}</span>
        </li>
      </ul>

      <div className="flex-none mx-auto lg:mx-0">
        <Link href={link}>
          <Button variant="tertiary" useArrow={true} className="text-sm">
            More info
          </Button>
        </Link>
      </div>
    </FeatureCard>
  )
}
