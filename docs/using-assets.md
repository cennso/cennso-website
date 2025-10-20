## Use assets

Each asset must be located in the `/public/assets` folder. To organise the content in the repository, it is best to create a separate folder with the same name as the name of the Markdown file in the `/public/assets/{CONTENT_KIND}` folder and place the assets inside. For example, if you create content for a blog post with markdown file name as `release-notes-1.0.0.md`, create a folder `/public/assets/blog-posts/release-notes-1.0.0` and put the related files there. Then, links to a particular asset should have the following path: `/assets/blog-posts/release-notes-1.0.0/{ASSET_FILE_NAME}`.

> **NOTE**: `CONTENT_KIND` should be named identically to the folders in the `/content` folder.

Follow this pattern to add assets, such as images or `.yaml` files, to markdown content:

```markdown
![{ALT_TITLE}](/assets/{ASSET_LOCATION} '{TEXT_WHILE_HOVERING}')
```

Replace these parameters with real values:

- `{ALT_TITLE}` is the text which appears if the image cannot appear for some reason.
- `{TEXT_WHILE_HOVERING}` is the text which appears when you move the mouse pointer over the image. This parameter is optional.

You can use an absolute link instead of a relative path to the image.

Example:

```markdown
# local asset

![Diagram](/assets/blog-posts/release-notes-1.0.0/diagram.svg 'This is a diagram!')

# asset from web

![Smoking kitty](https://www.meme-arsenal.com/memes/43b756fba8ab99cfaf6e25f8142194fe.jpg 'What a cute smoking kitty!')
```

## Link between pages

Links in markdown content should use an absolute format. Use this pattern to add links to other pages in Cennso Website:

```markdown
[Link description]({PATH})
```

Example:

```markdown
[Check out our latest blog posts](/blog).
```
