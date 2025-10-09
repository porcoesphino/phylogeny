const WIDTH_BOTH_ACCORDIONS_STAY_OPEN = 1200

const WIDTH_CONTROL_ACCORDION_STAY_OPEN = 780

class OfflineCaching {
  static ID_DOWNLOAD_PROGRESS_TEXT = 'offline-download-progress-text'
  static ID_DOWNLOAD_PROGRESS_BAR = 'offline-download-progress-bar'
  static ID_MEMORY_USED = 'memory-used'

  static will_be_blocked_by_cors() {
    return window.location.href.startsWith('file:')
  }

  static offline_support() {
    return 'serviceWorker' in navigator && !OfflineCaching.will_be_blocked_by_cors()
  }

  static sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  static reload_update_if_user_confirms(event_name) {
    const theyAreSure = window.confirm('A new version was loaded (' + event_name + '). Reload now?')
    if (theyAreSure) {
      window.location.reload();
    }
  }

  static register_cacher() {
    if (OfflineCaching.offline_support()) {
      // Register a service worker hosted at the root of the site using the default scope.
      navigator.serviceWorker.register('./cacher.js').then(
        (registration) => {
          console.log('Cacher service worker registration succeeded:', registration);
        },
        (error) => {
          console.error(`Cacher service worker registration failed: ${error}`);
        },
      );
      navigator.serviceWorker.addEventListener('controllerchange',
        () => {
          console.error('A new service worked started so do the simple thing and reload.')
          OfflineCaching.reload_update_if_user_confirms('controllerchange')
        },
        { once: true }
      );

      navigator.serviceWorker.addEventListener('message',
        async (event) => {
          const data = event.data
          switch (data.type) {
            case 'reload':
              console.error('Executing the reload request of a service worker.')
            OfflineCaching.reload_update_if_user_confirms('message')
              break
            case 'installation_update':
              const progress_indicator_el = document.getElementById('progress')
              progress_indicator_el.style.visibility = 'visible'
              const progress = data.payload.progress
              const total = data.payload.total
              OfflineCaching.update_download_progress_indicator(progress, total)
              await OfflineCaching.update_memory_estimate()
              await Settings.update_assets_progress(page.state)
              break
            default:
              throw Error(`Unknown event type sent as message: ${data}`)
          }
        },
        { once: false }
      );
    } else {
      console.warn('Cacher service worker was not registered since service workers are not supported.');
    }
  }

  static async update_memory_estimate() {
    const  memory_used_el = document.getElementById(OfflineCaching.ID_MEMORY_USED)
    const quota = await navigator.storage.estimate();
    const usage_mb = quota.usage / 1000 / 1000
    memory_used_el.innerText = Math.round(usage_mb) + ' MB'
  }

  static update_download_progress_indicator(progress, total) {
    var offline_bar_el = document.getElementById(OfflineCaching.ID_DOWNLOAD_PROGRESS_BAR)
    offline_bar_el.max = total
    offline_bar_el.value = progress
    var offline_text_el = document.getElementById(OfflineCaching.ID_DOWNLOAD_PROGRESS_TEXT)
    offline_text_el.innerText = ' (' + progress + '/' + total + ')'
  }

  static async fetch_all_urls(local_urls) {
    if (OfflineCaching.offline_support()) {
      navigator.serviceWorker.ready.then(
        async (registration) => {
          console.log('Client requesting thumbnail_prefetch', local_urls, registration)
          OfflineCaching.update_download_progress_indicator(0, local_urls.size)
          await OfflineCaching.update_memory_estimate()
          registration.active.postMessage(
            {
              'type': 'thumbnail_prefetch',
              'data': local_urls
            }
          )
        }
      )
    } else {
      console.warn('The thumbnail_prefetch was aborted since service workers are not supported.');
    }
  }

  static async trigger_app_code_refresh() {
    if ('serviceWorker' in navigator && !OfflineCaching.will_be_blocked_by_cors()) {
      navigator.serviceWorker.ready.then(
        (registration) => {
          registration.active.postMessage(
            {
              'type': 'app_prefetch',
            }
          )
        }
      )
    } else {
      console.warn('The app_prefetch was aborted since service workers are not supported.');
    }
  }

  static async get_cache_names() {
    return await window.caches.keys()
  }

  static async delete_caches() {
    if (OfflineCaching.offline_support()) {
      navigator.serviceWorker.ready.then(
        (registration) => {
          registration.active.postMessage(
            {
              'type': 'delete_caches',
            }
          )
        }
      )
    } else {
      console.warn('Deleting caches was aborted since service workers are not supported.');
    }
  }
}

function clear_child_nodes(parent_el) {
  while (parent_el.firstChild) {
    // The list is LIVE so it will re-index each call
    parent_el.removeChild(parent_el.firstChild);
  }
}

class QueryParams {
  static _MISSING_ROOT_FOR_LUCA = 'overview'
  static _KEY_CONTROLS = 'controls'
  static _DEFAULT_CONTROLS = 'open'
  static _KEY_SUMMARY = 'summary'
  static _DEFAULT_SUMMARY = ''
  static _KEY_ROOT = 'root'
  static _DEFAULT_ROOT = 'animalia'
  static _KEY_CARD = 'card'
  static _DEFAULT_CARD = 'all'
  static _KEY_TAXA = 'taxa'
  static _DEFAULT_TAXA = ''
  static _DEFAULTS = new Map([
    [QueryParams._KEY_CONTROLS, QueryParams._DEFAULT_CONTROLS],
    [QueryParams._KEY_SUMMARY, QueryParams._DEFAULT_SUMMARY],
    [QueryParams._KEY_ROOT, QueryParams._DEFAULT_ROOT],
    [QueryParams._KEY_CARD, QueryParams._DEFAULT_CARD],
    [QueryParams._KEY_TAXA, QueryParams._DEFAULT_TAXA],
  ])

  _get(key, default_value = null) {
    const params = new URLSearchParams(location.search);
    if (!params.has(key) && !!default_value) {
      return default_value
    }
    return params.get(key)
  }

  static _get_new_location_from_params(params) {
    if (params.size > 0) {
      return `${location.pathname}?${params}`
    } else {
      return location.pathname
    }
  }

  _update(key, value, default_value = null) {
    const params = new URLSearchParams(location.search);

    if (value == default_value) {
      // If this is a default, make sure it's not sent to the URL.
      if (!!params.has(key)) {
        params.delete(key)
      } else {
        return
      }
    } else {
      // If this will set the same value, abort early.
      if (params.get(key) == value) {
        return
      }

      params.set(key, value)
    }

    window.history.pushState({}, '', QueryParams._get_new_location_from_params(params));
  }

  get controls() {
    return this._get(QueryParams._KEY_CONTROLS, QueryParams._DEFAULT_CONTROLS)
  }

