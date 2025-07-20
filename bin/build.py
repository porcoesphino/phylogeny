#!/usr/bin/env python

import regenerate_index
import validate_inputs
import cache_thumbnails

validate_inputs.main()
regenerate_index.main()
cache_thumbnails.main()
