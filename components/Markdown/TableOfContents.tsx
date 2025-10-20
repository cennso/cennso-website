import { useState, useEffect, useRef } from 'react'
import { Typography } from '@material-tailwind/react/components/Typography'
import { Bars3BottomLeftIcon } from '@heroicons/react/24/outline'

import { TableOfContentsItem } from './TableOfContentsItem'

import type { Dispatch, SetStateAction, FunctionComponent } from 'react'
import type { MDXRemoteProps } from 'next-mdx-remote'
import type { TocHeader } from '../../lib/markdown'

function useIntersectionObserver(
  setActiveId: Dispatch<SetStateAction<string | undefined>>,
  mdxSource: unknown
) {
  const headingElementsRef = useRef<Record<string, IntersectionObserverEntry>>(
    {}
  )

  useEffect(() => {
    headingElementsRef.current = {}
    const docsContent = document.getElementById('article-content')
    if (!docsContent) {
      return
    }

    function observerCallback(headings: Array<IntersectionObserverEntry>) {
      headingElementsRef.current = headings.reduce((acc, headingElement) => {
        acc[headingElement.target.id] = headingElement
        return acc
      }, headingElementsRef.current)

      const visibleHeadings: Array<IntersectionObserverEntry> = []
      Object.keys(headingElementsRef.current).forEach((key) => {
        const headingElement = headingElementsRef.current[key]
        if (headingElement.isIntersecting) visibleHeadings.push(headingElement)
      })

      function getIndexFromId(id: string) {
        return headingElements.findIndex((heading) => heading.id === id)
      }

      if (visibleHeadings.length === 1) {
        setActiveId(visibleHeadings[0].target.id)
      } else if (visibleHeadings.length > 1) {
        const sortedVisibleHeadings = visibleHeadings.sort((a, b) =>
          getIndexFromId(a.target.id) > getIndexFromId(b.target.id) ? 1 : 0
        )
        setActiveId(sortedVisibleHeadings[0].target.id)
      }
    }

    const observer = new IntersectionObserver(observerCallback, {
      rootMargin: '-90px 0px -40% 0px',
    })

    const headingElements = Array.from(
      docsContent.querySelectorAll('h2, h3, h4, h5, h6')
    )
    headingElements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [setActiveId, mdxSource]) // check mdxSource to update TOC
}

interface TableOfContentsProps {
  toc: TocHeader[]
  mdxSource: MDXRemoteProps
}

export const TableOfContents: FunctionComponent<TableOfContentsProps> = ({
  toc,
  mdxSource,
}) => {
  const [activeId, setActiveId] = useState<string | undefined>()
  useIntersectionObserver(setActiveId, mdxSource)

  if (!toc.length) {
    return null
  }

  return (
    <nav aria-label="Table of contents">
      <Typography
        variant="h2"
        className="flex flex-row items-center gap-2 text-xl mb-2 ml-2 text-md text-secondary-200"
        placeholder={undefined}
        onPointerEnterCapture={undefined}
        onPointerLeaveCapture={undefined}
      >
        <Bars3BottomLeftIcon className="w-5 h-5" />
        Table of contents
      </Typography>
      <div className="w-full text-sm">
        <ul className="h-full max-h-[calc(100vh-9rem)] overflow-x-hidden overflow-y-auto scrollbar scrollbar-thumb-secondary-200 scrollbar-track-secondary-200/30 scrollbar-thin scrollbar-track-rounded-[32px] scrollbar-thumb-rounded-[32px]">
          {toc.map((item) => (
            <TableOfContentsItem
              key={item.id}
              item={item}
              activeId={activeId}
            />
          ))}
        </ul>
      </div>
    </nav>
  )
}
