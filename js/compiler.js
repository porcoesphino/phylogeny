const WIDTH_BOTH_ACCORDIONS_STAY_OPEN = 1200

const WIDTH_CONTROL_ACCORDION_STAY_OPEN = 780

class QueryParams {
  static _KEY_CONTROLS = 'controls'
  static _DEFAULT_CONTROLS = 'open'
  static _KEY_SUMMARY = 'summary'
  static _DEFAULT_SUMMARY = ''
  static _KEY_ROOT = 'root'
  static _KEY_CARD = 'card'
  static _DEFAULT_CARD = 'all'

  _get(key, default_value = null) {
    const params = new URLSearchParams(location.search);
    if (!params.has(key) && !!default_value) {
      return default_value
    }
    return params.get(key)
  }

  _update(key, value, default_value = null) {
    const params = new URLSearchParams(location.search);

    if (value == default_value) {
      // If this is a default, make sure it's not sent to the URL.
      if (!!params.has(key)) {
        params.delete(key)
      }
    } else {
      // If this will set the same value, abort early.
      if (params.get(key) == value) {
        return
      }

      params.set(key, value)
    }
    if (params.size > 0) {
      var new_location = `${location.pathname}?${params}`
    } else {
      var new_location = location.pathname
    }
    window.history.pushState({}, '', new_location);
  }

  get controls() {
    return this._get(QueryParams._KEY_CONTROLS, QueryParams._DEFAULT_CONTROLS)
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
    return this._get_menu_map().has(taxa.toLowerCase())
  }

  get_metadata(taxa) {
    return this._get_menu_map().get(taxa)
  }
}

class State {

  constructor(tree_range, card = 'all') {
    this._tree_range = tree_range
    this._card = card
    this._clear_cache()
    this.menu_map = new MenuMap()
  }

