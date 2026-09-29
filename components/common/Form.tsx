import { useState } from 'react'

import type {
  DetailedHTMLProps,
  FunctionComponent,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react'

type FormLabelProps = DetailedHTMLProps<
  LabelHTMLAttributes<HTMLLabelElement>,
  HTMLLabelElement
>

export const FormLabel: FunctionComponent<FormLabelProps> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <label
      {...props}
      className={`block text-sm leading-6 text-white mb-1 ${className}`}
    >
      {children}
    </label>
  )
}

/**
 * The layout and type every text control in the two forms shares: everything
 * that stays the same whatever box it is drawn in.
 *
 * It used to sit inline in two template literals, once per control, alongside
 * the four surface utilities below. Pulling it apart surfaced three things the
 * duplication was hiding:
 *
 * - `ring-inset ring-gray-300` set a ring colour with no ring width, so
 *   nothing was ever drawn. The focus ring declares both itself.
 * - `placeholder:text-gray-400` and `placeholder:text-gray-500` were both in
 *   the list, with stylesheet order silently deciding between them. Whichever
 *   won, the placeholder failed WCAG 2.1 AA on its own field - 1.55:1 and
 *   2.07:1 against the 4.5:1 floor the constitution requires of text - and
 *   `yarn a11y:contrast` does not read placeholders, so nothing caught it.
 *   gray-700 measures 6.50:1 on the white fill the contact frames give the
 *   fields and 5.03:1 on the #ECF3F8 the jobs form still uses, and
 *   `placeholder:font-light` keeps it distinguishable from entered text
 *   (gray-800, 10.67:1). Neither contact frame types into a field, so the
 *   placeholder colour is ours to choose; this is the accessible choice, and a
 *   one-token revert if the owner wants it lighter.
 * - The fill, radius, border and shadow are not shared at all - the contact
 *   frames draw a different box from the one the jobs form uses.
 */
const FIELD_BASE =
  'block w-full px-3.5 py-2 placeholder:text-gray-700 placeholder:font-light text-gray-800 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6'

/**
 * The box: fill, radius, border, shadow. A caller that draws a different one
 * replaces this wholesale rather than overriding it through `className`, because
 * Tailwind resolves two competing utilities by their order in the generated
 * stylesheet and not by their order in the attribute - so an override only
 * lands reliably when the utility it competes with is absent. That is why the
 * contact form's Figma values did nothing while these were concatenated.
 *
 * A class-merging helper (`cn`, i.e. tailwind-merge) solves the same problem,
 * and did until it was measured: importing it here put tailwind-merge in the
 * chunk shared by every route and cost 10kB of First Load JS on all of them,
 * to serve two components. Handing over the box costs nothing.
 *
 * The default is the jobs form's box, unchanged.
 */
const FIELD_SURFACE = 'rounded-md border-0 bg-[#ECF3F8] shadow-sm'

interface FieldSurfaceProp {
  /** Replaces {@link FIELD_SURFACE} entirely - see its note. */
  surface?: string
}

type FormInputProps = DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> &
  FieldSurfaceProp

export const FormInput: FunctionComponent<FormInputProps> = ({
  className = '',
  surface = FIELD_SURFACE,
  ...props
}) => {
  return (
    <input {...props} className={`${FIELD_BASE} ${surface} ${className}`} />
  )
}

type FormTextareaProps = DetailedHTMLProps<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  HTMLTextAreaElement
> &
  FieldSurfaceProp

export const FormTextarea: FunctionComponent<FormTextareaProps> = ({
  className = '',
  surface = FIELD_SURFACE,
  ...props
}) => {
  return (
    <textarea {...props} className={`${FIELD_BASE} ${surface} ${className}`} />
  )
}

/**
 * Neither contact frame draws a consent control at all, so there is no node to
 * measure this against. What it can do is stop disagreeing with the one orange
 * the frames DO draw: `#FF5D18` was a literal a shade off the `--cta` token
 * (`#ff6e14`) that paints the Send pill next to it in both palettes.
 */
interface FormSwitchProps
  extends Omit<
    DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
    'onChange'
  > {
  children?: ReactNode
  onChange?: (checked: boolean) => void
}

export const FormSwitch: FunctionComponent<FormSwitchProps> = ({
  className = '',
  checked = false,
  onChange = () => {
    // intentional
  },
  children,
  ...props
}) => {
  const [state, setState] = useState(checked)

  return (
    <button
      type="button"
      onClick={() => {
        onChange(!state)
        setState(!state)
      }}
      className={`${className} ${checked ? 'bg-cta' : 'bg-white'} flex w-8 flex-none cursor-pointer rounded-full p-px ring-1 ring-inset ring-gray-900/5 transition-colors duration-200 ease-in-out focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600`}
      role="switch"
      aria-checked={checked}
      aria-labelledby="privacy-policy"
      tabIndex={-1}
    >
      <input
        {...props}
        type="checkbox"
        className="sr-only w-4 h-6"
        checked={checked}
        onChange={() => {
          // intentional
        }}
        aria-hidden="true"
        tabIndex={-1}
      />
      {children}
      <span
        aria-hidden="true"
        className={`${
          checked
            ? 'translate-x-3.5  bg-white'
            : 'translate-x-0  bg-secondary-400'
        } h-4 w-4 transform rounded-full shadow-sm ring-1 ring-gray-900/5 transition duration-200 ease-in-out`}
      ></span>
    </button>
  )
}
