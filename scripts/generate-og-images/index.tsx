import { prepareImage, saveImage } from './image'
import { prepareData } from './data'
import { loadFonts, removeDirectory } from './common'

async function main() {
  console.log('🎨 Starting OG image generation...\n')

  await removeDirectory()
  const fonts = await loadFonts()
  console.log(`✅ Loaded ${fonts.length} font faces\n`)

  const data = await prepareData()
  const itemsToGenerate = data.filter((item) => item.generate !== false)

  console.log(
    `📊 Generating ${itemsToGenerate.length} of ${data.length} OG images:\n`
  )

  await Promise.all(
    data.map(async (item) => {
      if (item.generate === false) {
        return
      }

      const image = await prepareImage({
        fonts,
        badge: item.badge,
        title: item.title,
        description: item.description,
      })
      await saveImage({ image, destination: item.path })
    })
  )

  console.log('\n✨ OG image generation complete!')
}

main().catch((error) => {
  console.error('❌ Error generating OG images:', error)
  process.exit(1)
})
