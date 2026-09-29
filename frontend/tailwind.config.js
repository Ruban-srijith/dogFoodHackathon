/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0F172A',
        card: '#1E293B',
        accent: '#A78BFA',
        'text-primary': '#E2E8F0',
        'text-secondary': '#94A3B8',
        success: '#4ADE80',
        error: '#F87171',
        border: '#334155',
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        none: '0px',
        sharp: '4px',
        sm: '4px',
        DEFAULT: '4px',
        md: '8px',
        lg: '12px',
        xl: '14px',
        '2xl': '16px',
        '3xl': '20px',
        soft: '16px',
        full: '9999px',
      },
    },
  },
  plugins: [],
}
