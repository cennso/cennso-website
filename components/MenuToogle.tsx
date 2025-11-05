import type { FunctionComponent } from 'react'

interface MenuToggleProps {
  toggle: () => void
  isOpen?: boolean
}

export const MenuToggle: FunctionComponent<MenuToggleProps> = ({
  toggle,
  isOpen = false,
}) => (
  <button
    onClick={toggle}
    aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
    aria-expanded={isOpen}
    className="w-8 h-8 flex flex-col justify-center items-center gap-[5px]"
  >
    <span
      className={`block w-6 h-[3px] bg-[#185f99] rounded transition-all duration-300 ${
        isOpen ? 'rotate-45 translate-y-2' : ''
      }`}
    />
    <span
      className={`block w-6 h-[3px] bg-[#185f99] rounded transition-all duration-300 ${
        isOpen ? 'opacity-0' : 'opacity-100'
      }`}
    />
    <span
      className={`block w-6 h-[3px] bg-[#185f99] rounded transition-all duration-300 ${
        isOpen ? '-rotate-45 -translate-y-2' : ''
      }`}
    />
  </button>
)
