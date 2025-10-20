import { Fragment } from 'react'
import { HomeModernIcon } from '@heroicons/react/24/outline'

import type { FunctionComponent } from 'react'
import Link from 'next/link'

export interface Breadcrumb {
  title: string
  link: string
}

interface BreadcrumbsProps {
  breadcrumbs: Array<Breadcrumb>
}

export const Breadcrumbs: FunctionComponent<BreadcrumbsProps> = ({
  breadcrumbs = [],
}) => {
  if (!breadcrumbs.length) {
    return null
  }

  // remove last element from array
  breadcrumbs = [...breadcrumbs]
  breadcrumbs.pop()

  const length = breadcrumbs.length - 1
  const className =
    'text-gray-700 font-base text-xs lg:text-sm hover:text-primary-700 transition-colors duration-300'
  return (
    <div className="inline-block">
      <nav
        aria-label="breadcrumb"
        className="inline-block rounded-full px-4 py-1.5 bg-primary-100 text-gray-700"
      >
        <ul className="flex flex-row items-center gap-2">
          <li>
            <Link href="/" aria-label="Home">
              <HomeModernIcon className={`w-3.5 h-3.5 ${className}`} />
            </Link>
          </li>
          <li className={className}>/</li>
          {breadcrumbs.map((item, index) => {
            return (
              <Fragment key={index}>
                <Link href={item.link}>
                  <li className={className} aria-current="page">
                    {item.title}
                  </li>
                </Link>
                {index !== length ? <li className={className}>/</li> : null}
              </Fragment>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
