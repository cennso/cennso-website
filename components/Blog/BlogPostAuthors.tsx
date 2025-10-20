import Image from 'next/image'

import type { FunctionComponent } from 'react'
import type { Author } from '../../contexts'

interface BlogPostAuthorsProps {
  authors: Author[]
  date: string
  readingTime: number
}

export const BlogPostAuthors: FunctionComponent<BlogPostAuthorsProps> = ({
  authors,
  date,
  readingTime,
}) => {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="flex flex-row items-center mt-2 gap-4">
      <div>
        <ul className="flex flex-row gap-1">
          {authors.map((author, index) => (
            <li
              key={author.name}
              className="bg-white shadow-lg mask mask-hexagon-2 p-0.5 hover:!z-20"
              style={{ zIndex: 10 - index, marginLeft: `${-1.5 * index}rem` }}
            >
              <span className="sr-only">{author.name}</span>
              <Image
                width={50}
                height={50}
                className="mask mask-hexagon-2 w-12 h-12"
                src={author.avatar}
                title={`${author.name}, ${author.position}`}
                alt={`${author.name}, ${author.position}`}
              />
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col">
        <ul className="inline-block flex flex-row flex-wrap text-white">
          {authors.map((author, index) => (
            <li key={author.name}>
              <a
                href={
                  author.email ? `mailto:${author.email}` : author.socialLink
                }
                title={`${author.name}, ${author.position}`}
                target={author.email ? undefined : `_blank`}
                rel="noopener"
                className="text-xs md:text-sm underline hover:decoration-2"
                onClick={(e) => e.stopPropagation()}
              >
                <span>{author.name}</span>
              </a>
              {index !== authors.length - 1 ? (
                <span className="mx-1 text-xs md:text-sm">&</span>
              ) : null}
            </li>
          ))}
        </ul>
        <div className="text-xs lg:text-sm text-white">
          <time dateTime={formattedDate}>{formattedDate}</time>
          <span className="mx-1">·</span>
          <span>{readingTime} min read</span>
        </div>
      </div>
    </div>
  )
}
