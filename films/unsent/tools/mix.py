"""Sound effects + final mix. Effects are filtered noise and low thumps tied to on-screen actions."""
import json, sys, wave
import numpy as np

SR = 48000
DUR = 246.0
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

score = load(sys.argv[1])
put(score[: len(out)], 0, 3.0)

ev = json.load(open(sys.argv[2]))
for t, kind in ev["taps"]:
    v = rng.uniform(-1, 1)
    put(key_tap(v), t + 1 / 30, 0.22 if kind == "key" else 0.16, pan=0.25)

# room tones (bedroom at night, kitchen)
roomtone(7.0, 45.0, 0.05); roomtone(58.5, 106.0, 0.05); roomtone(106.0, 216.0, 0.045); roomtone(216.0, 232.0, 0.04, 0.08)
# flashback: door slam
put(thump(55, 0.9, 0.6), 53.2 + 1 / 30, 0.55)
put(thump(90, 0.25, 0.4), 53.25, 0.4)
# pride appears: low air swell; whispers
put(whoosh(2.2, 0.01, 0.08), 31.4, 0.2, pan=-0.4)
for t in [32.6, 37.3, 73.4, 94.4, 121.6]:
    put(breath(1.8), t, 0.35, pan=-0.5)
for t, pan in [(153.0, -0.6), (154.2, 0.5), (155.3, 0.7), (156.2, -0.7), (157.0, 0.0), (158.0, 0.4), (158.8, -0.4), (159.4, 0.6), (160.2, 0.0)]:
    put(breath(1.6), t, 0.45, pan=pan)
# heartbeat in the silence before SEND
t = 166.4
while t < 171.2:
    put(thump(48, 0.35, 0.1), t, 0.55); put(thump(44, 0.35, 0.1), t + 0.28, 0.38)
    t += 0.86
# send whoosh, pride breaking
put(whoosh(0.6, 0.03, 0.5), 171.45, 0.18, pan=0.2)
put(crackle(2.8), 172.7, 0.5)
put(whoosh(1.4, 0.01, 0.15), 172.6, 0.3)
# incoming messages and the call
for t in [190.5, 199.8, 202.8]:
    put(pop(), t + 1 / 30, 0.5, pan=-0.15)
for k in range(4):
    put(buzz(0.45), 205.45 + k * 0.9, 0.35)
# split-screen opening and cuts into the dream of sunday
put(whoosh(0.9, 0.02, 0.2), 130.7, 0.14)

mix = out[: int(DUR * SR)]
peak = np.max(np.abs(mix)); mix = mix / max(peak, 1.0) * 0.9
w = wave.open(sys.argv[3], "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((mix * 32767).astype(np.int16).tobytes()); w.close()
print("peak before norm", peak)
