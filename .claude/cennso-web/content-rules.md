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

## Form field labels are an established exception, not a new violation

`components/Contact/ContactForm.tsx` and `components/Jobs/JobForm.tsx` both
hardcode their visible `<label>` text ("First name:", "Company:", "Message:",
etc.) directly in the component, not through any `content/*.yaml` file. This
predates phase 4 and is the existing convention for short structural form
labels specifically — distinct from page/section body copy, which does
consistently live in YAML. Phase 4's `ContactForm.tsx` rewrite kept this
exact pattern (only the wrapping element changed, `FormLabel` → a plain
`<label>`; the label text itself is unchanged), which is following the
convention, not introducing it. Do not flag these labels, in either file, as
a new hardcoding defect; if a future diff moves form copy into content files
as a deliberate change of convention, that's a different, self-evidently
intentional diff, not one to infer from an unrelated touch.

## A content value that looks wrong is not this reviewer's finding

`content/landing-page.yaml`'s `sections.stats.cards[1].figure: '21'` sits
under a title that reads "Over 20 years Experience" — a mismatch between the
figure and the title text, shipped as drawn from the source design and
called out as deliberate in a comment in the same YAML file. This is a
content-accuracy question the designer owns, not a hardcoding-location
defect: the value **is** correctly sourced from `content/landing-page.yaml`,
which is all this reviewer judges. Do not raise a finding (or route one
through `unverifiable`) over content that looks internally inconsistent but
is properly stored in a content file — that determination belongs to
whoever owns the design, not to a reviewer checking where strings live.

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
