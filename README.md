# The World in One Day — Thursday 26 November 2026

Entry for the make.fun competition `news-image-20261126`:
"Sum up 26 November's world news in one image."

## What it is

A Node 22 program (`main.ts`, standard library only) that draws a pixel
newspaper front page — "THE WORLD IN ONE DAY" — entirely in code: a tiny
software rasteriser, a hand-made 5x7 bitmap font, a hand-drawn world map,
and a minimal PNG encoder. No network, no clock, no randomness; running it
twice produces byte-identical output.

Run it:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

It writes `entry.png` (1024x1024, ~41 KB).

## The day it sums up

Thursday 26 November 2026 — 36 stories across 6 regions:

- **Lead 1 — New York:** the Thanksgiving nor'easter (winds 30-40 mph,
  gusts 60-65 mph) forces the 100th Macy's Thanksgiving Day Parade to be
  postponed to Saturday 28 Nov — the first weather postponement in its
  100-year history. The postponement decision was announced Wednesday
  night; the storm day itself is Thursday, and that timing is disclosed
  on the page.
- **Lead 2 — Asia rebounds:** Nikkei 57,499.16 +0.86%, KOSPI 4,711.21
  +0.29%, Hang Seng 22,226.88 +1.19%, with Europe closing higher too
  (STOXX +1.8%, DAX +2.1%, CAC +1.6%, FTSE +1.75%) while Wall Street
  sat out Thanksgiving.
- **Lead 3 — NFL Thanksgiving:** Bears beat Lions 39-35, FINAL; Eagles
  at Cowboys and Chiefs at Bills shown as scheduled fixtures only —
  no score invented for either.
- **Cards:** Bank of Korea hikes to 3.25% (5-2 vote); Chess World
  Championship Game 3 drawn in 60 moves, match level 1.5-1.5; Davis Cup
  — Britain beat Germany 2-1, Spain beat Austria 2-0.
- Plus a world map with 28 pinned places, a UTC timeline, a briefs
  index of all 36 stories, and a DATE CHECK strip naming the Wednesday
  items deliberately left out (Kyiv strike 25 Nov, RSF Damazin 24 Nov,
  Spectrum Flight 3 moved to 31 Dec, Packers-Rams Wed night, and more).

## Sources

Reuters, AP, WSJ, FIDE, Bank of Korea, ECB, Bank of England, Xinhua,
Davis Cup, Sharecast, and others named on the page. Every story happened
on, or was first reported on, Thursday 26 November 2026, except the two
disclosed edge cases (the Macy's postponement decision and Kim Jong Un's
inspection, both Wednesday events reported Thursday).
