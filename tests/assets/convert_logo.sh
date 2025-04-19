#!/bin/bash
# Convert the SVG logo to PNG

# Requires ImageMagick to be installed
convert -background none -size 80x80 logo.svg logo.png

echo "Logo converted to PNG"
