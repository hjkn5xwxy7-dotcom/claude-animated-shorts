# Score, sound effects and final mix of the moon short, all synthesized (instruments / dsp from templates/audio).
# Every cue is placed from timing.json (sentence and word starts), so a new voice take re-times the sound.
#   music: music box mystery (night) -> pluck + pad (dark) -> bright vibes (harbour) -> wide pad + glock (space) ->
#          tremolo vibes (reef) -> low drone + timpani (ominous) -> pulse (wobble) -> heat / ice -> sad tuba -> reprise
#   sfx:   sea + crickets at night, pop + "plopp" sparkle, whooshes into space / reef, gulls + waves, bubbles,
#          clock tick, wind for the ice winter, sad trombone, a tired werewolf howl
#   mix:   voice as is; music ducked under speech; master to -14 LUFS, true peak <= -1 dBTP; 48 kHz stereo
# usage: python3 scripts/mond_audio.py public/mond   (needs voice.wav + timing.json there; --novoice for a test)
import json, os, sys
import numpy as np
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "templates", "audio"))
from dsp import SR, TAU, ns, tt, rng, lp, hp, bp, colored, smooth_noise, fades, pan, st, place, make_ir, convolve_st, integrated, true_peak, dbg, read_wav, write_wav  # noqa: E402
import instruments as I  # noqa: E402

D = sys.argv[1]
NOVOICE = "--novoice" in sys.argv
T = json.load(open(os.path.join(D, "timing.json"), encoding="utf-8"))
S = {s["id"]: s for s in T["sentences"]}
DUR = T["total"] + 1.2
N = ns(DUR)
at = lambda i: S[i]["start"]
end = lambda i: S[i]["end"]
def word(i, txt):
    for w in S[i]["words"]:
        if w["w"].lower().strip(".,!?:").startswith(txt):
            return w["start"]
    return at(i)

music = np.zeros((2, N)); sfx = np.zeros((2, N))
m2f = I.m2f
R = rng(5)

# ---------------------------------------------------------------- music
def arp(t0, t1, notes, step, inst, vel=0.5, gain=1.0, p=0.0):
    t, k = t0, 0
    while t < t1:
        place(music, pan(inst(m2f(notes[k % len(notes)]), vel, R), p), t, gain)
        t += step; k += 1

def padc(t0, t1, chord, vel=0.35, warm=900, gain=1.0):
    if t1 > t0 + 0.2:
        place(music, I.pad([m2f(m) for m in chord], t1 - t0, vel, R, att=0.5, rel=0.8, warm=warm), t0, gain)

B = 60 / 92  # beat (s)
# A: night mystery (hook .. plopp): music box Am arpeggio over a soft pad; stops dead on "plopp"
tp = word("plopp", "plopp")
arp(0.0, tp - 0.05, [69, 72, 76, 79, 76, 72, 74, 77], B / 2, lambda f, v, r: I.musicbox(f, v, r, 1.4), 0.5, 0.9, 0.2)
padc(0.0, tp, [45, 52, 57, 60], 0.3, 700)
# B: quiet / dark (nichts .. hundert): sparse low plucks + dark pad
arp(at("nichts") + 0.3, at("hafen") - 0.2, [45, 52, 48, 52], B, lambda f, v, r: I.pluck(f, v, r, 1.2, 0.3), 0.45, 0.8)
padc(at("dunkel"), at("hafen") - 0.1, [33, 40, 45, 48], 0.32, 500)
# C: harbour morning (hafen .. ebbe): bright vibes in C, light pluck bass
arp(at("hafen"), at("gezeiten") - 0.1, [72, 76, 79, 84, 79, 76], B / 2, lambda f, v, r: I.vibes(f, v, r, 1.0), 0.45, 0.8, -0.2)
arp(at("hafen"), at("gezeiten") - 0.1, [48, 55, 53, 55], B, lambda f, v, r: I.pluck(f, v, r, 0.8, 0.6), 0.5, 0.7)
# D: space (gezeiten): wide pad + glock sparkles
padc(at("gezeiten"), at("korallen"), [41, 48, 53, 57, 64], 0.36, 1200)
arp(at("gezeiten") + 0.4, at("korallen") - 0.3, [84, 88, 91, 86], B, lambda f, v, r: I.glock(f, v, r, 1.6), 0.3, 0.6, 0.4)
# E: reef (korallen .. warten): tremolo vibes, bubbly plucks
arp(at("korallen"), at("unheim") - 0.1, [69, 73, 76, 81, 76, 73], B / 2, lambda f, v, r: I.vibes(f, v, r, 1.4, trem=6.5, trem_depth=0.5), 0.4, 0.8, 0.2)
arp(at("korallen") + B / 4, at("warten"), [81, 88, 86, 93], B, lambda f, v, r: I.pluck(f, v, r, 0.3, 0.8), 0.25, 0.5, -0.4)
# F: ominous (unheim): low drone + timpani hit on the start
padc(at("unheim"), at("kreisel") + 0.4, [28, 35, 40], 0.45, 350)
place(music, st(I.timpani(m2f(40), 0.8, R, 2.5)), at("unheim"), 1.0)
# G: space wobble (kreisel .. taumeln): pulsing timpani + pad, glock motif rising
padc(at("kreisel"), at("jahresz"), [38, 45, 50, 53, 57], 0.38, 1000)
t = at("kreisel")
while t < at("jahresz") - 0.2:
    place(music, st(I.timpani(m2f(38), 0.35 + 0.3 * (t > at("taumeln")), R, 1.0)), t, 0.8); t += B
