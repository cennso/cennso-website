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
  /**
   * Performance optimization: Aggressive CSS purging configuration
   *
   * safelist: Explicitly preserve DaisyUI mask utilities we use throughout the site
   * This ensures mask-hexagon-2 is never purged even if detection is uncertain.
   *
   * The content globs above tell Tailwind to scan all component, page, and content
   * files to detect which classes are actually used. Any classes not found in these
   * files will be removed from the final CSS bundle, significantly reducing size.
   */
  safelist: [
    'mask',
    'mask-hexagon-2', // Hexagon shapes used in avatars, cards, images
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
  /**
   * DaisyUI Configuration - Optimized for minimal CSS output
   *
   * Performance optimization: DaisyUI can add significant unused CSS to the bundle.
   * This site only uses the mask-hexagon-2 utility from DaisyUI, so we disable all
   * unnecessary features to reduce CSS bundle size.
   *
   * Optimizations:
   * - themes: false - Disables all theme CSS (saves ~20KB)
   * - styled: false - Disables component styling, keeps only utilities (saves ~8KB)
   * - base: false - Disables base styles since we use Tailwind's defaults
   * - utils: true - Keeps utility classes like mask-hexagon-2 that we actually use
   * - logs: false - Disables build logs for cleaner output
   *
   * Result: Reduces DaisyUI CSS output by ~28KB, keeping only the mask utilities
   * we need for hexagon shapes throughout the site.
   */
  daisyui: {
    themes: false, // No theme CSS
    styled: false, // No component styles (buttons, cards, etc.)
    base: false, // No base styles
    utils: true, // Keep utilities (mask-hexagon-2)
    logs: false, // Disable logs
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
