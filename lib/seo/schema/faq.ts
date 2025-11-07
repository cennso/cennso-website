/**
 * FAQ Schema Generator
 *
 * Generates Schema.org FAQPage structured data for Q&A content.
 * Enables "People Also Ask" boxes in search results.
 */

import type { FAQPageSchema, Question } from './types'

export interface FAQItem {
  question: string
  answer: string
}

/**
 * Generates FAQPage schema from Q&A pairs
 * @param faqs - Array of question/answer pairs
 * @returns FAQPageSchema object for JSON-LD embedding
 */
export function generateFAQSchema(faqs: FAQItem[]): FAQPageSchema {
  // Validate minimum FAQ count (Schema.org recommends at least 2)
  if (faqs.length < 2) {
    throw new Error('FAQPage schema requires at least 2 question/answer pairs')
  }

  const questions: Question[] = faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  }))

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions,
  }
}
