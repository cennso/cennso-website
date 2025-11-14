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

type FormInputProps = DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>

export const FormInput: FunctionComponent<FormInputProps> = ({
  className = '',
  ...props
}) => {
  return (
    <input
      {...props}
      className={`block w-full rounded-md border-0 px-3.5 py-2 bg-[#ECF3F8] placeholder:text-gray-500 placeholder:font-light text-gray-800 shadow-sm ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 ${className}`}
    />
  )
}

type FormTextareaProps = DetailedHTMLProps<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  HTMLTextAreaElement
>

export const FormTextarea: FunctionComponent<FormTextareaProps> = ({
  className = '',
  ...props
}) => {
  return (
    <textarea
      {...props}
      className={`block w-full rounded-md border-0 px-3.5 py-2 bg-[#ECF3F8] placeholder:text-gray-500 placeholder:font-light text-gray-800 shadow-sm ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 ${
        className || ''
      }`}
    />
  )
}

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
      className={`${className} ${checked ? 'bg-[#FF5D18]' : 'bg-white'} flex w-8 flex-none cursor-pointer rounded-full p-px ring-1 ring-inset ring-gray-900/5 transition-colors duration-200 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600`}
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
