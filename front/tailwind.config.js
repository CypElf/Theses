module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
        colors: {
            "theses-blue": "#38B4E7",
            "theses-light-blue": "#E9E9E9",
            "theses-dark-blue": "#14161A"
        },
        fontFamily: {
          segoe: ["Segoe UI", "Arial", "sans-serif"]
        }
    }
},
  variants: {
    extend: {},
  },
  plugins: ["gatsby-plugin-postcss"],
}
