/**
 * A hard, non-recoverable problem with the harness itself or its inputs:
 * a missing or stale Figma dump, a degenerate mapping, a frame that parses to
 * nothing, a page that will not render, a browser that will not start.
 *
 * These are deliberately NOT "0 findings, all good". Every one of them aborts
 * the run with a non-zero exit code, because a fidelity review that reports
 * success while comparing nothing is worse than no review at all.
 */
export class FidelityError extends Error {
  /**
   * The hint may be passed either positionally or as `{ hint }`. Both spellings are in
   * use across the harness, and when the constructor accepted only the object form the
   * positional ones were silently dropped: the CLI printed the abort message without the
   * one line that says how to recover from it. A hint that vanishes is worse than no
   * hint, because nothing at the call site says it did.
   */
  constructor(message, hint = undefined) {
    super(message)
    this.name = 'FidelityError'
    this.hint = typeof hint === 'string' ? hint : hint?.hint
  }
}
