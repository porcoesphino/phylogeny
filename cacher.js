
const cacheName = 'porcoesphino_pt';
const precachedResources = [
  '/',
  '/cacher.js',
  '/favicon_tree_192.png',
  '/favicon_tree_512.png',
  '/index.html',
  '/js/compiler.js',
  '/css/collapsible_block.css',
  '/css/controls.css',
  '/css/layout.css',
  '/css/radio_nav.css',
  '/css/tree_view.css',
  '/css/typography.css'
]

async function precache(prefix) {
  const initial_load = []
  for (var i = 0; i < precachedResources.length; i++) {
    initial_load.push(prefix + precachedResources[i])
  }
  console.log('Precache expected files: ', initial_load)
  const cache = await caches.open(cacheName);
  return cache.addAll(initial_load).catch((error) => {
    console.error('Continuing through an error during addAll: ', error);
  });;
}

console.log('Registering the cacher install')
self.addEventListener('install', (event) => {
  console.log('Install ran in cacher', event)
  if (event.target.registration.scope.startsWith('https://porcoesphino.github.io')) {
    var prefix = '/phylogeny'
  } else {
    var prefix = ''
  }
  event.waitUntil(precache(prefix));
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
          // TODO: We should only be storing if the request was successful but it is complicated
          // by CORS. The response then is "opaque" and has empty attributes but works for caching.
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