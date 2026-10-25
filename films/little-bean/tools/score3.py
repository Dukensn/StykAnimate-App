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

# voicings
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

V.update({
    "G": ("G1", ["G2", "D3"], ["B3", "D4", "G4", "B4"]),
    "D": ("D2", ["D3", "A3"], ["D4", "F#4", "A4", "D5"]),
    "Em": ("E2", ["E2", "B2"], ["B3", "E4", "G4", "B4"]),
    "C": ("C2", ["C3", "G3"], ["C4", "E4", "G4", "C5"]),
    "Am": ("A1", ["A2", "E3"], ["C4", "E4", "A4", "C5"]),
    "Bm": ("B1", ["B2", "F#3"], ["B3", "D4", "F#4", "B4"]),
    "Cadd9": ("C2", ["C3", "G3"], ["D4", "E4", "G4", "D5"]),
    "Dsus4": ("D2", ["D3", "A3"], ["D4", "G4", "A4", "D5"]),
})
MOT = [("D5", 1), ("G5", 1), ("F#5", 1), ("D5", 1), ("E5", 2), ("D5", 1), ("B4", 1), ("C5", 1), ("B4", 1), ("A4", 2), ("G4", 2)]
MOT_M = [("B4", 1), ("E5", 1), ("D5", 1), ("B4", 1), ("C5", 2), ("B4", 1), ("G4", 1), ("A4", 2), ("E4", 4)]

def prog_arp(t, chords, dur, vel=44, steps=6):
    for ch in chords:
        broken(t, dur, ch, vel=vel, steps=steps); t += dur
    return t

# A — 0–7.5
pedal(0.4)
note("piano", 0.7, 3, "D5", 38); note("piano", 2.6, 3, "B4", 34); note("piano", 4.6, 3.5, "G4", 40); note("piano", 4.62, 3.5, "G2", 32)
pad("strings", 3.0, 4.5, "G", 38); swell("strings", 3.0, 7.5, 0, 60)

# B — 7.5–30 the kitchen at 5 AM, the first note
prog_arp(7.5, ["G", "D", "Em", "C", "G", "D", "C", "Dsus4"], 2.8, vel=42)
pad("strings", 7.5, 22.5, "G", 32, top=False); swell("strings", 7.5, 30.0, 50, 70)
melody("piano", 10.4, MOT, 0.58, vel=56)
melody("piano", 21.0, MOT, 0.58, vel=54)

# C — 30–42 age six: music box, bright
for k, ch in enumerate(["G", "Em", "C", "D", "G", "Em", "C", "D"]):
    waltz(30.0 + k * 1.5, 1.5, ch, vel=38)
melody("box", 30.4, MOT, 0.5, vel=74)
melody("box", 36.4, MOT, 0.5, vel=70)

# D — 42–60 age thirteen: thinner, a little sour; stops when she throws it
prog_arp(42.0, ["Em", "C", "G", "D", "Em", "C"], 1.45, vel=40, steps=4)
melody("celesta", 42.4, MOT_M, 0.5, vel=46)
cc("piano", 50.5, 64, 0)
note("piano", 52.0, 3, "E3", 34); note("piano", 52.02, 3, "B3", 30)
pad("strings", 53.0, 7.0, "Em", 34); swell("strings", 53.0, 60.0, 40, 70)
note("piano", 55.0, 3, "G4", 32); note("piano", 57.5, 3, "F#4", 32)

# E — 60–70 two jobs: a soft night pulse
for i in range(16):
    note("piano", 60.2 + i * 0.6, 0.5, "D3" if i % 4 else "G2", 34)
melody("piano", 61.0, [("B4", 2), ("A4", 2), ("G4", 2), ("D4", 4), ("E4", 2), ("F#4", 2), ("G4", 4)], 0.45, vel=48)
pad("strings", 60.0, 10.0, "G", 32)

# F — 70–82 the door
pad("strings", 70.0, 5.0, "Bm", 40); swell("strings", 70.0, 75.0, 50, 95)
note("cello", 70.0, 5.0, "B1", 56)
cc("strings", 74.95, 123, 0); cc("cello", 74.95, 123, 0)
chord("piano", 75.0, 1.6, ["B1", "F#2", "B2", "C3"], 66)
note("cello", 76.5, 5.5, "E2", 50)
note("piano", 78.0, 3, "G4", 30); note("piano", 80.0, 2.5, "E4", 30)

# G — 82–90 "i'm proud of you"
prog_arp(82.0, ["G", "D", "C", "G"], 2.0, vel=38, steps=4)
melody("piano", 82.6, MOT[:6], 0.55, vel=54)

# H — 90–112 eighteen: the departure, strings carry the motif
t = 90.0
for ch in ["Em", "C", "G", "D", "Em", "C", "G", "D", "C", "Am", "D", "D"]:
    broken(t, 1.83, ch, vel=46, steps=6); note("cello", t, 1.83, V[ch][0], 52); t += 1.83
