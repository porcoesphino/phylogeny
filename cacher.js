
const cache_name_versioned = 'porcoesphino_pt_v24.07.20.1';
const cache_name_thumbnails = 'porcoesphino_pt_thumbnails';

class AppData {
  static PRECACHED_RESOURCES = Object.freeze([
    '/',
    '/manifest.json',
    '/cacher.js',
    '/favicon_tree_192.png',
    '/favicon_tree_512.png',
    '/index.html',
    '/js/compiler.js',
    '/css/reset-2.0.min.css',
    '/css/collapsible_block.css',
    '/css/controls.css',
    '/css/layout.css',
    '/css/radio_nav.css',
    '/css/tree_view.css',
    '/css/typography.css',
    '/screenshots/chrome_screenshot.png',
    '/screenshots/iphone_screenshot.png',
  ])

  static url_is_remote(url) {
    return url.startsWith('https://porcoesphino.github.io')
  }

  static is_remote(event) {
    const scope = event.target.registration.scope
    return AppData.url_is_remote(scope)
  }

  static url_is_favicon(url) {
    return url.endsWith('favicon_tree_192.png') || url.endsWith('favicon_tree_512.png')
  }

  static get_resource_list_for_event(event) {
    if (AppData.is_remote(event)) {
      var prefix = '/phylogeny'
    } else {
      var prefix = ''
    }
    const resources_with_correct_prefix = []
    for (var i = 0; i < AppData.PRECACHED_RESOURCES.length; i++) {
      resources_with_correct_prefix.push(prefix + AppData.PRECACHED_RESOURCES[i])
    }
    return resources_with_correct_prefix
  }
}

async function cache_match_with_fetch_fallback(cache_name, url_or_request, put_on_success = true, cache_first = true) {
  const cache = await caches.open(cache_name)
  if (typeof (url_or_request) == 'string') {
    var request = new Request(url_or_request)
  } else {
    var request = url_or_request.clone()
  }

  // If we're serving the cache first, look it up and return.
  if (cache_first) {
    const cache_response = await cache.match(request)
    if (cache_response) {
      return cache_response
    }
    console.log(`Cache miss for "${request.url}", about to fetch.`)
  }

  // TODO: Ensure context is more clearly printed on failure.
  const fetch_response = await fetch(request)
  if (fetch_response.ok) {
    if (put_on_success) {
      console.log(`Adding "${request.url}" to cache`)
      let responseClone = fetch_response.clone();
      await cache.put(request, responseClone)
    }
  } else {

    // If we're not caching first, the load from the cache for any fetch miss.
    // If we were caching first, this was a miss so return the response.
    if (!cache_first) {
      console.log(`Fetch wasn't okay. Testing if the cache is available "${request.url}".`)
      const cache_response = await cache.match(request)
      if (cache_response) {
        return cache_response
      }
    }
  }

  return fetch_response
}

fault_tolerant_add_all = async (cache_name, list_or_set, only_add_on_cache_miss = false) => {
  const cache = await caches.open(cache_name)
  const url_list = [...list_or_set]
  for (var i = 0; i < url_list.length; i++) {
    var url = url_list[i]
    if (only_add_on_cache_miss) {
      await cache_match_with_fetch_fallback(cache_name, url, true /* put_on_success */)
    } else {
      console.log(`Ensuring "${url}" is up to date with an "add".`)
      await cache.add(url)
    }
  }
  console.log(`Finished ensuring the cache is fresh for ${url_list.length} items. (cache_name = ${cache_name}, only_add_on_cache_miss = ${only_add_on_cache_miss})`, url_list)
}

async function precache(event) {
  const resources = AppData.get_resource_list_for_event(event)
  return fault_tolerant_add_all(cache_name_versioned, resources, false /* only_add_on_cache_miss */)
}

function is_request_for_website(request) {
  // This is the initial page load.
  if (request.referrer == '') {
    return true
  }
  const referrer_url = new URL(request.referrer)
  const request_url = new URL(request.url)

  return referrer_url.host == request_url.host
}

function has_query_params(request) {
  const request_url = new URL(request.url)
  return request_url.search.length > 0
}

function strip_query_params(url_str) {
  const url = new URL(url_str)
  for (const key of url.searchParams.keys()) {
    url.searchParams.delete(key)
  }
  return url
}

self.addEventListener('install', (event) => {
  console.log('Installing cacher.js', event)
  event.waitUntil(async () => {
    await precache_then_delete_old_caches(event)

    // This should be safe because we have a listener that should refresh old tabs.
    console.warn('Skipping waiting to become active!')
    return skipWaiting();
  });
});

async function precache_then_delete_old_caches(event) {
  await precache(event)
  const all_caches = await caches.keys()
  const current_caches = [cache_name_versioned, cache_name_thumbnails]
  const old_caches = all_caches.filter((item) => !current_caches.includes(item))
  for (const cache_name of old_caches) {
    console.warn('Deleting old cache', cache_name)
    await caches.delete(cache_name)
  }
}

self.addEventListener('activate', (event) => {
  console.log('Activating cacher.js', event)
  event.waitUntil(precache_then_delete_old_caches(event));
});

self.addEventListener('fetch', (event) => {

  // The server puts files in a directory and so the HTML needs to reference this directory
  // but this doesn't align with local dev. For local dev catch and reroute these requests.
  var updated_request = event.request.clone()
  const original_url = updated_request.url
  if (AppData.url_is_favicon(original_url) && !AppData.url_is_remote(original_url)) {
    const split_url = original_url.split('/')
    updated_request = new Request('./' + split_url[split_url.length - 1])

    // If this is request for this website, and has quer params, then strip them.
    // The response will be the same and it will mean there are more cache hits.
  } else if (is_request_for_website(event.request) && has_query_params(event.request)) {
    updated_request = new Request(strip_query_params(original_url))
  }

  if (is_request_for_website(event.request) && original_url.includes('/thumbnails/')) {
    event.respondWith(cache_match_with_fetch_fallback(cache_name_thumbnails, updated_request, true /* put_on_success */))
  } else {
    event.respondWith(cache_match_with_fetch_fallback(cache_name_versioned, updated_request, true /* put_on_success */, false /* cache_first */))
  }
});

self.addEventListener('message', async (event) => {
  const data = event.data
  switch (data.type) {
    case 'thumbnail_prefetch':
      event.waitUntil(fault_tolerant_add_all(cache_name_thumbnails, data.data, true /* only_add_on_cache_miss */))
      break
    case 'app_prefetch':
      event.waitUntil(precache(event))
      break
    default:
      throw Error(`Unknown event type sent as message: ${data.type}`)
  }
});