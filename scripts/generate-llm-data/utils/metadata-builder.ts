/**
 * Metadata builder utility for generating LLM document metadata headers
 */

import type { DocumentMetadata } from '../types';
import { getSiteUrl } from './url-builder';

/**
 * Generate document metadata for LLM files
 * Per data-model.md DocumentMetadata specification
 * 
 * @returns DocumentMetadata object with required fields
 */
export function generateDocumentMetadata(): DocumentMetadata {
  const now = new Date();
  
  return {
    url: getSiteUrl(),
    lastUpdated: now.toISOString(),
    version: '1.0',
    contentSummary: 'Mobile core network solutions, consulting services, success stories',
  };
}

/**
 * Format metadata as text headers for LLM files
 * Format: "> key: value" per llms.txt specification
 * 
 * @param metadata - DocumentMetadata object
 * @returns Formatted metadata string
 */
export function formatMetadataHeaders(metadata: DocumentMetadata): string {
  return [
    `> url: ${metadata.url}`,
    `> last_updated: ${metadata.lastUpdated}`,
    `> version: ${metadata.version}`,
    `> content_summary: ${metadata.contentSummary}`,
  ].join('\n');
}
