module.exports = {
  content: ['./public/index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        indigo: {
          600: '#4f46e5'
        },
        emerald: {
          500: '#10b981'
        },
        amber: {
          400: '#f59e0b'
        },
        slate: {
          900: '#0f172a'
        }
      }
    }
  },
  plugins: []
};
