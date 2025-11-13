/**
 * Full LLM generator - creates llms-full.txt with comprehensive information
 * Per spec: All sections including complete blog posts, solutions, success stories,
 * team members, jobs, testimonials, partners
 */
import {
  loadBlogPosts,
  loadSolutions,
  loadSuccessStories,
  loadJobs,
} from '../utils/content-loader'
import {
  loadAuthors,
  loadTestimonials,
  loadPartners,
  loadPageMetadata,
} from '../utils/yaml-loader'
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
 * Generate full LLM document (llms-full.txt)
 * ~1-5MB with comprehensive information
 */
export async function generateFullLLM(): Promise<string> {
  const sections: string[] = []

  // File header
  sections.push('# llms-full.txt - Complete LLM-friendly website data')
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

  // TODO: All Blog Posts - Re-enable when blog content is published
  // Currently no published blog posts available
  // sections.push(await generateAllBlogPostsSection());
  // sections.push('');

  // TODO: All Solutions - Re-enable when solutions content is finalized
  // Content currently shows placeholder/test data
  // sections.push(await generateAllSolutionsSection());
  // sections.push('');

  // Success Stories (with full content)
  sections.push(await generateAllSuccessStoriesSection())
  sections.push('')

  // TODO: Team members - Do not publish team information publicly
  // Privacy consideration - team member data should not be exposed to LLMs
  // sections.push(await generateTeamSection());
  // sections.push('');

  // TODO: Job Postings - Re-enable when real job postings are available
  // Currently contains placeholder/test content
  // sections.push(await generateJobsSection());
  // sections.push('');

  // TODO: Testimonials - Re-enable when testimonial content is finalized
  // Currently contains placeholder/test content
  // sections.push(await generateTestimonialsSection());
  // sections.push('');

  // TODO: Partners - Re-enable when partner content is finalized
  // Currently contains placeholder/test content
  // sections.push(await generatePartnersSection());
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
 * Generate All Blog Posts section (with full content)
 */
async function generateAllBlogPostsSection(): Promise<string> {
  const parts: string[] = []

  const posts = await loadBlogPosts()

  parts.push(`# All Blog Posts (${posts.length} posts)`)

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

  // Load authors for name resolution
  const authors = await loadAuthors()

  sortedPosts.forEach((post) => {
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

    parts.push('')

    // Full content (cleaned of MDX/HTML)
    const fullContent = convertToPlainText(post.content)
    parts.push(fullContent)

    parts.push('')
    parts.push('---')
  })

  return parts.join('\n')
}

/**
 * Generate All Solutions section (with full content)
 */
async function generateAllSolutionsSection(): Promise<string> {
  const parts: string[] = []

  const solutions = await loadSolutions()

  parts.push(`# All Solutions (${solutions.length} solutions)`)

  if (solutions.length === 0) {
    parts.push('(No solutions available yet)')
    return parts.join('\n')
  }

  solutions.forEach((solution) => {
    parts.push('')
    parts.push(`## ${solution.frontmatter.title}`)
    parts.push(`URL: ${buildSolutionUrl(solution.slug)}`)
    parts.push('')

    // Full content
    const fullContent = convertToPlainText(solution.content)
    parts.push(fullContent)

    parts.push('')
    parts.push('---')
  })

  return parts.join('\n')
}

/**
 * Generate All Success Stories section (with full content)
 */
async function generateAllSuccessStoriesSection(): Promise<string> {
  const parts: string[] = []

  const stories = await loadSuccessStories()

  parts.push(`# Success Stories (${stories.length} stories)`)

  if (stories.length === 0) {
    parts.push('(No success stories available yet)')
    return parts.join('\n')
  }

  stories.forEach((story) => {
    parts.push('')
    parts.push(`## ${story.frontmatter.title}`)
    parts.push(`Client: ${story.frontmatter.client}`)
    parts.push(`Industry: ${story.frontmatter.industry}`)
    parts.push(`URL: ${buildSuccessStoryUrl(story.slug)}`)
    parts.push('')

    // Full content
    const fullContent = convertToPlainText(story.content)
    parts.push(fullContent)

    parts.push('')
    parts.push('---')
  })

  return parts.join('\n')
}

/**
 * Generate Team section
 */
async function generateTeamSection(): Promise<string> {
  const parts: string[] = ['# Team']

  const authors = await loadAuthors()
  const authorList = Object.values(authors)

  if (authorList.length === 0) {
    parts.push('(No team members available yet)')
    return parts.join('\n')
  }

  parts.push(`(${authorList.length} team members)`)

  authorList.forEach((author) => {
    parts.push('')
    parts.push(`## ${author.name}`)

    if (author.position) {
      parts.push(`Position: ${author.position}`)
    }

    if (author.company) {
      parts.push(`Company: ${author.company}`)
    }

    if (author.bio) {
      parts.push('')
      parts.push(author.bio)
    }
  })

  return parts.join('\n')
}

/**
 * Generate Jobs section
 */
async function generateJobsSection(): Promise<string> {
  const parts: string[] = []

  const jobs = await loadJobs()

  parts.push(`# Job Postings (${jobs.length} open positions)`)

  if (jobs.length === 0) {
    parts.push('(No open positions available)')
    return parts.join('\n')
  }

  jobs.forEach((job) => {
    parts.push('')
    parts.push(`## ${job.frontmatter.title}`)
    parts.push(`URL: ${buildJobUrl(job.slug)}`)
    parts.push(`Location: ${job.frontmatter.location}`)
    parts.push(`Type: ${job.frontmatter.type}`)
    parts.push(`Department: ${job.frontmatter.department}`)

    if (job.frontmatter.postedDate) {
      const postedDate = new Date(job.frontmatter.postedDate)
        .toISOString()
        .split('T')[0]
      parts.push(`Posted: ${postedDate}`)
    }

    parts.push('')

    // Full content
    const fullContent = convertToPlainText(job.content)
    parts.push(fullContent)

    parts.push('')
    parts.push('---')
  })

  return parts.join('\n')
}

/**
 * Generate Testimonials section
 */
async function generateTestimonialsSection(): Promise<string> {
  const parts: string[] = []

  const testimonials = await loadTestimonials()

  parts.push(`# Testimonials (${testimonials.length} testimonials)`)

  if (testimonials.length === 0) {
    parts.push('(No testimonials available yet)')
    return parts.join('\n')
  }

  testimonials.forEach((testimonial) => {
    parts.push('')
    parts.push(`> "${testimonial.quote}"`)
    parts.push(
      `> — ${testimonial.author}, ${testimonial.position} at ${testimonial.company}`
    )
  })

  return parts.join('\n')
}

/**
 * Generate Partners section
 */
async function generatePartnersSection(): Promise<string> {
  const parts: string[] = []

  const partners = await loadPartners()

  parts.push(`# Partners (${partners.length} partners)`)

  if (partners.length === 0) {
    parts.push('(No partners available yet)')
    return parts.join('\n')
  }

  partners.forEach((partner) => {
    parts.push('')
    parts.push(`## ${partner.name}`)

    if (partner.description) {
      parts.push(partner.description)
    }

    if (partner.url) {
      parts.push(`Website: ${partner.url}`)
    }
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
