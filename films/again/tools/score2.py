"""Score for UNSENT. — written against the picture's cue times (seconds).
Writes score.mid; render with FluidSynth + a sampled soundfont.
Humanized: velocity and timing drift, rubato-free but loose, sustain pedal per chord."""
import random, sys
import mido

random.seed(7)
TPS = 960  # ticks per second (tempo 120 bpm, 480 ppq)
events = []  # (time_sec, order, msg)

NOTE = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}

def n(name):
    i = 2 if len(name) > 2 and name[1] in "#b" else 1
    return 12 * (int(name[i:]) + 1) + NOTE[name[:i]]

CH = {"piano": 0, "strings": 1, "cello": 2, "box": 3, "trem": 4, "timp": 5, "celesta": 6, "guitar": 7, "pad": 8, "violin": 9 + 1}
PROG = {"piano": 0, "strings": 49, "cello": 42, "box": 10, "trem": 44, "timp": 47, "celesta": 8, "guitar": 24, "pad": 89, "violin": 40}

def note(inst, t, dur, pitch, vel, human=True):
    if isinstance(pitch, str): pitch = n(pitch)
    if human:
        t += random.gauss(0, 0.012)
        vel += random.randint(-6, 6)
    vel = max(1, min(127, int(vel)))
    t = max(0.0, t)
    c = CH[inst]
    events.append((t, 1, mido.Message("note_on", channel=c, note=pitch, velocity=vel)))
    events.append((t + dur, 0, mido.Message("note_off", channel=c, note=pitch, velocity=0)))

def cc(inst, t, ctrl, val):
    events.append((max(0, t), 0 if val == 0 else 2, mido.Message("control_change", channel=CH[inst], control=ctrl, value=int(val))))

def pedal(t):  # re-pedal: lift just before, press after
    cc("piano", t - 0.03, 64, 0)
    cc("piano", t + 0.04, 64, 100)

def swell(inst, a, b, v0, v1, steps=24):  # expression ramp
    for i in range(steps + 1):
        k = i / steps
        cc(inst, a + (b - a) * k, 11, v0 + (v1 - v0) * k)

def chord(inst, t, dur, names, vel, spread=0.0):
    for i, nm in enumerate(names):
        note(inst, t + i * spread, dur, nm, vel)

# chord voicings: (bass, [left-hand], [arp tones])
V = {
    "Dm": ("D2", ["D3", "A3"], ["D4", "F4", "A4", "D5"]),
    "Bb": ("Bb1", ["Bb2", "F3"], ["D4", "F4", "Bb4", "D5"]),
    "F": ("F2", ["F2", "C3"], ["C4", "F4", "A4", "C5"]),
    "C": ("C2", ["C3", "G3"], ["C4", "E4", "G4", "C5"]),
    "Gm": ("G1", ["G2", "D3"], ["D4", "G4", "Bb4", "D5"]),
    "A": ("A1", ["A2", "E3"], ["C#4", "E4", "A4", "C#5"]),
    "Am": ("A1", ["A2", "E3"], ["C4", "E4", "A4", "C5"]),
    "Dsus": ("D2", ["D3", "A3"], ["D4", "G4", "A4", "D5"]),
}

def arp(t, dur, ch, vel=48, pattern=(0, 1, 2, 1, 3, 1, 2, 1), steps=8, lh=True, oct_up=0):
    bass, left, tones = V[ch]
    pedal(t)
    if lh:
        note("piano", t, dur * 0.95, bass, vel + 6)
        note("piano", t + 0.02, dur * 0.9, left[1], vel - 6)
    step = dur / steps
    for i in range(steps):
        p = n(tones[pattern[i % len(pattern)]]) + 12 * oct_up
        # slight push-pull inside the bar
        sw = 0.012 * (1 if i % 2 else -1)
        note("piano", t + i * step + sw, step * 2.2, p, vel - 8 + (6 if i == 0 else 0) - (i % 2) * 4)

def pad(inst, t, dur, ch, vel=50, top=True):
    bass, left, tones = V[ch]
    names = [left[0], left[1]] + ([tones[1], tones[2]] if top else [tones[1]])
    for nm in names:
        note(inst, t, dur + 0.25, nm, vel, human=False)

