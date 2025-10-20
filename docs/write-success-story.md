# Write a success story

This document describes how to write a success story and publish it on Cennso Website.

Follow these steps to add a new success story on the website:

1. Fetch the `cennso-website` repository and create a new branch in the local repository.
2. Create a new Markdown (or [MDX](https://mdxjs.com/)) file in the `/content/success-stories` folder with a name following the `{FILE_NAME}.(md|mdx)` format.

   > **NOTE**: `{FILE_NAME}` is the last part of the site's address in the location bar. For example, name the file **ibm-success-story.md** to point to the `/success-stories/ibm-success-story` link on the website.

3. Prepare the content in a Markdown file with the success story metadata.
4. Make a pull request.
5. Wait for the review.
6. After the merge, the site rebuilds automatically and the success story appears.

The success story should have the following format:

```yaml
---
title: {TITLE}
company:
  name: {COMPANY_NAME}
  website: {COMPANY_WEBSITE}
  logo: {COMPANY_LOGO}
  location: {COMPANY_LOCATION}
  industry: {COMPANY_INDUSTRY}
tags:
  - {TAG_1}
  - {TAG_2}
  - ...
cover: {COVER}
excerpt: {EXCERPT}
---
{CONTENT}
```

Replace these parameters with real values:

- `{TITLE}` is the success story title.
- `{COMPANY_NAME}` is the company name.
- `{COMPANY_WEBSITE}` is the link to the company's website.
- `{COMPANY_LOGO}` is the link to the company's logo. Its source can be either local or external.
- `{COMPANY_LOCATION}` is the link to the company's location.
- `{COMPANY_INDUSTRY}` is the link to the company's industry.
- `{TAG_1, TAG_2, ...}` are the tags or keywords of the described success story.
- `{COVER}` is the path to the image displayed on the `/success-stories` page, next to the post preview itself, and as the cover of the preview link, the preview that renders when you share the link on social media.
- `{EXCERPT}` is a content to be displayed on the `/success-stories` page. The **Read more...** button appears at the end of the paragraph.
- `{CONTENT}` is a success story content written in Markdown/[MDX](https://mdxjs.com/) and/or HTML format.

## Add assets to the content

Follow the [Use assets](./using-assets.md) document to learn how to add assets, such as images or diagrams, to the content.
