# Write a blog post

This document describes how to write a blog post and publish it on Cennso Website.

Follow these steps to add a new blog post to the website:

1. Fetch the `cennso-website` repository and create a new branch in the local repository.
2. Create a new Markdown (or [MDX](https://mdxjs.com/)) file in the `/content/blog-posts` folder with a name following the `{FILE_NAME}.(md|mdx)` format.

   > **NOTE**: `{FILE_NAME}` is the last part of the site's address in the location bar. For example, name the file **release-notes-1.0.0.md** to point to the `/blog/release-notes-1.0.0` link on the website.

3. Prepare the content in a Markdown file with the blog post metadata.
4. Make a pull request.
5. Wait for the review.
6. After the merge, the site rebuilds automatically and the blog post appears.

The blog post should have the following format:

```yaml
---
title: {TITLE}
date: {DATE}
category: {CATEGORY}
authors:
  - {AUTHOR_1}
  - {AUTHOR_2}
  - ...
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

- `{TITLE}` is the blog post title.
- `{DATE}` is the blog post's publication date in the `YYYY-MM-DD` format.
- `{CATEGORY}` is the overall category of the blog post. It can be an arbitrary value, such as `Technology` or `Community`.
- `{AUTHOR_1, AUTHOR_2, ...}` are the names of the authors defined in the `authors.yaml` file. To find out how to define an author, [read this document](./create-author.md).
- `{TAG_1, TAG_2, ...}` are the tags or keywords of the blog post.
- `{COVER}` is the path to the image displayed on the `/blog` page, next to the post preview itself, and as the cover of the preview link, the preview that renders when you share the link on social media.
- `{EXCERPT}` is content to be displayed on the `/blog` page. The **Read more...** button appears at the end of the paragraph.
- `{CONTENT}` is a blog post content written in Markdown/[MDX](https://mdxjs.com/) and/or HTML format.

## Add assets to the content

Follow the [Use assets](./using-assets.md) document to learn how to add assets, such as images or diagrams, to the content.

## Content example

## Headers

# This is a Heading h1

## This is a Heading h2

###### This is a Heading h6

## Emphasis

_This text will be italic_  
_This will also be italic_

**This text will be bold**  
**This will also be bold**

_You **can** combine them_

## Lists

### Unordered

- Item 1
- Item 2
- Item 2a
- Item 2b

### Ordered

1. Item 1
1. Item 2
1. Item 3
1. Item 3a
1. Item 3b

## Images

![Cennso default thumbnail](/assets/thumbnails/cennso-thumbnail.jpeg)

## Links

You may be using [Cennso Documentation Portal](https://cloud.cennso.com/).

## Blockquotes

> Markdown is a lightweight markup language with plain-text-formatting syntax, created in 2004 by John Gruber with Aaron Swartz.
>
> > Markdown is often used to format readme files, for writing messages in online discussion forums, and to create rich text using a plain text editor.

## Tables

| Left columns | Right columns |
| ------------ | :-----------: |
| left foo     |   right foo   |
| left bar     |   right bar   |
| left baz     |   right baz   |
| left `code`  | right `code`  |

## Blocks of code

```
lol
```

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  selector:
    app.kubernetes.io/name: MyApp
  ports:
    - protocol: TCP
      port: 80
      targetPort: 9376
```

## Long blocks of code

```sh
Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum

Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum
```

## Link to assets

Link to [asset](./assets/docker-images.svg).

## Inline code

This web site is using `react-markdown`.