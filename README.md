# TALIM — Hackathon Pitch

**Digital Apprenticeship for Kashmir's Living Crafts.**

This repository contains the LaTeX source and compiled PDF for the TALIM
hackathon pitch document.

## What is TALIM?

TALIM is an AI-powered digital apprenticeship platform that:

1. **Captures** every Kashmiri master craftsman's lifetime of knowledge in
   their own voice and language (TALIM Capture).
2. **Teaches** the next generation through an interactive AI tutor with
   stage-gated certification (TALIM Academy).
3. **Authenticates** every piece with a cryptographic Sanad and routes
   payment direct to the artisan, eliminating the middleman (TALIM Sanad).

The name is rooted in the centuries-old Kashmiri *talim* — the encoded
weaving notation that master weavers themselves invented to pass technique
across generations. We are giving that invention its digital form.

## Files

- `talim_pitch.tex` — LaTeX source.
- `talim_pitch.pdf` — Compiled 12-page A4 pitch document.

## Build

```bash
sudo apt-get install -y --no-install-recommends \
    texlive-latex-base texlive-latex-recommended \
    texlive-latex-extra texlive-fonts-recommended \
    texlive-fonts-extra lmodern

pdflatex talim_pitch.tex
pdflatex talim_pitch.tex   # second pass for outlines
```
