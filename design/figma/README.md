# Figma ground truth — how the design-fidelity gate is fed

Two checked-in copies of what the Cennso Design 4.0 Figma file says, and
`scripts/check-design-fidelity.mjs` renders the built site in a real browser and
asserts the live computed values against both.

| File              | What it is                                                                                                            | Written by                            |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `snapshot.json`   | A **curated sample**: named tokens, named elements, named assertions. Precise, and only ever as complete as the list. | a human                               |
| `raw/*.jsx`       | The **unmodified** `get_design_context` code block for each of the six frames, symbols expanded.                      | the Figma MCP tool                    |
| `frames.json`     | Which raw dump is which frame, on which route, in which theme, and whether it is enforced yet.                        | a human                               |
| `inventory.json`  | An **enumeration** of every text node, box node and measured gap in those six frames.                                 | `build-inventory.mjs` — never by hand |
| `exclusions.json` | Every node the enumeration cannot compare, each with a written reason.                                                | a human, reviewably                   |

## Why both

A curated list can only ever assert what somebody thought to list. Every defect
the site owner found after the first version of this harness shipped was a
property nobody had listed: card headings left-aligned where the design centres
them, a card outline drawn fully opaque where Figma dims fill _and_ border
together at `opacity-41`, a footer band `#0d406a` in dark where the dark frame's
band is the frame fill `#001A2A`, a 32px heading→body gap against a designed
13px, illustrations recoloured away from `#ffb31b`.

So the enumerative pass does not ask "does this listed element look right?". It
asks "for every text node in the design, where did it land on the page and does
every one of its properties match?" — and then says out loud how many it could
not reach. **An unreached design node is a finding, not a silent pass.** That is
how "nobody checked the footer" becomes visible instead of being a blank.

### How a design node is found on the page

By its own text, normalised for whitespace, case, curly quotes and dashes. Text
content is a strong natural key and needs no hand-maintained selector, so the
match cannot be quietly narrowed to the elements somebody remembered to tag.

Repeated copy ("Book demo" in the nav and in the hero) is paired top-to-bottom
by vertical position. A repeated-copy group whose two sides are different sizes
is **not** guessed at — that mismatch is itself the finding.

A Figma text layer holding several lines is tried whole first and then line by
line, because "Success Stories / About / Blog" is one layer in Figma and three
anchors on the page.

Boxes have no text, so they are bridged through the text they enclose: take the
design text nodes geometrically inside the box, find where they landed, and walk
up to the nearest ancestor they share. A box that cannot be bridged is reported,
never assumed correct.

### Compositing

`opacity-41` on a Figma layer dims its fill **and** its border. The inventory
records the opacity as its own value and the comparison composites it onto both
before comparing, against a DOM side that composites element opacity the same
way. Comparing raw values is what makes a dimmed outline read as correct.

## `snapshot.json` — the curated sample

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
yarn design:inventory            # regenerate inventory.json from raw/ (no network)
yarn design:inventory:check      # prove the committed inventory is what raw/ produces (CI)
yarn design:inventory:refresh    # same, but also re-read the artwork colours from Figma's exports
```

`inventory.json` is generated and **must not be hand-edited**:
`design:inventory:check` rebuilds it from `raw/` and fails if the committed file
differs. An inventory somebody can edit is an inventory somebody can quietly
shrink to the assertions that pass.

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

## exclusions.json — the only way a node stops being checked

The enumeration has exactly one escape hatch, and it is loud. An entry needs the
frame, the node key, the properties it covers (`["*"]` for the whole node) and a
**written reason of at least 40 characters**. Three rules keep it honest:

- A reason that is a shrug ("flaky", "todo") is rejected on length.
- An entry whose node is not in the inventory is a hard failure — so an
  exclusion cannot outlive the design node it was written for.
- The same node cannot be excluded twice with two different stories.

The reasons currently written down are of three kinds: placeholder copy the
frame invents where the page renders CMS content, a footer layer the designer
left fully occluded behind another one, and the frozen 2023 copyright line the
site composes at render time.

## Refreshing from Figma

Run this locally, in a session that has the Figma MCP tool. Never from CI.

### The enumerative half

1. For each of the six frames — `1:9`, `1:4440`, `1:585`, `1:1062`, `1:3471`,
   `1:7084` — call `get_design_context`. Symbols (`1:99` Header, `1:575` Footer,
   `1:606` btn_More) come back expanded into functions; that expansion is the
   whole point, because an unexpanded symbol is a picture of a navigation.
2. Save each call's code block **unmodified** to `raw/<frame>.jsx`, including the
   `const img… = "https://…"` block at the top.
3. `yarn design:inventory:refresh` — regenerates `inventory.json` and re-reads the
   colours inside the exported artwork. Those export URLs expire about a week
   after the pull, so this step only works against a fresh dump; afterwards the
   colours are carried forward as committed data.
4. `git diff design/figma/inventory.json` is the design change, in values.
5. `yarn design:fidelity` and fix what it reports.

### The curated half

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