arp(at("taumeln"), at("jahresz") - 0.2, [74, 77, 81, 86, 89], B / 2, lambda f, v, r: I.glock(f, v, r, 1.2), 0.3, 0.6)
# H: seasons: hot = lazy vibes, ice = high thin music box
te = word("jahresz", "eisige")
arp(at("jahresz"), te - 0.05, [67, 71, 74, 71], B * 0.75, lambda f, v, r: I.vibes(f, v, r, 1.2, trem=3.0, trem_depth=0.4), 0.4, 0.8)
arp(te, at("finster") - 0.05, [88, 91, 95, 91], B / 3, lambda f, v, r: I.musicbox(f, v, r, 0.9), 0.35, 0.7)
# I: eclipse letdown: sad tuba "wah wah wah wahhh" on "nie wieder"
tn = word("finster", "nie")
for k, (m, d) in enumerate([(55, 0.32), (54, 0.32), (53, 0.32), (52, 1.1)]):
    place(music, st(I.brass(m2f(m - 12), d, 0.75, R, "soft", scoop=-30, fall=-0.6 if k == 3 else 0.0)), tn + k * 0.36, 0.9)
# J: reprise (himmel .. end): music box theme again, final button on the last word
arp(at("himmel"), at("werwolf") + 0.1, [69, 72, 76, 79, 76, 72], B / 2, lambda f, v, r: I.musicbox(f, v, r, 1.4), 0.45, 0.8, 0.2)
padc(at("himmel"), DUR - 0.3, [45, 52, 57, 60], 0.28, 700)
tl = S["werwolf"]["words"][-1]["start"]
place(music, st(I.pluck(m2f(45), 0.8, R, 1.0, 0.7) + I.pluck(m2f(57), 0.7, R, 1.0, 0.7)), tl + 0.55, 1.0)
place(music, st(I.triangle(0.6, R, 1.4)), tl + 0.55, 0.8)
music = lp(music, 9000)

