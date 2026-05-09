# HUNARMAND — Hackathon Pitch

**The Tacit Knowledge OS for Heritage Artisans.**

This repository contains the LaTeX source and compiled PDF for the
Hunarmand hackathon pitch.

## What is Hunarmand?

Hunarmand is the first platform that treats heritage artisans the way modern
engineering treats institutional memory — as a strategic, captureable,
monetisable asset.

We capture the irreplaceable tacit knowledge that dies with a master
craftsman (the unwritten techniques, supplier secrets, environmental
tunings, decades of failed experiments) and turn it into:

1. **Vault** — an AI-led structured craft interview produces a private,
   artisan-owned *Craft DNA* file.
2. **Sanad** — that knowledge becomes a verified public directory and
   per-piece cryptographic provenance counterfeiters cannot fake.
3. **Ustaad** — the same knowledge powers living-museum workshops that
   tourists pay a premium for.
4. **Bazaar** — pop-up bazaars and Heritage Bundles scale authenticity
   into commerce.

The artisan owns their knowledge. The platform makes that knowledge pay
them.

## Files

- `hunarmand_pitch.tex` — LaTeX source.
- `hunarmand_pitch.pdf` — Compiled 13-page A4 pitch document.

## Build

```bash
sudo apt-get install -y --no-install-recommends \
    texlive-latex-base texlive-latex-recommended \
    texlive-latex-extra texlive-fonts-recommended \
    texlive-fonts-extra lmodern

pdflatex hunarmand_pitch.tex
pdflatex hunarmand_pitch.tex   # second pass for outlines
```
