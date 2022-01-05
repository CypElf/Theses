module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
        colors: {
            "theses-blue": "#38B4E7",
            "theses-light-blue": "#E9E9E9"
        }
    }
},
  variants: {
    extend: {},
  },
  plugins: ["gatsby-plugin-postcss"],
}