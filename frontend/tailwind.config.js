module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}', './views/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'questrial': ['var(--font-questrial)', 'sans-serif'],
      },
      colors: {
        'brand-pink': '#E91E63',
        'dark-bg': '#0A0A0A',
        'dark-card': '#1A1A1A',
        'cream': '#FFF8F0',
      }
    }
  },
  plugins: []
}
