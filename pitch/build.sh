#!/usr/bin/env bash
# Compile the Hunarmand pitch dossier with xelatex (lualatex also works).
#
# Requires:
#   * texlive-xetex
#   * texlive-fonts-extra (for ebgaramond and friends)
#   * texlive-latex-extra (for tcolorbox, titlesec, microtype, enumitem)
#   * JetBrains Mono installed system-wide under
#       /usr/share/fonts/truetype/jetbrains-mono/
#     (one-time install; the .ttfs ship in ../presentation/fonts/)

set -euo pipefail

cd "$(dirname "$0")"

if ! command -v xelatex >/dev/null 2>&1; then
  echo "xelatex not found. Install with: apt-get install texlive-xetex" >&2
  exit 1
fi

# Two passes so cross-references resolve.
xelatex -interaction=nonstopmode hunarmand-pitch.tex >/dev/null
xelatex -interaction=nonstopmode hunarmand-pitch.tex >/dev/null

# Clean intermediate files; keep only the .tex source and the .pdf.
rm -f hunarmand-pitch.aux hunarmand-pitch.log hunarmand-pitch.out

echo "wrote hunarmand-pitch.pdf ($(du -h hunarmand-pitch.pdf | awk '{print $1}'))"
