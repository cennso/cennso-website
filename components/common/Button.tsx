import type {
  DetailedHTMLProps,
  ButtonHTMLAttributes,
  FunctionComponent,
} from 'react'

export interface ButtonProps
  extends DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'action'
  useArrow?: boolean
}

export const Button: FunctionComponent<ButtonProps> = ({
  variant = 'primary',
  useArrow = false,
  className = '',
  children,
  ...rest
}) => {
  let colorClassName: string = ''
  switch (variant) {
    case 'primary': {
      colorClassName =
        'block px-4 py-1.5 transition-[background] ease-in-out duration-200 bg-gradient-to-r from-[#1D75BC] via-[#04D3D6] to-[#1D75BC] bg-[length:200%_200%] hover:bg-right rounded-full text-white text-lg'
      break
    }
    case 'secondary': {
      colorClassName =
        'block px-4 py-1.5 transition-[background] ease-in-out duration-200 bg-gradient-to-r from-[#1E94EA] via-[#1FC26D] to-[#1E94EA] bg-[length:200%_200%] hover:bg-right rounded-full text-white text-lg'
      break
    }
    case 'tertiary': {
      colorClassName =
        'block px-4 py-1.5 transition-[background] ease-in-out duration-200 bg-gradient-to-r from-[#1983BF] via-[#AF37AA] to-[#1983BF] bg-[length:200%_200%] hover:bg-right rounded-full text-white text-lg'
      break
    }
    case 'action': {
      colorClassName =
        'block px-4 py-1.5 transition-[background] ease-in-out duration-200 bg-gradient-to-r from-[#FF5D18] via-[#F99B16] to-[#FF5D18] bg-[length:200%_200%] hover:bg-right rounded-full text-white text-lg'
      break
    }
  }

  return (
    <button
      {...rest}
      className={`[text-shadow:_1.5px_1.5px_rgb(0_0_0_/_0.35)] font-bold ${colorClassName} ${className}`}
    >
      {useArrow ? (
        <div className="flex flex-row items-center">
          {children} {'>'}
        </div>
      ) : (
        children
      )}
    </button>
  )
}
