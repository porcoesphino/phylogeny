from dataclasses import dataclass
import re
import typing
import urllib.parse

IMG_PREFIX = 'https://upload.wikimedia.org/wikipedia/commons/'

IMG_SOURCE_THUMBNAIL_REGEX = re.compile(
    r'^https\:\/\/upload.wikimedia.org\/wikipedia\/commons\/thumb\/[^\/]+\/[^\/]+\/([^\/]+)\/(|(lossless|lossy)-page1-)[0-9]*px-\1(|.png|.jpg)$'  #pylint: disable=line-too-long
)

IMG_SOURCE_COMMONS_REGEX = re.compile(
    r'^https\:\/\/upload.wikimedia.org\/wikipedia\/commons\/[^\/]+\/[^\/]+\/([^\/]+)$'
)

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


def _get_local_filename_from_remote(url: str) -> str:
  [_, url_encoded_filename] = url.rsplit('/', 1)
  return urllib.parse.unquote(url_encoded_filename)


def _get_filename_with_pattern(img_url: str, pattern: re.Pattern[str], image_type: str) -> str:
  m = pattern.match(img_url)
  if not m:
    raise ValueError(f'{image_type} image URL does not match regex: "{img_url}"')
  filename = m.group(1)
  if not filename:
    raise ValueError(f'{image_type} image URL does not have capture group: "{img_url}"')

  return filename


def _get_remote_filename(img_url: str) -> str:

  if not img_url.startswith(IMG_PREFIX):
    raise ValueError(f'Image URL does not start with "{IMG_PREFIX}": "{img_url}"')

  prefix_removed = img_url.removeprefix(IMG_PREFIX)

  if prefix_removed.startswith('thumb'):
    filename = _get_filename_with_pattern(
        img_url=img_url, pattern=IMG_SOURCE_THUMBNAIL_REGEX, image_type='Thumbnail'
    )

  else:
    filename = _get_filename_with_pattern(
        img_url=img_url, pattern=IMG_SOURCE_COMMONS_REGEX, image_type='Commons'
    )

  return filename


def _get_attribution_link_from_image_url(url: str) -> str:
  remote_filename = _get_remote_filename(url)
  return f'https://commons.wikimedia.org/wiki/File:{remote_filename}'


class Image:

  def __init__(self, url: str) -> None:
    self._url = url

  @property
  def remote_url(self) -> str:
    return self._url

  @property
  def local_filename(self) -> str:
    return _get_local_filename_from_remote(self._url)

  @property
  def attribution_url(self) -> str:
    return _get_attribution_link_from_image_url(self._url)


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

  @property
  def image_list(self) -> list[Image]:
    if not self.imgs:
      return []

    return [Image(img_url) for img_url in self.imgs]

  def _validate_common(self) -> None:
    if not self.common:
      return

    if len(self.common) == 1 and self.common[0] == '':
      raise ValueError(f'Invalid common list in {self.name} that has a single empty value.')

  def _validate_imgs(self) -> None:
    if not self.imgs:
      return

    for img in self.image_list:

      # This also validates the images url.
      attribution_url = img.attribution_url

      if len(img.local_filename) > 255:
        raise ValueError(f'Image has local filename that is too long {attribution_url}')

  def validate(self) -> None:
    self._validate_imgs()
    self._validate_common()
