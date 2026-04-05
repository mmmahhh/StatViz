/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        linear: {
          bg: "#08090a",
          panel: "#0f1011",
          surface: "#191a1b",
          surfaceHover: "#28282c",
          primary: "#f7f8f8",
          secondary: "#d0d6e0",
          tertiary: "#8a8f98",
          quaternary: "#62666d",
          brand: "#5e6ad2",
          brandAccent: "#7170ff",
          brandHover: "#828fff",
          success: "#27a644",
          border: "rgba(255,255,255,0.08)",
          borderSubtle: "rgba(255,255,255,0.05)",
        }
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Berkeley Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
      },
      fontWeight: {
        'linear-light': '300',
        'linear-normal': '400',
        'linear-semibold': '590',
        'linear-emphasis': '510',
      },
      boxShadow: {
        'linear-focus': 'rgba(0,0,0,0.1) 0px 4px 12px',
        'linear-level2': 'inset 0 0 12px 0 rgba(0,0,0,0.2)',
        'linear-dialog': '0px 8px 2px rgba(0,0,0,0), 0px 5px 2px rgba(0,0,0,0.01), 0px 3px 2px rgba(0,0,0,0.04), 0px 1px 1px rgba(0,0,0,0.07), 0px 0px 1px rgba(0,0,0,0.08)'
      }
    },
  },
  plugins: [],
}