  update_all(new_params, state) {
    const params = new URLSearchParams(location.search);
    for (const [key, value] of new_params) {
      params.set(key, value)
    }
    const new_location = QueryParams._get_new_location_from_params(params)
    window.history.pushState({}, '', new_location);
    this.clean_url(state)
  }

  set controls(new_value) {
    this._update(QueryParams._KEY_CONTROLS, new_value, QueryParams._DEFAULT_CONTROLS)
  }

  get summary() {
    return this._get(QueryParams._KEY_SUMMARY, QueryParams._DEFAULT_SUMMARY)
  }

  set summary(new_value) {
    this._update(QueryParams._KEY_SUMMARY, new_value, QueryParams._DEFAULT_SUMMARY)
  }

  get root() {
    return this._get(QueryParams._KEY_ROOT)
  }

  set root(new_value) {
    this._update(QueryParams._KEY_ROOT, new_value, null /* Always add this query param */)
  }

  get card() {
    return this._get(QueryParams._KEY_CARD, QueryParams._DEFAULT_CARD)
  }

  set card(new_value) {
    this._update(QueryParams._KEY_CARD, new_value, QueryParams._DEFAULT_CARD)
  }

  get taxa() {
    return this._get(QueryParams._KEY_TAXA, QueryParams._DEFAULT_TAXA)
  }

  set taxa(new_value) {
    this._update(QueryParams._KEY_TAXA, new_value, QueryParams._DEFAULT_TAXA)
  }

  clean_url(state) {
    const params = new URLSearchParams(location.search);

    const keys = Array.from(params.keys())
    for (var i = 0; i < keys.length; i++) {
      if (!QueryParams._DEFAULTS.has(keys[i])) {
        params.delete(keys[i])
      }
    }
    if (params.has(QueryParams._KEY_ROOT)) {
      if (this.root != QueryParams._MISSING_ROOT_FOR_LUCA && !state.data_map.has_taxa(this.root)) {
        params.delete(QueryParams._KEY_ROOT)
      }
    }

    for (const [key, default_value] of QueryParams._DEFAULTS) {
      // Always show the root
      if (key == QueryParams._KEY_ROOT) {
        continue
      }
      if (params.get(key) == default_value) {
        params.delete(key)
      }
    }

    if (params.size > 0) {
      var new_location = `${location.pathname}?${params}`
    } else {
      var new_location = location.pathname
    }
    window.history.replaceState({}, '', new_location);
  }
}

class MenuMap {
  constructor() {
    this._menu_mapped_by_taxa = null
  }

  _get_menu_map() {
    if (this._menu_mapped_by_taxa == null) {
      this._menu_mapped_by_taxa = new Map()
      for (var i = 0; i < window.data_files.length; i++) {
        var file_metadata = window.data_files[i]
        this._menu_mapped_by_taxa.set(file_metadata.taxa.toLowerCase(), file_metadata)
      }
    }
    return this._menu_mapped_by_taxa
  }

  has_taxa(taxa) {
    if (!taxa) {
      return false
    }
    return this._get_menu_map().has(taxa.toLowerCase())
  }

  get_metadata(taxa) {
    return this._get_menu_map().get(taxa.toLowerCase())
  }
}

class DataMap {
  constructor() {
    this._taxa_to_root = null
    this._taxa_to_metadata = null
    this._common_name_to_root_taxa_list = null
  }

  static get_data_for_file(metadata_file) {
    if (!window.hasOwnProperty(metadata_file)) {
      throw new Error('Data missing: ' + metadata_file)
    }
    return window[metadata_file]
  }

  _build_maps() {
    if (this._data_mapped_by_taxa == null) {
      // The value is name of the tree that includes this taxa.
      this._taxa_to_root = new Map()
      this._taxa_to_metadata = new Map()
      this._common_name_to_root_taxa_list = new Map()
      for (var file_i = 0; file_i < window.data_files.length; file_i++) {
        var menu_metadata = window.data_files[file_i]
        var tree_as_list = DataMap.get_data_for_file(menu_metadata.file)
        var root = menu_metadata.taxa.toLowerCase()
        for (var taxa_i = 0; taxa_i < tree_as_list.length; taxa_i++) {
          var taxa_metadata = tree_as_list[taxa_i]
          var id = taxa_metadata.name.toLowerCase()
          if (this._taxa_to_root.has(id) || this._taxa_to_metadata.has(id)) {
            throw new Error(`Duplicate taxa ID in source data (${id}).`)
          }
          this._taxa_to_root.set(id, root)
          this._taxa_to_metadata.set(id, taxa_metadata)

          if (!!taxa_metadata.common) {
            for (var common_i = 0; common_i < taxa_metadata.common.length; common_i++) {
              const common_name = taxa_metadata.common[common_i]
              if (!this._common_name_to_root_taxa_list.has(common_name)) {
                this._common_name_to_root_taxa_list.set(common_name, [])
              }
              var root_for_common_names = this._common_name_to_root_taxa_list.get(common_name)
              root_for_common_names.push([root, id])
            }
          }
        }
      }
    }
    return this._data_mapped_by_taxa
  }

  // The value is name of the tree that includes this taxa.
  get taxa_to_root() {
    if (this._taxa_to_root == null) {
      this._build_maps()
    }
    return this._taxa_to_root
  }

  has_taxa(taxa) {
    return this.taxa_to_root.has(taxa.toLowerCase())
  }

  get_root(taxa) {
    return this.taxa_to_root.get(taxa.toLowerCase())
  }

  get taxa_to_metadata() {
    if (this._taxa_to_metadata == null) {
      this._build_maps()
    }
    return this._taxa_to_metadata
  }

  get_metadata(taxa) {
    return this.taxa_to_metadata.get(taxa.toLowerCase())
  }

  get common_name_to_root_taxa_list() {
    if (!this._common_name_to_root_taxa_list) {
      this._build_maps()
    }
    return this._common_name_to_root_taxa_list
  }
}

class State {

  static get_img_relative_path_from_remote(remote_url) {
    const split_path = remote_url.split('/')
    return 'thumbnails/' + split_path[split_path.length - 1]
  }

  constructor(tree_range, card = 'all') {
    this._tree_range = tree_range
    this._card = card
    this._clear_cache()
    this.menu_map = new MenuMap()
    this.data_map = new DataMap()
    this._autocomplete_list = null
    this._img_set = null
  }

  get_tree_for_root_id(root_id) {
    switch (root_id) {
      case 'all':
        var all_data = []
        for (var i = 0; i < window.data_files.length; i++) {
          var file_metadata = window.data_files[i]
          var var_name_for_file = file_metadata.file
          if (!window.hasOwnProperty(var_name_for_file)) {
            throw new Error('State missing: ' + var_name_for_file)
          }
          var data_from_file = window[var_name_for_file]
          all_data = all_data.concat(data_from_file)
        }
        return all_data
      default:
        var metadata = this.menu_map.get_metadata(root_id)
        return DataMap.get_data_for_file(metadata.file)
    }
  }

