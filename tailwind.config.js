// tailwind.config.js

module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    // If your components are not in a 'src' folder, adjust this path.
    // For example, if they are at the root level:
    "./**/*.{js,jsx,ts,tsx}" 
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // ✅ This is the crucial line you need to add 
  presets: [require('nativewind/preset')], 
};