#!/usr/bin/env python

from dataclasses import dataclass
import os
import typing

HTML_OUT_FILENAME = 'index.html'

DATA_DIR = 'data'

JSON_DATA_LIST = [
    'data_luca.json',
    'data_animalia_phyla_common.json',
    'data_animalia_cnidaria_orders_common.json',
    'data_animalia_arthropoda_orders_common.json',
    'data_animalia_arthropoda_insecta_orders_common.json',
    'data_animalia_chordata_classes_minus_tetrapoda.json',
    'data_animalia_chordata_tetrapoda_orders_minus_aves_and_mammalia.json',
    'data_animalia_chordata_tetrapoda_aves_orders.json',
    'data_animalia_chordata_tetrapoda_mammalia_orders.json',
    'data_animalia_chordata_tetrapoda_mammalia_carnivora_families.json',
    'data_plantae_divisions.json',
    'data_plantae_pinophyta_genus_common.json',
    'data_plantae_angiosperm_orders_minus_monocots_eudicots.json',
    'data_plantae_angiosperm_monocots_orders.json',
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

  <details class="controls" id="summary-accordion" open>
    <summary>Summary</summary>
    <div>
      <p>
        This website is a way to help me memorise a simplified phylogenetic tree of life. The
        traditional taxonomic trees are easier to understand but a bit misleading and many of the
        great online sources for phylogenetic trees are pretty complicated. The aim here was to
        have a tree that was accurate enough to get a bit of an understanding without getting too
        complicated and to then split it up into smaller chunks that can be memorised with
        <a href="https://apps.ankiweb.net/">Anki</a>
        <a href="https://docs.ankiweb.net/?search=cloze%20deletion">cloze cards</a>. To achieve
        this I've mostly flattened complicated parts of the tree or parts that seemed less certain.
        I aimed to include some context without adding too much noise or individual detail.
      </p>
      <p>
        Each item has the name of the group, and a link back to Wikipedia. Most will list the more
        well known life in the group, the IPA pronunciation of the name, a link to play the IPA
        pronunciation, a short description and some images.
      </p>
      <p>
        Deep linking should work so you can collapse this section, refresh and not see it again.
      </p>
      <p>
        This website is obviously reinventing the wheel a little but it was mostly just cleaning up
        notes I already had and adding a generator for the
        <a href="https://apps.ankiweb.net/">Anki</a> cards I was already building. I'd always been
        a bit interested in the tree of life but I became a lot more interested in it after I began
        working remote and exploring National Parks soon after COVID. I quickly wanted a stable
        framework to quickly attach all the new things I was learning about these different
        ecosystems. I found a great starting place was the
        <a href="https://www.youtube.com/playlist?list=PLybg94GvOJ9HpCr9iU9YXHa5kXj0Pp2dA">Zoology
        Youtube playlist from Professor Dave Explains</a>. Memorising parts of it to get familiar
        was maybe a bit excessive but here we are.
      </p>
    </div>
  </details>

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
                <option value="luca" selected>Overview</option>
                <hr />
                <option value="all">All so far</option>
                <hr />
                <optgroup label="Animalia">
                  <option value="animalia_phyla_common">Animalia — common Phyla</option>
                  <option value="animalia_cnidaria_orders_common">Cnidaria — common classes/orders</option>
                  <option value="animalia_arthropoda_orders_common">Arthropoda — common classes/orders</option>
                  <option value="animalia_arthropoda_insecta_orders_common">Insecta — common orders</option>
                  <option value="animalia_chordata_classes_minus_tetrapoda">Chordata — classes minus Tetrapoda</option>
                  <option value="animalia_chordata_tetrapoda_orders_minus_aves_and_mammalia">Tetrapoda — orders minus Aves and Mammalia</option>
                  <option value="animalia_chordata_tetrapoda_aves_orders">Aves — orders</option>
                  <option value="animalia_chordata_tetrapoda_mammalia_orders">Mammalia — orders</option>
                  <!-- <option value="animalia_chordata_tetrapoda_mammalia_carnivora_families">Carnivora — families</option> -->
                </optgroup>
                <optgroup label="Plantae">
                <option value="plantae_divisions">Divisions</option>
                <option value="plantae_pinophyta_genus_common">Pinophyta — common genera</option>
                <option value="plantae_angiosperm_orders_minus_monocots_eudicots">Angiosperm — orders minus Monocots and Eudicots</option>
                <option value="plantae_angiosperm_monocots_orders">Monocot — orders</option>
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
