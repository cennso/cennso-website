# Figma ground truth — how the design-fidelity review is fed

The design is **not** in this repository. It is fetched from Figma, live, every
time the review runs.

That is the whole design decision, and it is worth being explicit about why.
This harness first shipped with six raw `get_design_context` dumps and a
generated inventory committed here — 10,658 lines of the Figma file — so that CI
could compare without Figma access. Size was the lesser problem. **A committed
copy goes stale silently.** The designer edits Figma, the comparison keeps
measuring the site against last month's frames, and it stays green while the
site drifts. That is the exact failure this harness exists to catch, so it must
not be built on the thing that causes it.

The Figma MCP tool is available to an agent working locally. So: fetch live, at
review time, locally.

## What is committed here, and what is not

| File              | What it is                                                                                    | Committed |
| ----------------- | --------------------------------------------------------------------------------------------- | --------- |
| `frames.json`     | The route ↔ frame mapping: which route is supposed to look like which Figma node, per theme. | yes       |
| `exclusions.json` | Every node the enumeration cannot compare, each with a written reason.                        | yes       |
| the frames        | The `get_design_context` output per frame, fetched per review.                                | **never** |

`frames.json` and `exclusions.json` are configuration. Neither holds a design
value: the first says which frame a route answers to, the second says which
nodes a reviewer has agreed cannot be compared and why. The frames themselves
land in a scratch directory outside the repository and are thrown away.

Two rules keep that true, and both are enforced by the script rather than
written down and hoped for:

- **A dump may not live anywhere git would track it.** Outside the working tree
  is fine; inside it, only if git already ignores the path. Otherwise the run
  aborts.
- **A dump older than an hour is refused.** "Fetched live" has to mean this
  review, not a dump left over from last week — which is the committed-copy
  problem again, wearing a temp directory.

## Prerequisite: the Figma MCP, enabled and authenticated

**The review cannot run without it, and there is no fallback.** Nothing from
Figma is committed, so if the design cannot be fetched there is nothing to
compare against. That is deliberate — see above — but it means the Figma MCP
server is a hard requirement for anyone performing this review, not a
convenience.

What a developer needs, all three:

1. **The Figma MCP server enabled** in their Claude Code session. It appears as
   `claude.ai Figma`, and provides `get_design_context`, `get_metadata` and
   `get_screenshot`. Check with `/mcp` in an interactive session; a server that
   is configured but failed to connect is listed there too, and its tools will
   not be callable.
2. **That connector authenticated.** Authorisation happens through the
   claude.ai connector settings, not from inside a session — a non-interactive
   session cannot complete the OAuth flow, so authorise it before starting the
   work.
3. **Access to the design file itself.** Being authenticated is not the same as
   being able to open `OqKo0g7Hb85V8YlEVYWUhf`. An account without access to
   the file gets an error on the first `get_design_context` call.

If any of the three is missing, stop and say so. Do **not** work around it with
an older dump lying around in the scratch directory: the freshness guard exists
precisely to stop that, and it will refuse anything over an hour old.

Note the review uses only the read tools above. It does not use Code Connect,
which needs a Dev or Full seat on an Organization or Enterprise plan — so that
plan level is _not_ a prerequisite here.

## Running a review

```bash
yarn design:review:where          # where to write the dumps, and under what names
yarn design:review --frames=…     # self-test, then diff those frames against the built site
yarn design:review                # every frame in frames.json
yarn design:review:selftest       # the proof suite alone — no dumps, no site, no Figma
```

The Stop hook `.claude/hooks/design-fidelity-review.sh` starts this off: when a
branch changes `pages/`, `components/`, `styles/`, `public/assets/` or
`tailwind.config.js`, it works out which frames that reaches and emits the
review to perform. It cannot perform it itself — a hook is a shell script and
cannot call MCP tools.

The review is **not** part of `yarn check:all` and **not** a CI job. CI has no
Figma access, and the only way to give it one was the committed copy this
replaced.

### The procedure, in full

1. `yarn design:review:where`. It prints the Figma file key, the scratch
   directory, the file name per frame, and the symbols that must come back
   expanded.
2. For each frame in scope, call `get_design_context` **once**, on that frame's
   node id. One call returns the whole frame with its symbols expanded, and that
   expansion is the enumeration source — it is what makes the nav's typography,
   its logo colour and its CTA readable values instead of a picture of a
   navigation. Save the code block **unmodified**, including the
   `const img… = "https://…"` constants at the top: the artwork colours are read
   from those URLs, and Figma expires them about a week after the pull.
3. `yarn build`, then `yarn design:review --frames=…`.
4. Report what the script prints: **design nodes, matched, mismatched,
   unreached**, per frame and in total. "It matches Figma" with no counts behind
   it is not an answer.

Large nodes overflow the MCP response limit and get written to a file instead;
read that file rather than re-requesting a smaller slice blindly.

## What the review actually compares

Every text node the frame declares, matched to the rendered DOM **by its own
text content**, with every property diffed — and then it says out loud how many
design nodes it could not reach.

