// sw.js simplificado al máximo
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Eliminamos clients.claim() por ahora para evitar el error de InvalidStateError
  console.log('Service Worker activado y limpio');
});

// Sin evento fetch para asegurar que el navegador use la red directamente
