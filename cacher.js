
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

class Fetcher {

  static is_request_for_website(request) {
    // This is the initial page load.
    if (request.referrer == '') {
      return true
    }
    const referrer_url = new URL(request.referrer)
    const request_url = new URL(request.url)

    return referrer_url.host == request_url.host
  }

  static has_query_params(request) {
    const request_url = new URL(request.url)
    return request_url.search.length > 0
  }

  static strip_query_params(url_str) {
    const url = new URL(url_str)
    const original_keys = Array.from(url.searchParams.keys())
    for (const key of original_keys) {
      url.searchParams.delete(key)
    }
    return url
  }

  static async cache_match_with_fetch_fallback(cache_name, url_or_request, put_on_success = true, cache_first = true) {
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

      // TODO: This will stall if there is a slow connection.
      // Instead we want to update in the background and then message the user that the data was stale.
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

  static async add_and_return_if_different(cache_name, url) {
    const cache = await caches.open(cache_name)
    const request = new Request(url)

    const cache_response = await cache.match(request)
    const fetch_response = await fetch(request)

    // If the response failed. Don't update the cache or force a reload.
    if (!fetch_response.ok) {
      return true
    }

    let cache_and_fetch_are_equal = true
    if (!cache_response) {
      // If the cache doesn't have the item yet update the cache and return that they different.
      cache_and_fetch_are_equal = false
    } else {
      const cache_text = await cache_response.clone().text()
      const fetch_text = await fetch_response.clone().text()
      cache_and_fetch_are_equal = (cache_text == fetch_text)
    }

    if (!cache_and_fetch_are_equal) {
      console.log(`Updating cache (${cache_name}) with file that changed: ${url}`)
      await cache.put(request, fetch_response)
    }

    return cache_and_fetch_are_equal
  }

  static fault_tolerant_add_all = async (cache_name, list_or_set, only_add_on_cache_miss = false) => {
    const url_list = [...list_or_set]
    let changed_files = []
    for (var i = 0; i < url_list.length; i++) {
      var url = url_list[i]
      if (only_add_on_cache_miss) {
        await Fetcher.cache_match_with_fetch_fallback(cache_name, url, true /* put_on_success */)
      } else {
        const this_response_unchanged = await this.add_and_return_if_different(cache_name, url)
        if (!this_response_unchanged) {
          changed_files.push(url)
        }
      }
    }
    console.log(`Finished ensuring the cache is fresh for ${url_list.length} items. (cache_name = ${cache_name}, only_add_on_cache_miss = ${only_add_on_cache_miss}; changed_files = ${changed_files})`, url_list)
    if (changed_files.length) {
      console.log('Changed files: ', changed_files)
    }
    if (!only_add_on_cache_miss) {
      console.log('Fetch complete and these files are changed: ', changed_files)
      return changed_files
    }
  }

  static async fetch(request) {
    // The server puts files in a directory and so the HTML needs to reference this directory
    // but this doesn't align with local dev. For local dev catch and reroute these requests.
    var updated_request = request.clone()
    const original_url = updated_request.url
    if (AppData.url_is_favicon(original_url) && !AppData.url_is_remote(original_url)) {
      const split_url = original_url.split('/')
      updated_request = new Request('./' + split_url[split_url.length - 1])

      // If this is request for this website, and has quer params, then strip them.
      // The response will be the same and it will mean there are more cache hits.
    } else if (
      Fetcher.is_request_for_website(request) &&
      Fetcher.has_query_params(request)
    ) {
      updated_request = new Request(Fetcher.strip_query_params(original_url))
    }

    if (Fetcher.is_request_for_website(request) && original_url.includes('/thumbnails/')) {
      return Fetcher.cache_match_with_fetch_fallback(cache_name_thumbnails, updated_request, true /* put_on_success */)
    } else {
      return Fetcher.cache_match_with_fetch_fallback(cache_name_versioned, updated_request, true /* put_on_success */)
    }
  }
}

class Cacher {
  constructor() {
    this.last_app_precache_start_date = null
  }

  // This function could do with a debounce on load, but there is no real "page load" event
  // for these workers and the initialisation is pretty long lived so for now this uses a TTL.
  async app_precache(event) {
    if (!this.last_app_precache_start_date) {
      this.last_app_precache_start_date = new Date(Date.now())
      console.log('Starting the precache of app files.')
    } else {
      const allowed_wait_sec = 2  // Short enough for quick refreshes during development.
      const time_since_sec = (Date.now() - this.last_app_precache_start_date.getTime()) / 1000
      if (time_since_sec < allowed_wait_sec) {
        console.log(`Prefetch is recent, ${time_since_sec} seconds ago. Returning early.`)
        return Promise.resolve()
      } else {
        console.log(`Prefetch is old, ${time_since_sec} seconds ago. Beginning new prefetch.`)
      }
    }
    this.precache_started = true
    const resources = AppData.get_resource_list_for_event(event)
    const only_add_on_cache_miss = false
    const changed_files = await Fetcher.fault_tolerant_add_all(cache_name_versioned, resources, only_add_on_cache_miss)
    if (changed_files.length > 0) {
      console.warn('Data changed and the page will refresh in half a second since these files changed:', changed_files)
      await new Promise(r => setTimeout(r, 500));
      await self.clients.matchAll({ 'type': 'window' }).then(async (clientList) => {
        for (const client of clientList) {
          console.warn('Sending reload request to client after app files were found to have changed:', client)
          await new Promise(r => setTimeout(r, 2000));
          client.postMessage('reload')
        }
      });
    }
    return changed_files
  }

  async precache_then_delete_old_caches(event) {
    await this.app_precache(event)
    console.log('Done with precache, auditing old caches.')
    const all_caches = await caches.keys()
    const current_caches = [cache_name_versioned, cache_name_thumbnails]
    const old_caches = all_caches.filter((item) => !current_caches.includes(item))
    if (old_caches.length > 0) {
      console.log('Found old caches, beginning delete.')
      for (const cache_name of old_caches) {
        console.warn('Deleting old cache', cache_name)
        await caches.delete(cache_name)
      }
      console.log('Done deleting old cache.')
    } else {
      console.log('There are no old caches to delete.')
    }
  }
}

const cacher = new Cacher()

self.addEventListener('install', (event) => {
  console.log('Installing cacher.js', event)
  event.waitUntil(async () => {
    await cacher.precache_then_delete_old_caches(event)
  });
});

self.addEventListener('activate', (event) => {
  console.log('Activating cacher.js', event)
  event.waitUntil(cacher.precache_then_delete_old_caches(event));
});

self.addEventListener('fetch', (event) => {
  response = Fetcher.fetch(event.request)
  event.respondWith(response)
});

self.addEventListener('message', async (event) => {
  const data = event.data
  switch (data.type) {
    case 'thumbnail_prefetch':
      event.waitUntil(Fetcher.fault_tolerant_add_all(cache_name_thumbnails, data.data, true /* only_add_on_cache_miss */))
      break
    case 'app_prefetch':
      event.waitUntil(cacher.app_precache(event))
      break
    default:
      throw Error(`Unknown event type sent as message: ${data.type}`)
  }
});

// This is meant to be done in the install event, but that code often doesn't execute.
// This will execute on load and only does something if there is a new worker waiting.
// It should be "safe" because the `compiler.js` code listens and refreshes the page if needed.
// It's still very aggressive to the user but for now seems better than the default of not
// knowning when the page will update.
console.warn('New load for service worker code. Calling `skipWaiting` to activate any that are ready.')
self.skipWaiting();