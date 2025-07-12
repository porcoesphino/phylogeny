#!/usr/bin/env python

from dataclasses import dataclass, asdict
import json
import os
import typing

HTML_OUT_FILENAME = 'index.html'

DATA_DIR = 'data'


@dataclass(kw_only=True)
class JsonDataFile:
  file: str
  domain: str
  label_sci: str
  label_simple: str


DATA_LIST = [
    JsonDataFile(
        file='luca',
        domain='',
        label_sci='Overview',
        label_simple='Overview',
    ),
    JsonDataFile(
        file='animalia_phyla_common',
        domain='animalia',
        label_sci='Animalia — common Phyla',
        label_simple='Animalia — common Phyla',
    ),
    JsonDataFile(
        file='animalia_cnidaria_orders_common',
        domain='animalia',
        label_sci='→ Cnidaria — common classes/orders',
        label_simple='→ Cnidaria — common classes/orders',
    ),
    JsonDataFile(
        file='animalia_arthropoda_orders_common',
        domain='animalia',
        label_sci='→ Arthropoda — common classes/orders',
        label_simple='→ Arthropoda — common classes/orders',
    ),
    JsonDataFile(
        file='animalia_arthropoda_insecta_orders_common',
        domain='animalia',
        label_sci='—→ Insecta — common orders',
        label_simple='—→ Insecta — common orders',
    ),
    JsonDataFile(
        file='animalia_chordata_classes_minus_tetrapoda',
        domain='animalia',
        label_sci='→ Chordata — classes minus Tetrapoda',
        label_simple='→ Chordata — classes minus Tetrapoda',
    ),
    JsonDataFile(
        file='animalia_chordata_elasmobranchii_orders',
        domain='animalia',
        label_sci='—→ Elasmobranchii — orders',
        label_simple='—→ Elasmobranchii — orders',
    ),
    JsonDataFile(
        file='animalia_chordata_actinopterygii_orders_minus_acanthomorpha',
        domain='animalia',
        label_sci='—→ Actinopterygii — orders minus Acanthomorpha',
        label_simple='—→ Actinopterygii — orders minus Acanthomorpha',
    ),
    JsonDataFile(
        file='animalia_chordata_actinopterygii_acanthomorpha_orders',
        domain='animalia',
        label_sci='——→ Acanthomorpha — orders',
        label_simple='——→ Acanthomorpha — orders',
    ),
    JsonDataFile(
        file='animalia_chordata_tetrapoda_orders_minus_aves_and_mammalia',
        domain='animalia',
        label_sci='—→ Tetrapoda — orders minus Aves and Mammalia',
        label_simple='—→ Tetrapoda — orders minus Aves and Mammalia',
    ),
    JsonDataFile(
        file='animalia_chordata_tetrapoda_aves_orders',
        domain='animalia',
        label_sci='——→ Aves — orders',
        label_simple='——→ Aves — orders',
    ),
    JsonDataFile(
        file='animalia_chordata_tetrapoda_aves_passeriformes',
        domain='animalia',
        label_sci='———→ Passeriformes — families minus Passeri',
        label_simple='———→ Passeriformes — families minus Passeri',
    ),
    JsonDataFile(
        file='animalia_chordata_tetrapoda_aves_passeriformes_passeri',
        domain='animalia',
        label_sci='————→ Passeri — families minus Core Passerides',
        label_simple='————→ Passeri — families minus Core Passerides',
    ),
    JsonDataFile(
        file='animalia_chordata_tetrapoda_aves_passeriformes_passeri_core_passerides',
        domain='animalia',
        label_sci='—————→ Core Passerides — families',
        label_simple='—————→ Core Passerides — families',
    ),
    JsonDataFile(
        file='animalia_chordata_tetrapoda_mammalia_orders',
        domain='animalia',
        label_sci='——→ Mammalia — orders',
        label_simple='——→ Mammal orders',
    ),
    JsonDataFile(
        file='animalia_chordata_tetrapoda_mammalia_carnivora_families',
        domain='animalia',
        label_sci='———→ Carnivora — families',
        label_simple='———→ The carnivorans — carniverous mammals',
    ),
    JsonDataFile(
        file='animalia_chordata_tetrapoda_mammalia_carnivora_canidae_genus',
        domain='animalia',
        label_sci='————→ Felidae — families',
        label_simple='————→ The cat-like carnivorans',
    ),
    JsonDataFile(
        file='animalia_chordata_tetrapoda_mammalia_carnivora_felidae_genus',
        domain='animalia',
        label_sci='————→ Canidae — families',
        label_simple='————→ The dog-like carnivorans',
    ),
    JsonDataFile(
        file='animalia_chordata_tetrapoda_mammalia_artiodactyl_families',
        domain='animalia',
        label_sci='———→ Artiodactyl — families',
        label_simple='———→ Artiodactyl — families',
    ),
    JsonDataFile(
        file='animalia_chordata_tetrapoda_mammalia_primates',
        domain='animalia',
        label_sci='———→ Primates',
        label_simple='———→ Primates',
    ),
    JsonDataFile(
        file='animalia_chordata_tetrapoda_mammalia_primates_platyrrhini_families',
        domain='animalia',
        label_sci='————→ Platyrrhini - families',
        label_simple='————→ The new world monkeys',
    ),
    JsonDataFile(
        file='animalia_chordata_tetrapoda_mammalia_primates_cercopithecidae_families',
        domain='animalia',
        label_sci='————→ Cercopithecidae - families',
        label_simple='————→ The old world monkeys',
    ),
    JsonDataFile(
        file='animalia_chordata_tetrapoda_mammalia_primates_homo',
        domain='animalia',
        label_sci='————→ Homo',
        label_simple='————→ Humans and their close ancestors',
    ),
    JsonDataFile(
        file='plantae_divisions',
        domain='plantae',
        label_sci='Plantae - Divisions',
        label_simple='Plantae - Divisions',
    ),
    JsonDataFile(
        file='plantae_pinophyta_genus_common',
        domain='plantae',
        label_sci='→ Pinophyta — common genera',
        label_simple='→ The conifers',
    ),
    JsonDataFile(
        file='plantae_angiosperm_orders_minus_monocots_eudicots',
        domain='plantae',
        label_sci='→ Angiosperm — orders minus Monocots and Eudicots',
        label_simple='→ The flowering plants',
    ),
    JsonDataFile(
        file='plantae_angiosperm_monocots_orders',
        domain='plantae',
        label_sci='—→ Monocot — orders',
        label_simple='—→ Monocot — orders',
    ),
    JsonDataFile(
        file='plantae_angiosperm_eudicots_orders',
        domain='plantae',
        label_sci='—→ Eudicot — orders',
        label_simple='—→ Eudicot — orders',
    ),
    JsonDataFile(
        file='fungi_phyla',
        domain='fungi',
        label_sci='Fungi — common Phyla',
        label_simple='Fungi — common Phyla',
    ),
    JsonDataFile(
        file='fungi_basidiomycota',
        domain='fungi',
        label_sci='→ Basidiomycota',
        label_simple='→ The higher fungi',
    ),
    JsonDataFile(
        file='fungi_ascomycota',
        domain='fungi',
        label_sci='→ Ascomycota',
        label_simple='→ The sac fungi',
    ),
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
  imgs: list[str] | None = None  # A list of the the remote image URLs.
  description: str | None = None
  common: list[str] | None = None
  etymology: str | None = None
  description: str | None = None


def get_script_vars() -> str:
  output: str = 'var data_files = ' + json.dumps(DATA_LIST, default=asdict, indent=2) + '\n'
  for json_file in DATA_LIST:
    json_filename = f'data_{json_file.file}.json'
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
              </select>
            </div>
          </td>

          <td>
            <div class="select">
              <label for="card-select">Select card <small>(Advanced for Anki input)</small></label>
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

  <h2 class="title is-4">Useful sites</h2>
  <ul class="regular_list">
    <li>
      Take a photo, learn what it is and help a scientist with <a href="https://www.inaturalist.org">iNaturalist</a>
    </li>
    <li>
      Catalogues
      <ul>
        <li>
          General
          <ul>
            <li>
              <a href="https://www.gbif.org">Global Biodiversity Information Facility</a>
            </li>
            <li>
              <a href="https://www.catalogueoflife.org">Catalogue of Life</a>
            </li>
            <li>
              <a href="http://tolweb.org/">Tree of Life - web project</a>
            </li>
            <li>
              <a href="https://eol.org/">Encylcopedia of Life</a>
            </li>
            <li>
              <a href="https://animaldiversity.org/">Animal Diversity Web</a>
            </li>
          </ul>
        </li>
        <li>
          Animals
          <ul>
            <li>
              Insects
              <ul>
                <li>
                  North Carolina State University - <a href="https://genent.cals.ncsu.edu/">General Entomology</a>
                </li>
              </ul>
            </li>
            <li>
              Fish
              <ul>
                <li>
                  <a href="https://researcharchive.calacademy.org/research/ichthyology/catalog/fishcatmain.asp">Eschmeyer's Catalog of Fishes</a>
                </li>
                <li>
                  <a href="https://www.fishbase.org/">FishBase</a>
                </li>
              </ul>
            </li>
            <li>
              Birds
              <ul>
                <li>
                  Cornell Lab - <a href="https://www.allaboutbirds.org/">All About Birds</a>
                </li>
              </ul>
            </li>
          </ul>
        <li>
          Plants
          <ul>
            <li>
              <a href="https://www.mobot.org/MOBOT/Research/APweb/welcome.html">Angiosperm Phylogeny Website</a>
            </li>
          </ul>
        </li>
      </ul>
    </li>
    <li>
      Interactive trees
      <ul>
        <li>
          <a href="https://www.onezoom.org/">OneZoom tree of life explorer</a>
        </li>
        <li>
          <a href="https://tree.opentreeoflife.org/">Open Tree of Life</a>
        </li>
        <li>
          <a href="https://lifemap.cnrs.fr/tree">Lifemap</a>
        </li>
      </ul>
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
