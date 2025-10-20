# Create a solution profile

This document describes how to create a solution profile and publish it on the Cennso website.

Follow these steps to add a new solution profile to the website:

1. Fetch the `cennso-website` repository and create a new branch in the local repository.
2. Create a new Markdown (or [MDX](https://mdxjs.com/)) file in the `/content/solutions` folder with a name following the `{FILE_NAME}.(md|mdx)` format.

   > **NOTE**: `{FILE_NAME}` is the last part of the site's address in the location bar. For example, name the file **npp.md** to point to the `/solutions/npp` link on the website.

3. Prepare the content in a Markdown file with the solution metadata.
4. Create a pull request.
5. Wait for the review.
6. After the merge, the site rebuilds automatically and the solution profile profile appears.

The document with a solution profile should include metadata in the following format:

```yaml
---
title: {TITLE}
description: {DESCRIPTION}
logo: {LOGO}
cover: {COVER}
---
{CONTENT}
```

Replace these parameters with real values:

- `{TITLE}` is the blog post title.
- `{DESCRIPTION}` is content to be displayed on the `/solutions` page.
- `{LOGO}` is the path to a diagram in the SVG format that is displayed on the `/solutions` page as a logo of the solution.
- `{COVER}` is the path to the image displayed as the cover of the preview link, the preview that renders when you share the link on social media.
- `{CONTENT}` is a solution content written in Markdown, [MDX](https://mdxjs.com/), and/or HTML format.

## Add assets to the content

Follow the [Use assets](./using-assets.md) document to learn how to add assets, such as images or diagrams, to the content.
