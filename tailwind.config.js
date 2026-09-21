const plugin = require('tailwindcss/plugin')
const cennsoPreset = require('@cennso/theme/tailwind-preset')

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
  // The site footer is drawn dark in both the light and dark palette, so it
  // cannot use the preset's own `footer` key, which is var(--footer)-backed and
  // flips to a pale surface under [data-theme="light"]. This entry, being a
  // plain string, wins the merge over the preset's object for the same key and
  // gives Footer.tsx a `bg-footer` that never tracks the page theme. Value is
  // lifted directly from the Design 4.0 footer frame (Figma node 1:7579).
  footer: '#0d406a',
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
  presets: [cennsoPreset],
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './content/**/*.{md,mdx}',
    './node_modules/@cennso/ui/dist/**/*.{js,mjs}',
  ],
  /**
   * Performance optimization: Aggressive CSS purging configuration
   *
   * safelist: Explicitly preserve mask utilities we use throughout the site.
   * This is defensive belt-and-braces, not a scanner workaround: every use is
   * the contiguous literal "mask mask-hexagon-2", which the scanner detects
   * fine. It guards against a future refactor making the class name dynamic.
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
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwind-scrollbar')({ nocompatible: true }),
    // The hexagon mask, previously supplied by DaisyUI's utilities layer.
    // DaisyUI was configured with themes/styled/base all off, so `mask` and
    // `mask-hexagon-2` were the only two classes it contributed to this site.
    // Copied verbatim from daisyui@4 dist/full.css, so removing the dependency
    // changes no pixel.
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.mask': {
          'mask-size': 'contain',
          'mask-repeat': 'no-repeat',
          'mask-position': 'center',
        },
        '.mask-hexagon-2': {
          'mask-image':
            "url(\"data:image/svg+xml,%3csvg width='200' height='182' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M64.786 181.4c-9.196 0-20.063-6.687-25.079-14.21L3.762 105.33c-5.016-8.36-5.016-20.9 0-29.259l35.945-61.86C44.723 5.851 55.59 0 64.786 0h71.055c9.196 0 20.063 6.688 25.079 14.211l35.945 61.86c4.18 8.36 4.18 20.899 0 29.258l-35.945 61.86c-4.18 8.36-15.883 14.211-25.079 14.211H64.786Z' fill='black' fill-rule='nonzero'/%3e%3c/svg%3e\")",
        },
      })
    }),
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

module.exports = tailwindConfig
