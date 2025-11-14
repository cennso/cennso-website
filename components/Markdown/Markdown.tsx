/* eslint-disable react-hooks/rules-of-hooks, @next/next/no-img-element */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowTopRightOnSquareIcon,
  HashtagIcon,
} from '@heroicons/react/24/outline'
import { MDXRemote } from 'next-mdx-remote'

import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus as SyntaxHighlighterTheme } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import json from 'react-syntax-highlighter/dist/cjs/languages/prism/json'
import yaml from 'react-syntax-highlighter/dist/cjs/languages/prism/yaml'
import bash from 'react-syntax-highlighter/dist/cjs/languages/prism/bash'
import go from 'react-syntax-highlighter/dist/cjs/languages/prism/go'
import python from 'react-syntax-highlighter/dist/cjs/languages/prism/python'
import erlang from 'react-syntax-highlighter/dist/cjs/languages/prism/erlang'
import elixir from 'react-syntax-highlighter/dist/cjs/languages/prism/elixir'

import { CallToAction } from './components/CallToAction'
import { CennsoButton } from './components/CennsoButton'
import { ContentBlock } from './components/ContentBlock'
import { Quote } from './components/Quote'

import type {
  FunctionComponent,
  ReactNode,
  DetailedHTMLProps,
  HTMLAttributes,
} from 'react'
import type { MDXRemoteProps } from 'next-mdx-remote'

export function serializeHeading(
  level: number,
  originalId: string | undefined,
  children: ReactNode
): {
  Component: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  className: string
  id: string | undefined
} {
  const Component = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

  let className: string
  switch (level) {
    case 1: {
      className = 'text-primary-600 font-bold'
      break
    }
    case 2: {
      className = 'text-primary-600 font-bold'
      break
    }
    case 3: {
      className = 'text-primary-600 font-bold'
      break
    }
    case 4: {
      className = 'text-primary-600 font-bold'
      break
    }
    case 5: {
      className = 'text-primary-600 font-bold'
      break
    }
    // 6 level
    default: {
      className = 'text-primary-600 font-bold'
    }
  }

  let id: string | undefined = originalId
  if (originalId === undefined) {
    const content: string | undefined = Array.isArray(children)
      ? (children[0] as string)
      : undefined

    if (typeof content === 'string') {
      id = content.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    }
  }

  return { Component, className, id }
}

const Heading: FunctionComponent<
  DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement> & {
    level: number
  }
> = ({ level, children, id: originalId, ...rest }) => {
  const router = useRouter()
  const routerEvents = router.events
  const [isActive, setIsActive] = useState(false)
  const { Component, className, id } = serializeHeading(
    level,
    originalId,
    children
  )

  useEffect(() => {
    setIsActive(window.location.hash === `#${id}`)
  }, [setIsActive, id])

  useEffect(() => {
    function onHashChangeStart(url: string) {
      try {
        const hash = url.split('#')[1]
        setIsActive(hash === id)
      } catch {
        // skip intentionally
      }
    }

    routerEvents.on('hashChangeStart', onHashChangeStart)
    return () => {
      routerEvents.off('hashChangeStart', onHashChangeStart)
    }
  }, [routerEvents, setIsActive, id])

  return (
    <Component
      {...rest}
      id={id}
      className={`${className} group flex flex-row items-center whitespace-pre-wrap -ml-4 pl-4 text-secondary-200`}
    >
      <Link
        href={`#${id}`}
        className={`mask mask-hexagon-2 flex flex-row items-center justify-center font-mono absolute -ml-8 flex items-center ${
          isActive
            ? 'opacity-100 text-gray-100 bg-gradient-to-r from-primary-600 to-[#04D3D6]'
            : 'text-gray-100 opacity-0 bg-gradient-to-r from-primary-600 to-[#04D3D6]'
        } hover:text-gray-100 border-0 group-hover:opacity-100 no-underline text-lg w-6 h-6 rounded-md shadow transition duration-300 ease-in-out`}
        aria-label="Anchor"
      >
        <HashtagIcon className="p-[0.3rem] stroke-2" />
      </Link>
      <div
        className="hover:underline cursor-pointer"
        onClick={() => router.push(`#${id}`)}
      >
        {children}
      </div>
    </Component>
  )
}

SyntaxHighlighter.registerLanguage('json', json)
SyntaxHighlighter.registerLanguage('yaml', yaml)
SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('sh', bash)
SyntaxHighlighter.registerLanguage('go', go)
SyntaxHighlighter.registerLanguage('python', python)
SyntaxHighlighter.registerLanguage('erlang', erlang)
SyntaxHighlighter.registerLanguage('elixir', elixir)

