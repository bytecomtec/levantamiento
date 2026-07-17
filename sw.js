// sw.js - Contenido mínimo
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Fuerza la activación inmediata
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activado');
});