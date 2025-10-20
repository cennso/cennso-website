# Set up a local environment

This document describes how to set up a local environment to add or change content in the Cennso website using GitHub Desktop.

## Prerequisites

- Code editor (the preferred one is [Visual Studio Code](https://code.visualstudio.com/))
- [GitHub Desktop](https://desktop.github.com/) as a preferred UI application for [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en/) v18 or higher
- [Yarn](https://yarnpkg.com/getting-started/install)
- [Github](https://github.com/) account

> **NOTE**: Node.js and Yarn are only needed if you want to set up a local environment and see changes on the local instance of the website.

## Add or change content using GitHub Desktop

> **TIP:** There is a useful YouTube tutorial on how to use GitHub Desktop. It is split into two parts:
>
> - [How to use GitHub Desktop: The easy tutorial (Part1)](https://www.youtube.com/watch?v=RPagOAUx2SQ)
> - [How to use GitHub Desktop: The easy tutorial (Part2)](https://www.youtube.com/watch?v=GOY9wMyr7pU)

Follow this flow when contributing to the `cennso-website` repository:

1. Clone the `cennso-website` repository.
2. Create a new branch in the local repository.
3. Add or change the content.
4. Commit and push your content to the remote branch.
5. Create a pull request (PR).
6. Wait for the review.
7. Apply review suggestions, if needed.
8. Wait for the approval.
9. Merge the PR.
10. After the merge, the site rebuilds automatically and the content will appear on the production website.

For more information, check out the [official GitHub flow tutorial](https://docs.github.com/en/get-started/quickstart/github-flow).

Follow the [tutorials](./README.md) to learn how to create a specific content type.

## Local instance of the website

To install all dependencies needed to set up a local instance of the website, run this command:

```bash
yarn
```

Launch the development server with the hot/auto-reloading functionality that makes any change in files from the `pages|components|lib` folder immediately visible in the browser. Run the following command:

```bash
yarn dev
```

Then, go to the `http://localhost:3000` page and start adding the given content according to the [tutorials](./README.md).
