#!/usr/bin/env python

import os

import json

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


def main():

  children: dict[str, list[common.NodeRaw]] = {}

  for file_metadata in JSON_DATA_LIST:
    full_filename = os.path.join(DATA_DIR, f'{file_metadata.file}.json')
    print(f'Loading: {full_filename}')
    with open(full_filename, 'r', encoding='utf8') as json_file:
      try:
        json_data: list = json.load(json_file)

        for item in json_data:
          n = common.NodeRaw(**item)
          if n.parent not in children:
            children[n.parent] = []
          children[n.parent].append(n)

      except Exception as e:
        raise ValueError(f'Invalid data in file: {full_filename}') from e

  print_node('LUCA', children)


if __name__ == '__main__':
  main()