That last number is the point. A curated list of assertions can only ever check
what somebody thought to list. Every defect the site owner found after the first
version of this harness shipped was a property nobody had listed: card headings
left-aligned where the design centres them, a card outline drawn fully opaque
where Figma dims fill _and_ border together at `opacity-41`, a footer band
`#0d406a` in dark where the dark frame's band is the frame fill `#001A2A`, a
32px heading→body gap against a designed 13px, illustrations recoloured away
from `#ffb31b`. **An unreached design node is a finding, not a silent pass.**

### How a design node is found on the page

By its text, normalised for whitespace, case, curly quotes and dashes — **and by
where the design puts it.** Text alone is not a key, and treating it as one made
the first full six-frame run 43% noise: "Book demo" is in the header and in the
hero, the nav and the footer share half their links, `/contact` renders two
partner blocks. Pairing those by text and then sorting by vertical position
paired the design's footer against the page's nav and swapped the two CTAs — then
reported both swapped values as defects, when direct measurement showed both
rendered exactly as designed.

Three things decide a pair, in this order:

1. **Unique copy first.** A string that appears once in the frame and once on the
   page cannot be cross-paired. Those pairs are anchors, and they are trusted.
2. **Position, projected through the anchors.** The artboard and the page are
   never the same height, so a design Y cannot be compared with a rendered Y
   directly. The anchors give a monotone design-Y → rendered-Y map fitted to that
   page — by its longest non-decreasing run, so one bad anchor cannot drag the
   rest. Horizontally the two sides share a scale, because the frames are drawn at
   the viewport width.
3. **Containment.** The design tree says which container a node came from; the
   anchors inside that container say which element on the page it became. A node
   from the Footer symbol may then only pair inside the page's footer.

**Where those three still leave a choice, the pair is reported as an ambiguity
rather than guessed.** A wrong pairing is worse than an admitted one: it costs a
reader the trust they need to act on every other finding.

A repeated-copy group whose two sides are different sizes is **not** guessed at
either — that mismatch is itself the finding.

A Figma text layer holding several lines is tried whole first and then line by
line, because "Success Stories / About / Blog" is one layer in Figma and three
anchors on the page. Each line carries its own position, stacked down from the
layer's, so a footer column's lines cannot drift up into the identically worded
nav. A layer whose lines ALL fail to match is reported once, as one missing
layer, not three times.

Boxes have no text, so two bridges are tried. Through the text they enclose:
the design text nodes inside the box landed somewhere, and the element among
their shared ancestors whose position matches the design's wins — not simply the
nearest, which is how a footer band came to be compared against `<body>` and a
24px radius against the contact form. Or, for a box enclosing no text at all,
through geometry: same left, same width, same projected height, and a top where
the anchors say it should be, with a unique winner required. **A box that neither
bridge reaches is reported as unreached, never bridged to something implausible.**

Vertical gaps between stacked copy are measured in the frame and compared against
the rendered geometry — edge to edge where the frame resolves a height, and top to
top where `leading-[normal]` leaves it without one.

### Artwork

Illustrations are compared as images, not as colour lists. The frame's export for
a node is fetched, so is the file the page actually served at that position, and
both are decoded in the browser that is already open and reduced to a coarse
dominant palette. A colour the design's artwork is substantially made of that the
served image does not have, within tolerance, is a finding.

It is deliberately not a pixel diff: our assets are re-encoded WebP at different
dimensions, so pixel equality would fail on every correct image and prove nothing.
It is also not what was here before — that read `fill` off the page's `<svg>`
elements, and since the illustrations ship as WebP it never once looked inside
one. All fourteen of its findings on the last full run were the same non-finding,
while a genuinely orange illustration in a frame that draws `#ffb31b` went
unreported.

Two guards keep it honest. A design node and an `<img>` can share a rectangle
without being the same picture — Figma composes, the site flattens — so where the
two palettes are concentrated very differently (the contact frame's flat amber
ring against the photograph the page puts inside it) the bridge is not believed
and the node is counted as not compared. And a Figma layer that draws an image is
not counted as a box at all: three out of five "design boxes" are vector fragments
inside one flattened WebP, with no element to be bridged to.

Separately, **dark and light must resolve to different files** wherever the design
draws that position's artwork differently. One file for both is a defect even when
it looks fine in the theme it was drawn for — it is how the light hero shipped
into dark mode.

### Compositing

`opacity-41` on a Figma layer dims its fill **and** its border. The enumeration
records the opacity as its own value and composites it onto both before
comparing, against a DOM side that composites element opacity the same way.
Comparing raw values is what makes a dimmed outline read as correct.

## Why computed values and not a pixel diff

Rendering Figma frames and diffing them against screenshots fails on
antialiasing, font hinting and subpixel layout long before it fails on real
drift. Every comparison here is a specific value read with `getComputedStyle` —
`48px`, `#ffb31b`, `700`, `37px` — so a finding names a property, not a region
of pixels.

Both themes are covered: each route is opened once per theme, with the theme
forced through `localStorage` before first paint, and the run aborts if
`<html data-theme>` does not come back as `frames.json` asked.

