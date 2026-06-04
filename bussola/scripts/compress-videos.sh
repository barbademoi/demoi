#!/bin/bash
# Comprime vídeos verticais (9:16) gravados no celular pra MP4 + WebM,
# com poster JPG. Roda em scripts/compress-videos.sh, rodar a partir
# da raiz do repo Next.js (onde está public/landing/).

set -u

INPUT_DIR="public/landing"
OUTPUT_DIR="public/landing/optimized"

mkdir -p "$OUTPUT_DIR"

shopt -s nullglob nocaseglob

for video in "$INPUT_DIR"/*.mov "$INPUT_DIR"/*.mp4; do
  [ -f "$video" ] || continue

  filename=$(basename "$video")
  name="${filename%.*}"

  # Pular se já está em optimized.
  if [[ "$video" == *"optimized"* ]]; then
    continue
  fi

  # Pular se o output mp4 já existe (idempotente).
  if [ -f "$OUTPUT_DIR/$name.mp4" ]; then
    echo "↳ $name já comprimido, pulando"
    continue
  fi

  echo "→ Comprimindo $name..."

  # MP4 (H.264, faststart pra streaming progressivo)
  ffmpeg -i "$video" \
    -vcodec libx264 \
    -crf 28 \
    -preset slow \
    -movflags +faststart \
    -an \
    -vf "scale='if(gt(iw,ih),min(1080,iw),-2)':'if(gt(ih,iw),min(1920,ih),-2)'" \
    -y "$OUTPUT_DIR/$name.mp4" 2>/dev/null

  # WebM (VP9, alternativo mais leve pra Chrome/Firefox)
  ffmpeg -i "$video" \
    -c:v libvpx-vp9 \
    -crf 35 \
    -b:v 0 \
    -an \
    -vf "scale='if(gt(iw,ih),min(1080,iw),-2)':'if(gt(ih,iw),min(1920,ih),-2)'" \
    -y "$OUTPUT_DIR/$name.webm" 2>/dev/null

  # Primeiro frame como poster (placeholder enquanto o vídeo carrega)
  ffmpeg -i "$video" \
    -vframes 1 \
    -q:v 2 \
    -y "$OUTPUT_DIR/$name-poster.jpg" 2>/dev/null

  echo "✓ $name (mp4, webm, poster)"
done

echo ""
echo "Compressão completa em $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR"/*.mp4 2>/dev/null
