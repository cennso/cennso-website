# Create a testimonial

This document describes how to write a testimonial and publish it on Cennso Website.

Follow these steps to add a new testimonial:

1. Fetch the `cennso-website` repository and create a new branch in the local repository.
2. Create a new entry in the `/content/testimonials.yaml` file containing testimonials.
3. Optionally, create the author of the testimonial in the [authors file](./create-author.md).
4. Make a pull request.
5. Wait for the review.
6. After the merge, the site rebuilds automatically and the testimonial appears.

The testimonial should have the following format:

```yaml
testimonials:
  - author: {TESTIMONIAL_AUTHOR}
    content: {TESTIMONIAL_CONTENT}
    link: {TESTIMONIAL_LINK}
  - ...
  - ...
```

Replace these parameters with real values:

- `{TESTIMONIAL_AUTHOR}` is the name of the author defined in the `authors.yaml` file. To find out how to define an author, [read this document](./create-author.md).
- `{TESTIMONIAL_CONTENT}` is the content of the testimonial.
- `{TESTIMONIAL_LINK}` is an optional link with which the testimonial is associated. For example, it can be a link to a success story or a blog post.
