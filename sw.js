self.addEventListener('install', (e) => {
  console.log('PWA Service Worker yüklendi.');
});

self.addEventListener('fetch', (e) => {
  // İleride buraya cache stratejileri ekleyebiliriz
});