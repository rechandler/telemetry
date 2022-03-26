const colors = require('tailwindcss/colors')

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
    colors: {
      ...colors,
      'e3': '#282c34f3',
      'pit': 'rgba(171, 152, 2, 0.48)'
    }
  },
  plugins: [],
}
