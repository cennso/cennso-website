import Image from 'next/image'
import Link from 'next/link'

import { BlogPostAuthors } from './BlogPostAuthors'

import type { FunctionComponent } from 'react'
import type { BlogPostItem as BlogPostItemType } from '../../contexts'
import { FeatureCard } from '../common'

interface BlogPostItemProps {
  post: BlogPostItemType
}

export const BlogPostItem: FunctionComponent<BlogPostItemProps> = ({
  post,
}) => {
  const { link, frontmatter, excerpt, readingTime } = post
  const { title, category, authors, date } = frontmatter

  return (
    <article className="h-full">
      <FeatureCard
        className="bg-secondary-600 flex flex-col transition-all duration-300 rounded-[32px] h-full text-secondary-600 overflow-hidden p-6"
        useGlow={true}
      >
        <div className="h-52 w-full hidden md:block z-50">
          <Image
            width={600}
            height={250}
            src={frontmatter.cover}
            alt={frontmatter.title}
            className="h-52 object-cover rounded-[32px]"
            sizes="(max-width: 768px) 0px, (max-width: 1024px) 45vw, 33vw"
          />
        </div>

        <div className="flex flex-col mt-0 md:mt-6 h-full z-50">
          <header className="flex-none flex flex-col gap-1">
            <div className="mb-2">
              <span className="px-4 py-0.5 text-sm bg-gradient-to-r from-[#1983BF] to-[#AF37AA] rounded-full text-white font-semibold">
                {category}
              </span>
            </div>
            <Link href={link}>
              <h3 className="text-lg text-secondary-200 font-bold hover:underline decoration-2 leading-6">
                {title}
              </h3>
            </Link>
          </header>

          <main className="flex-1 text-sm mt-3 mb-3 md:mb-6">
            <p className="inline mr-1 text-white">{excerpt}</p>
            <Link href={link} className="text-secondary-200 hover:underline">
              <span>Read more...</span>
            </Link>
          </main>

          <footer className="flex-none flex text-sm">
            <BlogPostAuthors
              authors={authors}
              date={date}
              readingTime={readingTime}
            />
          </footer>
        </div>
      </FeatureCard>
    </article>
  )
}
