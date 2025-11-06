import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'

import { Button, GradientHeader } from '../common'

import type { FunctionComponent } from 'react'
import type { Partner } from '../../contexts'

interface PartnersProps {
  content: Record<string, any>
  partners: Partner[]
}

export const Partners: FunctionComponent<PartnersProps> = ({
  content,
  partners: initialPartners,
}) => {
  const partners = initialPartners.slice(0, -1)

  const data = useMemo(() => {
    return [partners.slice(0, 6), partners.slice(6, partners.length)]
  }, [partners])

  const mobilePartners = useMemo(() => {
    const array: Partner[] = []
    for (let i = 0; i < 5; i++) {
      array.push(...partners)
    }
    return array
  }, [partners])

  return (
    <div className="flex flex-row justify-center items-center w-full py-12 lg:h-[500px]">
      <div
        className={`partners-orbits overflow-hidden flex flex-row justify-center items-center w-full`}
      >
        <div className="partners-orbits-container -top-[175px]">
          <div id="partners-orbits-first" className="partners-orbit">
            {data[0].map((orbit) => (
              <div
                key={orbit.name}
                className="relative partners-orbit-item-1 flex flex-row items-center justify-center"
              >
                <div className="flex flex-row items-center justify-center rounded-full border-2 border-secondary-200 bg-secondary-400 w-[100px] h-[100px]">
                  <div className="relative flex min-w-[100px] min-h-[100px] items-center justify-center">
                    <Image
                      src={orbit.logo}
                      alt={`${orbit.name} logo`}
                      title={`${orbit.name} logo`}
                      fill={true}
                      className="p-1.5 contrast-200 brightness-200 object-contain"
                      sizes="100px"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="absolute z-40 flex size-full justify-center items-center text-white">
              <div className="flex flex-col gap-0 justify-center items-center">
                <GradientHeader
                  variant="primary"
                  as="h2"
                  className="text-transparent text-center lg:text-left font-bold text-3xl lg:text-4xl inline-block"
                >
                  {content.title}
                </GradientHeader>
                <GradientHeader
                  variant="primary"
                  as="h3"
                  className="text-transparent text-center lg:text-left font-bold text-[64px] lg:text-[112px] py-0"
                >
                  95
                </GradientHeader>
                <div>
                  <Link href={content.link}>
                    <Button variant="action" useArrow={true}>
                      {content.linkContent}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div id="partners-orbits-second" className="partners-orbit">
            {data[1].map((orbit) => (
              <div
                key={orbit.name}
                className="relative partners-orbit-item-2 flex flex-row items-center justify-center"
              >
                <div className="flex flex-row items-center justify-center rounded-full border-2 border-secondary-200 bg-secondary-400 w-[100px] h-[100px]">
                  <div className="relative flex min-w-[100px] min-h-[100px] items-center justify-center">
                    <Image
                      src={orbit.logo}
                      alt={`${orbit.name} logo`}
                      title={`${orbit.name} logo`}
                      fill={true}
                      className="p-1.5 contrast-200 brightness-200 object-contain"
                      sizes="100px"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="block lg:hidden py-4">
        <div className="flex flex-col gap-0 justify-center items-center">
          <GradientHeader
            variant="primary"
            as="h2"
            className="text-transparent text-center lg:text-left font-bold text-3xl lg:text-4xl inline-block"
          >
            {content.title}
          </GradientHeader>
          <GradientHeader
            variant="primary"
            as="h3"
            className="text-transparent text-center lg:text-left font-bold text-[92px] sm:text-[96px] py-0"
          >
            95
          </GradientHeader>
          <div className="partners-logos mb-8 mt-2">
            <div className="partners-logos-slide flex flex-row">
              {mobilePartners.map((partner) => {
                const fallbackSize = { width: 320, height: 160 }
                const logoWidth = partner.logoSize?.width ?? fallbackSize.width
                const logoHeight =
                  partner.logoSize?.height ?? fallbackSize.height
                const targetWidth = 160
                const computedHeight = Math.max(
                  Math.round((logoHeight / logoWidth) * targetWidth),
                  1
                )

                return (
                  <Image
                    src={partner.logo}
                    key={partner.name}
                    alt={`${partner.name} logo`}
                    title={`${partner.name} logo`}
                    width={logoWidth}
                    height={logoHeight}
                    style={{
                      width: `${targetWidth}px`,
                      height: `${computedHeight}px`,
                    }}
                    className="inline-block object-contain"
                    sizes="160px"
                  />
                )
              })}
            </div>
          </div>
          <div>
            <Link href={content.link}>
              <Button variant="action" useArrow={true}>
                {content.linkContent}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
