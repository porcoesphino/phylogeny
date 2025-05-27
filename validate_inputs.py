#!/usr/bin/env python

from dataclasses import dataclass
import typing

import json

Rank: typing.TypeAlias = typing.Literal[
    'domain',  # Drunken
    'kingdom',  # Kangaroos
    'phylum',  # Punch
    'class',  # Children
    'order',  # On
    'family',  # Family
    'genus',  # Game
    'species',  # Shows
]


@dataclass(kw_only=True)
class NodeRaw:
  name: str
  rank: Rank
  parent: str
  ipa: str | None = None
  imgs: list[str] | None = None  # TODO: Should this be local or remote?
  description: str | None = None
  common: list[str] | None = None
  etymology: str | None = None
  description: str | None = None

  def validate(self):
    if self.ipa:
      # TODO: Why is this??
      if not (self.ipa.startswith('/') and self.ipa.endswith('/')):
        raise ValueError('The IPA string must start and end with "/"')


HTML_OUT_FILENAME = 'index_compiled.html'

JSON_FILES_BY_PARENT: dict[str, str] = {
    'LUCA': 'data_luca.json',
    'Animalia': 'data_animalia_phylums.json',
}

JSON_DATA_LIST = [
    'data_luca.json',
    'data_animalia_phylums.json',
]


def get_node_html(n: NodeRaw | str, children_map: dict[str, list[NodeRaw]], level: int = 0) -> str:
  leading_spaces = 2 * level + 6
  if isinstance(n, str):
    name = n
    id = name
    html_wrapper_start = f"""
  <ul class="tree">
    <li>
      <input type="checkbox" checked="checked" id="{id}" />
      <label class="tree_label" for="{id}">{name}</label>
"""
    html_wrapper_end = """
    </li>
  </ul>
"""
  else:
    name = n.name
    id = f'{n.parent}_{name}'
    label = f'{name}'
    if n.ipa:
      label += f' ({n.ipa})'
    html_wrapper_start = ' ' * leading_spaces + '<li>\n'
    if name in children_map:
      html_wrapper_start += (
          ' ' * (leading_spaces + 2)
      ) + f'<input type="checkbox" checked="checked" id="{id}" />\n'
      html_wrapper_start += (
          ' ' * (leading_spaces + 2)
      ) + f'<label for="{id}" class="tree_label">{label}<span class="badge">{n.rank}</span></label>\n'
    else:
      html_wrapper_start += (
          ' ' * (leading_spaces + 2)
      ) + f'<span class="tree_label">{label}</span>'
      html_wrapper_start += (' ' * (leading_spaces + 2)) + f'<span class="badge">{n.rank}</span>\n'

    if n.description:
      html_wrapper_start += (' ' * (leading_spaces + 2)) + f'<p>{n.description}</p>\n'

    html_wrapper_end = ' ' * leading_spaces + '</li>\n'

  if name in children_map:
    html_middle = (' ' * (leading_spaces + 2)) + '<ul>\n'
    for n in children_map[name]:
      html_middle += get_node_html(n, children_map, level + 1)
    html_middle += (' ' * (leading_spaces + 2)) + '</ul>\n'
  else:
    html_middle = ''
  html = html_wrapper_start + html_middle + html_wrapper_end
  return html


def get_html(children_map: dict[str, list[NodeRaw]]) -> str:
  html_wrapper_start = """
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://public.codepenassets.com/css/reset-2.0.min.css">
    <link rel="stylesheet" href="./tree_view.css">
    <title>Phylogentic tree</title
  </head>
  <body>
"""
  html_wrapper_end = """
  </body>
</html>
"""
  return html_wrapper_start + get_node_html('LUCA', children_map) + html_wrapper_end


def print_node(n: NodeRaw | str, children_map: dict[str, list[NodeRaw]], level: int = 0) -> None:
  leading_spaces = 2 * level
  if isinstance(n, str):
    name = n
    msg = f' - {name}'
  else:
    name = n.name
    msg = (' ' * leading_spaces) + f' - {n.rank} - {name}'
    if n.ipa:
      msg += f' ({n.ipa})'
  print(msg)
  if name in children_map:
    children = children_map[name]
    for child in children:
      print_node(child, children_map, level + 1)


def main():

  children: dict[str, list[NodeRaw]] = {}

  for json_filename in JSON_DATA_LIST:
    with open(json_filename, 'r', encoding='utf8') as json_file:
      json_data: list = json.load(json_file)

      for item in json_data:
        n = NodeRaw(**item)
        if n.parent not in children:
          children[n.parent] = []
        children[n.parent].append(n)

  print_node('LUCA', children)

  html = get_html(children)

  with open(HTML_OUT_FILENAME, 'w', encoding='utf8') as html_file:
    html_file.write(html)


if __name__ == '__main__':
  main()
