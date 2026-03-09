import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#F5F0EB',
        surface: '#FFFFFF',
        primary: {
          DEFAULT: '#2B6CB0',
          hover: '#1E4E8C',
          light: '#EBF4FF',
        },
        secondary: {
          DEFAULT: '#4A7C59',
        },
        danger: {
          DEFAULT: '#C53030',
          hover: '#9B2C2C',
          light: '#FFF5F5',
        },
        warning: {
          DEFAULT: '#B7791F',
          light: '#FFFFF0',
        },
        success: {
          DEFAULT: '#276749',
          light: '#F0FFF4',
        },
        text: {
          primary: '#1A202C',
          secondary: '#4A5568',
        },
        border: '#CBD5E0',
      },
      fontSize: {
        sm: ['16px', '24px'],
        base: ['18px', '28px'],
        lg: ['20px', '30px'],
        xl: ['24px', '34px'],
        '2xl': ['30px', '40px'],
        '3xl': ['36px', '46px'],
      },
    },
  },
  plugins: [],
} satisfies Config
