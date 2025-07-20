
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

function url_is_remote(url) {
  return url.startsWith('https://porcoesphino.github.io')
}

function url_is_favicon(url) {
  return url.endsWith('favicon_tree_192.png') || url.endsWith('favicon_tree_512.png')
}

async function match_from_cache_and_fetch_on_miss(cache_name, url_or_request, put_on_success = true) {
  const cache = await caches.open(cache_name)
  if (typeof (url_or_request) == 'string') {
    var request = new Request(url_or_request)
  } else {
    var request = url_or_request.clone()
  }
  const cache_response = await cache.match(request)
  if (cache_response) {
    return cache_response
  }

  const fetch_response = await fetch(request)
  if (put_on_success && fetch_response.ok) {
    await cache.put(request, fetch_response)
  }
  return fetch_response
}

async function fault_tolerant_add_all(cache_name, list_or_set, only_if_cache_miss = false) {
  const cache = await caches.open(cache_name)
  url_list = [...list_or_set]
  for (var i = 0; i < url_list.length; i++) {
    var url = url_list[i]
    if (only_if_cache_miss) {
      await match_from_cache_and_fetch_on_miss(cacheName, url, put_on_success = true)
    } else {
      await cache.add(url)
    }
  }
  console.log(`Finished ensuring the cache is fresh for ${url_list.length} items.`, url_list)
}

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
  if (url_is_remote(event.target.registration.scope)) {
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
          return cache_response;
        }

        console.log('Cache miss for ', event.request.url, event.request);

        // The server puts files in a directory and so the HTML needs to reference this directory
        // but this doesn't align with local dev. For local dev catch and reroute these requests.
        var updated_request = event.request.clone()
        if (url_is_favicon(url) && !url_is_remote(url)) {
          split_url = event.request.url.split('/')
          updated_request = new Request('./' + split_url[split_url.length - 1])
        }

        return fetch(updated_request).then((fetch_response) => {

          // TODO: Load the CSS reset from a local dir.
          if ((url.includes('/thumbnails/') && fetch_response.ok) || url.endsWith('reset-2.0.min.css')) {
            console.log('Storing file in the cache', event.request.url, fetch_response);
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

self.addEventListener('message', async (event) => {
  await fault_tolerant_add_all(cacheName, event.data, true /* only_if_cache_miss */)
});
