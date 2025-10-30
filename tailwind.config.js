const withMT = require('@material-tailwind/react/utils/withMT')
const plugin = require('tailwindcss/plugin')

const colors = {
  primary: {
    100: '#e9f3fc',
    200: '#c8dff2',
    300: '#a7cae7',
    400: '#86b6dd',
    500: '#65a1d3',
    600: '#448dc8',
    700: '#2178bd',
    800: '#1a60b2',
    900: '#1748a7',
  },
  secondary: {
    200: '#5CE2FF',
    400: '#0b4468',
    600: '#0b3956',
  },
  gray: {
    50: '#F7F9FA',
    100: '#F0F4F5',
    200: '#E8ECED',
    300: '#D7DFE0',
    400: '#BFC6C7',
    500: '#A3ACAD',
    600: '#8B9394',
    700: '#556061',
    800: '#364042',
    900: '#242929',
  },
}

/** @type {import('tailwindcss').Config} */
const tailwindConfig = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './content/**/*.{md,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ...colors,
      },
      fontFamily: {
        sans: [
          'inherit',
          'Poppins',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Open Sans',
          'Helvetica Neue',
          'sans-serif',
        ],
        code: [
          'Roboto Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace',
        ],
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
        'screen-3xl': '1664px',
      },
      screens: {
        '3xl': '1664px',
      },
      textShadow: {
        primary: '0 0 1px #1D75BC',
        secondary: '0 0 1px #1D75BC',
        sm: '0 1px 1px var(--tw-shadow-color)',
        DEFAULT: '0 2px 4px var(--tw-shadow-color)',
        lg: '0 8px 16px var(--tw-shadow-color)',
      },
      typography: {
        quoteless: {
          css: {
            'blockquote p:first-of-type::before': { content: 'none' },
            'blockquote p:first-of-type::after': { content: 'none' },
          },
        },
      },
    },
  },
  daisyui: {
    themes: false,
  },
  plugins: [
    require('daisyui'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwind-scrollbar')({ nocompatible: true }),
    // text shadow
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          'text-shadow': (value) => ({
            textShadow: value,
          }),
        },
        { values: theme('textShadow') }
      )
    }),
  ],
}

module.exports = withMT(tailwindConfig)
