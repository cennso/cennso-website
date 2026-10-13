/**
 * The consent switch on the site's forms (contact, jobs), restyled from the
 * `@cennso/ui` default to the Design 4.0 contact frames:
 *
 * - box (both themes): 39x22 track, 1px border, 16px thumb inset 4px from
 *   the track's outer edge, travelling 15px (Figma 153:815/153:816 dark,
 *   156:827/156:828 light).
 * - light (156:827-156:836): off #E1EAF0 track, #185F99 border and thumb;
 *   on #185F99 track and border, #FFFFFF thumb.
 * - dark (153:815-153:819): off #0C2842 track (owner override of the
 *   frame's #001A2A), #FFB31B border and thumb;
 *   on #FFB31B track and border, #0B2842 thumb.
 *
 * Thumb colour and travel are keyed off the track's state so the two can
 * never disagree. `dark:` resolves to `:root:not([data-theme="light"])`.
 */
export const FORM_SWITCH = [
  'h-[22px] w-[39px] px-[3px]',
  '[&_[data-slot=switch-thumb]]:size-4',
  'data-checked:[&_[data-slot=switch-thumb]]:translate-x-[15px]',
  // light
  'border-[#185f99] data-unchecked:bg-[#e1eaf0] data-checked:bg-[#185f99]',
  '[&_[data-slot=switch-thumb]]:bg-[#185f99] data-checked:[&_[data-slot=switch-thumb]]:bg-white',
  // dark - marked important (`!`): each dark rule has the same specificity as
  // its light twin (the dark variant's :where() adds none), so without it the
  // winner depended on the order Tailwind happened to emit them in.
  'dark:border-[#ffb31b]! dark:data-unchecked:bg-[#0c2842]! dark:data-checked:bg-[#ffb31b]!',
  'dark:[&_[data-slot=switch-thumb]]:bg-[#ffb31b]! dark:data-checked:[&_[data-slot=switch-thumb]]:bg-[#0b2842]!',
].join(' ')
