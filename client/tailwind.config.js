/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#2c3e50',
          slate: '#34495e',
          muted: '#7f8c8d',
          light: '#ecf0f1',

          primary: '#3498db',
          success: '#2ecc71',
          danger: '#e74c3c',
          speed: '#27ae60',

          widget: '#f8f9fa',
          widgetBorder: '#e9ecef',
          widgetMuted: '#95a5a6',
          inputBorder: '#bdc3c7',
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
        }
      }
    },
  },
  plugins: [],
}