def melody(inst, t0, line, beat, vel=62, legato=1.05):
    """line: list of (pitch or None, beats)"""
    t = t0
    for p, b in line:
        if p:
            note(inst, t + random.gauss(-0.01, 0.01), b * beat * legato, p, vel + random.randint(-4, 5))
        t += b * beat
    return t

# ---------- motif (in D minor) and its major answer
MOTIF = [("A4", 1), ("D5", 1), ("C5", 1.5), ("A4", 0.5), ("G4", 1), ("F4", 1), ("E4", 1.5), ("F4", 0.5)]
MOTIF2 = [("A4", 1), ("D5", 1), ("E5", 1.5), ("F5", 0.5), ("E5", 1), ("D5", 1), ("C5", 2)]
ANSWER = [("D4", 1), ("F4", 1), ("E4", 1.5), ("C4", 0.5), ("D4", 2), (None, 2)]
MAJOR = [("C5", 1), ("F5", 1), ("E5", 1.5), ("C5", 0.5), ("D5", 1), ("C5", 1), ("A4", 1.5), ("C5", 0.5)]

def section_programs():
    for inst, c in CH.items():
        events.append((0, -1, mido.Message("program_change", channel=c, program=PROG[inst])))
        cc(inst, 0, 7, 100)
        cc(inst, 0, 91, 90)  # reverb send
        cc(inst, 0, 11, 100)
    cc("strings", 0, 7, 82); cc("cello", 0, 7, 86); cc("pad", 0, 7, 60); cc("box", 0, 7, 70)
    cc("trem", 0, 7, 80); cc("timp", 0, 7, 66); cc("celesta", 0, 7, 70); cc("guitar", 0, 7, 78); cc("violin", 0, 7, 70)
    cc("piano", 0, 91, 70)

section_programs()

# voicings for film 2 (A minor / C major)
V.update({
    "Am": ("A1", ["A2", "E3"], ["C4", "E4", "A4", "C5"]),
    "F": ("F1", ["F2", "C3"], ["C4", "F4", "A4", "C5"]),
    "C": ("C2", ["C3", "G3"], ["C4", "E4", "G4", "C5"]),
    "G": ("G1", ["G2", "D3"], ["B3", "D4", "G4", "B4"]),
    "Em": ("E2", ["E2", "B2"], ["B3", "E4", "G4", "B4"]),
    "Dm": ("D2", ["D3", "A3"], ["D4", "F4", "A4", "D5"]),
    "E": ("E2", ["E2", "B2"], ["B3", "E4", "G#4", "B4"]),
    "Fmaj7": ("F1", ["F2", "C3"], ["C4", "E4", "A4", "C5"]),
})

def waltz(t, bar, ch, vel=46, inst="piano"):
    """oom-pah-pah: bass on 1, chord on 2 and 3"""
    bass, left, tones = V[ch]
    b = bar / 3
    if inst == "piano": pedal(t)
    note(inst, t, bar * 0.95, bass, vel + 6)
    for k in (1, 2):
        for nm in tones[:3]:
            note(inst, t + k * b + random.gauss(0, 0.006), b * 0.9, nm, vel - 10 - (k - 1) * 3)

def broken(t, dur, ch, vel=44, steps=6, pat=(0, 1, 2, 3, 2, 1)):
    arp(t, dur, ch, vel=vel, pattern=pat, steps=steps)

# motif (A minor waltz): A C E | D C B | C - A
MOT = [("E5", 1), ("A5", 1), ("G5", 1), ("F5", 2), ("E5", 1), ("D5", 1), ("E5", 1), ("C5", 1), ("A4", 3)]
MOT_C = [("E5", 1), ("G5", 1), ("C6", 1), ("B5", 2), ("A5", 1), ("G5", 1), ("A5", 1), ("E5", 1), ("C5", 3)]

# A — cold open 0–7.5: lone piano
pedal(0.4)
note("piano", 0.7, 3, "E5", 38); note("piano", 2.5, 3, "C5", 34); note("piano", 4.6, 3.5, "A4", 40); note("piano", 4.62, 3.5, "A2", 32)
pad("strings", 3.0, 4.5, "Am", 40); swell("strings", 3.0, 7.5, 0, 60)

# B — 7.5–28 morning: gentle broken chords, motif
t = 7.5
for ch in ["Am", "F", "C", "G", "Am", "F", "Dm", "E"]:
    broken(t, 2.55, ch, vel=42)
    t += 2.55
