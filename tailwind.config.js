/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        barcelona: '#A50044',
        'real-madrid': '#FEBE10',
        bayern: '#DC052D',
        'man-city': '#6CABDD',
        'man-utd': '#DA291C',
        dortmund: '#FDE100',
      },
    },
  },
  plugins: [],
}
