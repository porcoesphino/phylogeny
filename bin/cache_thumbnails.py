#!/usr/bin/env python

import os
import random
import time
import urllib.error
import urllib.request

import common
import data_files

_THUMBNAIL_DIR = 'thumbnails'
_ATTRIBUTIONS_FILE = 'Attributions.md'


def maybe_save_thumbnail(local: str, remote: str) -> int:
  image_local_path = os.path.join(_THUMBNAIL_DIR, local)

  # If the file already exists, continue.
  if os.path.isfile(image_local_path):
    return 0
  try:
    urllib.request.urlretrieve(remote, image_local_path)
  except urllib.error.URLError as e:
    raise SystemError(f'Download to file "{image_local_path}" failed.') from e

  file_size = os.path.getsize(image_local_path)
  return file_size


def download_thumbnails(local_to_remote: dict[str, str]) -> None:
  total_items = len(local_to_remote)
  completed_items = 0
  bytes_so_far = 0

  print(f'Beginning download of {total_items} thumbnails.')

  for (local, remote) in local_to_remote.items():
    downloaded_size = maybe_save_thumbnail(local=local, remote=remote)
    if bytes_so_far == 0 and downloaded_size > 0:
      print(f'Skipped {completed_items} already downloaded files.')
    bytes_so_far += downloaded_size
    completed_items += 1

    # If we just hit the server, then give a status then wait a little before continuing.
    if downloaded_size:
      print(f'Saved {completed_items} / {total_items} using {bytes_so_far / 1024 / 1024:.2f}MiB')
      sleep_in_sec = random.random() * 3  # Get a sleep of less than three seconds.
      time.sleep(sleep_in_sec)


def build_attributions_file(local_to_attribution: dict[str, str]) -> None:
  attributions = '# Attributions\n\n'
  for (local, attribution) in local_to_attribution.items():
    attributions += f'- [{local}]({attribution})\n'

  with open(
      os.path.join(_THUMBNAIL_DIR, _ATTRIBUTIONS_FILE), 'w', encoding='utf8'
  ) as attributions_file:
    attributions_file.write(attributions)


def main():

  local_to_attribution: dict[str, str] = {}
  local_to_remote: dict[str, str] = {}

  def node_callback(n: common.NodeRaw) -> None:

    n.validate()

    # Abort early if there are no images.
    if not n.imgs:
      return

    for image in n.image_list:

      local = image.local_filename
      remote = image.remote_url

      if local not in local_to_remote:
        local_to_remote[local] = remote
      else:
        if local_to_remote[local] != remote:
          raise ValueError(
              f'The same local URL ({local}) maps to duplicate remote URLs '
              f'({local_to_remote[local]}, {remote})'
          )

      local_to_attribution[local] = image.attribution_url

  data_files.process_nodes(node_callback)

  build_attributions_file(local_to_attribution=local_to_attribution)
  download_thumbnails(local_to_remote=local_to_remote)


if __name__ == '__main__':
  main()
