import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  plugins: [react()],
  // Номер версии в приложении — из package.json, один источник правды
  define: { __APP_VERSION__: JSON.stringify(version) },
  // Capacitor отдаёт файлы с локального origin — пути должны быть относительными
  base: './',
  build: { outDir: 'dist' },
});
