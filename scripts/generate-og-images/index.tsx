import { prepareImage, saveImage } from './image'
import { prepareData } from './data'
import { __dirname, loadFonts, removeDirectory } from './common'

async function main() {
  await removeDirectory()
  const fonts = await loadFonts()

  const data = await prepareData()
  await Promise.all(
    data.map(async (item) => {
      if (item.generate === false) {
        return
      }

      const image = await prepareImage({
        fonts,
        title: item.title,
        subTitle: item.subTitle,
        description: item.description,
      })
      await saveImage({ image, destination: item.path })
    })
  )
}

main()
