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
BEAT = 0.9  # ~66 bpm feel

# A — cold open 0–7
pedal(0.5)
note("piano", 0.8, 3.0, "A4", 40); note("piano", 2.6, 3.0, "F4", 36); note("piano", 4.5, 3.0, "D5", 42); note("piano", 4.52, 3.0, "D3", 34)
swell("strings", 2.5, 7.0, 0, 70); pad("strings", 2.5, 4.6, "Dm", 46)

# B — 7–45: room, first draft, pride
prog = ["Dm", "Bb", "F", "C"]
t = 7.0
i = 0
while t < 31.0 - 0.1:
    arp(t, 3.6, prog[i % 4], vel=46)
    t += 3.6; i += 1
pad("strings", 7.0, 24.0, "Dm", 38, top=False); swell("strings", 7.0, 31.0, 60, 72)
melody("piano", 17.0, MOTIF, BEAT, vel=60)
melody("piano", 24.2, MOTIF2, BEAT, vel=56)
# Pride: darker harmony, low cello
t = 31.0
for ch in ["Dm", "Gm", "Bb", "A"]:
    arp(t, 3.5, ch, vel=42, pattern=(0, 2, 1, 2), steps=4)
    note("cello", t, 3.5, V[ch][0], 64); note("cello", t, 3.5, n(V[ch][0]) + 12, 52)
    t += 3.5
swell("cello", 31.0, 45.0, 50, 95)
note("cello", 45.0 - 0.5, 0.6, "A1", 40)

# C — flashback 45–58.5: music box version over pad, cut at the door slam (53.2)
swell("box", 45.0, 46.0, 60, 100)
melody("box", 45.4, MOTIF, 0.85, vel=70)
pad("pad", 45.0, 8.2, "Dm", 46)
pad("strings", 53.9, 4.6, "Bb", 40); swell("strings", 53.9, 58.5, 30, 70)
note("piano", 54.6, 3.5, "D4", 34); note("piano", 56.2, 3.0, "A3", 30)

# D — 58.5–101: the nights. moving arpeggios, a pulse, motif variations
t = 58.5
prog = ["Dm", "Bb", "F", "C", "Dm", "Bb", "Gm", "A"]
i = 0
while t < 101.0 - 0.1:
    ch = prog[i % len(prog)]
    arp(t, 2.7, ch, vel=48 + (4 if t > 77 else 0), pattern=(0, 1, 2, 3, 2, 1), steps=6)
    note("cello", t, 2.7, V[ch][0], 54)
    t += 2.7; i += 1
pad("strings", 58.5, 42.5, "Dm", 36, top=False); swell("strings", 58.5, 100.0, 55, 80)
melody("piano", 61.2, MOTIF, 0.8, vel=58)
melody("piano", 83.0, MOTIF, 0.75, vel=62)
melody("violin", 85.4, [("D5", 2), ("C5", 2), ("A4", 4)], 0.75, vel=60, legato=1.0)
melody("piano", 92.0, MOTIF2, 0.75, vel=60)
swell("cello", 96.0, 101.0, 90, 40)

# E — 101–121: almost nothing. high pad; a note when the dots appear; true silence when they vanish
swell("strings", 101.0, 101.5, 70, 55)
pad("strings", 101.0, 17.3, "Dm", 40)
note("piano", 107.5, 4.0, "A5", 34); note("piano", 107.52, 4.0, "D5", 30)
note("piano", 112.0, 4.0, "F5", 30); note("piano", 115.0, 3.0, "E5", 28)
swell("strings", 117.0, 118.45, 55, 0)

# F — 121–131: pride again; then hope
note("cello", 121.2, 5.0, "D2", 50); swell("cello", 121.0, 126.0, 60, 80)
note("piano", 122.0, 2.5, "D3", 38); note("piano", 124.0, 2.5, "C#3", 36)
pedal(126.0); chord("piano", 126.0, 2.4, ["Bb2", "F3", "D4"], 40, spread=0.08)
pedal(128.2); chord("piano", 128.2, 3.0, ["F2", "C3", "A3", "F4"], 44, spread=0.07)
pad("strings", 126.0, 5.0, "Bb", 40); swell("strings", 126.0, 131.0, 40, 70)

# G — 131–146: split screen. call (him, high) and response (her, low)
t = 131.0
for ch in ["Dm", "Bb", "F", "C"]:
    arp(t, 3.75, ch, vel=42, pattern=(0, 2, 1, 3), steps=4)
    t += 3.75
pad("strings", 131.0, 15.0, "F", 40); swell("strings", 131.0, 146.0, 60, 78)
melody("piano", 132.0, [("A5", 1), ("D6", 1), ("C6", 1.5), ("A5", 0.5)], 0.85, vel=54)
melody("piano", 135.6, [("D4", 1), ("F4", 1), ("E4", 1.5), ("C4", 0.5)], 0.85, vel=52)
melody("piano", 139.4, [("G5", 1), ("F5", 1), ("E5", 1.5), ("F5", 0.5)], 0.85, vel=54)
melody("piano", 143.0, [("Bb3", 1), ("A3", 1), ("G3", 1.5), ("A3", 0.5)], 0.85, vel=50)

# H — 146–152: he types. a held breath
pad("strings", 146.0, 6.0, "Dm", 44)
note("piano", 147.4, 3, "D4", 36); note("piano", 149.6, 3, "A4", 36)

