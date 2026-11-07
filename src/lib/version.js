/** Версия приложения — подставляется при сборке из package.json (vite.config.js). */
// eslint-disable-next-line no-undef
export const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0';
export const RELEASES_API = 'https://api.github.com/repos/Zairxon/Vital/releases/latest';
