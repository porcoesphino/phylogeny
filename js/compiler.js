// class DataNode {

// }

function get_content(content_select_value) {
  switch (content_select_value) {
    case 'overview':
      return data_luca
    case 'animalia_phyla_nine':
      return data_animalia_phyla_nine
    case 'animalia_arthropoda':
      return data_animalia_arthropoda
    case 'chordata_tetrapoda':
      return data_chordata_tetrapoda
    case 'carnivora':
      return data_carnivora
    case 'all':
      return data_luca.concat(data_animalia_phyla).concat(data_animalia_arthropoda)
  }
  return nodes
}

function get_root_name(content_select_value) {
  switch (content_select_value) {
    case 'all':
      return 'LUCA'
    case 'overview':
      return 'LUCA'
    case 'animalia_phyla_nine':
      return 'Animalia'
    case 'animalia_arthropoda':
      return 'Arthropoda'
    case 'chordata_tetrapoda':
      return 'Chordata'
    case 'carnivora':
      return 'Carnivora'
  }
}

function create_dictionary(nodes) {
  var node_dictionary = new Map()
  for (var i = 0; i < nodes.length; i++) {
    n = nodes[i]
    if (!node_dictionary.has(n.parent)) {
      node_dictionary.set(n.parent, [])
    }
    parents_children = node_dictionary.get(n.parent)
    parents_children.push(n)
  }
  return node_dictionary
}

function get_element_for_node(node, node_map, level = 0) {

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
        img_src = node.imgs[i]
        var img_el = document.createElement('img')
        img_el.src = img_src
        wrapper_el.appendChild(img_el)
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
      var li_child_el = get_element_for_node(children[i], node_map, level + 1)
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

function update_content(content_select_value) {
  var nodes = get_content(content_select_value)
  var root_name = get_root_name(content_select_value)
  var dict = create_dictionary(nodes)

  var root_list_el = document.createElement('ul');
  root_list_el.classList.add('tree')
  root_list_el.appendChild(get_element_for_node(root_name, dict))

  var tree_root = document.getElementById('tree_root')

  while (tree_root.firstChild) {
    // The list is LIVE so it will re-index each call
    tree_root.removeChild(tree_root.firstChild);
  }
  tree_root.appendChild(root_list_el)
}

var content_select = document.getElementById('content-select');

update_content(content_select.value)

content_select.addEventListener('change', function () {
  update_content(content_select.value)
});
