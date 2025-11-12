/**
 * Text cleaning utilities for converting MDX/HTML to plain text
 * Strips formatting while preserving structure and readability
 */

/**
 * Strip MDX/JSX components from content
 * Removes: <Component />, <Component>...</Component>, imports, exports
 */
export function stripMDX(content: string): string {
  let cleaned = content;
  
  // Remove import statements
  cleaned = cleaned.replace(/^import\s+.+?from\s+['"].+?['"];?\s*$/gm, '');
  
  // Remove export statements
  cleaned = cleaned.replace(/^export\s+.+?;?\s*$/gm, '');
  
  // Remove self-closing JSX components
  cleaned = cleaned.replace(/<[A-Z][A-Za-z0-9]*\s*\/>/g, '');
  
  // Remove JSX component tags (opening and closing)
  cleaned = cleaned.replace(/<\/?[A-Z][A-Za-z0-9]*(\s+[^>]*)?\s*>/g, '');
  
  // Remove JSX expressions in curly braces
  cleaned = cleaned.replace(/\{[^}]+\}/g, '');
  
  return cleaned;
}

/**
 * Strip HTML tags from content
 * Preserves text content, removes all HTML markup
 */
export function stripHTML(content: string): string {
  // Remove HTML comments
  let cleaned = content.replace(/<!--[\s\S]*?-->/g, '');
  
  // Remove script and style tags with their content
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove all HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, '');
  
  // Decode common HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
  
  return cleaned;
}

/**
 * Convert Markdown formatting to plain text
 * Removes: bold, italic, links, images, code blocks, headers
 */
export function convertMarkdownToPlain(content: string): string {
  let cleaned = content;
  
  // Remove code blocks (```...```)
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  
  // Remove inline code (`...`)
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  
  // Remove images ![alt](url)
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');
  
  // Convert links [text](url) to just text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Remove bold/italic (**text**, *text*, __text__, _text_)
  cleaned = cleaned.replace(/(\*\*|__)(.*?)\1/g, '$2');
  cleaned = cleaned.replace(/(\*|_)(.*?)\1/g, '$2');
  
  // Remove headers (# Header)
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
  
  // Remove horizontal rules (---, ***)
  cleaned = cleaned.replace(/^[-*_]{3,}\s*$/gm, '');
  
  // Remove blockquotes (> text)
  cleaned = cleaned.replace(/^>\s+/gm, '');
  
  // Convert list markers to simple dashes
  cleaned = cleaned.replace(/^\s*[-*+]\s+/gm, '- ');
  cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, '- ');
  
  return cleaned;
}

/**
 * Complete conversion pipeline: MDX/HTML/Markdown → Plain Text
 * Combines all cleaning operations in the correct order
 */
export function convertToPlainText(content: string): string {
  let cleaned = content;
  
  // Step 1: Strip MDX/JSX components
  cleaned = stripMDX(cleaned);
  
  // Step 2: Strip HTML tags
  cleaned = stripHTML(cleaned);
  
  // Step 3: Convert Markdown to plain text
  cleaned = convertMarkdownToPlain(cleaned);
  
  // Step 4: Clean up excessive whitespace
  // Replace multiple newlines with at most 2
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Trim leading/trailing whitespace from each line
  cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');
  
  // Remove leading/trailing empty lines
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Truncate text to a maximum length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length (default: 500)
 * @param ellipsis - Ellipsis string (default: '...')
 */
export function truncateText(text: string, maxLength: number = 500, ellipsis: string = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  // Try to truncate at word boundary
  const truncated = text.substring(0, maxLength - ellipsis.length);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    // If we're close enough to the limit, use word boundary
    return truncated.substring(0, lastSpace) + ellipsis;
  }
  
  // Otherwise, hard truncate
  return truncated + ellipsis;
}

/**
 * Extract excerpt from content (first paragraph or first N characters)
 * @param content - Full content text
 * @param maxLength - Maximum length (default: 200)
 */
export function extractExcerpt(content: string, maxLength: number = 200): string {
  const cleaned = convertToPlainText(content);
  
  // Try to get first paragraph
  const firstParagraph = cleaned.split('\n\n')[0];
  
  if (firstParagraph && firstParagraph.length <= maxLength) {
    return firstParagraph;
  }
  
  // Otherwise, truncate to maxLength
  return truncateText(cleaned, maxLength);
}
