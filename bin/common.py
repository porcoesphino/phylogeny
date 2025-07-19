from dataclasses import dataclass
import typing

# TODO: Should https://upload.wikimedia.org/wikipedia/commons/ be the value?
# Why is https://upload.wikimedia.org/wikipedia/en in the list?
IMG_PREFIX = 'https://upload.wikimedia.org/wikipedia/'

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

  def _validate_common(self) -> None:
    if not self.common:
      return

    if len(self.common) == 1 and self.common[0] == '':
      raise ValueError(f'Invalid common list in {self.name} that has a single empty value.')

  def _validate_imgs(self) -> None:
    if not self.imgs:
      return

    for img in self.imgs:
      if not img.startswith(IMG_PREFIX):
        raise ValueError(f'Invalid image in {self.name} that does not start with "{IMG_PREFIX}".')

  def validate(self) -> None:
    self._validate_imgs()
    self._validate_common()
