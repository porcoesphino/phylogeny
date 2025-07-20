#!/usr/bin/env python

import common
import data_files

JSON_DATA_LIST = data_files.DATA_LIST
DATA_DIR = data_files.DATA_DIR


def print_node(
    n: common.NodeRaw | str, children_map: dict[str, list[common.NodeRaw]], level: int = 0
) -> None:
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


def validate_no_loop(n: common.NodeRaw, taxa_to_metadata: dict[str, common.NodeRaw]) -> None:

  seen_node_names: set[str] = set()
  current_node = n

  while current_node.parent != 'LUCA':
    if current_node.name in seen_node_names:
      raise ValueError(f'Loop in nodes: {seen_node_names}')

    seen_node_names.add(current_node.name)

    current_node = taxa_to_metadata[current_node.parent]


def main():

  children: dict[str, list[common.NodeRaw]] = {}
  children['LUCA'] = []
  taxa_to_metadata: dict[str, common.NodeRaw] = {}

  def validate_node(n: common.NodeRaw) -> None:
    n.validate()

    if n.parent not in children:
      raise ValueError(f'Node ({n.name}) has a parent ({n.parent}) that does not already exist.')

    children[n.parent].append(n)
    children[n.name] = []

    if n.name in taxa_to_metadata:
      raise ValueError(f'Duplicate node ({n.name}).')

    taxa_to_metadata[n.name] = n

  data_files.process_nodes(validate_node)

  print('Testing node data does not have a loop...')
  for n in taxa_to_metadata.values():
    validate_no_loop(n, taxa_to_metadata)

  print('Data files are valid')


if __name__ == '__main__':
  main()
