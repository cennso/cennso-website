import Link from 'next/link'

import type { FunctionComponent } from 'react'
import type { TocHeader } from '../../lib/markdown'

interface TableOfContentsItemProps {
  item: TocHeader
  activeId: string | undefined
}

export const TableOfContentsItem: FunctionComponent<
  TableOfContentsItemProps
> = ({ item, activeId }) => {
  const { id, title, children } = item
  const strictActive = id === activeId

  return (
    <li className={`text-white rounded-[32px]`}>
      <Link
        href={`#${id}`}
        className={`block py-1 my-0.5 hover:bg-secondary-600 rounded-full ${
          strictActive ? 'bg-secondary-600' : ''
        }`}
      >
        <span className={`block px-2 truncate`}>{title}</span>
      </Link>
      {children.length ? (
        <ul className="ml-4 my-0.5">
          {children.map((child) => (
            <TableOfContentsItem
              key={child.id}
              item={child}
              activeId={activeId}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}
