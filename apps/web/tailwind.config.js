/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0d9488',
          dark: '#0f766e',
          light: '#ccfbf1',
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        navy: {
          DEFAULT: '#0f172a',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#94a3b8',
          400: '#64748b',
          500: '#475569',
          600: '#334155',
          700: '#1e293b',
          800: '#0f172a',
          900: '#020617',
        },
        cream: {
          DEFAULT: '#f8fafc',
          soft: '#f1f5f9',
        },
        gold: {
          DEFAULT: '#f59e0b',
          dark: '#d97706',
        },
        surface: {
          DEFAULT: '#ffffff',
          soft: 'rgba(255,255,255,0.60)',
        },
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 24px -4px rgba(15, 118, 110, 0.12), 0 1px 4px rgba(0,0,0,0.04)',
        'card-hover': '0 20px 60px -10px rgba(15, 118, 110, 0.20), 0 4px 16px rgba(0,0,0,0.08)',
        'floating': '0 20px 60px -10px rgba(15, 118, 110, 0.20), 0 4px 16px rgba(0,0,0,0.08)',
        'search': '0 15px 40px rgba(35, 75, 78, 0.12)',
        'soft': '0 10px 30px rgba(31, 63, 67, 0.08)',
      },
      maxWidth: {
        'content': '1216px',
      },
      borderRadius: {
        '2xl': '24px',
        '3xl': '28px',
      },
    },
  },
  plugins: [],
}
