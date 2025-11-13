#!/usr/bin/env ts-node
/**
 * LLM Data Generation Orchestrator
 * Generates llms.txt and llms-full.txt files during build process
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { generateBasicLLM } from './generators/basic'
import { generateFullLLM } from './generators/full'

/**
 * Main orchestrator function
 * Generates both LLM files and writes them to public directory
 */
async function main(): Promise<void> {
  console.log('🚀 Starting LLM data generation...')
  const startTime = Date.now()

  try {
    // Generate basic LLM file
    console.log('📝 Generating llms.txt (basic)...')
    const basicContent = await generateBasicLLM()
    const basicPath = path.join(process.cwd(), 'public', 'llms.txt')
    await fs.writeFile(basicPath, basicContent, 'utf-8')
    const basicSize = (basicContent.length / 1024).toFixed(2)
    console.log(`✅ Generated llms.txt (${basicSize} KB)`)

    // Generate full LLM file
    console.log('📝 Generating llms-full.txt (comprehensive)...')
    const fullContent = await generateFullLLM()
    const fullPath = path.join(process.cwd(), 'public', 'llms-full.txt')
    await fs.writeFile(fullPath, fullContent, 'utf-8')
    const fullSize = (fullContent.length / 1024).toFixed(2)
    console.log(`✅ Generated llms-full.txt (${fullSize} KB)`)

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`✨ LLM data generation completed in ${elapsed}s`)

    // Check file sizes against limits
    const basicSizeKB = basicContent.length / 1024
    const fullSizeKB = fullContent.length / 1024

    if (basicSizeKB > 5 * 1024) {
      console.warn(`⚠️  Warning: llms.txt is ${basicSize} KB (limit: 5 MB)`)
    }

    if (fullSizeKB > 20 * 1024) {
      console.warn(`⚠️  Warning: llms-full.txt is ${fullSize} KB (limit: 20 MB)`)
    }
  } catch (error) {
    console.error('❌ Error generating LLM data:', error)
    process.exit(1)
  }
}

// Run if executed directly
if (require.main === module) {
  main()
}

export { main }
