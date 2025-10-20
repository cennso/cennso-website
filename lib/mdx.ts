import { serialize } from 'next-mdx-remote/serialize'
import remarkGfm from 'remark-gfm'
import remarkUnwrapImages from 'remark-unwrap-images'
import rehypeSlug from 'rehype-slug'

export async function parseMDX(mdContent: string) {
  return await serialize(mdContent, {
    parseFrontmatter: true,
    mdxOptions: {
      remarkPlugins: [remarkUnwrapImages, remarkGfm],
      rehypePlugins: [rehypeSlug],
    },
  })
}