pad("strings", 90.0, 22.0, "G", 40); swell("strings", 90.0, 104.0, 50, 105); swell("strings", 104.0, 112.0, 105, 50)
melody("violin", 92.0, [("B4", 2), ("E5", 2), ("D5", 2), ("B4", 2), ("C5", 3), ("B4", 1), ("A4", 4)], 0.6, vel=64, legato=1.0)
melody("piano", 101.6, MOT, 0.62, vel=58)

# I — 112–132 the empty house: music box, slow and alone
melody("box", 112.6, MOT, 0.85, vel=60)
pad("pad", 112.0, 20.0, "Em", 34)
for t, nm in [(113.0, "E3"), (116.0, "C3"), (119.0, "G2"), (122.0, "D3"), (125.0, "E3"), (128.0, "C3")]:
    note("piano", t, 3, nm, 32)
melody("box", 124.4, MOT[:6], 0.85, vel=54)

# J — 132–158 the dorm: building to the shoebox
t = 132.0
for ch in ["C", "G", "D", "Em", "C", "G", "D", "D", "C", "G", "Am", "D", "Cadd9"]:
    broken(t, 2.0, ch, vel=40 + int((t - 132) * 0.6), steps=6); t += 2.0
pad("strings", 132.0, 26.0, "C", 36); swell("strings", 132.0, 150.0, 40, 85); swell("strings", 150.0, 158.0, 85, 110)
melody("piano", 138.4, MOT, 0.6, vel=58)
melody("violin", 150.2, [("G5", 2), ("F#5", 1), ("E5", 1), ("D5", 2), ("B4", 2), ("C5", 2), ("D5", 4)], 0.55, vel=68, legato=1.0)

# K — 158–170 she drives home: a pulse rising
for i in range(24):
    note("piano", 158.0 + i * 0.5, 0.45, ["G3", "D4", "B3", "D4"][i % 4], 36 + i)
pad("strings", 158.0, 12.0, "D", 40); swell("strings", 158.0, 169.8, 40, 100)
note("cello", 158.0, 12.0, "D2", 52)
cc("strings", 169.9, 123, 0); cc("cello", 169.9, 123, 0); cc("piano", 169.9, 64, 0)

# L — 170–186 the dark kitchen: almost nothing
note("piano", 173.2, 4, "B4", 30)
note("piano", 177.0, 4, "G4", 30)
note("piano", 181.0, 4, "A4", 32); note("piano", 183.5, 3, "D4", 30)
pad("strings", 179.0, 7.0, "Dsus4", 32); swell("strings", 179.0, 186.0, 30, 70)

# M — 186–216 her note, his face, "hi, dad", the hug: the release
cc("piano", 185.9, 64, 0)
t = 186.0
for ch, d in zip(["G", "D", "Em", "C", "G", "D", "C", "G", "Em", "C", "D", "G", "C", "G", "D", "G"],
                 [2.0, 2.0, 2.0, 2.0, 1.9, 1.9, 1.9, 1.9, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 2.2]):
    broken(t, d, ch, vel=54, steps=6); pad("strings", t, d, ch, 60); note("cello", t, d, V[ch][0], 62); t += d
swell("strings", 186.0, 196.0, 50, 112); swell("strings", 196.0, 214.0, 112, 120); swell("strings", 214.0, 216.0, 120, 70)
melody("violin", 187.0, [("D5", 2), ("G5", 2), ("F#5", 2), ("D5", 2), ("E5", 3), ("D5", 1), ("B4", 4), ("C5", 2), ("D5", 2), ("G5", 6)], 0.6, vel=70, legato=1.0)
melody("piano", 203.4, MOT, 0.6, vel=62)

# N — 216–228 sunrise: guitar and a light piano
t = 216.0
for ch in ["G", "C", "G", "D", "G", "C"]:
    bass, left, tones = V[ch]
    for k, idx in enumerate([0, 2, 1, 3, 2, 1, 3, 2]):
        note("guitar", t + k * 0.25, 0.9, n(tones[idx]) - 12, 54 - (k % 2) * 6)
    note("guitar", t, 1.8, bass if n(bass) > 40 else n(bass) + 12, 56)
    t += 2.0
pad("strings", 216.0, 12.0, "G", 32)
melody("piano", 217.0, MOT, 0.62, vel=50)

# O — 228–244 end: piano alone, land on G
pedal(228.2)
melody("piano", 228.6, [("D5", 1), ("G5", 1), ("F#5", 1), ("D5", 1), ("E5", 2), ("D5", 1), ("B4", 1), ("A4", 2), ("G4", 3)], 0.7, vel=44)
note("piano", 228.6, 3.5, "G2", 34); note("piano", 232.6, 3, "C3", 32)
pedal(236.1)
chord("piano", 236.1, 7.0, ["G1", "D2", "B2", "D3", "G3", "B3"], 44, spread=0.06)
note("piano", 238.6, 4.5, "D6", 28)
cc("piano", 243.5, 64, 0)

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