  _clear_cache() {
    this._displayed_tree_raw_data = null
    this._parent_to_child_list = null
    this._root_name = null
    this._max_card = null
  }

  get tree_range() {
    return this._tree_range
  }

  set tree_range(new_val) {
    this._tree_range = new_val
    this._clear_cache()
  }

  get card() {
    return this._card
  }

  set card(new_val) {
    this._card = new_val
    this._clear_cache()
  }

  get displayed_tree_raw_data() {
    if (!this._displayed_tree_raw_data) {
      if (!this.tree_range) {
        return []  // Abort early during initialisation.
      }
      this._displayed_tree_raw_data = this.get_tree_for_root_id(this.tree_range)
    }
    return this._displayed_tree_raw_data
  }

  _update_maps() {

    if (this.displayed_tree_raw_data.length == 0) {
      return  // Abort early during initialisation.
    }

    var parent_to_child_list = new Map()
    var name_to_node = new Map()
    var filtered_nodes = []
    var max_card = 0

    for (var i = 0; i < this.displayed_tree_raw_data.length; i++) {
      var n = this.displayed_tree_raw_data[i]

      var display_node = (this.card == 'all' || Number(this.card) == n.card)

      if (!display_node) {
        continue
      }

      filtered_nodes.push(n)
      if (n.card && n.card > max_card) {
        max_card = n.card
      }

      if (!parent_to_child_list.has(n.parent)) {
        parent_to_child_list.set(n.parent, [])
      }
      var parents_children = parent_to_child_list.get(n.parent)
      parents_children.push(n)

      if (!name_to_node.has(n.name)) {
        name_to_node.set(n.name, n)
      } else {
        console.error('Map already has node', n.name, n, name_to_node)
      }
    }

    if (!filtered_nodes || filtered_nodes.length == 0) {
      throw new Error('Empty filtered_nodes')
    }

    var current_parent = filtered_nodes[0].parent
    while (name_to_node.has(current_parent)) {
      grand_parent = current_parent.parent
      if (!grand_parent) {
        break
      }
      current_parent = grand_parent
    }

    this._max_card = max_card
    this._root_name = current_parent
    this._parent_to_child_list = parent_to_child_list
    this._name_to_node = name_to_node
  }

  get max_card() {
    if (this._max_card == null) {
      this._update_maps()
    }
    return this._max_card
  }

  get root_name() {
    if (!this._root_name) {
      this._update_maps()
    }
    return this._root_name
  }

  get parent_to_child_list() {
    if (!this._parent_to_child_list) {
      this._update_maps()
    }
    return this._parent_to_child_list
  }

  get name_to_node() {
    if (!this._name_to_node) {
      this._update_maps()
    }
    return this._name_to_node
  }

  get current_domain() {
    const menu_metadata = this.menu_map.get_metadata(this.root_name)
    if (!menu_metadata) {
      return ''
    }
    return menu_metadata.domain
  }

  get autocomplete_list() {
    if (!this._autocomplete_list) {
      var taxa_list = this.data_map.taxa_to_root.keys()
      var common_name_list = this.data_map.common_name_to_root_taxa_list.keys()
      this._autocomplete_list = [...taxa_list, ...common_name_list].sort()

    }
    return this._autocomplete_list
  }

  get img_urls() {
    if (!this._img_set) {
      var img_list = []
      for (const metadata of this.data_map.taxa_to_metadata.values()) {
        if (!!metadata.imgs && metadata.imgs.length > 0) {
          metadata.imgs.forEach((remote_url) => {
            img_list.push(State.get_img_relative_path_from_remote(remote_url))
          })
        }
      }
      this._img_set = new Set(img_list)
    }
    return this._img_set
  }
}

class Search {
  static ID = 'taxa-search'
  static AUTOCOMPLETE_LIST_ID = 'common-names-and-taxa-list'

  constructor(state) {
    this._state = state
  }

  static ensure_parents_are_visible(el) {
    var p = el.parentNode
    while (p.id != 'tree-range-select-buttons') {
      p.style.display = ''
      p = p.parentNode
    }
  }

  static get_start_indicies_for_substring(full_string, sub_string) {
    let string_to_match_in = full_string.toLowerCase()
    const sub_string_lower = sub_string.toLowerCase()
    const indicies = []

    while (true) {
      const rel_index = string_to_match_in.indexOf(sub_string_lower)
      if (rel_index >= 0) {
        if (indicies.length > 0) {
          var absolut_index = rel_index + indicies[indicies.length - 1] + sub_string.length
        } else {
          var absolut_index = rel_index
        }
        indicies.push(absolut_index)
        string_to_match_in = string_to_match_in.substr(absolut_index + sub_string_lower.length)
      } else {
        break
      }
    }
    return indicies
  }

  static wrap_nested_text_with_mark_tags(el, text) {
    const indicies = Search.get_start_indicies_for_substring(el.innerText, text)
    const inner_text = el.innerText
    const fragment = document.createDocumentFragment();

    let last_index = 0
    for (const index of indicies) {
      if (last_index < index) {
        const text_for_node = inner_text.substr(last_index, index - last_index)
        fragment.appendChild(document.createTextNode(text_for_node))
      }
      const mark_el = document.createElement('mark')
      mark_el.innerText = inner_text.substr(index, text.length)
      fragment.appendChild(mark_el)
      last_index = index + text.length
    }
    const end_of_last_match = indicies[indicies.length - 1] + text.length
    const text_after_last_match = inner_text.substr(end_of_last_match)
    fragment.appendChild(document.createTextNode(text_after_last_match))

    clear_child_nodes(el)
    el.innerText = ''
    el.appendChild(fragment)
  }

  static add_mark_for_text(search) {
    const root_el = document.getElementById('tree_root')
    const text_only_els = root_el.querySelectorAll('.taxa, .common_names, .tag')
    for (const el of text_only_els) {
      if (el.innerText.toLowerCase().includes(search.toLowerCase())) {
        Search.wrap_nested_text_with_mark_tags(el, search)
      }
    }
  }

