/**
 * Content loader utility for MDX files
 * Loads and parses blog posts, solutions, success stories, and jobs
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import type {
  ParsedMDX,
  BlogPostFrontmatter,
  SolutionFrontmatter,
  SuccessStoryFrontmatter,
  JobFrontmatter,
} from '../types';

const mdRegex = /\.mdx?$/;
const frontmatterRegex = /^---\n([\s\S]+?)\n---\n([\s\S]*)$/;

/**
 * Parse MDX file with frontmatter
 */
function parseMDXContent<T = any>(content: string): { frontmatter: T; content: string } {
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return {
      frontmatter: {} as T,
      content,
    };
  }
  
  const frontmatterStr = match[1];
  const bodyContent = match[2];
  
  const frontmatter = yaml.load(frontmatterStr) as T;
  
  return {
    frontmatter,
    content: bodyContent,
  };
}

/**
 * Load all blog posts from content/blog-posts directory
 */
export async function loadBlogPosts(): Promise<ParsedMDX<BlogPostFrontmatter>[]> {
  const postsDirectory = path.join(process.cwd(), 'content', 'blog-posts');
  
  try {
    const dirents = await fs.readdir(postsDirectory, { withFileTypes: true });
    
    const posts = await Promise.all(
      dirents
        .filter(dirent => dirent.isFile() && mdRegex.test(dirent.name))
        .map(async (dirent) => {
          const mdPath = path.join(postsDirectory, dirent.name);
          const mdContent = await fs.readFile(mdPath, 'utf-8');
          const parsed = parseMDXContent<BlogPostFrontmatter>(mdContent);
          
          // Skip hidden posts
          if ((parsed.frontmatter as any).show === false) {
            return null;
          }
          
          return {
            frontmatter: parsed.frontmatter,
            content: parsed.content,
            slug: dirent.name.replace(mdRegex, ''),
          };
        })
    );
    
    return posts.filter((post): post is ParsedMDX<BlogPostFrontmatter> => post !== null);
  } catch (error) {
    console.warn('Warning: Could not load blog posts:', error);
    return [];
  }
}

/**
 * Load all solutions from content/solutions directory
 */
export async function loadSolutions(): Promise<ParsedMDX<SolutionFrontmatter>[]> {
  const solutionsDirectory = path.join(process.cwd(), 'content', 'solutions');
  
  try {
    const dirents = await fs.readdir(solutionsDirectory, { withFileTypes: true });
    
    const solutions = await Promise.all(
      dirents
        .filter(dirent => dirent.isFile() && mdRegex.test(dirent.name))
        .map(async (dirent) => {
          const mdPath = path.join(solutionsDirectory, dirent.name);
          const mdContent = await fs.readFile(mdPath, 'utf-8');
          const parsed = parseMDXContent<SolutionFrontmatter>(mdContent);
          
          return {
            frontmatter: parsed.frontmatter,
            content: parsed.content,
            slug: dirent.name.replace(mdRegex, ''),
          };
        })
    );
    
    return solutions;
  } catch (error) {
    console.warn('Warning: Could not load solutions:', error);
    return [];
  }
}

/**
 * Load all success stories from content/success-stories directory
 */
export async function loadSuccessStories(): Promise<ParsedMDX<SuccessStoryFrontmatter>[]> {
  const storiesDirectory = path.join(process.cwd(), 'content', 'success-stories');
  
  try {
    const dirents = await fs.readdir(storiesDirectory, { withFileTypes: true });
    
    const stories = await Promise.all(
      dirents
        .filter(dirent => dirent.isFile() && mdRegex.test(dirent.name))
        .map(async (dirent) => {
          const mdPath = path.join(storiesDirectory, dirent.name);
          const mdContent = await fs.readFile(mdPath, 'utf-8');
          const parsed = parseMDXContent<SuccessStoryFrontmatter>(mdContent);
          
          return {
            frontmatter: parsed.frontmatter,
            content: parsed.content,
            slug: dirent.name.replace(mdRegex, ''),
          };
        })
    );
    
    return stories;
  } catch (error) {
    console.warn('Warning: Could not load success stories:', error);
    return [];
  }
}

/**
 * Load all job postings from content/jobs directory
 */
export async function loadJobs(): Promise<ParsedMDX<JobFrontmatter>[]> {
  const jobsDirectory = path.join(process.cwd(), 'content', 'jobs');
  
  try {
    const dirents = await fs.readdir(jobsDirectory, { withFileTypes: true });
    
    const jobs = await Promise.all(
      dirents
        .filter(dirent => dirent.isFile() && mdRegex.test(dirent.name))
        .map(async (dirent) => {
          const mdPath = path.join(jobsDirectory, dirent.name);
          const mdContent = await fs.readFile(mdPath, 'utf-8');
          const parsed = parseMDXContent<JobFrontmatter>(mdContent);
          
          return {
            frontmatter: parsed.frontmatter,
            content: parsed.content,
            slug: dirent.name.replace(mdRegex, ''),
          };
        })
    );
    
    return jobs;
  } catch (error) {
    console.warn('Warning: Could not load jobs:', error);
    return [];
  }
}
