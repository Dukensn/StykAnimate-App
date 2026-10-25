"""Sound effects + final mix. Effects are filtered noise and low thumps tied to on-screen actions."""
import json, sys, wave
import numpy as np

SR = 48000
DUR = 248.0
rng = np.random.default_rng(11)

def load(p):
    w = wave.open(p); n = w.getnframes(); ch = w.getnchannels()
    a = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768
    return a.reshape(-1, ch)

def lp(x, a):  # one-pole lowpass, a in (0,1): higher = brighter
    y = np.empty_like(x); s = 0.0
    for i in range(len(x)):
        s += a * (x[i] - s); y[i] = s
    return y

def hp(x, a): return x - lp(x, a)

out = np.zeros((int(DUR * SR) + SR, 2), np.float32)

def put(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if sig.ndim == 1:
        l = np.sqrt(0.5 * (1 - pan)); r = np.sqrt(0.5 * (1 + pan))
        sig = np.stack([sig * l, sig * r], 1) * 1.414
    j = min(len(out), i + len(sig))
    out[i:j] += sig[: j - i] * gain

def env(n, att, dec):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(att, 1e-4)) * np.exp(-t / dec)

def key_tap(var):
    n = int(0.035 * SR)
    x = rng.standard_normal(n).astype(np.float32)
    x = hp(lp(x, 0.55 + 0.1 * var), 0.08) * env(n, 0.0005, 0.006 + 0.002 * var)
    return x * 0.5

def thump(f0=60, dur=0.5, click=0.3):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f0 * (1 + 1.5 * np.exp(-t * 30))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
    nz = lp(rng.standard_normal(n).astype(np.float32), 0.2) * np.exp(-t * 40) * click
    return (x + nz).astype(np.float32)

def whoosh(dur=0.7, a0=0.02, a1=0.35):
    n = int(dur * SR)
    x = rng.standard_normal(n).astype(np.float32)
    y = np.empty_like(x); s = 0.0
    for i in range(n):
        k = i / n; a = a0 + (a1 - a0) * np.sin(np.pi * k) ** 2
        s += a * (x[i] - s); y[i] = s
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5
    return y * e * 1.6

def breath(dur=1.6):  # whispery air for Pride's voice
    n = int(dur * SR)
    x = hp(lp(rng.standard_normal(n).astype(np.float32), 0.35), 0.05)
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** 2
    return x * e * 0.5

def buzz(dur=0.45):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.sign(np.sin(2 * np.pi * 165 * t)) * 0.5 + np.sin(2 * np.pi * 330 * t) * 0.3
    x = lp(x.astype(np.float32), 0.15) * (0.6 + 0.4 * np.sin(2 * np.pi * 28 * t))
    e = np.minimum(1, t / 0.01) * np.minimum(1, (dur - t) / 0.03)
    return x * e * 0.5

def pop():
    n = int(0.12 * SR); t = np.arange(n) / SR
    f = 520 * np.exp(-t * 18) + 260
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35) * 0.35).astype(np.float32)

def crackle(dur):
    n = int(dur * SR); x = np.zeros(n, np.float32)
    for _ in range(int(dur * 90)):
        i = rng.integers(0, n - 400); x[i:i + 300] += hp(rng.standard_normal(300).astype(np.float32), 0.4) * np.exp(-np.arange(300) / 40) * rng.uniform(0.1, 0.5)
    return x * np.linspace(1, 0, n) ** 1.5

def roomtone(a, b, level, bright=0.04):
    n = int((b - a) * SR)
    x = lp(rng.standard_normal(n).astype(np.float32), bright)
    fade = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (0.5 * SR))
    put(x * fade * level, a)

def scratch(a, b, level=0.12):  # pencil on paper
    n = int((b - a) * SR)
    x = hp(lp(rng.standard_normal(n).astype(np.float32), 0.6), 0.25)
    t = np.arange(n) / SR
    am = 0.4 + 0.6 * np.abs(np.sin(2 * np.pi * (2.3 + 0.7 * np.sin(t * 1.3)) * t))
    fade = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (0.05 * SR))
    put(x * am * fade * level, a, pan=-0.2)

def page(t):
    n = int(0.5 * SR)
    x = hp(lp(rng.standard_normal(n).astype(np.float32), 0.45), 0.05)
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** 3 * (0.6 + 0.4 * np.sin(np.linspace(0, 18, n)))
    put(x * e * 0.35, t)

def cough(t):
    for k, d in enumerate([0.0, 0.32]):
        n = int(0.28 * SR); tt = np.arange(n) / SR
        x = lp(rng.standard_normal(n).astype(np.float32), 0.12) * np.exp(-tt * 9) * np.minimum(1, tt / 0.01)
        put(x * 0.9, t + d, pan=-0.3)

def wind(a, b, level, bright=0.02):
    n = int((b - a) * SR)
    x = lp(rng.standard_normal(n).astype(np.float32), bright)
    tt = np.arange(n) / SR
    am = 0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * tt + 1.3) * np.sin(2 * np.pi * 0.031 * tt)
    fade = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (0.8 * SR))
    put(x * am * fade * level, a)

def engine(a, b, level, rise=True):
    n = int((b - a) * SR); tt = np.arange(n) / SR
    f = 38 + (30 * tt / (b - a) if rise else 0)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.6 + lp(rng.standard_normal(n).astype(np.float32), 0.02) * 2
    fade = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (0.6 * SR))
    put((x * fade * level).astype(np.float32), a, pan=0.3)

def waves(a, b, level):
    n = int((b - a) * SR); tt = np.arange(n) / SR
    x = lp(rng.standard_normal(n).astype(np.float32), 0.05) * 1.5
    am = 0.35 + 0.65 * (0.5 + 0.5 * np.sin(2 * np.pi * tt / 7.0 - 1.2)) ** 2
    fade = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (1.0 * SR))
    put((x * am * fade * level).astype(np.float32), a)

def buzzes(t, k=3):
    for i in range(k): put(buzz(0.4), t + i * 0.8, 0.28)

score = load(sys.argv[1])
put(score[: len(out)], 0, 3.0)
roomtone(7.0, 42.0, 0.04); roomtone(48.0, 104.0, 0.04); roomtone(216.0, 230.0, 0.04)
wind(140.0, 166.0, 0.06, 0.04)
engine(166.0, 186.0, 0.07, rise=False)
waves(186.0, 216.0, 0.22)
# phone buzzes, the declines, typing
for t in [28.2, 36.2, 39.2]: buzzes(t, 3)
for t in [30.8, 37.9, 40.6]: put(thump(700, 0.06, 0.6), t + 1 / 30, 0.08)
for i in range(21): put(key_tap(rng.uniform(-1, 1)), 32.0 + i / 9 + 1 / 30, 0.18)
put(whoosh(0.4, 0.05, 0.4), 34.6, 0.12)
for t in [222.8]: buzzes(t, 2)
# the door at dad's house, car doors
put(thump(80, 0.3, 0.5), 149.0, 0.25)
put(thump(70, 0.35, 0.5), 165.4, 0.25)
# calendar ticks
for i in range(5): put(thump(1100, 0.04, 0.8), 116.4 + i * 0.7, 0.05)
for i in range(17): put(thump(1100, 0.04, 0.8), 132.3 + i * 0.2, 0.04)

mix = out[: int(DUR * SR)]
peak = np.max(np.abs(mix)); mix = mix / max(peak, 1.0) * 0.9
w = wave.open(sys.argv[3], "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((mix * 32767).astype(np.int16).tobytes()); w.close()
print("peak before norm", peak)