Everything is compared at the Figma frame width (**1360px**), and the report says
so on every run, next to every number. There are no mobile artboards in this Figma
file, so there is nothing below 1360px to compare against and none of these counts
is a claim about narrow screens — "62% matched" is 62% of one viewport. Mobile is
Lighthouse's and `yarn perf:mobile`'s problem.

## `exclusions.json` — the only way a node stops being checked

The enumeration has exactly one escape hatch, and it is loud. An entry needs the
frame, the node key, the properties it covers (`["*"]` for the whole node) and a
**written reason of at least 40 characters**. Three rules keep it honest:

- A reason that is a shrug ("flaky", "todo") is rejected on length.
- When a frame is fetched for a review, an entry naming a node that frame no
  longer contains is a hard failure — so an exclusion cannot outlive the design
  node it was written for. (An entry for a frame that was not fetched this time
  is simply not checked; inventing a verdict either way would be worse.)
- The same node cannot be excluded twice with two different stories.

An entry is written against the layer a reviewer sees in Figma, and it covers
**the line-level nodes read out of that layer** as well. It did not, once:
`I1:1533;1:579` never matched `I1:1533;1:579:L1`, and the occluded duplicate
Footer in `use-cases-light` leaked a dozen findings past an exclusion that named
it exactly. A node excluded with `["*"]` also leaves the matching entirely — while
the occluded footer still competed for elements, the _visible_ footer's links
became unpairable, because two design nodes claimed the same place on the page.

The reasons currently written down are of three kinds: placeholder copy the
frame invents where the page renders CMS content, a footer layer the designer
left fully occluded behind another one, and the frozen 2023 copyright line the
site composes at render time.

## Why it cannot pass without checking

This repo has shipped build guards with fail-open paths before (missing inputs
returned early, a parser finding zero items passed vacuously, a non-recursive
scan silently skipped 77 files). Every degenerate input here is a hard failure,
and `yarn design:review:selftest` proves each one on every run — including
before every real review, so the review refuses to say anything about the site
if the harness is not behaving.

| Degenerate input                                              | Result                  |
| ------------------------------------------------------------- | ----------------------- |
| mapping missing, unparseable, or written for another schema   | abort                   |
| mapping with no frames, duplicate ids, or two frames per node | abort                   |
| a frame naming a theme the mapping never declares             | abort                   |
| a theme with no way to force it, or no way to prove it stuck  | abort                   |
| dumps written where git would track them                      | abort                   |
| a dump that was never fetched, or is empty                    | abort                   |
| a dump older than the freshness window                        | abort                   |
| a dump whose Figma node is not the frame's node               | abort                   |
| a dump that parses to zero nodes, or to zero text             | abort                   |
| a review that selects no frames                               | abort                   |
| `--frames` naming a frame the mapping does not declare        | abort                   |
| route 404s, 500s, throws, or renders empty                    | abort                   |
| page renders in the wrong theme                               | abort                   |
| Chrome missing                                                | abort (never "skipped") |
| a design node nothing on the page renders                     | finding                 |
| a property, a gap or a box width that differs                 | finding                 |
| a fill or border compared without compositing its opacity     | finding                 |
| a dominant artwork colour the served image does not have      | finding                 |
| one file served for both themes where the design differs      | finding                 |
| repeated copy the matcher cannot pair confidently             | finding                 |
| identical copy in two regions paired across them              | proven not to happen    |
| exclusion with no reason, a shrug reason, or a dangling node  | abort                   |

Plus **positive controls**: the committed mapping must load, a fresh dump must
be read and enumerated, and a fixture page that matches its design must pass —
so "always red" cannot masquerade as a working review either.

**Never make a finding go away by loosening the harness.** Adding an exclusion
without a reason a reviewer would accept is the same defect class as editing a
check script.

## The rules this file encodes

Phase 4 shipped `/` substantially off-design with every automated gate green.
The root causes, and what this does about each:

1. **Symbols were never expanded.** `1:99` rendered as a picture of a nav, so its
   typography, logo colour and CTA were never read. → one `get_design_context`
   call per frame returns it expanded, and `frames.json` names the symbols that
   matter (`1:99` Header, `1:575` Footer, `1:606` btn_More).
2. **Work was screenshot-driven.** Hues sampled off a rendered image
   (206°/196°/175°) were _composited_ colours; the raw fills matched
   `glow-blue`/`glow-cyan`/`glow-teal` exactly. **A composited colour is not a
   fill.** → every value compared here comes from a node, and every finding names
   the node it came from.
3. **Implementation started from the existing site.** Anything that already
   looked plausible was never compared. → the enumeration starts from the frame
   and reports what it could not reach.
4. **One theme's artwork shipped into the other.** The design draws the hero, the
   logo and the nav CTA separately per theme. → both themes are reviewed, the
   served image's palette is compared against the frame's own export, and a
   position the design draws differently per theme that resolves to ONE file is a
   finding.
5. **Nothing checked fidelity, and then something checked a stale copy of it.** →
   this reviews the live file, refuses a stale dump, and fails closed on every
   degenerate input, proven on every run by
   `scripts/design-fidelity/selftest.mjs`.