  // Assumes all parent elements were text before mark was added.
  static remove_all_marks() {
    const root_el = document.getElementById('tree_root')
    const mark_els = root_el.querySelectorAll('mark')
    const parents = []

    // Multiple mark elements could have the same parent, so flatten them.
    for (const el of mark_els) {
      parents.push(el.parentElement)
    }
    const parent_set = new Set(parents)

    for (const parent of parent_set) {
      let text = ''
      for (const child of parent.childNodes) {
        switch (child.nodeName) {
          case 'MARK':
            text += child.innerText
            break
          case '#text':
            text += child.textContent
            break
          default:
            const error_msg_prefix = 'Unexpected node while removing marks: '
            console.error(error_msg_prefix, child)
            throw Error(`${error_msg_prefix}${child}`)
        }
      }
      clear_child_nodes(parent)
      parent.innerText = text
    }
  }

  _menu_el_matches_search(el, search_input_lowercase) {
    var input_el = el.getElementsByTagName('input')[0];
    var id = input_el.id
    var data_for_menu_item = this._state.get_tree_for_root_id(id)
    for (var data_i = 0; data_i < data_for_menu_item.length; data_i++) {
      var taxa_metadata = data_for_menu_item[data_i]
      if (taxa_metadata.name.toLowerCase().includes(search_input_lowercase)) {
        return true
      }

      if (!!taxa_metadata.tag && taxa_metadata.tag.toLowerCase().includes(search_input_lowercase)) {
        return true
      }

      if (!taxa_metadata.common) {
        continue
      }
      var common_names = taxa_metadata.common
      for (var name_i = 0; name_i < common_names.length; name_i++) {
        if (common_names[name_i].toLowerCase().includes(search_input_lowercase)) {
          return true
        }
      }
    }

    return false
  }

  _search_callback() {
    var search_el = document.getElementById(Search.ID)
    const search_input_raw = search_el.value
    const search_input_lowercase = search_input_raw.toLowerCase()

    var matches = []

    var menu_items = document.querySelectorAll('#tree-range-select-buttons li, #tree-range-select-buttons > div > div')

    const exact_match_fieldset_el = document.getElementById('exact-match-fieldset')
    const exact_match_buttons_el = document.getElementById('exact-match-buttons')
    clear_child_nodes(exact_match_buttons_el)

    if (!search_input_raw) {

      // If the search is empty, hide the exact matches before the early abort.
      exact_match_fieldset_el.style.display = 'none'

      Search.remove_all_marks()

      // If the search is empty, make the menu visible.
      for (var i = 0; i < menu_items.length; i++) {
        var menu_el = menu_items[i]
        menu_el.style.display = ''
      }
      return
    }

    for (var i = 0; i < menu_items.length; i++) {
      var menu_el = menu_items[i]

      var innerText_lowercase = menu_items[i].innerText.toLowerCase()
      if (
        innerText_lowercase.includes(search_input_lowercase) ||
        this._menu_el_matches_search(menu_el, search_input_lowercase)
      ) {
        matches.push(menu_el)
      }
    }

    // Start by hidding all items
    for (var i = 0; i < menu_items.length; i++) {
      var menu_el = menu_items[i]
      menu_el.style.display = 'none'
    }

    // Then make matches and parents visible
    // TODO: Parents and matches should be a different colour.
    for (var i = 0; i < matches.length; i++) {
      var menu_el = matches[i]
      menu_el.style.display = ''
      Search.ensure_parents_are_visible(menu_el)
    }

    if (matches.length == 0) {
      Search.remove_all_marks()
      exact_match_fieldset_el.style.display = 'none'
    } else {

      // Add a `mark` tag.
      Search.add_mark_for_text(search_input_raw)

      var root_taxa_pairs = []
      if (this._state.data_map.taxa_to_root.has(search_input_raw)) {
        root_taxa_pairs.push([this._state.data_map.taxa_to_root.get(search_input_raw), search_input_raw])
      }
      if (this._state.data_map.common_name_to_root_taxa_list.has(search_input_raw)) {
        const root_taxa_pairs_for_common_name = this._state.data_map.common_name_to_root_taxa_list.get(search_input_raw)
        root_taxa_pairs = root_taxa_pairs.concat(root_taxa_pairs_for_common_name)
      }

      if (root_taxa_pairs.length == 0) {
        exact_match_fieldset_el.style.display = 'none'
        return
      }

      const capitalizeFirstLetter = (str) => {
        return String(str).charAt(0).toUpperCase() + String(str).slice(1);
      }

      const fragment = document.createDocumentFragment();
      for (var i = 0; i < root_taxa_pairs.length; i++) {
        const [root, taxa] = root_taxa_pairs[i]
        const callback = () => {
          window.page.select_new_tree_range(root, true /* select_menu */, false /* scroll_menu */, taxa)
        }

        var outer_div_el = document.createElement('div')
        var input_el = document.createElement('input')
        input_el.type = 'radio'
        var id = `exact_match_${root}_${taxa}`
        input_el.id = id
        input_el.value = id
        input_el.name = 'exact_match_radio'
        input_el.addEventListener('click', callback)
        outer_div_el.appendChild(input_el)
        var label_el = document.createElement('label')
        label_el.htmlFor = id
        outer_div_el.appendChild(label_el)
        var inner_div_el = document.createElement('div')
        var label = `${capitalizeFirstLetter(taxa)} as part of the ${capitalizeFirstLetter(root)} tree`
        inner_div_el.innerText = label

        const metadata = this._state.data_map.get_metadata(taxa)
        if (!!metadata.tag) {
          var br_el = document.createElement('br')
          inner_div_el.appendChild(br_el)
          var small_el = document.createElement('small')
          const max_summary_length = 150
          var summary = metadata.tag.substr(0, max_summary_length)
          if (metadata.tag.length > max_summary_length) {
            summary += '…'
          }
          small_el.innerText = summary
          inner_div_el.appendChild(small_el)
        }
        label_el.appendChild(inner_div_el)

        fragment.appendChild(outer_div_el)

      }

      exact_match_buttons_el.appendChild(fragment)
      exact_match_fieldset_el.style.display = ''
    }
  }

  _debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
  }

  add_callback() {
    var process_typing = this._debounce(() => this._search_callback());
    document.getElementById(Search.ID).addEventListener('input', process_typing)
  }

  add_autocomplete_options() {
    const fragment = document.createDocumentFragment();
    const autocomplete_list = this._state.autocomplete_list
    for (const autocomplete_value of autocomplete_list.values()) {
      const option_el = document.createElement("option");
      option_el.value = autocomplete_value
      fragment.appendChild(option_el);
    }
    const autocomplete_list_el = document.getElementById(Search.AUTOCOMPLETE_LIST_ID)
    autocomplete_list_el.appendChild(fragment)
  }
}

class TreeBuilderAsTreeList {

  constructor(state) {
    this._state = state
  }

