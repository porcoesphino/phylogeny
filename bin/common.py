from dataclasses import dataclass
import typing

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
class NodeRaw:  #pylint: disable=too-many-instance-attributes

  name: str
  parent: str
  rank: Rank
  ipa: str | None = None
  # Consider deleting. It's for pronunciations in different dialects.
  ipa_alt: list[str] | None = None
  etymology: str | None = None
  common: list[str] | None = None
  tag: str | None = None
  # A list of the the remote image URLs.
  imgs: list[str] | None = None
  # The estimated number of species in the taxa.
  species: int | None = None
  card: int | None = None