pad("strings", 7.5, 20.5, "Am", 34, top=False); swell("strings", 7.5, 28.0, 50, 70)
melody("piano", 10.0, MOT, 0.62, vel=56)
melody("violin", 21.2, [("E5", 2), ("D5", 1), ("C5", 1), ("B4", 2), ("A4", 3)], 0.7, vel=58, legato=1.0)

# C — 28–42 Forgetting: thin, cold, celesta + low drone, harmony slipping
note("cello", 28.0, 14, "A1", 50); swell("cello", 28.0, 42.0, 50, 85)
pad("pad", 28.0, 14.0, "Am", 40)
for k, nm in enumerate(["E6", "C6", "A5", "E5", "D#5", "C5", "A4", "E4"]):
    note("celesta", 29.0 + k * 1.4, 2.5, nm, 40 - k * 2)
note("piano", 35.6, 4, "A3", 36); note("piano", 35.62, 4, "C4", 30)
swell("pad", 39.0, 42.0, 100, 0)

# D — 42–72 flashback 1974: music box + piano waltz in C major, warm
for k, ch in enumerate(["C", "Am", "F", "G", "C", "Am", "Dm", "G", "C", "F", "C", "G", "Am", "F", "G", "C"]):
    waltz(42.0 + k * 1.875, 1.875, ch, vel=40)
melody("box", 43.0, MOT_C, 0.625, vel=72)
melody("box", 50.6, MOT_C, 0.625, vel=66)
melody("piano", 60.0, MOT_C, 0.625, vel=56)
pad("strings", 60.0, 12.0, "C", 38); swell("strings", 60.0, 72.0, 40, 80)
for k, nm in enumerate(["C6", "E6", "G6"]):
    note("celesta", 68.0 + k * 0.25, 2.5, nm, 46)   # the thread appears

# E — 72–104 present: same waltz, a little slower, in A minor → C, strings carry
t = 72.0
prog = ["Am", "F", "C", "G", "Am", "F", "Dm", "E", "F", "G", "C", "Am", "F", "G", "Am", "Am"]
for ch in prog:
    waltz(t, 2.0, ch, vel=42)
    note("cello", t, 2.0, V[ch][0], 48)
    t += 2.0
pad("strings", 72.0, 32.0, "Am", 34, top=False); swell("strings", 72.0, 104.0, 55, 82)
melody("piano", 74.2, MOT, 0.66, vel=56)
melody("violin", 84.5, [("C5", 2), ("E5", 1), ("A5", 3), ("G5", 2), ("F5", 1), ("E5", 3)], 0.66, vel=58, legato=1.0)
melody("piano", 92.0, MOT_C, 0.66, vel=58)
melody("violin", 98.0, [("E5", 3), ("D5", 3), ("C5", 6)], 0.66, vel=56, legato=1.0)

# F — 104–122 the bad day: hit, then a lonely cello
cc("piano", 104.0, 64, 0)
chord("piano", 105.4, 1.5, ["A1", "E2", "A2", "D#3"], 70)
note("cello", 108.5, 6, "A2", 58); note("cello", 114.5, 7, "G2", 54)
note("piano", 110.0, 3, "E4", 34); note("piano", 113.0, 3, "C4", 32); note("piano", 117.5, 4, "B3", 34); note("piano", 117.52, 4, "E4", 30)
pad("strings", 117.5, 4.5, "Em", 34)

# G — 122–140 sketchbook: music box motif, one note per page turn, then silence on the empty page
melody("box", 122.6, MOT, 0.75, vel=62)
for t in [126.0, 130.0, 134.0]:
    note("piano", t, 3.5, "A4", 36); note("piano", t + 0.02, 3.5, "E4", 30)
pad("strings", 122.0, 14.3, "F", 32); swell("strings", 122.0, 136.4, 60, 0)
note("piano", 138.4, 4, "C5", 30)

# H — 140–157 winter: sparse low piano, cold pad, the motif fragmented
pad("pad", 140.0, 17.0, "Am", 34)
note("cello", 140.0, 10, "A1", 44)
for t, nm in [(141.0, "A3"), (143.5, "E3"), (146.0, "C4"), (148.5, "B3"), (151.0, "A3"), (153.5, "E4"), (155.5, "D4")]:
    note("piano", t, 3, nm, 32)

