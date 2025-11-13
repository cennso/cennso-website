/**
 * Basic LLM generator - creates llms.txt with summary information
 * Per spec: About, Services, Contact, Recent Blog Posts (5 most recent),
 * Solutions (summaries only), Success Stories (summaries only), Pages
 */

import type { Section, ContentItem } from '../types'
import {
  loadBlogPosts,
  loadSolutions,
  loadSuccessStories,
  loadJobs,
} from '../utils/content-loader'
import { loadAuthors, loadPageMetadata } from '../utils/yaml-loader'
import { convertToPlainText, extractExcerpt } from '../utils/text-cleaner'
import {
  buildBlogPostUrl,
  buildSolutionUrl,
  buildSuccessStoryUrl,
  buildJobUrl,
  buildAbsoluteUrl,
} from '../utils/url-builder'
import {
  generateDocumentMetadata,
  formatMetadataHeaders,
} from '../utils/metadata-builder'
import siteMetadata from '../../../siteMetadata'

/**
 * Generate basic LLM document (llms.txt)
 * ~50-200KB with essential information
 */
export async function generateBasicLLM(): Promise<string> {
  const sections: string[] = []

  // File header
  sections.push('# llms.txt - LLM-friendly website data')
  sections.push(`# Generated: ${new Date().toISOString().split('T')[0]}`)
  sections.push('')

  // Metadata headers
  const metadata = generateDocumentMetadata()
  sections.push(formatMetadataHeaders(metadata))
  sections.push('')

  // About section
  sections.push(await generateAboutSection())
  sections.push('')

  // TODO: Services section - Re-enable when solutions content is finalized
  // Content currently shows placeholder/test data
  // sections.push(await generateServicesSection());
  // sections.push('');

  // Contact section
  sections.push(generateContactSection())
  sections.push('')

  // TODO: Recent Blog Posts - Re-enable when blog content is published
  // Currently no published blog posts available
  // sections.push(await generateRecentBlogPostsSection(5));
  // sections.push('');

  // TODO: Solutions - Re-enable when solutions content is finalized
  // Content currently shows placeholder/test data
  // sections.push(await generateSolutionsSummarySection());
  // sections.push('');

  // Success Stories (summaries only)
  sections.push(await generateSuccessStoriesSummarySection())
  sections.push('')

  // TODO: Job Postings - Re-enable when real job postings are available
  // Currently contains placeholder/test content
  // sections.push(await generateJobsSummarySection());
  // sections.push('');

  // Pages
  sections.push(generatePagesSection())

  return sections.join('\n')
}

/**
 * Generate About section
 */
async function generateAboutSection(): Promise<string> {
  const parts: string[] = ['# About']

  const aboutPage = await loadPageMetadata('about-page.yaml')
  if (aboutPage && aboutPage.description) {
    parts.push(aboutPage.description)
  } else {
    // Fallback to site metadata
    parts.push(siteMetadata.description)
  }

  return parts.join('\n')
}

/**
 * Generate Services section
 */
async function generateServicesSection(): Promise<string> {
  const parts: string[] = ['# Services']

  const solutions = await loadSolutions()
  solutions.forEach((solution) => {
    const description =
      solution.frontmatter.description || extractExcerpt(solution.content, 150)
    parts.push(`- ${solution.frontmatter.title}: ${description}`)
  })

  if (solutions.length === 0) {
    parts.push('- Mobile Core Network Consulting')
    parts.push('- Network Implementation')
    parts.push('- 24/7 Support and Monitoring')
  }

  return parts.join('\n')
}

/**
 * Generate Contact section
 */
function generateContactSection(): string {
  const parts: string[] = ['# Contact']

  parts.push(`Email: ${siteMetadata.contact.email}`)
  parts.push(`Phone: ${siteMetadata.contact.phone}`)
  parts.push(`Address: ${siteMetadata.contact.address.place.join(', ')}`)
  parts.push(`Website: ${buildAbsoluteUrl('contact')}`)

  if (siteMetadata.social.platforms.linkedIn) {
    parts.push(`LinkedIn: ${siteMetadata.social.platforms.linkedIn}`)
  }

  return parts.join('\n')
}

