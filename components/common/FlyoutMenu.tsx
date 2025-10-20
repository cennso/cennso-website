import { useState } from 'react'
import {
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
} from '@material-tailwind/react/components/Menu'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

import { FunctionComponent, PropsWithChildren, ReactNode } from 'react'

interface FlyoutMenuProps extends PropsWithChildren {
  items: Array<{
    title: string
    link: string
  }>
  renderItem: (item: { title: string; link: string }) => ReactNode
}

export const FlyoutMenu: FunctionComponent<FlyoutMenuProps> = ({
  items,
  renderItem,
  children,
}) => {
  const [openMenu, setOpenMenu] = useState(false)

  const triggers = {
    onMouseEnter: () => setOpenMenu(true),
    onMouseLeave: () => setOpenMenu(false),
  }

  return (
    <Menu open={openMenu} handler={setOpenMenu}>
      <MenuHandler>
        <div
          {...triggers}
          className="flex items-center text-base font-normal capitalize tracking-normal"
        >
          {children}
          <ChevronDownIcon
            strokeWidth={2.5}
            className={`h-3.5 w-3.5 transition-transform text-primary-600 ${
              openMenu ? 'rotate-180' : ''
            }`}
          />
        </div>
      </MenuHandler>
      <MenuList
        {...triggers}
        className="hidden lg:block gap-3 overflow-hidden border-[1px] border-primary-200 p-0 shadow-lg shadow-black/10"
        placeholder={undefined}
        onPointerEnterCapture={undefined}
        onPointerLeaveCapture={undefined}
      >
        <ul className="flex flex-col w-full divide-y divide-primary-200">
          {items.map((item) => (
            <MenuItem
              key={item.title}
              className="text-base hover:bg-transparent py-0 px-1 rounded-none"
              placeholder={undefined}
              onPointerEnterCapture={undefined}
              onPointerLeaveCapture={undefined}
            >
              {renderItem(item)}
            </MenuItem>
          ))}
        </ul>
      </MenuList>
    </Menu>
  )
}
