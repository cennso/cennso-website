/**
 * Footer data loader
 * Loads footer.yaml and transforms it for use in components
 */

import { promises as fsPromises } from 'fs'
import path from 'path'
import { parse as YamlParse } from 'yaml'
import type { FooterLink } from '../contexts'

interface FooterYAML {
  footer: {
    company_links: Array<{
      title: string
      link: string
      target?: string
    }>
    explore_links: Array<{
      title: string
      link: string
      target?: string
    }>
    llm_links: Array<{
      title: string
      link: string
      aria_label: string
      description: string
    }>
    agent_directive: {
      before: string
      link: string
      link_text: string
      after: string
    }
    copyright: {
      year_prefix: string
      company_suffix: string
      rights: string
    }
  }
}

/** The sentence for AI agents at the top of every page: text, then a link, then text. */
export interface AgentDirective {
  before: string
  link: string
  linkText: string
  after: string
}

export interface FooterData {
  footerLinks: FooterLink[]
  exploreLinks: FooterLink[]
  llmLinks: FooterLink[]
  agentDirective: AgentDirective
  copyright: {
    yearPrefix: string
    companySuffix: string
    rights: string
  }
}

/**
 * Load footer data from footer.yaml
 * Call this in getStaticProps, similar to createNavigation()
 */
export async function loadFooterData(): Promise<FooterData> {
  const footerPath = path.join(process.cwd(), 'content', 'footer.yaml')
  const footerContent = (await fsPromises.readFile(footerPath)).toString()
  const yaml = YamlParse(footerContent) as FooterYAML

  return {
    footerLinks: yaml.footer.company_links.map((link) => {
      const result: FooterLink = {
        title: link.title,
        link: link.link,
      }
      if (link.target) {
        result.target = link.target
      }
      return result
    }),
    exploreLinks: yaml.footer.explore_links.map((link) => {
      const result: FooterLink = {
        title: link.title,
        link: link.link,
      }
      if (link.target) {
        result.target = link.target
      }
      return result
    }),
    llmLinks: yaml.footer.llm_links.map((link) => ({
      title: link.title,
      link: link.link,
      ariaLabel: link.aria_label,
    })),
    agentDirective: {
      before: yaml.footer.agent_directive.before,
      link: yaml.footer.agent_directive.link,
      linkText: yaml.footer.agent_directive.link_text,
      after: yaml.footer.agent_directive.after,
    },
    copyright: {
      yearPrefix: yaml.footer.copyright.year_prefix,
      companySuffix: yaml.footer.copyright.company_suffix,
      rights: yaml.footer.copyright.rights,
    },
  }
}