export const Components: MDXRemoteProps['components'] = {
  a({ children, href, ...rest }) {
    let isExternal = false
    if (href) {
      try {
        const url = new URL(href || '')
        isExternal = Boolean(url.protocol)
      } catch {
        // skip intentionally
      }
    }

    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener"
          {...rest}
          className="text-secondary-200 hover:decoration-2 my-0"
        >
          {children}
          <ArrowTopRightOnSquareIcon className="inline-block ml-0.5 h-3" />
        </a>
      )
    }

    return (
      <Link
        {...(rest as any)}
        href={href as string}
        className="text-secondary-200 hover:decoration-2"
      >
        {children}
      </Link>
    )
  },
  blockquote({ children, ...rest }) {
    return (
      <blockquote
        {...rest}
        className="bg-secondary-600 border-l-0 px-4 py-0.5 not-italic font-normal text-sm rounded-[32px]"
      >
        {children}
      </blockquote>
    )
  },
  br({ children, ...rest }) {
    return <br {...rest} />
  },
  code({ className, children, ...rest }) {
    if (className === undefined) {
      return (
        <code
          {...rest}
          className="before:content-none after:content-none text-secondary-200 bg-secondary-600 py-[0.2rem] px-1.5 rounded-full font-code font-normal break-words"
        >
          {children}
        </code>
      )
    }

    let language = 'bash'
    if (typeof className === 'string' && className.startsWith('language-')) {
      language = className.replace('language-', '')
    }

    const code = children?.toString().trim()
    return (
      <div className="relative">
        <div className="absolute -top-3 right-3.5 flex flex-row gap-1">
          <span className="border border-secondary-200 rounded-[32px] bg-white text-xs px-2 py-0.5 text-secondary-600">
            {language.toLowerCase()}
          </span>
        </div>

        {/* @ts-ignore - SyntaxHighlighter has React type incompatibility between @types/react versions */}
        <SyntaxHighlighter
          {...(rest as any)}
          language={language}
          useInlineStyles={true}
          showLineNumbers={true}
          codeTagProps={{
            className: 'text-xs',
          }}
          className={`!bg-secondary-600 !border-secondary-600 !mt-3 !font-code shadow scrollbar scrollbar-thumb-secondary-200 scrollbar-track-secondary-200/30 scrollbar-thin scrollbar-track-rounded-[32px] scrollbar-thumb-rounded-[32px] overflow-x-auto overflow-y-hidden`}
          style={SyntaxHighlighterTheme}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    )
  },
  em({ children, ...rest }) {
    return <em {...rest}>{children}</em>
  },
  h1: (props) => <Heading {...props} level={1} />,
  h2: (props) => <Heading {...props} level={2} />,
  h3: (props) => <Heading {...props} level={3} />,
  h4: (props) => <Heading {...props} level={4} />,
  h5: (props) => <Heading {...props} level={5} />,
  h6: (props) => <Heading {...props} level={6} />,
  hr({ children, ...rest }) {
    return <hr {...rest} className="h-[2px] my-4" />
  },
  img({ ...props }) {
    const { title, alt, src } = props

    const figcaption = title || alt
    if (typeof figcaption === 'string') {
      return (
        <figure className="flex flex-col items-center">
          <img
            {...props}
            src={src}
            title={title}
            alt={alt}
            className="w-full max-w-2xl"
          />
          <figcaption className="text-secondary-200">{figcaption}</figcaption>
        </figure>
      )
    }

    return (
      <div className="flex flex-col items-center">
        <img
          {...props}
          src={src}
          title={title}
          alt={alt}
          className="w-full max-w-2xl"
        />
      </div>
    )
  },
  li({ children, ...rest }) {
    return <li {...rest}>{children}</li>
  },
  ol({ children, ...rest }) {
    return (
      <ol
        className={`marker:text-secondary-200 ${rest.className || ''}`}
        {...rest}
      >
        {children}
      </ol>
    )
  },
  ul({ children, ...rest }) {
    return (
      <ul
        {...rest}
        className={`marker:text-secondary-200 ${rest.className || ''}`}
      >
        {children}
      </ul>
    )
  },
  table({ children, ...rest }) {
    return (
      <div className="scrollbar scrollbar-thumb-secondary-200 scrollbar-track-secondary-200/30 scrollbar-thin scrollbar-track-rounded-[32px] scrollbar-thumb-rounded-[32px] rounded-[32px] my-6 border border-secondary-200 overflow-x-auto overflow-y-hidden shadow">
        <table
          {...rest}
          className="relative rounded-[32px] my-0 border-secondary-200"
        >
          {children}
        </table>
      </div>
    )
  },
  thead({ children, ...rest }) {
    return (
      <thead {...rest} className="bg-secondary-200 border-0">
        {children}
      </thead>
    )
  },
  tbody({ children, ...rest }) {
    return <tbody {...rest}>{children}</tbody>
  },
  th({ children, style, ...rest }) {
    return (
      <th
        {...(rest as JSX.IntrinsicElements['th'])}
        scope="col"
        className={`font-medium py-1.5 px-4 text-secondary-600 bg-secondary-200`}
      >
        {children}
      </th>
    )
  },
  td({ children, style, ...rest }) {
    return (
      <td {...rest} className={'text-white font-normal py-1.5 px-4'}>
        {children}
      </td>
    )
  },
  tr({ children, ...rest }) {
    return (
      <tr {...rest} className="border-primary-100">
        {children}
      </tr>
    )
  },
  p({ children, ...rest }) {
    return <p {...rest}>{children}</p>
  },
  pre({ children, ...rest }) {
    return (
      <pre {...rest} className="bg-transparent p-0">
        {children}
      </pre>
    )
  },
  span({ children, ...rest }) {
    return <span {...rest}>{children}</span>
  },
  strong({ children, ...rest }) {
    return (
      <strong
        {...rest}
        className={`text-secondary-200 font-bold ${rest.className || ''}`}
      >
        {children}
      </strong>
    )
  },

  // don't render inputs
  input() {
    return null
  },

  // custom
  CallToAction: CallToAction as any,
  Quote: Quote as any,
  ContentBlock: ContentBlock as any,
  CennsoButton: CennsoButton as any,
  Image: Image as any,
}

interface MarkdownProps {
  mdxSource: MDXRemoteProps
}

export const Markdown: FunctionComponent<MarkdownProps> = ({ mdxSource }) => {
  return (
    <div
      className="prose prose-quoteless max-w-full prose-p:text-white prose-span:text-white prose-li:text-white"
      id="article-content"
    >
      <MDXRemote {...mdxSource} components={Components} />
    </div>
  )
}