  static scroll_to_taxa(root, taxa, shake = false) {

    const taxa_treebox_el = document.getElementById(`${root}_${taxa}`)
    // TODO: Remove this workaround to ensure the column layout is complete.
    setTimeout(() => {
      taxa_treebox_el.scrollIntoView({ block: "center", behavior: "instant" });

      if (shake) {
        const shake_animation = [
          { transform: 'translate(1px, 1px) rotate(0deg)' },
          { transform: 'translate(-1px, -1px) rotate(-0.1deg)' },
          { transform: 'translate(-1px, 0px) rotate(0.1deg)' },
          { transform: 'translate(1px, 1px) rotate(0deg)' },
          { transform: 'translate(1px, -1px) rotate(0.1deg)' },
          { transform: 'translate(-1px, 1px) rotate(-0.1deg)' },
          { transform: 'translate(-1px, 1px) rotate(0deg)' },
          { transform: 'translate(1px, 1px) rotate(-0.1deg)' },
          { transform: 'translate(-1px, -1px) rotate(0.1deg)' },
          { transform: 'translate(1px, 1px) rotate(0deg)' },
          { transform: 'translate(1px, -1px) rotate(-0.1deg)' },
        ]

        taxa_treebox_el.style.background = 'rgb(229 255 220)'
        taxa_treebox_el.style.borderColor = 'rgb(50 161 12)'
        taxa_treebox_el.animate(shake_animation, { duration: 1000 })
      }
    }, 100)
  }

  _create_icon_button(prefix, icon_path, name) {
    var link_el = document.createElement('a')
    link_el.href = prefix + name
    link_el.target = '_blank'
    link_el.classList.add('icon-button')

    var link_img_el = document.createElement('img')
    link_img_el.src = icon_path

    link_el.appendChild(link_img_el)
    return link_el
  }

  _get_element_for_node(node, node_map, level = 0) {

    if (typeof (node) == 'string') {
      var is_root = true
      if (node == 'LUCA') {
        // Create a fake node for LUCA.
        node = {
          'name': node,
          'tag': 'The theoretical Last Universal Common Ancestor.'
        }
      } else {
        // If this is a parent node, load it's data from the tree where it's a child.
        node = this._state.data_map.get_metadata(node)
      }
    } else {
      var is_root = false
    }

    const taxa_as_id = node.name.toLowerCase()

    const append_name = (node, parent_el) => {
      var name_parent_el = document.createElement('span')

      var name_el = document.createElement('span')
      name_el.innerText = name

      name_parent_el.appendChild(name_el)

      const wikipedia_link_el = this._create_icon_button(
        'https://en.wikipedia.org/wiki/',
        './thumbnails/icon_wikipedia.jpg',
        name
      )
      name_parent_el.appendChild(wikipedia_link_el)

      const inaturalist_link_el = this._create_icon_button(
        'https://www.inaturalist.org/search?source%5B%5D=taxa&q=',
        './thumbnails/icon_inaturalist.png',
        name
      )
      name_parent_el.appendChild(inaturalist_link_el)

      const eol_link_el = this._create_icon_button(
        'https://eol.org/search?utf8=%E2%9C%93&q=',
        './thumbnails/icon_eol.png',
        name
      )
      name_parent_el.appendChild(eol_link_el)

      if (this._state.current_domain == 'animalia') {
        const animaldiversity_link_el = this._create_icon_button(
          'https://animaldiversity.org/accounts/',
          './thumbnails/icon_animaldiversity.png',
          name
        )
        name_parent_el.appendChild(animaldiversity_link_el)
      }

      if (node.rank == 'Order' && this._state.tree_range == 'insecta') {
        const animaldiversity_link_el = this._create_icon_button(
          'https://genent.cals.ncsu.edu/insect-identification/order-',
          './thumbnails/icon_ncstate.png',
          name
        )
        name_parent_el.appendChild(animaldiversity_link_el)
      }

      if (node.hasOwnProperty('ipa') && !!node.ipa) {

        var ipa_parent_el = document.createElement('span')
        ipa_parent_el.appendChild(document.createTextNode(' (/'))
        var ipa_link_el = document.createElement('a')
        ipa_link_el.href = 'https://ipa-reader.com/?voice=Russell&text=' + node.ipa
        ipa_link_el.innerText = node.ipa
        ipa_link_el.target = '_blank'
        ipa_parent_el.appendChild(ipa_link_el)
        ipa_parent_el.appendChild(document.createTextNode('/)'))
        name_parent_el.appendChild(ipa_parent_el)
      }
      parent_el.appendChild(name_parent_el)
    }

    const maybe_append_common_names = (node, parent_el) => {
      if (node.hasOwnProperty('common') && !!node.common && node.common.length > 0) {
        var common_names_el = document.createElement('span')
        common_names_el.classList.add('common_names')
        common_names_el.innerText = '(' + node.common.join(', ') + ')'
        parent_el.appendChild(common_names_el)
      }
    }

    const add_float_right = (node, parent_el, is_root) => {
      var right_el = document.createElement('span')
      right_el.classList.add('float-right')
      maybe_append_open_tree_button(node, right_el, is_root)
      maybe_append_rank(node, right_el)
      parent_el.appendChild(right_el)
    }

    const maybe_append_open_tree_button = (node, parent_el) => {
      if (!window.page) {
        // Abort early during init.
        return
      }

      if (this._state.menu_map.has_taxa(taxa_as_id)) {
        var button_el = document.createElement('button')
        if (is_root) {
          button_el.innerText = 'See parent'
          button_el.addEventListener('click', () => {
            window.page.select_new_tree_range(
              window.page.state.data_map.get_root(taxa_as_id),
              true, true /* skip_menu_update */
            )
          })
        } else {
          button_el.innerText = 'See children'
          button_el.addEventListener('click', () => {
            window.page.select_new_tree_range(taxa_as_id, true /* select_menu */, true /* scroll_menu */)
          })
        }
        parent_el.appendChild(button_el)
      }
    }

    const maybe_append_rank = (node, parent_el) => {
      if (node.hasOwnProperty('rank') && !!node.rank) {
        var rank_el = document.createElement('span')
        rank_el.classList.add('badge')
        rank_el.innerText = node.rank
        parent_el.appendChild(rank_el)
      }
    }

    const maybe_append_tag_line = (node, parent_el) => {
      if (node.hasOwnProperty('tag') && !!node.tag) {
        var tag_el = document.createElement('p')
        tag_el.innerText = node.tag
        tag_el.classList.add('tag')
        parent_el.appendChild(tag_el)
      }
    }
    const maybe_append_images = (node, parent_el) => {
      if (node.hasOwnProperty('imgs') && !!node.imgs) {
        var wrapper_el = document.createElement('div')
        for (var i = 0; i < node.imgs.length; i++) {
          var img_remote_src = node.imgs[i]
          if (!img_remote_src) {
            continue
          }
          var img_el = document.createElement('img')
          img_el.src = State.get_img_relative_path_from_remote(img_remote_src)
          img_el.classList.add('taxa-img')

          if (img_remote_src.startsWith('https://upload.wikimedia.org/wikipedia/commons/thumb')) {
            var re = /https\:\/\/upload.wikimedia.org\/wikipedia\/commons\/thumb\/[^/]+\/[^/]+\/([^/]+)\//
          } else {
            var re = /https\:\/\/upload.wikimedia.org\/wikipedia\/commons\/[^/]+\/[^/]+\/([^/]+)/
          }
          var re_match = re.exec(img_remote_src)
          if (!!re_match && re_match.length > 1) {
            var img_base = re_match[1]
            var img_href = 'https://commons.wikimedia.org/wiki/File:' + img_base
            var img_link = document.createElement('a')
            img_link.href = img_href
            img_link.target = '_blank'
            img_link.appendChild(img_el)
            wrapper_el.appendChild(img_link)
          } else {
            wrapper_el.appendChild(img_el)
          }
        }
        parent_el.appendChild(wrapper_el)
      }
    }

    const append_tree_box = (node, parent_el) => {
      var outer_box_el = document.createElement('div')
      outer_box_el.classList.add('outer_tree_box')

      var inner_box_el = document.createElement('div')
      inner_box_el.id = `${this._state.tree_range}_${taxa_as_id}`
      inner_box_el.classList.add('tree_box')
      outer_box_el.appendChild(inner_box_el)

      append_name(node, inner_box_el)
      add_float_right(node, inner_box_el, is_root)
      maybe_append_common_names(node, inner_box_el)
      maybe_append_tag_line(node, inner_box_el)
      maybe_append_images(node, inner_box_el)

      parent_el.appendChild(outer_box_el)
    }

    var { name, parent } = node
    var id = parent + '_' + name

    var children = node_map.get(name)
    var has_children = !!children

    var li_el = document.createElement('li')
    if (has_children == true) {
      var expander_el = document.createElement('input')
      expander_el.type = 'checkbox'
      expander_el.checked = 'checked'
      expander_el.id = id
      li_el.appendChild(expander_el)

      var label_el = document.createElement('label')
      label_el.classList.add('tree_label')
      label_el.htmlFor = id
      li_el.appendChild(label_el)

      append_tree_box(node, li_el)

      var ul_el = document.createElement('ul')
      for (var i = 0; i < children.length; i++) {
        var node_new_child = children[i]
        var li_child_el = this._get_element_for_node(node_new_child, node_map, level + 1)
        ul_el.appendChild(li_child_el)
      }
      li_el.appendChild(ul_el)

    } else {
      var tree_label_el = document.createElement('div')
      tree_label_el.classList.add('tree_label')
      li_el.appendChild(tree_label_el)

      append_tree_box(node, li_el)
    }

    return li_el
  }