  _get_data(root_id) {
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
        var data_variable_name = metadata.file
        if (!window.hasOwnProperty(data_variable_name)) {
          throw new Error('Data missing: ' + data_variable_name)
        }
        return window[data_variable_name]
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

  set tree_range(new_val) {
    this._tree_range = new_val
    this._clear_cache()
  }

  get displayed_tree_raw_data() {
    if (!this._displayed_tree_raw_data) {
      if (!this.tree_range) {
        return []  // Abort early during initialisation.
      }
      this._displayed_tree_raw_data = this._get_data(this.tree_range)
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
      }
    }

    if (!filtered_nodes || filtered_nodes.lenth == 0) {
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
}

class Search {
  static ID = 'taxa-search'

  constructor(state) {
    this._state = state
  }

  _menu_el_matches_search(el, search_input) {
    var input_el = el.getElementsByTagName('input')[0];
    var id = input_el.id
    var data_for_menu_item = window[id]
    for (var data_i = 0; data_i < data_for_menu_item.length; data_i++) {
      var taxa_metadata = data_for_menu_item[data_i]
      if (taxa_metadata.name.includes(search_input)) {
        return true
      }

      if (!!taxa_metadata.tag && taxa_metadata.tag.includes(search_input)) {
        return true
      }

      if (!taxa_metadata.common) {
        continue
      }
      var common_names = taxa_metadata.common
      for (var name_i = 0; name_i < common_names.length; name_i++) {
        if (common_names[name_i].includes(search_input)) {
          return true
        }
      }
    }

    return false
  }

  _search_callback() {
    var search_el = document.getElementById(Search.ID)
    var search_input = search_el.value

    var menu_items = document.querySelectorAll('#tree-range-select-buttons li, #tree-range-select-buttons > div')
    for (var i = 0; i < menu_items.length; i++) {
      var menu_el = menu_items[i]

      if (!search_input) {
        menu_el.style.display = ''
        continue
      }

      var innerText = menu_items[i].innerText
      if (innerText.includes(search_input) || this._menu_el_matches_search(menu_el, search_input)) {
        menu_el.style.display = ''
      } else {
        menu_el.style.display = 'none'
      }
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
}

class TreeBuilderAsTreeList {
  static _get_element_for_node(node, node_map, level = 0) {

    function append_name(node, parent_el) {
      if (typeof (node) == 'string') {
        var name = node
      } else {
        var { name } = node
      }
      var name_el = document.createElement('span')
      var wikipedia_link_el = document.createElement('a')
      wikipedia_link_el.href = 'https://en.wikipedia.org/wiki/' + name
      wikipedia_link_el.innerText = name
      wikipedia_link_el.target = '_blank'
      name_el.appendChild(wikipedia_link_el)
      if (node.hasOwnProperty('ipa') && !!node.ipa) {
        name_el.appendChild(document.createTextNode(' (/'))
        var ipa_link_el = document.createElement('a')
        ipa_link_el.href = 'https://ipa-reader.com/?voice=Russell&text=' + node.ipa
        ipa_link_el.innerText = node.ipa
        ipa_link_el.target = '_blank'
        name_el.appendChild(ipa_link_el)
        name_el.appendChild(document.createTextNode('/)'))
      }
      parent_el.appendChild(name_el)
    }

    function maybe_append_common_names(node, parent_el) {
      if (node.hasOwnProperty('common') && !!node.common && node.common.length > 0) {
        var common_names_el = document.createElement('span')
        common_names_el.classList.add('common_names')
        common_names_el.innerText = '(' + node.common.join(', ') + ')'
        parent_el.appendChild(common_names_el)
      }
    }

    function add_float_right(node, parent_el) {
      var right_el = document.createElement('span')
      right_el.classList.add('float-right')
      maybe_append_open_tree_button(node, right_el)
      maybe_append_rank(node, right_el)
      parent_el.appendChild(right_el)
    }

    function maybe_append_open_tree_button(node, parent_el) {
      var name = node.name
      if (name == null) {
        // TODO: Add button to open the parent tree.
        return
      }
      var id = node.name.toLowerCase()
      if (!window.page) {
        // Abort early during init.
        // TODO: Optimise so this doesn't happen. (The menu should load before the first tree load)
        return
      }
      if (window.page.state.menu_map.has_taxa(id)) {
        var button_el = document.createElement('button')
        button_el.innerText = 'See children'
        button_el.addEventListener('click', () => {
          window.page.select_new_tree_range(id, false)
        })
        parent_el.appendChild(button_el)
      }
    }

    function maybe_append_rank(node, parent_el) {
      if (node.hasOwnProperty('rank') && !!node.rank) {
        var rank_el = document.createElement('span')
        rank_el.classList.add('badge')
        rank_el.innerText = node.rank
        parent_el.appendChild(rank_el)
      }
    }

    function maybe_append_tag_line(node, parent_el) {
      if (node.hasOwnProperty('tag') && !!node.tag) {
        var tag_el = document.createElement('p')
        tag_el.innerText = node.tag
        parent_el.appendChild(tag_el)
      }
    }
    function maybe_append_images(node, parent_el) {
      if (node.hasOwnProperty('imgs') && !!node.imgs) {
        var wrapper_el = document.createElement('div')
        for (var i = 0; i < node.imgs.length; i++) {
          var img_src = node.imgs[i]
          if (!img_src) {
            continue
          }
          var img_el = document.createElement('img')
          img_el.src = img_src

          if (img_src.startsWith('https://upload.wikimedia.org/wikipedia/commons/thumb')) {
            var re = /https\:\/\/upload.wikimedia.org\/wikipedia\/commons\/thumb\/[^/]+\/[^/]+\/([^/]+)\//
          } else {
            var re = /https\:\/\/upload.wikimedia.org\/wikipedia\/commons\/[^/]+\/[^/]+\/([^/]+)/
          }
          var re_match = re.exec(img_src)
          if (!!re_match && re_match.length > 1) {
            var img_base = re_match[1]
            var img_href = 'https://commons.wikimedia.org/wiki/File:' + img_base
            var img_link = document.createElement('a')
            img_link.href = img_href
            img_link.appendChild(img_el)
            wrapper_el.appendChild(img_link)
          } else {
            wrapper_el.appendChild(img_el)
          }
        }
        parent_el.appendChild(wrapper_el)
      }
    }

    function append_tree_box(node, parent_el) {
      var outer_box_el = document.createElement('div')
      outer_box_el.classList.add('outer_tree_box')

      var inner_box_el = document.createElement('div')
      inner_box_el.classList.add('tree_box')
      outer_box_el.appendChild(inner_box_el)

      append_name(node, inner_box_el)
      add_float_right(node, inner_box_el)
      maybe_append_common_names(node, inner_box_el)
      maybe_append_tag_line(node, inner_box_el)
      maybe_append_images(node, inner_box_el)

      parent_el.appendChild(outer_box_el)
    }

    if (typeof (node) == 'string') {
      var name = node
      var id = name
    } else {
      var { name, parent } = node
      var id = parent + '_' + name
    }

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
        var li_child_el = TreeBuilderAsTreeList._get_element_for_node(node_new_child, node_map, level + 1)
        ul_el.appendChild(li_child_el)
      }
      li_el.appendChild(ul_el)

    } else {
      var tree_label_el = document.createElement('div')
      tree_label_el.classList.add('tree_label')
      li_el.appendChild(tree_label_el)

      var outer_box_el = document.createElement('div')
      outer_box_el.classList.add('outer_tree_box')
      li_el.appendChild(outer_box_el)

      append_tree_box(node, li_el)
    }

    return li_el
  }

  static get_html_for_tree_range(data) {

    if (!data.tree_range) {
      return  // Abort early during initialisation.
    }

    var root_name = data.root_name
    var dict = data.parent_to_child_list

    var root_list_el = document.createElement('ul');
    root_list_el.classList.add('tree')
    root_list_el.appendChild(TreeBuilderAsTreeList._get_element_for_node(root_name, dict))

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
      input_el.id = metadata.taxa.toLowerCase()
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
    while (parent_el.firstChild) {
      // The list is LIVE so it will re-index each call
      parent_el.removeChild(parent_el.firstChild);
    }

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

class Page {

  constructor() {
    this._tree_range_select = document.getElementById('tree-range-select-buttons');
    this._card_select = document.getElementById('card-select');
    this._tree_root = document.getElementById('tree_root')

    this._controls = new Accordion(Accordion.ID_CONTROLS)
    this._summary = new Accordion(Accordion.ID_SUMMARY)

    this.query_params = new QueryParams()
    this.state = new State('animalia', 'all')

    this.search = new Search(this.state)
    this.search.add_callback()

    this._update_tree_range_view = (data) => {
      var root_list_el = TreeBuilderAsTreeList.get_html_for_tree_range(data)

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

    this.select_new_tree_range = (new_value, button_click = false) => {
      page.query_params.root = new_value
      this.state.tree_range = new_value
      this.state.card = 'all'
      page.query_params.card = 'all'
      this.add_card_select_options()
      update_tree_range_view(this.state)
      this.scroll_tree_to_top()

      if (this.state.tree_range == 'all') {
        this._card_select.disabled = true
      } else {
        this._card_select.disabled = false
      }

      var menu_metadata = this.state.menu_map.get_metadata(new_value)
      document.title = 'Phylogentic tree - ' + menu_metadata.taxa

      if (!button_click) {
        var radio_btn = document.getElementById(new_value);
        radio_btn.checked = true;
        radio_btn.scrollIntoView({ block: "center", behavior: "instant" });
      }
    }

    this._update_tree_range_view(this.state)

    var update_tree_range_view = this._update_tree_range_view

    var card_select_change = () => {
      page.query_params.card = this._card_select.value
      this.state.card = this._card_select.value
      update_tree_range_view(this.state)
    }
    this._card_select.addEventListener('change', function () {
      card_select_change()
    });

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
    setTimeout(function () {
      page_load_callback()
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

    var tree_range_builder = new TreeRangeSelectorBuilder(this.state.tree_range)
    tree_range_builder.replace_tree_range_as_buttons(this._tree_range_select)
    var select_new_tree_range = this.select_new_tree_range
    document.getElementById('tree-range-select-buttons').addEventListener('click', function (event) {
      if (event.target && event.target.matches("input[type='radio']")) {
        var clicked_range = event.target.id
        select_new_tree_range(clicked_range, true)
      }
    });

    var tree_range = this.query_params.root
    if (!!tree_range) {
      this.state.tree_range = tree_range
      var radio_btn = document.getElementById(tree_range);
      radio_btn.checked = true;
      radio_btn.scrollIntoView({ block: "center", behavior: "instant" });
      var menu_metadata = this.state.menu_map.get_metadata(tree_range)
      document.title = 'Phylogentic tree - ' + menu_metadata.taxa
    }

    this.add_card_select_options()

    var card = this.query_params.card
    if (!!card) {
      this._card_select.value = card
      this.state.card = card
    } else {
      this._card_select.value = 'all'
      this.state.card = 'all'
    }

    this._update_tree_range_view(this.state)

    var controls_are_open = this.query_params.controls
    this._controls.set_state(controls_are_open)
    var summary_is_open = this.query_params.summary
    this._summary.set_state(summary_is_open)

    this._set_state_based_on_width()

    Accordion.add_query_param_on_state_change(Accordion.ID_CONTROLS)
    Accordion.add_query_param_on_state_change(Accordion.ID_SUMMARY)
  }
}

var page = new Page()
