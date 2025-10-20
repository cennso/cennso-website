import { useRef, useState, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, A11y, Autoplay } from 'swiper/modules'

import { Testimonial } from './Testimonial'

import type { FunctionComponent } from 'react'
import type { Testimonial as TestimonialType } from '../../contexts'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/a11y'
import 'swiper/css/autoplay'

function useSwiperRef() {
  const [wrapper, setWrapper] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    setWrapper(ref.current)
  }, [])

  return [wrapper, ref]
}

interface TestimonialsProps {
  testimonials: TestimonialType[]
}

export const Testimonials: FunctionComponent<TestimonialsProps> = ({
  testimonials,
}) => {
  const [nextEl, nextElRef] = useSwiperRef()
  const [prevEl, prevElRef] = useSwiperRef()
  const buttonClassName = `transition-color ease-in-out duration-200 rounded-full bg-secondary-400 text-secondary-600 font-bold opacity-50 hover:opacity-100`

  return (
    <div className="relative w-full">
      <div className="transparent">
        <Swiper
          modules={[Navigation, A11y, Autoplay]}
          loop={true}
          speed={500}
          spaceBetween={8}
          slidesPerView={1}
          autoplay={{
            delay: 7500,
          }}
          navigation={{
            prevEl: prevEl as unknown as HTMLElement,
            nextEl: nextEl as unknown as HTMLElement,
          }}
        >
          {testimonials.map((testimonial, index) => (
            <SwiperSlide key={index}>
              <Testimonial testimonial={testimonial} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <div className="absolute top-[calc(50%-2.25rem)] hidden md:flex flex-row w-full justify-between justify-content-center md:justify-content-start z-10 bg-transparent">
        <button
          ref={prevElRef}
          className={buttonClassName}
          title="Previous testimonial"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 85 85"
            className="w-16 h-16 rotate-180"
          >
            <path
              d="M42.5 85C66 85 85 66 85 42.5S66 0 42.5 0 0 19 0 42.5 19 85 42.5 85ZM26 17h16.7L63 41.6 42.7 67H26l21.4-25.4L26 17Z"
              style={{
                fill: '#64b5ff',
                fillOpacity: 0.5,
                fillRule: 'evenodd',
                strokeWidth: 0,
              }}
            />
          </svg>
        </button>
        <button
          ref={nextElRef}
          className={buttonClassName}
          title="Next testimonial"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            data-name="Layer 1"
            viewBox="0 0 85 85"
            className="w-16 h-16"
          >
            <path
              d="M42.5 85C66 85 85 66 85 42.5S66 0 42.5 0 0 19 0 42.5 19 85 42.5 85ZM26 17h16.7L63 41.6 42.7 67H26l21.4-25.4L26 17Z"
              style={{
                fill: '#64b5ff',
                fillOpacity: 0.5,
                fillRule: 'evenodd',
                strokeWidth: 0,
              }}
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
