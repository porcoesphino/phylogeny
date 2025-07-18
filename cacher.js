
const cacheName = "porcoesphino_pt";
const precachedResources = [
  '/',
  '/cacher.js',
  '/favicon_tree_192.jpg',
  '/favicon_tree_512.jpg',
  '/index.html',
  '/js/compiler.js',
  '/css/collapsible_block.css',
  '/css/controls.css',
  '/css/layout.css',
  '/css/radio_nav.css',
  '/css/tree_view.css',
  '/css/typography.css'
]

async function precache() {
  console.log('Actually ran precache')
  const cache = await caches.open(cacheName);
  return cache.addAll(precachedResources);
}

console.log('Registering the cacher install')
self.addEventListener('install', (event) => {
  console.log('Install ran in cacher', event)
  event.waitUntil(precache());
});

console.log('Registering the cacher activate')
self.addEventListener('activate', (event) => {
  console.log('Activating', event)
});

console.log('Registering the cacher fetch')
self.addEventListener('fetch', (event) => {

  const url = event.request.url

  event.respondWith(
    caches
      .open(cacheName)
      .then((cache) => cache.match(event.request))
      .then((cache_response) => {
        if (cache_response) {
          console.log('We have a match for the request', event.request.url);
          return cache_response;
        }

        return fetch(event.request).then((fetch_response) => {
          console.log('Cache miss for ', event.request.url, fetch_response);
          if (url.startsWith('https://upload.wikimedia.org') || url.endsWith('reset-2.0.min.css')) {
            console.log('Storing file in the cache', event.request.url);
            let responseClone = fetch_response.clone();
            console.log('clone', responseClone)
            caches.open(cacheName).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return fetch_response;
        });
      })
  );
});