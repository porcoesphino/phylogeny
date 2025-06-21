#!/usr/bin/env python

from dataclasses import dataclass
import os
import typing

HTML_OUT_FILENAME = 'index.html'

# JSON_FILES_BY_PARENT: dict[str, str] = {
#     'LUCA': 'data_luca.json',
#     'Animalia': 'data_animalia_phyla_common.json',
#     'Cnidaria': 'data_animalia_cnidaria_orders_common.json',
#     'Arthropoda': 'data_animalia_arthropoda_orders_common.json',
#     'Insecta': 'data_animalia_arthropoda_insecta_orders_common.json',
#     'Chordata': 'data_animalia_chordata_tetrapoda.json',
#     'Carnivora': 'data_animalia_carnivora.json',
#     'Tetrapoda': 'data_animalia_tetrapoda_aves.json',
#     'Plantae': 'data_plantae_divisions.json',
#     'Pinopsida': 'data_plantae_pinopsida_genus_common.json',
# }

DATA_DIR = 'data'

JSON_DATA_LIST = [
    'data_luca.json',
    'data_animalia_phyla_common.json',
    'data_animalia_cnidaria_orders_common.json',
    'data_animalia_arthropoda_orders_common.json',
    'data_animalia_arthropoda_insecta_orders_common.json',
    'data_animalia_chordata_tetrapoda.json',
    'data_animalia_carnivora.json',
    'data_animalia_tetrapoda_aves.json',
    'data_plantae_divisions.json',
    'data_plantae_pinopsida_genus_common.json',
]

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


def get_script_vars() -> str:
  output: str = ''
  for json_filename in JSON_DATA_LIST:
    with open(os.path.join(DATA_DIR, json_filename), 'r', encoding='utf8') as json_file:
      var_name = json_filename.removesuffix('.json')
      prefix_spaces = '    '
      output += f'{prefix_spaces}var {var_name} = {prefix_spaces.join(json_file.readlines())}\n'
  return output


def get_html() -> str:
  html_wrapper_start = """
<html>

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://public.codepenassets.com/css/reset-2.0.min.css">
  <link rel="stylesheet" href="./css/typography.css">
  <link rel="stylesheet" href="./css/collapsible_block.css">
  <link rel="stylesheet" href="./css/controls.css">
  <link rel="stylesheet" href="./css/tree_view.css">
  <title>Phylogentic tree</title </head>

<body>

  <h1 class="title">A simplified tree of life</h1>

  <details class="controls" id="controls-accordion">
    <summary>Controls</summary>
    <div>
      <table>
        <tr>
          <td>
            <div class="select">
              <label for="style-select">Select style</label>
              <select size="1" id="style-select">
                <option value="tree">Tree list</option> <!-- Use javascript to select this option -->
                <!-- <option value="list" selected>Regular list</option> -->
              </select>
            </div>
          </td>

          <td>
            <div class="select">
              <label for="tree-range-select">Select tree range</label>
              <select size="5" id="tree-range-select">
                <option value="overview" selected>Overview</option>
                <hr />
                <option value="all">All so far</option>
                <hr />
                <optgroup label="Animalia">
                  <option value="animalia_phyla_common">Animalia to common Phyla</option>
                  <option value="animalia_cnidaria_orders_common">Cnidaria to common classes/orders (incomplete)</option>
                  <option value="animalia_arthropoda_orders_common">Arthropoda to common classes/orders (incomplete)</option>
                  <option value="animalia_arthropoda_insecta_orders_common">Insecta to common Orders</option>
                  <option value="animalia_chordata_tetrapoda">Chordata to Tetrapoda</option>
                  <option value="animalia_tetrapoda_aves">Tetrapoda to Aves</option>
                  <!-- <option value="animalia_mammalia">Mammalia</option> -->
                  <option value="animalia_carnivora">Carnivora</option>
                </optgroup>
                <optgroup label="Plantae">
                <option value="plantae_divisions">Divisions</option>
                <option value="plantae_pinopsida_genus_common">Pinopsida to common genera</option>
                </optgroup>
              </select>
            </div>
          </td>

          <td>
            <div class="select">
              <label for="card-select">Select card</label>
              <select id="card-select">
              </select>
            </div>
          </td>

        </tr>
      </table>
    </div>
  </details>

  <div id="tree_root"></div>

  <script>
"""
  html_wrapper_end = """
  </script>

  <script src="./js/compiler.js"></script>

  <h2 class="title is-4">Interesting sites</h2>
  <ul class="regular_list">
    <li>
      <a href="https://www.inaturalist.org">iNaturalist</a>
    </li>
    <li>
      <a href="https://www.gbif.org">Global Biodiversity Information Facility</a>
    </li>
    <li>
      <a href="https://www.catalogueoflife.org">Catalogue of Life</a>
    </li>
  </ul>

</body>

</html>
"""
  return html_wrapper_start + get_script_vars() + html_wrapper_end


def main():

  html = get_html()

  with open(HTML_OUT_FILENAME, 'w', encoding='utf8') as html_file:
    html_file.write(html)


if __name__ == '__main__':
  main()