  get_html_for_tree_range() {

    if (!this._state.tree_range) {
      throw Error('Trying to build the taxa tree before initialisation completes.')
    }

    var root_name = this._state.root_name
    var dict = this._state.parent_to_child_list

    var root_list_el = document.createElement('ul');
    root_list_el.classList.add('tree')
    root_list_el.appendChild(this._get_element_for_node(root_name, dict))

    return root_list_el
  }
}

class TreeRangeSelectorBuilder {
  constructor(initial_selection) {
    this._initial_selection = initial_selection
    this._options_map = new Map()
    this._options_map[''] = []
    this._options_map['animalia'] = []
    this._options_map['fungi'] = []
    this._options_map['plantae'] = []

    for (var i = 0; i < window.data_files.length; i++) {
      var file_metadata = window.data_files[i]
      var domain = file_metadata.domain
      var metadata_list_for_domain = this._options_map[domain]
      metadata_list_for_domain.push(file_metadata)
    }
  }

  _add_hr(parent_el) {
    var hr_el = document.createElement('hr')
    parent_el.appendChild(hr_el)
  }

  _add_from_metadata_list_buttons(parent_el, metadata_list) {
    var level = 0
    var parent_ul_els = []
    var current_parent = parent_el
    for (var i = 0; i < metadata_list.length; i++) {
      var metadata = metadata_list[i]

      if (metadata.level > level) {
        if (metadata.level != level + 1) {
          throw new Error('Source data does not have expected level changes')
        }
        level += 1
        var ul_el = document.createElement('ul')
        current_parent.appendChild(ul_el)

        parent_ul_els.push(current_parent)
        current_parent = ul_el
      }

      var outer_div_el = document.createElement('div')
      var input_el = document.createElement('input')
      input_el.type = 'radio'
      var id = metadata.taxa.toLowerCase()
      input_el.id = id
      input_el.value = id
      input_el.name = 'tree_range_selector_radio'
      outer_div_el.appendChild(input_el)
      var label_el = document.createElement('label')
      label_el.htmlFor = id
      outer_div_el.appendChild(label_el)
      var inner_div_el = document.createElement('div')
      var label = metadata.taxa
      inner_div_el.innerText = label
      if (!!metadata.tag) {
        var br_el = document.createElement('br')
        inner_div_el.appendChild(br_el)
        var small_el = document.createElement('small')
        small_el.innerText = metadata.tag
        inner_div_el.appendChild(small_el)
      }
      label_el.appendChild(inner_div_el)

      if (id == this._initial_selection) {
        input_el.checked = true
      }

      if (metadata.level < level) {
        while (metadata.level < level) {
          level -= 1
          current_parent = parent_ul_els.pop()
        }
      }

      if (level > 0) {
        var li_el = document.createElement('li')
        li_el.appendChild(outer_div_el)
        current_parent.appendChild(li_el)
      } else {
        current_parent.appendChild(outer_div_el)
      }
    }
  }

  replace_tree_range_as_buttons(parent_el) {
    clear_child_nodes(parent_el)

    var wrapper_div_el = document.createElement('div')

    this._add_from_metadata_list_buttons(wrapper_div_el, this._options_map[''])

    this._add_hr(wrapper_div_el)

    this._add_from_metadata_list_buttons(wrapper_div_el, this._options_map['animalia'])

    this._add_hr(wrapper_div_el)

    this._add_from_metadata_list_buttons(wrapper_div_el, this._options_map['fungi'])

    this._add_hr(wrapper_div_el)

    this._add_from_metadata_list_buttons(wrapper_div_el, this._options_map['plantae'])

    parent_el.appendChild(wrapper_div_el)
  }
}

class Accordion {
  static ID_CONTROLS = 'controls-accordion'
  static ID_SUMMARY = 'summary-accordion'

  constructor(id) {
    this.id = id
  }

  static set_state_with_id(id, is_open, disabled = false) {
    if (!!is_open) {
      document.getElementById(id).setAttribute('open', '')
    } else {
      document.getElementById(id).removeAttribute('open')
    }
    if (!!disabled) {
      document.getElementById(id).setAttribute('disabled', '')
    } else {
      document.getElementById(id).removeAttribute('disabled')
    }
  }

