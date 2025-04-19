#!/bin/bash
# This script creates placeholder PNG files from the SVG files
# It requires imagemagick to be installed (convert command)

# Create normal icons in different sizes
convert -background none -size 16x16 icon.svg icon16.png
convert -background none -size 48x48 icon.svg icon48.png
convert -background none -size 128x128 icon.svg icon128.png

# Create disabled icons in different sizes
convert -background none -size 16x16 icon-disabled.svg icon-disabled16.png
convert -background none -size 48x48 icon-disabled.svg icon-disabled48.png
convert -background none -size 128x128 icon-disabled.svg icon-disabled128.png

echo "Created placeholder PNG icons"
