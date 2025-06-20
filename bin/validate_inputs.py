#!/usr/bin/env python

from dataclasses import dataclass
import os
import typing

import json

import regenerate_index

JSON_DATA_LIST = regenerate_index.JSON_DATA_LIST
DATA_DIR = regenerate_index.DATA_DIR

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
  tag: str | None = None


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
    full_filename = os.path.join(DATA_DIR, json_filename)
    print(f'Loading: {full_filename}')
    with open(full_filename, 'r', encoding='utf8') as json_file:
      json_data: list = json.load(json_file)

      for item in json_data:
        n = NodeRaw(**item)
        if n.parent not in children:
          children[n.parent] = []
        children[n.parent].append(n)

  print_node('LUCA', children)


if __name__ == '__main__':
  main()