  static add_query_param_on_state_change(id) {
    var accordion = document.getElementById(id);
    if (!accordion) {
      throw new Error('Missing accordion element id: %s', id)
    }
    accordion.addEventListener('toggle', function () {
      if (window.innerWidth > WIDTH_BOTH_ACCORDIONS_STAY_OPEN) {
        Accordion.set_state_with_id(id, true, true)
        return
      }

      var is_open = accordion.hasAttribute('open')
      if (!!is_open) {
        var query_param_value = 'open'
      } else {
        var query_param_value = ''
      }

      switch (id) {
        case Accordion.ID_CONTROLS:
          page.query_params.controls = query_param_value
          break;
        case Accordion.ID_SUMMARY:
          page.query_params.summary = query_param_value
          break;
        default:
          throw new Error('Invalid Accordion ID')
      }
    });
  }

  set_state(is_open, disabled = false) {
    Accordion.set_state_with_id(this.id, is_open, disabled)
  }
}

class Settings {
  static ID_INSTALL_ASSETS_BUTTON = 'install-assets-button'
  static ID_DELETE_CACHE_BUTTON = 'delete-cache-button'
  static ID_CACHE_LIST = 'cache-list-indicator'
  static ID_INSTALLED_ASSETS = 'installed-assets'
  static ID_UNINSTALLED_BADGE = 'uninstalled-badge'

  static async get_missing_thumbnails(state) {
    const cache_name_thumbnails = 'porcoesphino_pt_thumbnails';
    const thumbnail_cache = await window.caches.open(cache_name_thumbnails)
    const thumbnail_requests = await thumbnail_cache.keys()
    const thumbnail_urls = new Set()
    const request_prefix = window.location.origin + window.location.pathname
    for (const request of thumbnail_requests) {
      if (!request.url.startsWith(request_prefix)) {
        throw Error('Cache includes unexpected request: ' + request.url)
      }
      const trimmed_url = request.url.substring(request_prefix.length)
      thumbnail_urls.add(trimmed_url)
    }

    const missing_thumbnails = new Set()
    const all_imgs = state.img_urls
    for (const img of all_imgs) {
      if (!thumbnail_urls.has(img)) {
        const img_prefix = 'thumbnails/'
        if (!img.startsWith(img_prefix)) {
          throw Error('Image in data file has unexpected prefix: ' + request.url)
        }
        const img_suffix = img.substring(img_prefix.length)
        const img_encoded = relative_prefix + encodeURIComponent(img_suffix)
        if (!thumbnail_urls.has(img_encoded)) {
          const img_decoded = relative_prefix + decodeURIComponent(img_suffix)
          if (!thumbnail_urls.has(img_decoded)) {
            console.log('Missing in cache', img, img_decoded, img_encoded)
            missing_thumbnails.add(img)
          }
        }
      }
    }
    console.log('Missing thumbnails', missing_thumbnails)
    return missing_thumbnails
  }

  static async update_assets_progress(state) {
    const missing_thumbnails = await Settings.get_missing_thumbnails(state)
    const all_imgs = state.img_urls

    const installed_assets = all_imgs.size - missing_thumbnails.size
    console.log(installed_assets, all_imgs.size)

    var installed_assets_el = document.getElementById(Settings.ID_INSTALLED_ASSETS)
    installed_assets_el.innerHTML = `(${installed_assets} / ${all_imgs.size})`

    if (missing_thumbnails.size > 0) {
      const uninstalled_badge_indicator = document.getElementById(Settings.ID_UNINSTALLED_BADGE)
      uninstalled_badge_indicator.style.visibility = 'visible'
    }
  }

  static async download_missing_thumbnails(state) {
    const install_assets_button = document.getElementById(Settings.ID_INSTALL_ASSETS_BUTTON)
    install_assets_button.disabled = true
    const progress_indicator_el = document.getElementById('progress')
    progress_indicator_el.style.visibility = 'visible'
    const missing_thumbnails = await Settings.get_missing_thumbnails(state)
    await OfflineCaching.fetch_all_urls(missing_thumbnails)
  }

  static add_callbacks(state) {
    var delete_cache_button = document.getElementById(Settings.ID_DELETE_CACHE_BUTTON)
    var install_assets_button = document.getElementById(Settings.ID_INSTALL_ASSETS_BUTTON)

    // Handle the case a user has just chosen to install the app by downloading offline assets.
    // Note: this is Chrome only and the installation probably hasn't finished.
    // This may not have an effect until a reload.
    window.addEventListener('appinstalled', async () => {
      await Settings.download_missing_thumbnails(state)
    });

    if (!OfflineCaching.offline_support()) {
      delete_cache_button.disabled = true
      install_assets_button.disabled = true
      const uninstalled_badge_indicator = document.getElementById(Settings.ID_UNINSTALLED_BADGE)
      uninstalled_badge_indicator.style.visibility = 'hidden'
    } else {
      setTimeout(async () => {
        await Settings.update_assets_progress(state)
        await OfflineCaching.update_memory_estimate()
      })
    }

    install_assets_button.addEventListener('click', async () => {
      await Settings.download_missing_thumbnails(state)
    })

    delete_cache_button.addEventListener('click', async () => {
      const theyAreSure = window.confirm('Are you sure you want to delete the app cache?')
      if (theyAreSure) {
        await OfflineCaching.delete_caches()
        var cache_list_el = document.getElementById(Settings.ID_CACHE_LIST)
        var li_el = document.createElement('li')
        li_el.innerText = 'Unknown'
        li_el.style.color = 'graytext'
        cache_list_el.replaceChildren(li_el)
      } else {
        console.log('Aborting touching the local cache.')
      }
    })

    setTimeout(async () => {
      var cache_list_el = document.getElementById(Settings.ID_CACHE_LIST)
      var cache_list = await OfflineCaching.get_cache_names()
      if (!cache_list || cache_list.length == 0) {
        var li_el = document.createElement('li')
        li_el.innerText = 'No caches found'
        cache_list_el.appendChild(li_el)
        cache_list_el.style.color = 'graytext'
        li_el.style.color = 'graytext'
      } else {
        for (const cache_name of cache_list) {
          var li_el = document.createElement('li')
          li_el.innerText = cache_name
          cache_list_el.appendChild(li_el)
        }
      }
    })
  }
}

class Page {

