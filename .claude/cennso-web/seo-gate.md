# seo-gate: cennso-website

## Metadata bands this repository enforces

`scripts/validate-seo.py` reads the built HTML in `.next/server/pages/**/*.html`
and the sitemap. The rules are in constitution VI (CENNSO-4534), and the
script's docstring lists them. Structure is an ERROR: one
`<title>` per page, the pattern `<page name> · Cennso` (home page: starts with
"Cennso"), `og:title` = the page name, unique titles and descriptions,
`og:site_name` "Cennso", `og:locale` `en_US`, `twitter:card`, one `theme-color`
per theme, canonical = `og:url` = the page's own address (home page with its
slash), the 404 page noindex with no canonical, and the sitemap listing exactly
the canonical URLs, and robots.txt (the Content Signals policy word for word,
one `*` group, Content-Signal, `Allow: /`, no Disallow, the sitemap and llms
addresses), and the icons (every page links favicon.ico, icon.svg, icon.png,
the Apple icon and the manifest; the files exist at their sizes, the Apple icon,
the maskable icon and the logo opaque; the manifest's icons exist). Lengths are
WARNINGS only - a title over 60 characters, a
description outside 50-160 - so a long success-story title passes the build and
is a review call, not a defect.

## Structured data per page type

Since CENNSO-4534, `components/SEO.tsx` writes ONE `@graph` per page, built by
`lib/seo/schema/graph.ts` from `siteMetadata`: the Organization
(`https://www.cennso.com/#organization` - other sites name it as their
publisher, so its `@id` must never change) and the WebSite on every page but the
404, plus what `SEO`'s `pageType` says the page is:

| Page type | `pageType` | Node | Built by |
| --- | --- | --- | --- |
| every page but 404 | - | Organization, WebSite | `graph.ts` `organizationNode`, `websiteNode` |
| success story | `article` | Article (no dates: the content has none) | `graph.ts` `articleNode` |
| contact | `contact` | ContactPage | `graph.ts` `contactPageNode` |
| blog post (disabled) | `structuredData` | BlogPosting | `lib/seo/schema/article.ts` |
| solutions index (disabled) | `structuredData` | FAQPage | `lib/seo/schema/faq.ts` |
| (nested only) | - | Person | `article.ts` (blog author) |

The breadcrumb trail is written by `components/PageHeader.tsx`, which draws the
visible one, as its own block - only when it has two or more crumbs (no house
crumb), so today only on success stories. The address, phone, VAT ID and
profiles are `siteMetadata.contact` / `siteMetadata.social.profiles`, the same
data as Cennso's imprint in the PDFs and the cloud portal.

`scripts/validate-structured-data.py` checks the graph: the module docstring
lists every rule.

## The rule that fails a build

`scripts/check-navigable.py:161-170` matches the regex `<SEO\s` — `<SEO` followed
by any whitespace — in every file under `pages/`, excluding `pages/api/`. A page
that renders metadata any other way fails with an ERROR, not a warning. Treat the
removal of a `<SEO` call from a page as critical.

## Commands

`yarn seo` runs `seo:validate`, `seo:schema` and `seo:links`. All three read built
HTML, so they need `yarn build` first. `yarn validate:ogimages` is separate.

## Also immune to markup changes

`validate-seo.py`, `validate-structured-data.py`, `check-internal-links.py` and
`validate-og-images.py` all parse `.next/server/pages/**/*.html` — the build's
rendered output — not `.tsx` source, so it makes no difference to them whether a
heading or image came from a literal tag or a `@cennso/ui` component. This is
the working precedent `docs/accessibility-checkers-and-cennso-ui.md` points to
for fixing the five a11y checkers that are not similarly immune (four blind —
`check-text-alternatives`, `check-semantic-structure`, `check-navigable`,
`check-compatible` — plus one false positive, `check-input-assistance`).

## Out of scope for this gate

`content/privacy-policy.md` links to `https://dg-datenschutz.de/dienstleistungen/`,
which is dead. `scripts/check-internal-links.py` explicitly skips external links
(`check-internal-links.py:68`), so this is not caught there — it is caught by the
separate `.github/workflows/link-check.yml` ("Link check") CI job, which runs
`lychee` against all `**/*.md` on any PR touching Markdown. Pre-existing, not this
diff's fault; do not attribute it to a change that happens to touch the same file.
