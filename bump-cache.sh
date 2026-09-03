#!/bin/sh
# Bump the ?v= cache-buster in index.html so browsers fetch fresh files.
# Run it after changing app.js, style.css, sync.js or aisles.js while testing.
cd "$(dirname "$0")" || exit 1
old=$(sed -n 's/.*style\.css?v=\([^"]*\)".*/\1/p' index.html | head -1)
new="$(date +%Y%m%d%H%M%S)"
sed -i '' "s/?v=$old/?v=$new/g" index.html
echo "cache-buster: $old -> $new"
