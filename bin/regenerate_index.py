#!/usr/bin/env python

from dataclasses import asdict

import json
import os

import data_files

HTML_OUT_FILENAME = 'index.html'


def get_script_vars() -> str:
  output: str = 'var data_files = ' + json.dumps(
      data_files.DATA_LIST, default=asdict, indent=2
  ) + '\n'
  for file_metadata in data_files.DATA_LIST:
    json_filename = f'{file_metadata.file}.jsonc'
    with open(os.path.join(data_files.DATA_DIR, json_filename), 'r', encoding='utf8') as json_file:
      prefix_spaces = '    '
      output += f'{prefix_spaces}var {file_metadata.file} = {prefix_spaces.join(json_file.readlines())}\n'
  return output


def get_html() -> str:
  html_wrapper_start = """
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="manifest" href="./manifest.json" />
  <link rel="stylesheet" href="./css/reset-2.0.min.css">
  <link rel="stylesheet" href="./css/layout.css">
  <link rel="stylesheet" href="./css/typography.css">
  <link rel="stylesheet" href="./css/collapsible_block.css">
  <link rel="stylesheet" href="./css/controls.css">
  <link rel="stylesheet" href="./css/tree_view.css">
  <link rel="stylesheet" href="./css/radio_nav.css">
  <link rel="icon" href="./favicon_tree_192.png" sizes="192x192">
  <link rel="icon" href="./favicon_tree_512.png" sizes="512x512">

  <title>Phylogentic tree</title>

  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black">

  <meta property="og:site_name" content="Phylogentic tree">
  <meta property="og:og:description"
        content="A website to quickly explore how different life is related from the top down.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://porcoesphino.github.io/phylogeny/" />
  <meta property="og:image" content="./screenshots/chrome_screenshot.png">
</head>

<body>

  <div class="full-height-wrapper">
  <h1 class="title">A simplified tree of life</h1>

  <div class="layout-columns">

    <div class="rows-on-mobile">

      <details class="controls" id="summary-accordion">
        <summary>Summary</summary>
        <div class="summary">
          <p>
            This website is a way to help me memorise a simplified phylogenetic tree of life. The
            traditional taxonomic trees are easier to understand but a bit misleading and many of the
            great online sources for phylogenetic trees are pretty complicated. The aim here was to
            have a tree that was accurate enough to get a bit of an understanding without getting too
            complicated and to then split it up into smaller chunks that can be memorised with
            <a href="https://apps.ankiweb.net/">Anki</a>
            <a href="https://docs.ankiweb.net/?search=cloze%20deletion">cloze cards</a>. To do
            this I've mostly flattened complicated parts of the tree or parts that seemed less certain,
            aiming for a branching factor of around 7±2. I aimed to include some context without adding
            too much noise or individual detail.
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
                      <a href="https://eol.org/">Encyclopedia of Life</a>
                    </li>
                    <li>
                      University of Michigan Museum of Zoology - <a href="https://animaldiversity.org/">Animal Diversity Web</a>
                    </li>
                  </ul>
                </li>
                <li>
                  <a href="https://www.marinespecies.org">The World Register of Marine Species</a>
                </li>
                <li>
                  Animals
                  <ul>
                    <li>
                      Sponges
                      <ul>
                        <li>
                          <a href="https://www.marinespecies.org/porifera/">The World Porifera Database</a>
                        </li>
                        <li>
                          University of North Carolina Wilmington - <a href="https://spongeguide.uncw.edu/">The Sponge Guide - Caribbean</a>
                        </li>
                      </ul>
                    </li>
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
                </li>
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
        </div>
      </details>

      <details class="controls" id="controls-accordion" open>
        <summary>Controls</summary>
        <div>

          <div>
            <div class="control-section">Select tree range</div>
            <search>
              <input type="search" id="taxa-search" placeholder="Exact match search — try plurals"
                list="common-names-and-taxa-list" enterkeyhint="search">
              <datalist id="common-names-and-taxa-list">
              </datalist>
            </search>
            <fieldset id="exact-match-fieldset" style="display: none;">
              <legend>Open exact match</legend>
              <div id="exact-match-buttons"></div>
            </fieldset>
            <fieldset>
              <legend>Open tree</legend>
              <div id="tree-range-select-buttons">
                <div style="height: 1800px; width: 500px;"></div>
              </div>
            </fieldset>
          </div>

        </div>
      </details>

    </div>

    <div id="tree_root"></div>

  </div>

  <script>
"""
  html_wrapper_end = """
  </script>

  <script src="./js/compiler.js"></script>

  </div>

</body>

</html>
"""
  return html_wrapper_start + get_script_vars() + html_wrapper_end


def main():

  html = get_html()

  with open(HTML_OUT_FILENAME, 'w', encoding='utf8') as html_file:
    html_file.write(html)

  print(f'Index successfully built at: {HTML_OUT_FILENAME}')


if __name__ == '__main__':
  main()
