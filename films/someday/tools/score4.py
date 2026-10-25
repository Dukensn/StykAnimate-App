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

CH["voice"] = 11; PROG["voice"] = 53
events.append((0, -1, mido.Message("program_change", channel=11, program=53)))
cc("voice", 0, 7, 70); cc("voice", 0, 91, 100); cc("voice", 0, 11, 100)
cc("guitar", 0, 7, 96)

SONG = [("E5", 1), ("G5", 1), ("A5", 2), ("G5", 1), ("E5", 1), ("D5", 2), ("C5", 1), ("D5", 1), ("E5", 2), ("D5", 2)]
PROG4 = ["C", "G", "Am", "F"]

def pick(t, ch, dur, vel=52, pattern=(0, 2, 1, 3, 2, 1, 3, 2)):
    bass, left, tones = V[ch]
    b = n(bass) if n(bass) >= 40 else n(bass) + 12
    note("guitar", t, dur * 0.95, b, vel + 4)
    step = dur / len(pattern)
    for k, idx in enumerate(pattern):
        note("guitar", t + k * step, step * 2.4, n(tones[idx]) - 12, vel - (k % 2) * 6)

def strum(t, ch, vel=58, spread=0.03, down=True):
    bass, left, tones = V[ch]
    notes = [n(left[0]), n(left[1])] + [n(x) - 12 for x in tones]
    if not down: notes = notes[::-1]
    for i, p in enumerate(notes):
        note("guitar", t + i * spread, 1.6, p, vel - i * 2)

def bar_strums(t, ch, dur, vel=56):
    for k, (off, d) in enumerate([(0, True), (0.375, False), (0.5, True), (0.75, False)]):
        strum(t + off * dur, ch, vel - (0 if d else 10), 0.022, d)

# A — 0–7
pedal(0.4); note("piano", 0.8, 3, "E5", 36); note("piano", 3.0, 3, "C5", 32); note("piano", 5.0, 3, "G4", 36)
pad("strings", 3.0, 4.0, "C", 34); swell("strings", 3.0, 7.0, 0, 55)

# B — 7–24 morning: fingerpicked guitar, piano melody
t = 7.0
while t < 24.0 - 0.1:
    for ch in PROG4:
        if t >= 24.0 - 0.1: break
        pick(t, ch, 2.1, vel=46); t += 2.1
melody("piano", 15.5, SONG, 0.42, vel=52)

# C — 24–42 the guitar, the declined calls
for t0 in [24.0, 28.2, 32.4, 36.6]:
    pick(t0, "Am", 2.1, vel=40); pick(t0 + 2.1, "F", 2.1, vel=40)
for tt in [30.8, 37.9, 40.6]:
    note("piano", tt, 2.5, "A2", 44); note("piano", tt + 0.02, 2.5, "E3", 36)
pad("pad", 24.0, 18.0, "Am", 30)

# D — 42–48 card
pedal(42.4); chord("piano", 42.4, 5.4, ["F2", "C3", "A3", "E4"], 38, spread=0.08)

# E — 48–76 dad's visit
t = 48.0
for ch in ["C", "Am", "F", "G", "C", "Am", "F", "G"]:
    broken(t, 2.0, ch, vel=38, steps=4); t += 2.0
pad("strings", 48.0, 15.0, "C", 32); swell("strings", 48.0, 63.0, 50, 65)
note("piano", 63.2, 3.5, "A3", 32); note("piano", 63.22, 3.5, "E4", 28)
note("cello", 67.0, 5.0, "A1", 48)
note("piano", 72.0, 3.6, "F3", 30); note("piano", 72.02, 3.6, "C4", 28)

# F — 76–82 card
note("piano", 76.6, 2.5, "C5", 32); note("piano", 78.8, 3, "B4", 30)

# G — 82–96 night, alone
t = 82.0
for ch in ["Am", "F", "C", "G", "Am", "F", "Dm"]:
    broken(t, 2.0, ch, vel=36, steps=4); t += 2.0
pad("pad", 82.0, 14.0, "Am", 34)
melody("piano", 86.0, [("E5", 2), ("D5", 1), ("C5", 1), ("B4", 2), ("A4", 4)], 0.5, vel=46)

# H — 96–104 the first call: warmth
cc("piano", 95.9, 64, 0)
pad("strings", 96.0, 8.0, "F", 46); swell("strings", 96.0, 104.0, 40, 90)
pick(96.0, "F", 2.0, vel=46); pick(98.0, "C", 2.0, vel=46); pick(100.0, "G", 2.0, vel=46); pick(102.0, "C", 2.0, vel=46)

# I — 104–110 card
pedal(104.4); chord("piano", 104.4, 5.4, ["C3", "G3", "E4", "G4"], 36, spread=0.08)

