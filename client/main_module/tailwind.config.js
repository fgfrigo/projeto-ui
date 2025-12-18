/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./client/main_module/index.html",
    "./client/main_module/src/**/*.{js,ts,jsx,tsx}",
    "./client/main_module/src/*.{js,ts,jsx,tsx}",
    "./client/main_module/src/components/**/*.{js,ts,jsx,tsx}",
    "./client/main_module/src/pages/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {}
  },
  plugins: []
};