# ---------------------------------------------------------------- sfx
def bed(t0, t1, x_fn, gain):
    if t1 > t0 + 0.1:
        n = ns(t1 - t0); x = x_fn(n)
        e = np.ones(n); f = min(n // 2, ns(0.4)); e[:f] = np.linspace(0, 1, f); e[-f:] = np.linspace(1, 0, f)
        place(sfx, x * e, t0, gain)

def sea(n):  # slow waves: low-passed noise with a swell envelope
    x = lp(colored(n, rng(1), 1.0), 900) * (0.55 + 0.45 * np.sin(TAU * 0.13 * np.arange(n) / SR) ** 2)
    return np.stack([x, lp(colored(n, rng(2), 1.0), 900) * (0.55 + 0.45 * np.cos(TAU * 0.11 * np.arange(n) / SR) ** 2)])

def crickets(n):
    t = np.arange(n) / SR; x = np.zeros(n)
    for f0, rate, ph in [(4300, 2.1, 0.0), (4700, 2.6, 1.3), (3900, 1.8, 2.1)]:
        chirp = (np.sin(TAU * 32 * t) > 0.2) * (np.sin(TAU * rate * t + ph) > 0.6)
        x += np.sin(TAU * f0 * t) * lp(chirp.astype(float), 300)
    return pan(x * 0.3, 0.3)

def underwater(n):
    x = lp(colored(n, rng(3), 2.0), 300)
    return np.stack([x, lp(colored(n, rng(4), 2.0), 300)])

def wind(n):
    t = np.arange(n) / SR
    x = bp(colored(n, rng(6), 0.0), 400, 1600) * (0.5 + 0.5 * smooth_noise(n, rng(7), 0.4))
    return pan(x, -0.2)

def pop():
    t = tt(0.35); f = 900 * np.exp(-t / 0.05) + 180
    return fades(np.sin(TAU * np.cumsum(f) / SR) * np.exp(-t / 0.08) + hp(rng(8).standard_normal(len(t)), 2000) * np.exp(-t / 0.004) * 0.4, 0.0005, 0.05)

def sparkle():
    out = np.zeros(ns(1.2))
    for k in range(8):
        g = I.glock(m2f(96 + k % 4 * 3), 0.4, R, 0.6); i = ns(0.06 * k); out[i:i + len(g)] += g[: len(out) - i]
    return out

def whoosh(d=0.7, up=True):
    n = ns(d); t = np.arange(n) / SR; x = colored(n, rng(9), 0.0)
    fc = np.linspace(300, 3000, n) if up else np.linspace(3000, 300, n)
    y = np.zeros(n)
    for a in range(0, n, 1024):
        y[a:a + 1024] = bp(x[a:a + 1024 + 2048], max(100, fc[a] * 0.6), fc[a] * 1.4)[: len(y[a:a + 1024])]
    return fades(y * np.sin(np.pi * t / d) ** 2, 0.01, 0.05)

def gull():
    t = tt(0.5); f = 1800 + 700 * np.sin(np.pi * t / 0.5)
    return fades(np.sin(TAU * np.cumsum(f) / SR) * np.exp(-((t - 0.2) / 0.15) ** 2) * (1 + 0.4 * np.sin(TAU * 32 * t)), 0.005, 0.05)

def bubble(f0):
    t = tt(0.12); f = f0 * (1 + 3 * t)
    return fades(np.sin(TAU * np.cumsum(f) / SR) * np.exp(-t / 0.03), 0.001, 0.02)

def tick(hi):
    return I.pluck(2600 if hi else 2000, 0.6, R, 0.08, 1.0)

def howl():
    t = tt(2.2); f = 330 + 160 * np.sin(np.pi * np.minimum(t / 1.6, 1)) - 80 * np.maximum(0, t - 1.6)
    v = 1 + 0.02 * np.sin(TAU * 5.5 * t)
    src = sum(np.sin(TAU * k * np.cumsum(f * v) / SR) / k for k in range(1, 8))
    y = bp(src, 300, 1800) * np.minimum(1, t / 0.3) * np.clip((2.2 - t) / 0.5, 0, 1)
    return fades(y, 0.01, 0.1)

night = [("hook", "plopp"), ("weg", "hafen"), ("unheim", "kreisel"), ("himmel", None)]
for a, b in night:
    t0, t1 = at(a), (at(b) if b else DUR)
    bed(t0, t1, sea, 0.10); bed(t0, t1, crickets, 0.03 if a != "unheim" else 0.0)
bed(at("plopp"), at("weg"), sea, 0.08)
bed(at("hafen"), at("gezeiten"), sea, 0.13)
for k in range(3): place(sfx, pan(gull(), -0.5 + 0.5 * k), at("hafen") + 0.4 + 1.3 * k, 0.12)
place(sfx, st(pop()), tp, 0.55); place(sfx, pan(sparkle(), 0.2), tp + 0.05, 0.25)
for i in ["gezeiten", "kreisel"]: place(sfx, st(whoosh(0.8, True)), at(i) - 0.35, 0.25)
place(sfx, st(whoosh(0.9, False)), at("korallen") - 0.4, 0.25)
bed(at("korallen"), at("unheim"), underwater, 0.35)
for k in range(14): place(sfx, pan(bubble(500 + 90 * (k % 5)), (k % 3 - 1) * 0.5), at("korallen") + 0.3 + 0.45 * k, 0.12)
t = at("warten")
while t < at("unheim") - 0.2: place(sfx, st(tick(int((t - at("warten")) / 0.5) % 2 == 0)), t, 0.35); t += 0.5
place(sfx, st(whoosh(0.7, True)), at("jahresz") - 0.3, 0.2)
bed(word("jahresz", "eisige"), at("finster"), wind, 0.3)
for q in ["hafen"]:
    tq = word(q, "kratzen"); place(sfx, st(I.pluck(m2f(84), 0.5, R, 0.25, 0.9)), tq, 0.2); place(sfx, st(I.pluck(m2f(88), 0.5, R, 0.25, 0.9)), tq + 0.12, 0.2)
place(sfx, st(howl()), S["werwolf"]["words"][-1]["end"] + 0.05, 0.22)

# reverb sends
ir = make_ir(1.4, 31, hf=1.4)
music = music + 0.22 * convolve_st(music, ir)
sfx = sfx + 0.12 * convolve_st(sfx, ir)

# ---------------------------------------------------------------- mix
if NOVOICE:
    voice = np.zeros((2, N))
else:
    v, vsr = read_wav(os.path.join(D, "voice.wav"))
    v = st(v)
    if vsr != SR:
        g = np.gcd(SR, vsr); v = signal.resample_poly(v, SR // g, vsr // g, axis=-1)
    voice = np.zeros((2, N)); voice[:, : min(N, v.shape[1])] = v[:, :N]
    voice = hp(voice, 80) * 1.0

# duck the music under speech (key = word times), -7 dB with 60 ms attack / 300 ms release
key = np.zeros(N)
for s in T["sentences"]:
    for w in s["words"]:
        key[ns(w["start"]): ns(w["end"] + 0.08)] = 1
key = signal.lfilter([1 - np.exp(-1 / (0.06 * SR))], [1, -np.exp(-1 / (0.06 * SR))], key)
rel = np.exp(-1 / (0.3 * SR)); k2 = np.copy(key)
for i in range(1, N): k2[i] = max(key[i], k2[i - 1] * rel)
duck = dbg(-7.0 * np.clip(k2, 0, 1))
vI = integrated(voice) if not NOVOICE else -20.0
mI, sI = integrated(music), integrated(sfx)
music *= dbg((vI - 12.0) - mI)   # music sits ~12 LU under the voice (before ducking)
sfx *= dbg((vI - 13.0) - sI)
music *= duck[None, :]
y = voice + music + sfx
y *= dbg(-14.0 - integrated(y))
def limit(x, ceil_db=-1.5):
    """look-ahead peak limiter: gain = min(1, ceiling / peak) over a 6 ms window, 80 ms release"""
    from scipy.ndimage import minimum_filter1d
    lim = 10 ** (ceil_db / 20)
    env = np.max(np.abs(x), axis=0)
    g = minimum_filter1d(np.minimum(1.0, lim / (env + 1e-9)), ns(0.006))
    g = np.minimum(g, np.roll(g, -ns(0.003)))
    rel = np.exp(-1 / (0.08 * SR))
    out = np.copy(g)
    for i in range(1, len(g)):
        out[i] = min(g[i], 1 - (1 - out[i - 1]) * rel)
    return x * out[None, :]
for _ in range(3):
    y = limit(y)
    y *= dbg(-14.0 - integrated(y))
y = limit(y, -1.2)
write_wav(os.path.join(D, "mix.wav"), y)
print(f"[audio] {DUR:.2f} s, mix {integrated(y):.1f} LUFS, peak {true_peak(y):.1f} dBTP, voice {vI:.1f} LUFS")
