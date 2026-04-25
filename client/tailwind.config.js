/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
    "./shared/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#121212',    // --background
          card: '#171717',     // --card
          surface: '#1f1f1f',  // --muted
          border: '#292929',   // --border
          accent: '#fafafa',   // --secondary-foreground
          green: '#008a50',    // --primary
          muted: '#a2a2a2',    // --muted-foreground
          input: '#242424',    // --input
          popover: '#242424',  // --popover
          destructive: '#961111', // --destructive
        },
        traffic: {
          body: '#1a1a1a',
          border: '#333333',
          box: '#0a0a0a',
          boxBorder: '#2a2a2a',
        },
        lens: {
          red: { on: '#ff1a1a', off: '#4a0000' },
          yellow: { off: '#4a3b00' },
          green: { on: '#00ff00', off: '#003300' }
        },
        jam: {
          normal: '#00B14F',
          slow: '#FFB800',
          heavy: '#FF3B30',
        }
      }
    },
  },
  plugins: [],
}