# J — 110–140 one thing a day: his clumsy chords, getting cleaner; a light pulse grows underneath
strum(111.0, "C", 40, 0.12); strum(112.6, "C", 44, 0.09); strum(114.0, "C", 48, 0.06)
for i in range(8): note("celesta", 116.2 + i * 0.45, 0.6, ["C6", "E6", "G6", "C7"][i % 4], 34)
strum(120.6, "G", 48, 0.07); strum(122.0, "G", 52, 0.05)
pick(124.0, "C", 2.0, vel=42); pick(126.0, "G", 2.0, vel=42)
strum(128.6, "Am", 52, 0.05); strum(130.0, "Am", 54, 0.04)
for i in range(10): note("celesta", 132.2 + i * 0.35, 0.6, ["A5", "C6", "E6", "A6"][i % 4], 36)
strum(136.6, "F", 50, 0.06); strum(137.8, "F", 56, 0.03); strum(139.0, "F", 60, 0.025)
for i in range(30): note("piano", 110.0 + i * 1.0, 0.4, "C3" if i % 2 == 0 else "G2", 26 + i // 2)
pad("strings", 110.0, 30.0, "C", 30); swell("strings", 110.0, 140.0, 30, 75)

# K — 140–166 picking dad up: hopeful, building
t = 140.0
for i in range(12):
    ch = PROG4[i % 4]
    pick(t, ch, 2.15, vel=50); note("cello", t, 2.15, V[ch][0], 46); t += 2.15
pad("strings", 140.0, 26.0, "C", 40); swell("strings", 140.0, 166.0, 50, 100)
melody("piano", 148.6, SONG, 0.45, vel=56)
melody("violin", 157.2, [("C5", 2), ("E5", 2), ("G5", 4), ("F5", 2), ("E5", 2), ("D5", 4)], 0.5, vel=60, legato=1.0)

# L — 166–186 the road: the full song, strummed
t = 166.0
for i in range(8):
    ch = PROG4[i % 4]
    bar_strums(t, ch, 1.75, vel=58); note("cello", t, 1.75, V[ch][0], 56); pad("strings", t, 1.75, ch, 52); t += 1.75
melody("violin", 166.4, SONG, 0.44, vel=66, legato=1.0)
melody("piano", 173.4, SONG, 0.44, vel=58)
swell("strings", 166.0, 180.0, 80, 115); swell("strings", 180.0, 186.0, 115, 60)
t = 180.0
for ch in ["F", "G", "C"]:
    pick(t, ch, 2.0, vel=44); t += 2.0

# M — 186–216 the ocean
pad("strings", 186.0, 10.0, "F", 50); swell("strings", 186.0, 196.0, 40, 110)
pick(186.0, "F", 2.5, vel=44); pick(188.5, "C", 2.5, vel=44); pick(191.0, "G", 2.5, vel=46); pick(193.5, "Am", 2.5, vel=46)
cc("strings", 195.9, 123, 0)
pad("pad", 196.0, 8.0, "F", 34)
note("piano", 196.4, 3.5, "A4", 36); note("piano", 199.2, 3.5, "C5", 36); note("piano", 201.6, 3.0, "G4", 32)
t = 204.0
for i in range(6):
    ch = PROG4[i % 4]
    bar_strums(t, ch, 2.0, vel=54); t += 2.0
melody("voice", 204.4, SONG, 0.5, vel=56, legato=1.1)    # dad humming along
melody("voice", 209.6, SONG[:6], 0.5, vel=52, legato=1.1)

# N — 216–230 the list, the call
pick(216.0, "C", 2.0, vel=44); pick(218.0, "G", 2.0, vel=44); pick(220.0, "Am", 2.0, vel=44); pick(222.0, "F", 2.0, vel=44)
pick(224.0, "C", 2.0, vel=46); pick(226.0, "G", 2.0, vel=46); pick(228.0, "C", 2.0, vel=42)
melody("piano", 216.6, SONG, 0.45, vel=50)
pad("strings", 216.0, 14.0, "C", 30)

# O — 230–248 end
pedal(230.4); melody("piano", 230.8, [("E5", 1), ("G5", 1), ("A5", 2), ("G5", 1), ("E5", 1), ("D5", 2), ("C5", 4)], 0.7, vel=42)
note("piano", 230.8, 3.5, "C3", 32); note("piano", 234.6, 3.5, "F2", 30)
pedal(240.2); strum(240.4, "C", 48, 0.06)
chord("piano", 240.4, 7.0, ["C2", "G2", "E3", "G3", "C4", "E4"], 40, spread=0.06)
note("piano", 243.0, 4.0, "G5", 26)
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
