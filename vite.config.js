import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Capacitor отдаёт файлы с локального origin — пути должны быть относительными
  base: './',
  build: { outDir: 'dist' },
});
