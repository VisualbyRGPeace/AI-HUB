const c = n => `rgb(var(--${n}) / <alpha-value>)`

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Bảng màu trắng đen: mọi màu đều lấy từ biến CSS trong index.css
      colors: { paper: c('paper'), ink: c('ink'), mute: c('mute'), line: c('line'), soft: c('soft') },
    },
  },
  plugins: [],
}
