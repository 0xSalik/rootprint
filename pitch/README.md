# Hunarmand pitch dossier

A short, plain-English technical document for the jury round. Compiled
to `hunarmand-pitch.pdf`. Source is `hunarmand-pitch.tex`.

The document explains, stage by stage, what the platform does, what
technology we picked, and why. A Q&A section at the end answers the
questions the jury is most likely to ask.

## Build

```bash
./build.sh
```

Requires `texlive-xetex`, `texlive-fonts-extra`, and `texlive-latex-extra`,
plus JetBrains Mono installed system-wide under
`/usr/share/fonts/truetype/jetbrains-mono/`. The four TTFs ship in
`../presentation/fonts/` and can be installed with one `cp` and an
`fc-cache -f`.

## What's in it

| Section | What lands |
| --- | --- |
| What this document is | One paragraph framing |
| The system in one paragraph | Three services, one database |
| Architecture, in a single picture | ASCII diagram of the data flow |
| Technology at each stage | Onboarding, Vault, Sanad, Ustaad, Bazaar, Ask the Hunarmand |
| Why these choices, in plain English | Five short principles |
| Anticipated questions from the jury | 16-question Q&A |

The doc is 7 pages, ~3000 words. A juror should be able to skim it in
ten minutes.

## Edit rule of thumb

Edit `hunarmand-pitch.tex`, run `./build.sh`, commit both the source
and the rebuilt PDF. The `.pdf` is committed deliberately so a
reviewer reading the PR sees the artefact alongside the source.
