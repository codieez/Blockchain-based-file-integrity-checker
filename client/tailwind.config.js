export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#10b981',
        secondary: '#059669',
        success: '#34d399',
        danger: '#ef4444',
        dark: '#1f2937',
        darker: '#0f172a'
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        bounce: 'bounce 1s infinite',
        spin: 'spin 1s linear infinite'
      }
    }
  },
  plugins: []
};
