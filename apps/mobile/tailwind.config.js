/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],

  // NativeWind 4 requires the native preset.
  presets: [require('nativewind/preset')],

  theme: {
    extend: {},
  },

  plugins: [],
};
