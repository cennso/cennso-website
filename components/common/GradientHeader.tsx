import type {
  FunctionComponent,
  DetailedHTMLProps,
  HTMLAttributes,
} from 'react'

interface GradientHeaderProps
  extends DetailedHTMLProps<
    HTMLAttributes<HTMLHeadingElement>,
    HTMLHeadingElement
  > {
  as: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  variant?: 'primary' | 'secondary' | 'default'
}

export const GradientHeader: FunctionComponent<GradientHeaderProps> = ({
  as,
  variant = 'default',
  children,
  className = '',
  ...rest
}) => {
  let colorClassName: string = ''
  switch (variant) {
    case 'default': {
      colorClassName =
        'bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-[#04D3D6]'
      break
    }
    case 'primary': {
      colorClassName =
        'bg-clip-text text-transparent bg-gradient-to-r from-[#2E81D4] to-[#00FBFF]'
      break
    }
    case 'secondary': {
      colorClassName =
        'bg-clip-text text-transparent bg-gradient-to-r from-[#2E81D4] to-[#00FBFF]'
      break
    }
  }

  const As = as
  return (
    <As {...rest} className={`${colorClassName} ${className}`}>
      {children}
    </As>
  )
}
