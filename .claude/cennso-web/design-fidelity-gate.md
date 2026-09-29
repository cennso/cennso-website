# design-fidelity-gate: cennso-website

## It is a local review, not a CI gate

There is no `design:fidelity` job in the `Verify Cennso Website` matrix, and
`yarn check:all` does not run it. Both existed and both were removed, because
the only way to check fidelity in CI was to commit a copy of the Figma file —
and a committed copy goes stale silently. The designer edits Figma, CI keeps
comparing the site against last month's frames, and the build stays green while
the site drifts. That is the failure the harness exists to catch.

So the design is fetched live, locally, by an agent that has the Figma MCP tool,
every time the review runs.

```bash
yarn design:review:where          # where to write the fetched frames, and under what names
yarn design:review --frames=…     # self-test, then diff those frames against the built site
yarn design:review:selftest       # the proof suite alone — no dumps, no site, no Figma
```

`.claude/hooks/design-fidelity-review.sh` (Stop hook, once per session) starts
it: when the branch changed `pages/`, `components/`, `styles/`,
`public/assets/` or `tailwind.config.js` and a frame in `design/figma/frames.json`
covers what changed, it emits the review to perform. It cannot perform it — a
hook is a shell script and cannot call MCP tools. A shared surface
(`components/`, `styles/`, `tailwind.config.js`, `public/assets/`) puts all six
frames in scope; a page puts its own two in scope; a page no frame covers fires
nothing.

## What is committed, and what must never be

`design/figma/` holds **two configuration files and no design values**:
`frames.json` (route ↔ node ↔ theme) and `exclusions.json` (what cannot be
compared, and why). The frames themselves go to a scratch directory outside the
repository and are thrown away.

Two rules, both enforced by the script:

- a dump may not live anywhere git would track it (outside the tree, or a path
  git already ignores);
- a dump older than an hour is refused — a stale dump is the committed copy of
  the design by another name.

**A PR that adds a `get_design_context` dump, an inventory, or a snapshot of
design values back under `design/` is reintroducing the defect this branch
removed. Reject it.**

## What the review compares

- **Every text node in every frame under review**, matched to the DOM by its own
  text content _and_ by where the design puts it, with font family/weight/size,
  line height, letter spacing, transform, decoration, alignment and colour
  diffed on each match. Text alone is not a key: "Book demo" is in the header and
  in the hero, the nav and the footer share half their links, and `/contact`
  renders two partner blocks. Copy that appears once on both sides is paired
  first and calibrates a design-Y → rendered-Y projection; everything repeated is
  placed through that and through containment (a node from the Footer symbol may
  only pair inside the page's footer). **A pair that still cannot be decided is
  reported as an ambiguity, not guessed** — a wrong pairing costs the reader the
  trust they need for every other finding.
- **Boxes**, bridged either through the text they enclose or, where they enclose
  none, through geometry alone: fill, border colour and width, radius and width,
  with element opacity composited onto fill _and_ border before comparison. A box
  that cannot be bridged confidently is reported as unreached, never bridged to
  whatever was nearest.
- **Vertical gaps** between stacked copy, edge to edge where the frame gives a
  height and top to top where it does not.
- **Artwork**, by fetching the image Figma exported for the node and the image
  the page actually served for it and comparing their dominant palettes. Both are
  decoded in the browser, so WebP is readable; the tolerance is a palette
  distance, not pixel equality, because our assets are re-encoded at different
  dimensions. Plus the theme-paired rule: where the two frames draw a position's
  artwork differently, the two themes must resolve to different files.
- **Both themes**, forced through `localStorage` before first paint, at 1360px.
  The run aborts if `<html data-theme>` does not come back as the mapping asked.

## The counts are the deliverable

The script prints four numbers per frame and in total: **design nodes, matched,
mismatched, unreached**.

A review that ends "the page matches Figma" with no counts behind it is not an
acceptable answer, and neither is one where the agent eyeballed the comparison
instead of running the script. An unreached design node means nobody is checking
it — which is the state every defect this harness was built for shipped in.

## Why it cannot pass without checking

`yarn design:review:selftest` runs before every real review and proves the
harness still fails on degenerate input. Aborts: a missing, unparseable or
wrong-schema mapping; a mapping with no frames, duplicate ids or two frames on
one node; a frame naming an undeclared theme; a theme that cannot be forced or
cannot be proved to have applied; dumps written where git would track them; a
dump never fetched, empty, stale, or belonging to a different frame; a dump that
parses to zero nodes or zero text; a review selecting no frames; `--frames`
naming an unknown frame; a route that 404s, 500s, throws or renders empty; a
page in the wrong theme; a missing Chrome; an exclusion with no reason, a shrug
reason, a dangling node or a duplicate story. Findings: an unrendered design
node, a differing property, gap or width, an uncomposited fill or border, a
dominant artwork colour the served image does not have, one file serving both
themes where the design draws them differently, and a repeated string the matcher
cannot pair confidently.

Plus positive controls — the committed mapping loads, a fresh dump enumerates,
and a fixture page matching its design passes — so "always red" cannot
masquerade as a working review. If any case misbehaves, the run aborts before it
says anything about the site.

## What it does not cover

- **Responsive breakpoints.** Everything is compared at the Figma frame width
  (1360px), and the report says so on every run. There are no mobile artboards in
  this Figma file, so there is nothing below 1360px to compare against and none of
  these numbers is a claim about narrow screens — "62% matched" is 62% of one
  viewport. Mobile is Lighthouse's and `yarn perf:mobile`'s problem.
- **Frames nobody fetched.** The review covers the frames passed to `--frames`.
  If a change reached a route whose frame was not fetched, that route was not
  reviewed — say so rather than implying coverage.
- **Routes the design does not have.** `frames.json` maps `/`,
  `/success-stories` and `/contact`. A change to `/about` or `/blog` has no
  frame to compare against; that is a gap to name, not a pass.

## Reviewing a change that touches design

- New entries in `design/figma/frames.json` are configuration: a node id, a
  route, a theme. A design **value** appearing anywhere under `design/` is the
  defect described above.
- A new exclusion needs a reason a reviewer can disagree with. "Flaky" is
  rejected on length; "the copy is CMS-driven, so the frame's placeholder
  headline is not a value the page can match" is an argument.
- New code in `scripts/design-fidelity/` means a genuinely new property type or
  a new matching rule — check that, and check the self-test grew a case for it.
- A colour, size or spacing cited in a review comment without a Figma node id
  behind it is citing a pixel. Reject it.
