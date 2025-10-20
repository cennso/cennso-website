# Create a partner profile

This document describes how to write a partner profile and publish it on the Cennso website.

Follow these steps to add a new partner profile:

1. Fetch the `cennso-website` repository and create a new branch in the local repository.
2. Create a new entry in the `/content/partners.yaml` file that contains partner profiles.
3. Create a pull request.
4. Wait for the review.
5. After the merge, the site rebuilds automatically and the partner profile appears.

The document with a partner profile should include metadata in the following format:

```yaml
partners:
  - name: {PARTNER_NAME}
    content: {PARTNER_CONTENT}
    logo: {PARTNER_LOGO}
    link: {PARTNER_LINK}
  - ...
  - ...
```

Replace these parameters with real values:

- `{PARTNER_NAME}` is the name of the partner.
- `{PARTNER_CONTENT}` is the description of the partnership.
- `{PARTNER_LOGO}` is the path to the logo of the partner.
- `{PARTNER_LINK}` is an optional link with which the partnership is associated. For example, it can be a link to a success story, blog post, or external website.
