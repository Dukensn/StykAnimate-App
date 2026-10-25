# Animated short films

Source for the animated shorts made in the StykAnimate style (bean characters, line-art rooms,
one accent colour, on-screen counters). Each film is a [HyperFrames](https://hyperframes.heygen.com)
project: a single canvas drawn from code, so every frame is a function of time and re-renders identically.

| Film | Length | Folder | Accent |
| --- | --- | --- | --- |
| UNSENT | 4:06 | `unsent/` | amber (Pride) |
| AGAIN | 4:08 | `again/` | red thread |

## Layout

- `<film>/index.html` – the composition (1920×1080, 30 fps); `thumb.html` draws the YouTube thumbnail.
- `<film>/assets/js/` – `core.js` (noise, easing, sketchy lines), `chars.js` (character rig and looks),
  `props.js` (rooms, phone UI), `fx.js` (captions, HUD, grain), `sets2.js` (AGAIN's park, sketchbook, thread),
  `film.js` (the shot list and timing).
- `<film>/tools/` – `score*.py` writes the music as MIDI against the picture's cue times; `mix*.py` adds
  sound effects and writes the final track. `unsent/tools/events.json` holds the typing times.
- `tools/` – Playwright helpers: `still.cjs` (frames at given times), `thumb.cjs` (thumbnail), `events.cjs`.
- `thumbnails/`, `youtube/` – published thumbnails, titles and descriptions.

## Rebuild a film

Requires Node 22+, Python 3 with `mido` and `numpy`, FluidSynth with the FluidR3 GM soundfont, and ffmpeg.

```sh
cd films/unsent                      # or films/again (score2.py / mix2.py)
python3 tools/score.py score.mid
fluidsynth -ni -g 0.6 -r 48000 -o synth.reverb.room-size=0.82 -o synth.reverb.level=0.75 \
  -o synth.chorus.active=0 -F score.wav /usr/share/sounds/sf2/FluidR3_GM.sf2 score.mid
python3 tools/mix.py score.wav tools/events.json premix.wav      # AGAIN: tools/mix2.py score.wav - premix.wav
mkdir -p assets/audio
ffmpeg -i premix.wav -af "acompressor=threshold=-24dB:ratio=2.5:attack=20:release=400:makeup=2,loudnorm=I=-14:TP=-1.5:LRA=11" \
  -ar 48000 -c:a pcm_s16le assets/audio/mix.wav
npx --yes hyperframes@0.8.193 render -w 4 -q delivery -o renders/film.mp4
```

Quick look at frames without rendering: `node ../tools/still.cjs . /tmp/stills 12 38 140`.
Thumbnail: `node ../tools/thumb.cjs . thumb.png`.

## Starting a new film

Copy `again/` (the most complete rig), keep `core.js`, `chars.js`, `props.js`, `fx.js`, and rewrite
`film.js` (shots and timing) and the score cues. Character looks live in the `LOOKS` table in `chars.js`.