# I — 152–166: the whispers. tremolo crescendo, timpani pulse accelerating, rising tension
swell("trem", 152.0, 165.9, 25, 127, steps=40)
t = 152.0
for k, ch in enumerate(["Dm", "Dm", "Bb", "Bb", "Gm", "Gm", "A", "A"]):
    pad("trem", t, 1.75, ch, 70)
    t += 1.75
for k, nm in enumerate(["D3", "Eb3", "E3", "F3", "F#3", "G3", "G#3", "A3"]):
    note("cello", 152.0 + k * 1.75, 1.8, nm, 60 + k * 6, human=False)
swell("cello", 152.0, 165.9, 60, 100)
tt, gap = 154.0, 1.4
while tt < 165.8:
    note("timp", tt, 0.6, "D2", int(60 + (tt - 154) * 4))
    tt += gap; gap = max(0.32, gap * 0.86)
cc("trem", 165.95, 123, 0); cc("cello", 165.95, 123, 0); cc("timp", 165.95, 123, 0)
cc("piano", 165.95, 64, 0)

# J/K — 166–176: silence; the send; pride breaks (celesta shimmer)
note("piano", 171.47, 4.5, "D5", 52, human=False); note("piano", 171.49, 4.5, "A4", 40, human=False); cc("piano", 171.5, 64, 100)
for k, nm in enumerate(["D6", "A5", "F5", "D5", "A4", "F4", "D4"]):
    note("celesta", 172.6 + k * 0.17, 1.6, nm, 50 - k * 3)

# L — 176–190.5: delivered, seen, typing
note("piano", 176.6, 4.5, "F4", 34)
note("piano", 182.0, 4.5, "A4", 36)
pad("strings", 185.0, 5.6, "Dsus", 38); swell("strings", 185.0, 190.4, 30, 70)
note("piano", 185.2, 3.0, "D4", 30); note("piano", 187.6, 3.0, "G4", 30)

# M — 190.5–216: "hi baby". resolution in F major, the swell
cc("piano", 190.4, 64, 0)
t = 190.5
prog = ["Bb", "F", "C", "Dm", "Bb", "F", "C", "F", "Bb", "F", "C", "F"]
durs = [3.0, 3.0, 2.5, 2.5, 2.5, 2.5, 2.25, 2.25, 2.3, 2.3, 2.3, 2.6]
for ch, d in zip(prog, durs):
    arp(t, d, ch, vel=54, pattern=(0, 1, 2, 3, 2, 1), steps=6)
    pad("strings", t, d, ch, 58)
    note("cello", t, d, V[ch][0], 62)
    t += d
swell("strings", 190.5, 199.0, 50, 110); swell("strings", 199.0, 207.0, 110, 120); swell("strings", 207.0, 216.0, 120, 70)
swell("cello", 190.5, 216.0, 70, 90)
melody("violin", 193.0, [("D5", 2), ("C5", 1), ("Bb4", 1), ("A4", 2), ("C5", 2), ("F5", 3), ("E5", 1), ("D5", 2), ("C5", 2)], 0.9, vel=66, legato=1.0)
melody("piano", 199.6, MAJOR, 0.9, vel=64)
melody("piano", 207.2, MAJOR, 0.9, vel=58)

# N — 216–232: Sunday. nylon guitar + light piano, in F
t = 216.0
for ch in ["F", "C", "Dm", "Bb", "F", "C", "Bb", "F"]:
    bass, left, tones = V[ch]
    for k, idx in enumerate([0, 2, 1, 3, 2, 1, 3, 2]):
        note("guitar", t + k * 0.25, 0.9, n(tones[idx]) - 12, 56 - (k % 2) * 6)
    note("guitar", t, 1.8, bass if n(bass) > 40 else n(bass) + 12, 58)
    t += 2.0
pad("strings", 216.0, 16.0, "F", 34); swell("strings", 216.0, 232.0, 50, 60)
melody("piano", 218.0, MAJOR, 0.95, vel=52)
melody("piano", 225.6, [("A5", 1), ("C6", 1), ("Bb5", 1), ("A5", 1), ("G5", 2), ("F5", 2)], 0.95, vel=48)

# O — 232–246: end. piano alone, the motif one last time, land on F major at the title
pedal(232.2)
melody("piano", 232.6, [("A4", 1), ("D5", 1), ("C5", 1.5), ("A4", 0.5), ("G4", 1), ("F4", 1), ("E4", 2)], 0.95, vel=46)
note("piano", 232.6, 3.6, "D3", 36); note("piano", 236.4, 2.6, "Bb2", 34)
pedal(239.1)
chord("piano", 239.1, 6.5, ["F2", "C3", "A3", "C4", "F4", "A4"], 44, spread=0.06)
note("piano", 241.6, 4.0, "C6", 28)
cc("piano", 245.5, 64, 0)

# ---------- write
events.sort(key=lambda e: (e[0], e[1]))
mid = mido.MidiFile(ticks_per_beat=480)
tr = mido.MidiTrack(); mid.tracks.append(tr)
tr.append(mido.MetaMessage("set_tempo", tempo=500000, time=0))
last = 0
for tsec, _, msg in events:
    tick = int(round(tsec * TPS))
    msg.time = tick - last
    last = tick
    tr.append(msg)
tr.append(mido.MetaMessage("end_of_track", time=int(2.0 * TPS)))
mid.save(sys.argv[1] if len(sys.argv) > 1 else "score.mid")
print("events", len(events))
