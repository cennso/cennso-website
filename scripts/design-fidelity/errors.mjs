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
  constructor(message, { hint } = {}) {
    super(message)
    this.name = 'FidelityError'
    this.hint = hint
  }
}
