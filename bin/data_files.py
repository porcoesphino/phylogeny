from dataclasses import dataclass
import json
import os
import typing

import common

DATA_DIR = 'data'


@dataclass(kw_only=True)
class JsonDataFile:
  file: str
  domain: str
  taxa: str
  tag: str
  # TODO: Make this a parent to create a tree instead of being lazy + would help with filtering.
  level: int


DATA_LIST = [
    JsonDataFile(
        file='luca',
        domain='',
        taxa='Overview',
        tag='Early life and how the main domains formed.',
        level=0,
    ),
    JsonDataFile(
        file='luca_animalia',
        domain='animalia',
        taxa='Animalia',
        tag='The main evolutionary branches for animals.',
        level=0,
    ),
    JsonDataFile(
        file='luca_animalia_cnidaria',
        domain='animalia',
        taxa='Cnidaria',
        tag='Jellyfish, corals and sea anenomes.',
        level=1,
    ),
    JsonDataFile(
        file='luca_animalia_mollusca',
        domain='animalia',
        taxa='Mollusca',
        tag='Snails, bivalves, squids and nudibranchs.',
        level=1,
    ),
    JsonDataFile(
        file='luca_animalia_arthropoda',
        domain='animalia',
        taxa='Arthropoda',
        tag='Crabs, insects and arachnids.',
        level=1,
    ),
    JsonDataFile(
        file='luca_animalia_arthropoda_insecta',
        domain='animalia',
        taxa='Insecta',
        tag='The insects.',
        level=2,
    ),
    JsonDataFile(
        file='luca_animalia_arthropoda_insecta_hymenoptera',
        domain='animalia',
        taxa='Hymenoptera',
        tag='The narrow waisted insects. Wasps, bees and ants.',
        level=3,
    ),
    JsonDataFile(
        file='luca_animalia_chordata',
        domain='animalia',
        taxa='Chordata',
        tag='From early spinal cords to animals leaving the oceans.',
        level=1,
    ),
    JsonDataFile(
        file='luca_animalia_chordata_elasmobranchii',
        domain='animalia',
        taxa='Elasmobranchii',
        tag='The cartilaginous fish that developed bones. Mostly sharks and rays.',
        level=2,
    ),
    JsonDataFile(
        file='luca_animalia_chordata_actinopterygii',
        domain='animalia',
        taxa='Actinopterygii',
        tag='The ray finned fish. Most known fish.',
        level=2,
    ),
    JsonDataFile(
        file='luca_animalia_chordata_actinopterygii_acanthomorpha',
        domain='animalia',
        taxa='Acanthomorpha',
        tag='A large group nested in the ray finned fish.',
        level=3,
    ),
    JsonDataFile(
        file='luca_animalia_chordata_tetrapoda',
        domain='animalia',
        taxa='Tetrapoda',
        tag='Early land life up until birds and mammals.',
        level=2,
    ),
    JsonDataFile(
        file='luca_animalia_chordata_tetrapoda_aves',
        domain='animalia',
        taxa='Aves',
        tag='An overview of birds.',
        level=3,
    ),
    JsonDataFile(
        file='luca_animalia_chordata_tetrapoda_aves_passeriformes',
        domain='animalia',
        taxa='Passeriformes',
        tag='The perching birds.',
        level=4,
    ),
    JsonDataFile(
        file='luca_animalia_chordata_tetrapoda_aves_passeriformes_passeri',
        domain='animalia',
        taxa='Passeri',
        tag='A large group of perching birds known as the songbirds.',
        level=5,
    ),
    JsonDataFile(
        file='luca_animalia_chordata_tetrapoda_aves_passeriformes_passeri_core_passerides',
        domain='animalia',
        taxa='Core Passerides',
        tag='A large group of songbirds.',
        level=6,
    ),
    JsonDataFile(
        file='luca_animalia_chordata_tetrapoda_mammalia',
        domain='animalia',
        taxa='Mammalia',
        tag='Most of the animals we think of.',
        level=3,
    ),
    JsonDataFile(
        file='luca_animalia_chordata_tetrapoda_mammalia_carnivora',
        domain='animalia',
        taxa='Carnivora',
        tag='The carnivorans, the carnivorous mammals.',
        level=4,
    ),
    JsonDataFile(
        file='luca_animalia_chordata_tetrapoda_mammalia_carnivora_felidae',
        domain='animalia',
        taxa='Felidae',
        tag='The cat-like carnivorans.',
        level=5,
    ),
    JsonDataFile(
        file='luca_animalia_chordata_tetrapoda_mammalia_carnivora_canidae',
        domain='animalia',
        taxa='Canidae',
        tag='The dog-like carnivorans.',
        level=5,
    ),
    JsonDataFile(
        file='luca_animalia_chordata_tetrapoda_mammalia_artiodactyla',
        domain='animalia',
        taxa='Artiodactyla',
        tag='The ungulates and their descendents. Many of the herbivours we think of... and whales.',
        level=4,
    ),
    JsonDataFile(
        file='luca_animalia_chordata_tetrapoda_mammalia_primates',
        domain='animalia',
        taxa='Primates',
        tag='The monkeys and apes.',
        level=4,
    ),
    JsonDataFile(
        file='luca_animalia_chordata_tetrapoda_mammalia_primates_platyrrhini',
        domain='animalia',
        taxa='Platyrrhini',
        tag='The new world monkeys.',
        level=5,
    ),
    JsonDataFile(
        file='luca_animalia_chordata_tetrapoda_mammalia_primates_cercopithecidae',
        domain='animalia',
        taxa='Cercopithecidae',
        tag='The old world monkeys.',
        level=5,
    ),
    JsonDataFile(
        file='luca_animalia_chordata_tetrapoda_mammalia_primates_homo',
        domain='animalia',
        taxa='Homo',
        tag='Humans and their close ancestors.',
        level=5,
    ),
    JsonDataFile(
        file='luca_plantae',
        domain='plantae',
        taxa='Plantae',
        tag='The main evolutionary branches for plants.',
        level=0,
    ),
    JsonDataFile(
        file='luca_plantae_rhodophyta',
        domain='plantae',
        taxa='Rhodophyta',
        tag='The red algae... but often green in colour and includes some seaweeds.',
        level=1,
    ),
    JsonDataFile(
        file='luca_plantae_chlorophyta',
        domain='plantae',
        taxa='Chlorophyta',
        tag='The green algae that branched off before the land plants including some seaweeds.',
        level=1,
    ),
    JsonDataFile(
        file='luca_plantae_pinophyta',
        domain='plantae',
        taxa='Pinophyta',
        tag='The conifers',
        level=1,
    ),
    JsonDataFile(
        file='luca_plantae_angiosperms',
        domain='plantae',
        taxa='Angiosperms',
        tag='The flowering plants',
        level=1,
    ),
    JsonDataFile(
        file='luca_plantae_angiosperms_monocots',
        domain='plantae',
        taxa='Monocots',
        tag='This includes the grasses and many of the plants used in large-scale farming.',
        level=2,
    ),
    JsonDataFile(
        file='luca_plantae_angiosperms_eudicots',
        domain='plantae',
        taxa='Eudicots',
        tag='Dicots show two leaves seed leaves during germination and this is the true dicots.',
        level=2,
    ),
    JsonDataFile(
        file='luca_fungi',
        domain='fungi',
        taxa='Fungi',
        tag='The main evolutionary branches for fungi.',
        level=0,
    ),
    JsonDataFile(
        file='luca_fungi_basidiomycota',
        domain='fungi',
        taxa='Basidiomycota',
        tag='The higher fungi.',
        level=1,
    ),
    JsonDataFile(
        file='luca_fungi_ascomycota',
        domain='fungi',
        taxa='Ascomycota',
        tag='The sac fungi',
        level=1,
    ),
]


def process_nodes(
    per_node_function: typing.Callable[[common.NodeRaw], None]
) -> None:  # type: ignore
  for file_metadata in DATA_LIST:
    full_filename = os.path.join(DATA_DIR, f'{file_metadata.file}.json')
    print(f'Validating: {full_filename}')
    with open(full_filename, 'r', encoding='utf8') as json_file:
      try:
        json_data: list[object] = json.load(json_file)

        for item in json_data:
          n = common.NodeRaw(**item)  # pyright: ignore[reportCallIssue]

          per_node_function(n)

      except Exception as e:
        raise ValueError(f'Invalid data in file "{full_filename}" thowing error: {e}') from e

  print('Data files are valid')