/**
 * Generate Recent Blog Posts section (5 most recent)
 */
async function generateRecentBlogPostsSection(
  count: number = 5
): Promise<string> {
  const parts: string[] = ['# Recent Blog Posts']

  const posts = await loadBlogPosts()

  if (posts.length === 0) {
    parts.push('(No blog posts available yet)')
    return parts.join('\n')
  }

  // Sort by date (most recent first)
  const sortedPosts = posts.sort((a, b) => {
    const dateA = new Date(a.frontmatter.date).getTime()
    const dateB = new Date(b.frontmatter.date).getTime()
    return dateB - dateA
  })

  // Take top N posts
  const recentPosts = sortedPosts.slice(0, count)

  // Load authors for name resolution
  const authors = await loadAuthors()

  recentPosts.forEach((post) => {
    parts.push('')
    parts.push(`## ${post.frontmatter.title}`)
    parts.push(`URL: ${buildBlogPostUrl(post.slug)}`)

    // Resolve author names
    const authorNames = post.frontmatter.authors
      .map((authorId) => authors[authorId]?.name || authorId)
      .join(', ')
    parts.push(`Author: ${authorNames}`)

    // Format date
    const publishedDate = new Date(post.frontmatter.date)
      .toISOString()
      .split('T')[0]
    parts.push(`Published: ${publishedDate}`)

    if (post.frontmatter.category) {
      parts.push(`Category: ${post.frontmatter.category}`)
    }

    const summary =
      post.frontmatter.excerpt || extractExcerpt(post.content, 200)
    parts.push(`Summary: ${summary}`)
  })

  return parts.join('\n')
}

/**
 * Generate Solutions summary section
 */
async function generateSolutionsSummarySection(): Promise<string> {
  const parts: string[] = ['# Solutions']

  const solutions = await loadSolutions()

  if (solutions.length === 0) {
    parts.push('(No solutions available yet)')
    return parts.join('\n')
  }

  solutions.forEach((solution) => {
    const description =
      solution.frontmatter.description || extractExcerpt(solution.content, 150)
    parts.push(`- ${solution.frontmatter.title}: ${description}`)
  })

  return parts.join('\n')
}

/**
 * Generate Success Stories summary section
 */
async function generateSuccessStoriesSummarySection(): Promise<string> {
  const parts: string[] = ['# Success Stories']

  const stories = await loadSuccessStories()

  if (stories.length === 0) {
    parts.push('(No success stories available yet)')
    return parts.join('\n')
  }

  stories.forEach((story) => {
    const summary =
      story.frontmatter.excerpt || extractExcerpt(story.content, 150)
    parts.push(`- ${story.frontmatter.title}: ${summary}`)
  })

  return parts.join('\n')
}

/**
 * Generate Jobs summary section
 */
async function generateJobsSummarySection(): Promise<string> {
  const parts: string[] = ['# Job Postings']

  const jobs = await loadJobs()

  if (jobs.length === 0) {
    parts.push('(No open positions available)')
    return parts.join('\n')
  }

  parts.push(`${jobs.length} open position${jobs.length > 1 ? 's' : ''}`)

  jobs.forEach((job) => {
    const location = job.frontmatter.location || 'Remote'
    const type = job.frontmatter.type || 'Full-time'
    parts.push(
      `- ${job.frontmatter.title} (${location}, ${type}): ${buildJobUrl(job.slug)}`
    )
  })

  return parts.join('\n')
}

/**
 * Generate Pages section
 */
function generatePagesSection(): string {
  const parts: string[] = ['# Pages']

  const pages = [
    { name: 'Home', path: '' },
    { name: 'About', path: 'about' },
    { name: 'Solutions', path: 'solutions' },
    { name: 'Success Stories', path: 'success-stories' },
    { name: 'Blog', path: 'blog' },
    { name: 'Jobs', path: 'jobs' },
    { name: 'Contact', path: 'contact' },
    { name: 'Partners', path: 'partners' },
  ]

  pages.forEach((page) => {
    parts.push(`- ${page.name}: ${buildAbsoluteUrl(page.path)}`)
  })

  return parts.join('\n')
}
