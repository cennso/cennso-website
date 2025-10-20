import Link from 'next/link'

import { Button } from '../../common'

import metadata from '../../../siteMetadata'

import type { FunctionComponent, PropsWithChildren } from 'react'

interface ContentBlockProps extends PropsWithChildren {
  title?: string
  link?: string
}

export const CennsoButton: FunctionComponent<ContentBlockProps> = ({
  title = 'Get started with Cennso',
  link = metadata.explore.cloudPortal,
}) => {
  const isExternal = link.startsWith('http')

  return (
    <div className="flex flex-row justify-center">
      <Link
        href={link}
        target={isExternal ? '_blank' : undefined}
        className="no-underline"
      >
        <Button variant="action" className="text-[24px]">
          {title}
        </Button>
      </Link>
    </div>
  )
}
