class Data {

  constructor(tree_range, card = 'all') {
    this._tree_range = tree_range
    this._card = card
    this._clear_cache()
  }

  static _get_data(content_select_value) {
    switch (content_select_value) {
      case 'all':
        return (
          data_luca
            .concat(data_animalia_phyla_common)
            .concat(data_animalia_cnidaria_orders_common)
            .concat(data_animalia_arthropoda_orders_common)
            .concat(data_animalia_arthropoda_insecta_orders_common)
            .concat(data_animalia_chordata_classes_minus_tetrapoda)
            .concat(data_animalia_chordata_elasmobranchii_orders)
            .concat(data_animalia_chordata_tetrapoda_orders_minus_aves_and_mammalia)
            .concat(data_animalia_chordata_tetrapoda_aves_orders)
            .concat(data_animalia_chordata_tetrapoda_mammalia_orders)
            .concat(data_fungi_phyla)
            .concat(data_plantae_divisions)
            .concat(data_plantae_pinophyta_genus_common)
            .concat(data_plantae_angiosperm_orders_minus_monocots_eudicots)
            .concat(data_plantae_angiosperm_monocots_orders)
            .concat(data_plantae_angiosperm_eudicots_orders)
        )
      default:
        var data_variable_name = 'data_' + content_select_value
        if (!window.hasOwnProperty(data_variable_name)) {
          throw new Error('Content selection not found: ' + content_select_value)
        }
        return window[data_variable_name]
    }
  }

  _clear_cache() {
    this._data = null
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

  get data() {
    if (!this._data) {
      this._data = Data._get_data(this.tree_range)
    }
    return this._data
  }

  _update_maps() {
    var parent_to_child_list = new Map()
    var name_to_node = new Map()
    var filtered_nodes = []
    var max_card = 0

    for (var i = 0; i < this.data.length; i++) {
      var n = this.data[i]

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
      maybe_append_rank(node, inner_box_el)
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
    var root_name = data.root_name
    var dict = data.parent_to_child_list

    var root_list_el = document.createElement('ul');
    root_list_el.classList.add('tree')
    root_list_el.appendChild(TreeBuilderAsTreeList._get_element_for_node(root_name, dict))

    return root_list_el
  }
}

class QueryParams {
  get(key) {
    const params = new URLSearchParams(location.search);
    return params.get(key)
  }

  update(key, value) {
    const params = new URLSearchParams(location.search);
    if (params.get(key) == value) {
      return
    }
    params.set(key, value)
    window.history.pushState({}, '', `${location.pathname}?${params}`);
  }
}


class Page {

  constructor() {
    this._content_select = document.getElementById('tree-range-select');
    this._card_select = document.getElementById('card-select');

    this.query_params = new QueryParams()
    this.data = new Data(this._content_select.value, 'all')

    this.update_tree_range_view = (data) => {
      var root_list_el = TreeBuilderAsTreeList.get_html_for_tree_range(data)

      var tree_root = document.getElementById('tree_root')

      while (tree_root.firstChild) {
        // The list is LIVE so it will re-index each call
        tree_root.removeChild(tree_root.firstChild);
      }
      tree_root.appendChild(root_list_el)
    }

    this.update_tree_range_view(this.data)

    var update_tree_range_view = this.update_tree_range_view
    var content_select_change = () => {
      page.query_params.update('tree_range', this._content_select.value)
      this.data.tree_range = this._content_select.value
      this.data.card = 'all'
      page.query_params.update('card', 'all')
      this.add_card_select_options()
      update_tree_range_view(this.data)
    }
    this._content_select.addEventListener('change', function () {
      content_select_change()
    });

    var card_select_change = () => {
      page.query_params.update('card', this._card_select.value)
      this.data.card = this._card_select.value
      update_tree_range_view(this.data)
    }
    this._card_select.addEventListener('change', function () {
      card_select_change()
    });

    var page_load_callback = () => {
      this.page_load_callback()
    }
    window.addEventListener('load', function () {
      page_load_callback()
    })

    window.addEventListener("popstate", (e) => {
      if (e.state) {
        page_load_callback()
      }
    });

  }

  static set_details_accordion_state(id, is_open) {
    if (!!is_open) {
      document.getElementById(id).setAttribute('open', '')
    } else {
      document.getElementById(id).removeAttribute('open')
    }
  }

  static add_query_param_update_for_details_accordion_state(id) {
    var accordion = document.getElementById(id);
    if (!accordion) {
      throw new Error('Missing accordion element id: %s', id)
    }
    accordion.addEventListener('toggle', function () {
      var is_open = accordion.hasAttribute('open')
      if (!!is_open) {
        page.query_params.update(id, 'open')
      } else {
        page.query_params.update(id, '')
      }
    });
  }

  add_card_select_options() {

    this._card_select.replaceChildren();

    var el_all = document.createElement('option')
    el_all.value = 'all'
    el_all.selected = true
    el_all.innerText = 'All'
    this._card_select.appendChild(el_all)

    var max_card = this.data.max_card
    if (!!max_card) {
      var el_opt_group = document.createElement('optgroup')
      el_opt_group.label = 'Cards'

      for (var i = 0; i < this.data.max_card; i++) {
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

    var tree_range = this.query_params.get('tree_range')
    if (!!tree_range) {
      this._content_select.value = tree_range
      this.data.tree_range = tree_range
    }

    this.add_card_select_options()

    var card = this.query_params.get('card')
    if (!!card) {
      this._card_select.value = card
      this.data.card = card
    } else {
      this._card_select.value = 'all'
      this.data.card = 'all'
    }

    this.update_tree_range_view(this.data)

    var controls_are_open = this.query_params.get('controls-accordion')  // Treat any value as 'open'.
    Page.set_details_accordion_state('controls-accordion', controls_are_open)

    var controls_are_open = this.query_params.get('summary-accordion')  // Treat any value as 'open'.
    Page.set_details_accordion_state('summary-accordion', controls_are_open)

    Page.add_query_param_update_for_details_accordion_state('controls-accordion')

    Page.add_query_param_update_for_details_accordion_state('summary-accordion')
  }
}

var page = new Page()