  constructor() {
    this._tree_range_select = document.getElementById('tree-range-select-buttons');
    // this._card_select = document.getElementById('card-select');
    this._tree_root = document.getElementById('tree_root')

    this._controls = new Accordion(Accordion.ID_CONTROLS)
    this._summary = new Accordion(Accordion.ID_SUMMARY)

    this.query_params = new QueryParams()
    this.state = new State(QueryParams._DEFAULT_ROOT, QueryParams._DEFAULT_CARD)

    this.search = new Search(this.state)
    this.search.add_callback()

    this._tree_range_builder = new TreeBuilderAsTreeList(this.state)

    this._update_tree_range_view = () => {
      var root_list_el = this._tree_range_builder.get_html_for_tree_range()

      if (!root_list_el) {
        return  // Abort early during initialisation.
      }

      var tree_root = this._tree_root

      while (tree_root.firstChild) {
        // The list is LIVE so it will re-index each call
        tree_root.removeChild(tree_root.firstChild);
      }
      tree_root.appendChild(root_list_el)
    }

    this.select_new_tree_range = (new_value, select_menu = true, scroll_menu = true, new_taxa = '') => {
      if (!new_value) { new_value = '' }
      this.state.tree_range = new_value
      this.state.card = 'all'
      this.state.taxa = new_taxa
      page.query_params.update_all(new Map([
        [QueryParams._KEY_ROOT, new_value],
        [QueryParams._KEY_CARD, this.state.card],
        [QueryParams._KEY_TAXA, new_taxa]
      ]), this.state)
      // this.add_card_select_options()
      update_tree_range_view()
      this.scroll_tree_to_top()

      var menu_metadata = this.state.menu_map.get_metadata(new_value)
      document.title = 'Phylogentic tree - ' + menu_metadata.taxa

      if (select_menu || scroll_menu) {
        var radio_btn = document.getElementById(new_value);
        if (select_menu) {
          radio_btn.checked = true;
        }
        if (scroll_menu) {
          radio_btn.scrollIntoView({ block: "center", behavior: "instant" });
        }
      }

      if (!!new_taxa) {
        TreeBuilderAsTreeList.scroll_to_taxa(new_value, new_taxa, false /* shake */)
      }

      setTimeout(() => {
        const search_text = document.getElementById(Search.ID).value
        if (search_text.length > 0) {
          Search.add_mark_for_text(search_text)
        }
      }, 0.5)
    }

    // TODO: Do we need async to know if the app is installed?
    setTimeout(async () => {
      Settings.add_callbacks(this.state)
    })

    var update_tree_range_view = this._update_tree_range_view

    // var card_select_change = () => {
    //   page.query_params.card = this._card_select.value
    //   this.state.card = this._card_select.value
    //   update_tree_range_view()
    // }
    // this._card_select.addEventListener('change', function () {
    //   card_select_change()
    // });

    this._set_state_based_on_width = () => {
      var width = window.innerWidth
      if (width > WIDTH_BOTH_ACCORDIONS_STAY_OPEN) {
        this._controls.set_state(true, true)
        this._summary.set_state(true, true)
      } else if (width > WIDTH_CONTROL_ACCORDION_STAY_OPEN) {
        this._controls.set_state(true, true)

        var summay_is_open = this.query_params.summary
        this._summary.set_state(summay_is_open, false)
      } else {
        var controls_are_open = this.query_params.controls
        this._summary.set_state(controls_are_open, false)

        var summay_is_open = this.query_params.summary
        this._summary.set_state(summay_is_open, false)
      }
    }
    window.addEventListener('resize', this._set_state_based_on_width, true);

    var page_load_callback = () => {
      this.page_load_callback()
    }
    setTimeout(() => {
      page_load_callback()
      // Add the autocomplete options after releasing this thread.
      // These are low priority and could be put in another thread but this is simpler for now.
      setTimeout(() => {
        this.search.add_autocomplete_options()
      })
    })

    window.addEventListener("popstate", (e) => {
      if (e.state) {
        page_load_callback()
      }
    });

  }

  scroll_tree_to_top() {
    if (!tree_root.firstChild || !tree_root.firstChild.firstChild) {
      return
    }
    tree_root.firstChild.firstChild.scrollIntoView()
  }

  add_card_select_options() {

    this._card_select.replaceChildren();

    var el_all = document.createElement('option')
    el_all.value = 'all'
    el_all.selected = true
    el_all.innerText = 'All'
    this._card_select.appendChild(el_all)

    var max_card = this.state.max_card
    if (!!max_card) {
      var el_opt_group = document.createElement('optgroup')
      el_opt_group.label = 'Cards'

      for (var i = 0; i < this.state.max_card; i++) {
        var el_option = document.createElement('option')
        var label = i + 1
        el_option.value = label
        el_option.innerText = label
        el_opt_group.appendChild(el_option)
      }

      this._card_select.appendChild(el_opt_group)
    }
  }

  page_load_callback() {

    OfflineCaching.register_cacher()
    // On every refresh, forcibly reload the app code stored in the cache.
    // NOTE: The code won't be loaded until a reload but it should be installed.
    OfflineCaching.trigger_app_code_refresh()

    var tree_range_builder = new TreeRangeSelectorBuilder(this.state.tree_range)
    tree_range_builder.replace_tree_range_as_buttons(this._tree_range_select)
    var select_new_tree_range = this.select_new_tree_range
    document.getElementById('tree-range-select-buttons').addEventListener('click', function (event) {
      if (event.target && event.target.matches("input[type='radio']")) {
        var clicked_range = event.target.id
        select_new_tree_range(clicked_range, false /* select_menu */, false /* scroll_menu */)
      }
    });

    this.query_params.clean_url(this.state)

    var tree_range = this.query_params.root
    if (!!tree_range) {
      this.state.tree_range = tree_range
      var radio_btn = document.getElementById(tree_range);
      radio_btn.checked = true;
      radio_btn.scrollIntoView({ block: "center", behavior: "instant" });
      var menu_metadata = this.state.menu_map.get_metadata(tree_range)
      document.title = 'Phylogentic tree - ' + menu_metadata.taxa
    }

    // this.add_card_select_options()
    // var card = this.query_params.card
    // if (!!card) {
    //   this._card_select.value = card
    //   this.state.card = card
    // } else {
    //   this._card_select.value = 'all'
    //   this.state.card = 'all'
    // }

    this._update_tree_range_view()

    var controls_are_open = this.query_params.controls
    this._controls.set_state(controls_are_open)
    var summary_is_open = this.query_params.summary
    this._summary.set_state(summary_is_open)

    this._set_state_based_on_width()

    Accordion.add_query_param_on_state_change(Accordion.ID_CONTROLS)
    Accordion.add_query_param_on_state_change(Accordion.ID_SUMMARY)

    if (!!this.query_params.taxa) {
      const root = this.state.tree_range
      const taxa = this.query_params.taxa

      TreeBuilderAsTreeList.scroll_to_taxa(root, taxa, true /* shake */)
    }
  }
}

var page = new Page()
