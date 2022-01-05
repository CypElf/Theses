module.exports = {
  siteMetadata: {
    siteUrl: "http://localhost:3000",
    title: "theses",
  },
  plugins: [
    "gatsby-plugin-postcss",
    "gatsby-plugin-react-helmet",
    "gatsby-plugin-image",
    "gatsby-plugin-sharp",
    "gatsby-transformer-sharp",
    "gatsby-plugin-react-leaflet",
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "images",
        path: "./src/img/",
      }
    }
  ]
};
