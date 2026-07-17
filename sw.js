// sw.js - Versión actualizada para evitar bloqueos
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim()); // Toma control de las páginas abiertas
});

// ESTO ES LO QUE TE FALTA:
// Al añadir este evento, le dices al navegador: 
// "Para cualquier cosa que necesites, ve directo a la red (no bloquees)"
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
