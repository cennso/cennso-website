# Create a job offer

This document describes how to create a job offer and publish it on the Cennso website.

Follow these steps to add a new job offer to the website:

1. Fetch the `cennso-website` repository and create a new branch in the local repository.
2. Create a new Markdown (or [MDX](https://mdxjs.com/)) file in the `/content/jobs` folder with a name following the `{FILE_NAME}.(md|mdx)` format.

   > **NOTE**: `{FILE_NAME}` is the last part of the site's address in the location bar. For example, name the file **senior-devops.md** to point to the `/jobs/senior-devops` link on the website.

3. Prepare the content in a Markdown file with the product metadata.
4. Create a pull request.
5. Wait for the review.
6. After the merge, the site rebuilds automatically and the job offer appears.

The document with a job offer should include metadata in the following format:

```yaml
---
position: {POSITION}
kind: {KIND}
mode: {MODE}
cover: {COVER}
---
{CONTENT}
```

Replace these parameters with real values:

- `{POSITION}` is the job offer title.
- `{KIND}` is a kind of the job, either `Full-time` or `Contract`.
- `{MODE}` is a mode of the job, either `On place` or `Remote`.
- `{COVER}` is the path to the image displayed as the cover of the preview link, the preview that renders when you share the link on social media.
- `{CONTENT}` is a job offer content written in Markdown, [MDX](https://mdxjs.com/), and/or HTML format.

## Add assets to the content

Follow the [Use assets](./using-assets.md) document to learn how to add assets, such as images or diagrams, to the content.
