# Hunarmand presentation

Seven slides, editorial register, JetBrains Mono throughout, the
website's palette intact.

## Build

```bash
cd presentation
pip install -r requirements.txt
python build_deck.py
```

Outputs `hunarmand.pptx` next to the script.

## Render check

The committed `.pptx` was verified with LibreOffice headless export:

```bash
libreoffice --headless --convert-to pdf hunarmand.pptx
```

For a per-slide visual audit:

```bash
mkdir -p out && pdftoppm -r 110 hunarmand.pdf out/slide -png
```

## Fonts

`fonts/` carries the four JetBrains Mono faces used by the deck. Every
text run sets `font.name` to `JetBrains Mono` (or `JetBrains Mono Light`
for the Light face). On a reviewer machine that has the fonts
installed, the deck renders identically. If not, install once from
`fonts/`:

| OS      | Steps                                                        |
| ------- | ------------------------------------------------------------ |
| macOS   | Open each `.ttf`, click `Install Font`                        |
| Windows | Right-click each `.ttf`, choose `Install`                     |
| Linux   | `cp fonts/*.ttf ~/.fonts/ && fc-cache -f`                     |

## Editing rule of thumb

Re-run `python build_deck.py` after any change. Do not edit the
`.pptx` by hand. The script is the source of truth so the deck stays
deterministic across rebuilds.
