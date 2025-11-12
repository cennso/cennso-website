/**
 * YAML loader utility for structured content
 * Loads and parses authors, testimonials, partners, and page metadata
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import type { Author, Testimonial, Partner, PageMetadata } from '../types';

/**
 * Load authors from content/authors.yaml
 */
export async function loadAuthors(): Promise<Record<string, Author>> {
  const authorsPath = path.join(process.cwd(), 'content', 'authors.yaml');
  
  try {
    const authorsContent = await fs.readFile(authorsPath, 'utf-8');
    const parsed = yaml.load(authorsContent) as { authors: Record<string, Author> };
    return parsed.authors || {};
  } catch (error) {
    console.warn('Warning: Could not load authors:', error);
    return {};
  }
}

/**
 * Load testimonials from content/testimonials.yaml
 */
export async function loadTestimonials(): Promise<Testimonial[]> {
  const testimonialsPath = path.join(process.cwd(), 'content', 'testimonials.yaml');
  
  try {
    const testimonialsContent = await fs.readFile(testimonialsPath, 'utf-8');
    const parsed = yaml.load(testimonialsContent) as { testimonials: { items: any[] } };
    
    // Transform items to Testimonial format
    const items = parsed.testimonials?.items || [];
    
    // Also load authors to resolve names
    const authors = await loadAuthors();
    
    return items.map((item, index) => {
      const authorId = item.author;
      const author = authors[authorId];
      
      return {
        id: authorId || `testimonial-${index}`,
        author: author?.name || authorId,
        position: author?.position || '',
        company: author?.company || '',
        quote: item.content || '',
        avatar: author?.avatar,
      };
    });
  } catch (error) {
    console.warn('Warning: Could not load testimonials:', error);
    return [];
  }
}

/**
 * Load partners from content/partners.yaml
 */
export async function loadPartners(): Promise<Partner[]> {
  const partnersPath = path.join(process.cwd(), 'content', 'partners.yaml');
  
  try {
    const partnersContent = await fs.readFile(partnersPath, 'utf-8');
    const parsed = yaml.load(partnersContent) as { partners: Partner[] };
    return parsed.partners || [];
  } catch (error) {
    console.warn('Warning: Could not load partners:', error);
    return [];
  }
}

/**
 * Load page metadata from a YAML file
 * @param filename - Name of the YAML file (e.g., 'about-page.yaml')
 */
export async function loadPageMetadata(filename: string): Promise<PageMetadata | null> {
  const pagePath = path.join(process.cwd(), 'content', filename);
  
  try {
    const pageContent = await fs.readFile(pagePath, 'utf-8');
    const parsed = yaml.load(pageContent) as { page: PageMetadata };
    return parsed.page || null;
  } catch (error) {
    console.warn(`Warning: Could not load page metadata from ${filename}:`, error);
    return null;
  }
}

/**
 * Load landing page data
 */
export async function loadLandingPageData(): Promise<any> {
  const landingPath = path.join(process.cwd(), 'content', 'landing-page.yaml');
  
  try {
    const landingContent = await fs.readFile(landingPath, 'utf-8');
    return yaml.load(landingContent);
  } catch (error) {
    console.warn('Warning: Could not load landing page data:', error);
    return null;
  }
}
