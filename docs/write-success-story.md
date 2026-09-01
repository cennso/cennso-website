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
- `{COMPANY_LOGO}` is the link to the company's logo. Its source can be either local or external. It is shown on a white card on the `/success-stories` page, so use a logo that reads on white, ideally with a transparent background. Any shape works — wordmarks are kept at their own aspect ratio and scaled to fit, so do not pad one into a square.
- `{COMPANY_LOCATION}` is the link to the company's location.
- `{COMPANY_INDUSTRY}` is the link to the company's industry.
- `{TAG_1, TAG_2, ...}` are the tags or keywords of the described success story.
- `{COVER}` is the path to the image displayed on the `/success-stories` page, next to the post preview itself, and as the cover of the preview link, the preview that renders when you share the link on social media.
- `{EXCERPT}` is a content to be displayed on the `/success-stories` page. The **Read more...** button appears at the end of the paragraph.
- `{CONTENT}` is a success story content written in Markdown/[MDX](https://mdxjs.com/) and/or HTML format.

## Choose a layout

The optional `layout` property controls how the story body is rendered:

- `layout: new` renders the story body full width, directly under the page header. Use this for new stories.
- `layout: old` (the default when `layout` is omitted) additionally renders a company logo card and a table of contents sidebar.

## Components available in the content

Besides Markdown, the following components can be used in the `{CONTENT}` body:

> **IMPORTANT**: Pass every property as a quoted string. The MDX pipeline keeps
> only string attributes and **silently drops JSX expressions**, so
> `width={1379}` reaches the component as no width at all, with no build error.
> Write `width="1379"` instead. A property with no value at all (such as
> `priority`) is the one exception — it correctly becomes `true`.

- `<ContentBlock title='...'>` wraps a section, rendering the title in the left column and the content in the right one.
- `<Stats>` wraps a row of highlighted figures, each one a `<Stat value='50+' label='IBM Cloud locations worldwide' />`. Keep `value` short and put the explanation in `label`.
- `<Quote authorName='...' authorPosition='...' authorCompany='...' avatar='...'>` renders a pull quote. `authorPosition`, `authorCompany`, `avatar` and `authorSocialLink` are all optional; `avatar` takes a path to a square image.
- `<Image src='...' title='...' alt='...' width='...' height='...' sizes='...' />` renders an image. The `sizes` property is mandatory, and images must be WebP under 100KB. Add `priority` to an image that is visible without scrolling, so it is not lazy-loaded.
- `<CallToAction>` and `<CennsoButton>` render a call to action and a button.

## Add assets to the content

Follow the [Use assets](./using-assets.md) document to learn how to add assets, such as images or diagrams, to the content.
