# Create an author

This document describes how to add a new author to the registry of the website authors. Author data can later be used, for example, in blog posts.

Follow these steps to add a new author:

1. Fetch the `cennso-website` repository and create a new branch in the local repository.
2. Create a new entry in the `/content/authors.yaml` file describing the author.
3. Optionally, use the author in a [new blog post](./write-blog-post.md).
4. Make a pull request.
5. Wait for the review.
6. After the merge, the site rebuilds automatically.

The author should have the following format:

```yaml
authors:
  {AUTHOR_ID}:
    name: {AUTHOR_NAME}
    position: {AUTHOR_POSITION}
    company: {AUTHOR_COMPANY}
    email: {AUTHOR_EMAIL}
    socialLink: {AUTHOR_SOCIAL_LINK}
    avatar: {AUTHOR_AVATAR}
```

Replace these parameters with real values:

- `{AUTHOR_ID}` is a unique identifier of the author. It should be a combination of the first and last name of the author without any special characters, for example `john-smith`.
- `{AUTHOR_NAME}` is the first and last name of the author.
- `{AUTHOR_POSITION}` is the author's position title, for example `Software Engineer`.
- `{AUTHOR_COMPANY}` is the name of the company where the author works.
- `{AUTHOR_EMAIL}` is the author's email address.
- `{AUTHOR_SOCIAL_LINK}` is a social media link through which people can contact the author. It can be a link to a profile on LinkedIn, Github, Twitter etc.
- `{AUTHOR_AVATAR}` is the path to the author's avatar. It is recommended to create an avatar in the repository in the `/public/assets/avatars/{AVATAR}` folder.
