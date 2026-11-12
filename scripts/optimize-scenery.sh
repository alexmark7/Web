#!/usr/bin/env bash
# Rebuild the display-sized WebP exports; keep the original paintings untouched.
# Requires ImageMagick with WebP support.
set -euo pipefail
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
source_dir="$project_dir/portfolio-v1_1/images"
output_dir="$source_dir/optimized"
mkdir -p "$output_dir"

export_pair() {
  local name="$1" small="$2" large="$3"
  local input="${4:-$source_dir/$name.webp}"
  magick "$input" -resize "$small" -strip -quality 82 -define webp:method=6 "$output_dir/$name.webp"
  magick "$input" -resize "$large" -strip -quality 82 -define webp:method=6 "$output_dir/$name@2x.webp"
}

export_pair watercolor-sun 480x480 960x960
# Bake the three identical mountain washes into one image instead of painting
# the same large transparent background three times in the browser.
mountain_paint="$(mktemp --suffix=.png)"
trap 'rm -f -- "$mountain_paint"' EXIT
# Keep the original ridge texture intact. Only the small generated notch repair
# is placed behind the source painting, at its original 1536x1024 coordinates.
magick "$source_dir/watercolor-mountains-extended.webp" \
  "$source_dir/watercolor-mountain-gap-fill.webp" \
  -geometry +850+420 -compose DstOver -composite \
  \( +clone \) \( +clone \) -compose Over \
  -background none -layers flatten "$mountain_paint"
export_pair watercolor-mountains-connected 1200x800 1536x1024 "$mountain_paint"
export_pair watercolor-cherry-tree-solid 420x420 840x840
export_pair watercolor-ink-splatter 256x256 512x512
export_pair watercolor-ink-stroke 640x 1024x
# The river is displayed as a shallow panorama, so it needs fewer vertical pixels.
export_pair watercolor-river '1536x192!' '2172x384!'
export_pair watercolor-river-forest 720x 1440x
for name in watercolor-cloud watercolor-cloud-{02..07}; do
  export_pair "$name" 640x 1280x
done

# Six square cells: three hamlets followed by three groves, at their display size.
for density in 1 2; do
  cell_size=$((34 * density))
  suffix=""
  if [ "$density" = 2 ]; then suffix="@2x"; fi
  magick \( "$source_dir/watercolor-river-hamlets.webp" -resize "$((cell_size * 3))x$cell_size!" \) \
    \( "$source_dir/watercolor-river-trees.webp" -resize "$((cell_size * 3))x$cell_size!" \) \
    +append -strip -quality 86 -define webp:method=6 "$output_dir/watercolor-river-details$suffix.webp"
done
