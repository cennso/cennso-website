# content-rules: cennso-website

## Where copy lives

- `content/*.yaml` — per-page copy (e.g. `content/success-stories-page.yaml`,
  `content/contact-page.yaml`, `content/landing-page.yaml`).
- `content/blog-posts/`, `content/jobs/`, `content/solutions/`,
  `content/success-stories/` — MDX content collections.
- `content/footer.yaml` — footer copy.
- `content/authors.yaml` — author/person records.
- `content/imprint.md` and `content/privacy-policy.md` — the two legal pages.

A page reads its own YAML in `getStaticProps` and passes it down as props; a
string literal rendered as visible copy directly in a component (rather than
read from one of these sources) is a finding.

## What is not copy

Do not flag: a `data-slot` value, a class name, a test id, a `key` prop, or a
URL. These are structural/identifying strings, not content a copy editor
would ever touch, even when they look like English words.

## The `industrySelectLabel`-shaped hazard

Page copy is read through nested property access
(`content.content.industrySelectLabel` in `pages/success-stories/index.tsx:127`,
sourced from `content/success-stories-page.yaml`). A YAML key rename or a
`getStaticProps` shape change that leaves the two sides of that dotted path
out of sync produces an empty string silently — no type error, since the
prop is typed as `string` either way, just an empty `sr-only` label at
runtime. Treat any renamed/restructured content YAML key as a reason to
verify every page that reads it, not just the one being edited.

## The MDX silent-drop hazard

`lib/mdx.ts`'s `parseMDX` calls `next-mdx-remote`'s `serialize()`. Attributes
written as JSX expressions in MDX source (e.g. `width={1379}`) can arrive as
`undefined` at render time when the consuming component or serialization path
doesn't evaluate the expression scope the MDX file assumes — the build
succeeds either way, because the failure is a missing prop value, not a type
or syntax error. Use quoted string attributes (`width="1379"`) in MDX content
and let the consuming component parse/coerce, rather than relying on a raw
JSX expression surviving the round trip. Flag an MDX file using `{}`-expression
attributes as worth a manual render check, not an automatic pass because
`yarn build` succeeded.