# I — 157–176 her hands remember: piano motif returns, slowly building
t = 157.0
for ch in ["Am", "F", "C", "G", "Am", "F", "Dm", "E", "F"]:
    broken(t, 2.1, ch, vel=40 + int((t - 157) * 0.8))
    t += 2.1
melody("piano", 158.0, MOT, 0.68, vel=60)
melody("violin", 164.0, [("A5", 2), ("G5", 1), ("F5", 1), ("E5", 2), ("D5", 1), ("E5", 3)], 0.68, vel=60, legato=1.0)
pad("strings", 157.0, 19.0, "F", 40); swell("strings", 157.0, 176.0, 40, 90)
for k, nm in enumerate(["A5", "C6", "E6", "A6"]):
    note("celesta", 172.6 + k * 0.3, 3, nm, 44)  # the thread lights

# J — 176–183 he walks: held breath, a pedal on E
note("cello", 176.0, 7, "E2", 56); pad("strings", 176.0, 7.0, "E", 44); swell("strings", 176.0, 183.0, 70, 100)
for t in [176.5, 178.5, 180.5]:
    note("piano", t, 2, "E4", 34); note("piano", t + 0.66, 2, "B3", 30)

# K — 183–210 "...Leo?": the big release in C major
cc("piano", 183.0, 64, 0)
note("piano", 184.0, 3.0, "G4", 46); note("piano", 184.02, 3.0, "C5", 44)
t = 185.2
prog = ["C", "G", "Am", "F", "C", "G", "F", "C", "Am", "F", "G", "C"]
for ch in prog:
    broken(t, 2.0, ch, vel=56, steps=6)
    pad("strings", t, 2.0, ch, 60)
    note("cello", t, 2.0, V[ch][0], 64)
    t += 2.0
swell("strings", 185.2, 192.0, 60, 115); swell("strings", 192.0, 203.0, 115, 120); swell("strings", 203.0, 210.0, 120, 70)
melody("violin", 186.0, [("E5", 2), ("G5", 1), ("C6", 3), ("B5", 2), ("A5", 1), ("G5", 3), ("E5", 2), ("F5", 1), ("G5", 6)], 0.66, vel=70, legato=1.0)
melody("piano", 197.6, MOT_C, 0.66, vel=62)
pedal(209.2)
chord("piano", 209.2, 3, ["C3", "G3", "E4", "C5"], 40, spread=0.05)

# L — 210–234 the next morning and the walk: the waltz, major, light
t = 210.0
for ch in ["C", "Am", "F", "G", "C", "Am", "Dm", "G", "C", "F", "C", "G"]:
    waltz(t, 2.0, ch, vel=38)
    t += 2.0
melody("box", 211.0, MOT_C, 0.66, vel=64)
melody("piano", 219.0, MOT_C, 0.66, vel=52)
pad("strings", 210.0, 24.0, "C", 32); swell("strings", 210.0, 234.0, 50, 60)

# M — 234–248 end: piano alone, motif, land on C at the title
pedal(234.2)
melody("piano", 234.6, [("E5", 1), ("A5", 1), ("G5", 1), ("F5", 2), ("E5", 1), ("D5", 1), ("E5", 1), ("C5", 3)], 0.72, vel=44)
note("piano", 234.6, 3.5, "A2", 34); note("piano", 238.0, 3, "F2", 32)
pedal(241.1)
chord("piano", 241.1, 6.5, ["C2", "G2", "E3", "G3", "C4", "E4"], 44, spread=0.06)
note("piano", 243.4, 4.0, "G5", 28)
cc("piano", 247.5, 64, 0)

events.sort(key=lambda e: (e[0], e[1]))
mid = mido.MidiFile(ticks_per_beat=480)
tr = mido.MidiTrack(); mid.tracks.append(tr)
tr.append(mido.MetaMessage("set_tempo", tempo=500000, time=0))
last = 0
for tsec, _, msg in events:
    tick = int(round(tsec * TPS)); msg.time = tick - last; last = tick; tr.append(msg)
tr.append(mido.MetaMessage("end_of_track", time=int(2.0 * TPS)))
mid.save(sys.argv[1])
print("events", len(events))
