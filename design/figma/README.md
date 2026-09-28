# Figma ground truth — how the design-fidelity gate is fed

`snapshot.json` is a checked-in copy of what the Cennso Design 4.0 Figma file
says. `scripts/check-design-fidelity.mjs` renders the built site in a real
browser and asserts the live computed values against it.

The split exists for one reason: **CI cannot call Figma.** Figma access here is
an MCP tool available to a local agent, not to a GitHub Actions runner. So the
values are pulled locally, committed as data, and CI only compares.

```
Figma  --(local agent, MCP)-->  design/figma/snapshot.json  --(CI)-->  rendered site
        refresh, by hand              ground truth                     assertions
```

## Running it

```bash
yarn design:fidelity             # self-test, then assert the built site (needs yarn build first)
yarn design:fidelity:selftest    # just the proof suite — no site, no build needed
yarn design:fingerprints         # current digests of the pending frames' implementation files
```

`yarn check:all` runs `design:fidelity` last, and CI runs it as its own matrix
job. It renders with `next start` on port 3210 (override with
`DESIGN_FIDELITY_PORT`), or against an already-running server with
`--base-url=…`. It is deliberately **not** in the Lighthouse path — Lighthouse
measures a separate `next start`, so the browser this check launches never shows
up in a performance number.

## Why computed values and not a pixel diff

Rendering Figma frames and diffing them against screenshots of the site fails on
antialiasing, font hinting and subpixel layout long before it fails on real
drift. Every assertion here is a specific value read with `getComputedStyle` —
`48px`, `#ffb31b`, `700`, `37px` — so a failure names a property, not a region
of pixels.

## What the snapshot contains

| Section             | What it asserts                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `tokens`            | A CSS expression (`hsl(var(--primary))`) resolves, per theme, to the hex a named Figma node uses. |
| `frames`            | Per frame (= one Figma node, one route, one theme) a list of elements and their computed values.  |
| `themePairedAssets` | Two frames' artwork elements must resolve to **different** files — dark art is not light art.     |
| `designFrames`      | The coverage ledger: every frame in the design, captured or not, and a written reason when not.   |

### Adding an asserted element

It is a data edit, not a code change. Add an entry to the frame's `elements`:

```json
{
  "id": "main-dark-nav-blog",
  "figmaNode": "1:110",
  "figmaName": "Blog",
  "selector": "[data-figma-node=\"1:110\"]",
  "implementedIn": "components/Navigation.tsx",
  "expect": {
    "fontFamily": "Poppins",
    "fontWeight": "500",
    "fontSize": "18px",
    "color": "#ffffff",
    "text": "Blog"
  }
}
```

`id` is unique across the whole file. `selector` must match **exactly one**
rendered element — zero and two are both hard failures. The durable selector is
a `data-figma-node` attribute on the element that implements the node; a
structural selector (`main h1`) is fine where the structure is the contract.
`implementedIn` is what the failure message tells the reader to open.

The property names allowed in `expect` are the keys of `PROPERTIES` in
`scripts/design-fidelity/properties.mjs`. An unknown one is a hard error, so a
typo can never quietly assert nothing. A new property means a new extractor
there — that is the only case that needs code.

`tolerance` (per-channel for colours, px for lengths) defaults to `0` and is
capped at `4`. Token assertions carry `2` because the design's hex goes through
an HSL token pipeline that rounds. Nothing else should need it.

### Frame status

- `enforced` — assertions run on every CI build.
- `awaiting-implementation` — the page does not implement the frame yet. The
  assertions are held back, but the frame must list
  `implementationFingerprint.files` and their combined digest. **If any of those
  files changes while the frame is still pending, the check fails.** That is
  what stops a pending frame from being a permanent, silent hole: the first
  commit that touches the hero or the nav has to either enforce the frame or
  re-baseline the digest in a reviewable diff.

  ```bash
  yarn design:fingerprints   # prints the current digest to paste in
  ```

## Refreshing from Figma

Run this locally, in a session that has the Figma MCP tool. Never from CI.

1. **List the frames.** `get_metadata` on each frame node. The output is a tree,
   not a picture — this is the step that turns a symbol into readable children.
2. **Expand every symbol.** A `<symbol>` in that tree (e.g. `1:99` "Header") is
   the thing a frame screenshot renders as a flat picture. Call `get_metadata`
   on the symbol id, then `get_design_context` on it, and read the children's
   real values. Skipping this is how a whole navigation got rebuilt by eye.
3. **Read values with `get_design_context`, per node.** It returns fills, font
   family/weight/size, line height, radii, padding and gaps as declared. Do not
   read a colour off `get_screenshot`.
4. **Write the values into `snapshot.json`**, each with the `figmaNode` it came
   from and a `figmaEvidence`/`figmaName` line saying which node proves it.
5. **Record the pull.** Update `figma.pulledAt` and add every node id you read to
   `figma.nodesPulled`.
6. `yarn design:fidelity` and fix what it reports.

Large nodes overflow the MCP response limit and get written to a file instead;
grep that file rather than re-requesting a smaller slice blindly.

### Detecting that the snapshot has gone stale

The snapshot cannot notice a Figma edit by itself — nothing in CI can reach the
file. Staleness is detected by re-running the pull and diffing:

```bash
# in a session with the Figma MCP tool
#   re-read every id in figma.nodesPulled, rewrite snapshot.json from them
git diff --exit-code design/figma/snapshot.json   # non-empty diff => the design moved
```

`figma.nodesPulled` exists precisely so a refresh is mechanical: it is the exact
list of nodes to re-read. Do this when the designer says the file changed, and
as the first step of any new design phase — before writing code, not after.

## The rules this file encodes

Phase 4 shipped `/` substantially off-design with every automated gate green.
The four root causes, and what the snapshot does about each:

1. **Symbols were never expanded.** `1:99` rendered as a picture of a nav, so its
   typography, logo colour and CTA were never read. → the refresh procedure
   expands symbols, and `figma.note` names the ones that matter.
2. **Work was screenshot-driven.** Hues sampled off a rendered image (206°/196°/175°)
   were _composited_ colours; the raw fills matched `glow-blue`/`glow-cyan`/`glow-teal`
   exactly. **A composited colour is not a fill.** → the `tokens` section asserts
   the token pipeline against node fills, so "no token matched" is a checkable claim.
3. **Implementation started from the existing site.** Anything that already looked
   plausible was never compared. → the snapshot is written from the frames, and
   every value carries the node id it came from.
4. **No gate checked fidelity.** → this one does, and it fails closed: an empty
   snapshot, a frame with no assertions, a selector that matches nothing and a page
   that does not render are all hard failures, proven on every run by the self-test
   in `scripts/design-fidelity/selftest.mjs`.
