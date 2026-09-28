# design-fidelity-gate: cennso-website

## The command

`yarn design:fidelity` runs `scripts/check-design-fidelity.mjs`. It is the last
step of `yarn check:all` and its own job in the `Verify Cennso Website` matrix.

```bash
yarn design:fidelity             # self-test, then assert the built site (yarn build first)
yarn design:fidelity:selftest    # the proof suite alone — no build, no site
yarn design:fingerprints         # current digests for the pending frames
```

It launches Chrome through `chrome-launcher` + `puppeteer-core`, serves the
existing `.next` build with `next start` on port 3210, and compares
`getComputedStyle` values against `design/figma/snapshot.json`. CI cannot reach
Figma, so the snapshot is the ground truth and this check only compares.

## What it asserts

- **Tokens** — a CSS expression (`hsl(var(--primary))`) resolved through the real
  cascade, per theme, against the hex a named Figma node actually uses. This is
  the answer to "I sampled it and no token matched".
- **Frame elements** — per Figma node: font family/weight/size, line height,
  letter spacing, text, colour, background, border colour/width/radius, padding,
  gap, box size, SVG `fill`, and the asset an element resolved to.
- **Per-theme artwork** — `themePairedAssets` asserts the dark and light frames
  load *different* files. The Phase 4 light-art-on-dark-page defect is this rule.
- **Both themes** — each route is opened once per theme, with the theme forced
  through `localStorage` before first paint, and the run aborts if
  `<html data-theme>` does not come back as the snapshot asked.

## Why it cannot pass without checking

This repo has shipped a build guard with three fail-open paths before (missing
inputs returned early, a parser finding zero items passed vacuously, a
non-recursive scan silently skipped 77 files). Every one of these is a hard
failure here, and `yarn design:fidelity:selftest` proves each on every run
against fixture pages:

| Degenerate input                                 | Result                            |
| ------------------------------------------------ | --------------------------------- |
| snapshot missing / not JSON / empty object        | abort                             |
| `tokens: []` or `frames: []`                      | abort                             |
| frame with `elements: []`                         | abort                             |
| element with `expect: {}`                         | abort                             |
| unknown property name in `expect`                 | abort                             |
| `tolerance` above the cap of 4                    | abort                             |
| dangling `themePairedAssets` reference            | abort                             |
| uncovered frame with no written reason            | abort                             |
| selector matching 0 elements                      | abort                             |
| selector matching 2 elements                      | abort                             |
| selector matching a hidden / zero-sized element   | abort                             |
| route 404s, 500s, throws, or renders empty        | abort                             |
| page renders in the wrong theme                   | abort                             |
| `var()` naming a custom property that is not set  | abort                             |
| Chrome missing                                    | abort (never "skipped")           |
| executed assertion count ≠ declared count         | abort                             |

Plus a **positive control**: a fixture page that matches its snapshot must pass,
so "always red" cannot masquerade as a working check either. If any self-test
case misbehaves, the run aborts before it says anything about the site.

**Never make a failure go away by loosening the snapshot.** Widening a
`tolerance`, deleting an `expect` key, or flipping a frame back to
`awaiting-implementation` is the same defect class as editing a check script.

## What it does not cover

- **Layout and spacing between elements.** It reads one element at a time; it
  does not assert that the hero sits 135px from the top of the frame.
- **Responsive breakpoints.** Everything is asserted at the Figma frame width
  (1360px). Mobile is Lighthouse's and `yarn perf:mobile`'s problem.
- **Anything not in the snapshot.** `designFrames` is the coverage ledger and
  prints on every run. Four of the six design frames (`1:585`, `1:1062`,
  `1:3471`, `1:7084` — use-cases and contact, both themes) are `not-captured`
  and must be pulled before those pages are rebuilt.
- **Frames marked `awaiting-implementation`.** Their assertions are held back
  until the page implements the frame. They are not silent: the frame lists the
  files that will implement it and their combined SHA-256, and **the check fails
  the moment any of those files changes** while the frame is still pending. The
  fix is to enforce the frame, not to re-baseline the digest out of habit.

## Reviewing a change that touches design

- A new asserted element should be a JSON edit in `design/figma/snapshot.json`,
  with a `figmaNode` and an `implementedIn`. New code in
  `scripts/design-fidelity/` means a genuinely new property type — check that.
- A value with no `figmaNode` behind it is not ground truth. Reject it.
- A frame flipped from `awaiting-implementation` to `enforced` should arrive with
  the selectors filled in and the check passing — see `design/figma/README.md`.
