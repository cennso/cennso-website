import { motion } from 'framer-motion'

import type { FunctionComponent } from 'react'
import type { SVGMotionProps } from 'framer-motion'

const Path: FunctionComponent<SVGMotionProps<SVGPathElement>> = (props) => (
  <motion.path
    fill="currentColor"
    strokeWidth="3"
    stroke="currentColor"
    strokeLinecap="round"
    {...props}
  />
)

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
  >
    <svg
      viewBox="0 0 22 22"
      className="w-8 h-8 text-[#185f99] fill-[#185f99]"
      aria-hidden="true"
    >
      <Path
        variants={{
          closed: { d: 'M 2 2.5 L 20 2.5' },
          open: { d: 'M 3 16.5 L 17 2.5' },
        }}
      />
      <Path
        d="M 2 9.423 L 20 9.423"
        variants={{
          closed: { opacity: 1 },
          open: { opacity: 0 },
        }}
        transition={{ duration: 0.1 }}
      />
      <Path
        variants={{
          closed: { d: 'M 2 16.346 L 20 16.346' },
          open: { d: 'M 3 2.5 L 17 16.346' },
        }}
      />
    </svg>
  </button>
)
