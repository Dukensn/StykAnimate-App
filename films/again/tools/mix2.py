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

score = load(sys.argv[1])
put(score[: len(out)], 0, 3.0)

roomtone(7.5, 42.0, 0.05); roomtone(104.0, 150.0, 0.045); roomtone(210.0, 226.0, 0.045)
wind(42.0, 104.0, 0.09, 0.03); wind(150.0, 210.0, 0.12, 0.02); wind(226.0, 234.0, 0.08, 0.03)
# footsteps of the old man coming in with the tea
for t in np.arange(8.1, 11.4, 0.62):
    put(thump(80, 0.18, 0.5), t, 0.12)
# Forgetting: cold air
for t in [28.6, 35.4, 167.4]:
    put(breath(2.4), t, 0.3, pan=0.3)
# drawing and writing
scratch(52.4, 57.6); scratch(58.0, 59.4, 0.1)
scratch(157.3, 163.5); scratch(164.0, 165.4, 0.1)
# the door
put(thump(55, 0.9, 0.6), 105.4 + 1 / 30, 0.55)
put(thump(95, 0.22, 0.5), 105.45, 0.3)
# page turns, the tear
for t in [125.45, 129.45, 133.45, 136.05]:
    page(t)
put(thump(300, 0.08, 0.2), 138.4 + 1 / 30, 0.08)
cough(141.2); cough(145.4)
# his steps in the snow
for t in np.arange(176.3, 182.0, 0.9):
    n = int(0.2 * SR); x = lp(rng.standard_normal(n).astype(np.float32), 0.25) * np.exp(-np.arange(n) / SR * 25)
    put(x * 0.25, t, pan=0.4)

mix = out[: int(DUR * SR)]
peak = np.max(np.abs(mix)); mix = mix / max(peak, 1.0) * 0.9
w = wave.open(sys.argv[3], "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((mix * 32767).astype(np.int16).tobytes()); w.close()
print("peak before norm", peak)
