import type { FunctionComponent, PropsWithChildren } from 'react'

interface ContainerProps extends PropsWithChildren {
  className?: string
  subClassName?: string
}

export const Container: FunctionComponent<ContainerProps> = ({
  className = '',
  subClassName = '',
  children,
}) => {
  return (
    <section
      className={`${className} flex flex-row justify-center w-full max-w-screen border-none px-8 lg:px-4`}
    >
      <div
        className={`${subClassName} relative flex flex-row items-center justify-between w-full max-w-screen-2xl`}
      >
        {children}
      </div>
    </section>
  )
}
