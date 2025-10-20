import { Fragment, useState } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'

import type { FunctionComponent } from 'react'

export type SelectOption = {
  id: string
  value: string
}

export interface SelectProps {
  selected?: string
  placeholder: string
  options: Array<SelectOption>
  onChange?: (option: SelectOption) => void
  id?: string
  ariaLabelledBy?: string
}

export const Select: FunctionComponent<SelectProps> = ({
  selected: selectedDefault = '',
  placeholder,
  options = [],
  onChange = () => {
    // intentional
  },
  id,
  ariaLabelledBy,
}) => {
  const [selected, setSelected] = useState<string>(selectedDefault)
  const selectedValue = options.find((item) => item.id === selected)?.value

  return (
    <div className="w-72">
      <Listbox
        value={selected}
        onChange={(id) => {
          setSelected(id)
          const v = options.find((item) => item.id === id)
          onChange(v as SelectOption)
        }}
        as="div"
      >
        <div className="relative mt-1">
          <Listbox.Button
            id={id}
            aria-labelledby={ariaLabelledBy}
            aria-label={placeholder}
            className="relative w-full cursor-pointer rounded-[32px] bg-primary-100/50 py-2 pl-3 pr-10 text-left border-[1px] focus:outline-none focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-300 sm:text-sm"
          >
            <span className="block truncate">
              {selectedValue || placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50">
              {options.map((option) => (
                <Listbox.Option
                  key={option.id}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                      active
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-gray-900'
                    }`
                  }
                  value={option.id}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? 'font-medium' : 'font-normal'
                        }`}
                      >
                        {option.value}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  )
}
