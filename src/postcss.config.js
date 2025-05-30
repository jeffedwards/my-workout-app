// postcss.config.js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {}, // This tells PostCSS to use the new Tailwind v4 plugin
    'autoprefixer': {},       // This is standard and good practice
  }
}