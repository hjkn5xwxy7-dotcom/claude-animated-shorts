# Score, sound design and mix of the true-crime short "Ich hieß Ted" (part 1), adapted from mann_audio.py (all synthesized; instruments and
# dsp from templates/audio). Every cue is placed from timing.json (sentence / word starts).
#   score: low drone pad + a detuned music-box motif (cold open / present), tension pulse during the week,
#          dead silence for the deadpan jokes and before "Hallo, Ben.", stingers on every reveal
#   sfx:   phone buzz + chime, doorbell, camera shutter, zoom riser, typing, door lock x2, window creak,
#          heartbeat (accelerating), wind / room tone beds, final hit + sub rumble on the blackout
#   mix:   each voice line levelled (whispers a bit under the normal voice), score ducked under speech,
#          master -14 LUFS, true peak <= -1 dBTP, 48 kHz stereo
# usage: python3 scripts/mann_audio.py public/mann [--novoice]
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
R = rng(9)

def padc(t0, t1, chord, vel=0.35, warm=600, gain=1.0, att=1.2):
    if t1 > t0 + 0.2:
        place(music, I.pad([m2f(m) for m in chord], t1 - t0, vel, R, att=att, rel=1.2, warm=warm), t0, gain)

def box(t0, t1, notes, step, vel=0.4, gain=0.8, detune=14.0):
    """detuned music box: two tines a few cents apart, slightly uneven timing"""
    t, k = t0, 0
    while t < t1:
        f = m2f(notes[k % len(notes)])
        place(music, pan(I.musicbox(f, vel, R, 2.0) + 0.7 * I.musicbox(f * 2 ** (detune / 1200), vel * 0.8, R, 2.0), 0.25), t + 0.01 * np.sin(k * 1.7), gain)
        t += step; k += 1

# ---------------------------------------------------------------- score
# cold, sparse: a low drone, a slow minor pluck figure (like a muted piano), silence on the darkest lines
padc(0, end("c3") + 1.0, [26, 33, 38], 0.4, 300)
box(0.8, end("c2"), [62, 65, 69, 65], 1.3, 0.3, 0.6, detune=6.0)
place(music, st(I.timpani(m2f(26), 0.8, R, 3.0)), word("c3", "dreißig"), 1.0)
# childhood: thin music box, nostalgic but off
box(at("k1") + 0.3, at("s1") - 0.3, [67, 71, 74, 71, 69, 72], 0.7, 0.32, 0.55, detune=18.0)
padc(at("k1"), at("s1"), [43, 50, 55], 0.25, 700)
# Seattle night / the method: tension pulse, thicker every chapter
chap = [("s1", "v4", [37, 44]), ("v4", "l1", [36, 43]), ("l1", "u1", [38, 45, 50]), ("u1", "a1", [35, 42, 47]), ("a1", "a4", [34, 41, 46]), ("a4", None, [33, 40, 45])]
for a, b, ch in chap:
    t1 = at(b) if b else DUR - 0.3
    padc(at(a), t1, ch, 0.36, 420)
    t = at(a) + 0.3
    while t < t1 - 0.3:
        place(music, st(I.pluck(m2f(ch[0]), 0.55, R, 1.4, 0.2)), t, 0.55)
        place(music, st(I.pluck(m2f(ch[0] + 1), 0.4, R, 1.2, 0.2)), t + 0.55, 0.4)
        t += 1.7
# lake: a brief warm, deceptive major colour before the darkness returns
box(at("l1") + 0.2, at("l2") + 2.0, [72, 76, 79, 76], 0.5, 0.3, 0.5, detune=4.0)
# silence on the darkest lines (v5 "vergangen / erwürgt", the name cards)
for a, b in [(at("v5") - 0.2, end("v5") + 1.0), (end("s2"), end("s2") + 1.6)]:
    music[:, ns(a):ns(b)] *= 0.15
music = lp(music, 7000)

# ---------------------------------------------------------------- sfx
def bed(t0, t1, fn, gain):
    if t1 > t0 + 0.1:
        n = ns(t1 - t0); x = fn(n)
        e = np.ones(n); f = min(n // 2, ns(0.5)); e[:f] = np.linspace(0, 1, f); e[-f:] = np.linspace(1, 0, f)
        place(sfx, x * e, t0, gain)
def wind(n):
    return pan(bp(colored(n, rng(6), 1.0), 200, 900) * (0.6 + 0.4 * smooth_noise(n, rng(7), 0.25)), -0.2)
def roomtone(n):
    t = np.arange(n) / SR
    return st(lp(colored(n, rng(8), 2.0), 180) * 0.6 + 0.06 * np.sin(TAU * 60 * t))
def crowd(n):
    """beach crowd: band-passed noise murmur with slow swells + a few kids' calls"""
    x = bp(colored(n, rng(30), 0.5), 300, 2400) * (0.7 + 0.3 * smooth_noise(n, rng(31), 0.6))
    return np.stack([x, bp(colored(n, rng(32), 0.5), 300, 2400) * (0.7 + 0.3 * smooth_noise(n, rng(33), 0.6))])
def water(n):
    return st(lp(colored(n, rng(34), 1.0), 700) * (0.6 + 0.4 * np.sin(TAU * 0.15 * np.arange(n) / SR) ** 2))
def crickets(n):
    t = np.arange(n) / SR; x = np.zeros(n)
    for f0, rate, ph in [(4300, 2.1, 0.0), (4700, 2.6, 1.3)]:
        x += np.sin(TAU * f0 * t) * lp(((np.sin(TAU * 32 * t) > 0.2) * (np.sin(TAU * rate * t + ph) > 0.6)).astype(float), 300)
    return pan(x * 0.25, 0.3)
def thud():
    x = tt(0.5); return fades(lp(rng(16).standard_normal(len(x)), 400) * np.exp(-x / 0.05) + np.sin(TAU * 60 * x) * np.exp(-x / 0.1), 0.001, 0.05)
def cuffs():
    x = tt(0.35); y = sum(np.sin(TAU * f * x) * np.exp(-x / d) for f, d in [(2300, 0.05), (3400, 0.03), (5200, 0.02)])
    return fades(y * 0.5 + hp(rng(17).standard_normal(len(x)), 3000) * np.exp(-x / 0.006), 0.0005, 0.03)
def door_creak(d=1.2):
    x = tt(d); f = 230 + 70 * np.sin(TAU * 0.9 * x) + 30 * smooth_noise(len(x), rng(23), 3)
    src = np.sign(np.sin(TAU * np.cumsum(f) / SR)) * (0.5 + 0.5 * smooth_noise(len(x), rng(24), 9))
    return fades(bp(src, 400, 2400) * np.sin(np.pi * x / d), 0.01, 0.05)
def car_door():
    x = tt(0.6); return fades(lp(rng(26).standard_normal(len(x)), 900) * np.exp(-x / 0.04) + np.sin(TAU * 85 * x) * np.exp(-x / 0.12) * 0.8, 0.001, 0.05)
def engine(d):
    x = tt(d); f = 32 + 6 * np.sin(TAU * 0.3 * x)
    return fades(lp(np.sign(np.sin(TAU * np.cumsum(f) / SR)) * 0.4 + 0.3 * colored(len(x), rng(27), 1.0), 300), 0.3, 0.6)
def siren_chirp():
    x = tt(0.9); f = 700 + 500 * np.sin(np.pi * np.minimum(x / 0.9, 1))
    return fades(np.sin(TAU * np.cumsum(f) / SR) * 0.6, 0.01, 0.1)
def glass():
    x = tt(1.4); y = sum(np.sin(TAU * f * x + k) * np.exp(-x / (0.15 + 0.05 * k)) for k, f in enumerate([2800, 3700, 4900, 6100, 7300]))
    return fades(y * 0.25 + hp(rng(28).standard_normal(len(x)), 2500) * np.exp(-x / 0.08) * 0.8, 0.0005, 0.1)
def steps(t0, t1, rate=1.8, gain=0.2):
    t = t0
    while t < t1:
        x = tt(0.12); place(sfx, st(fades(lp(rng(int(t * 100)).standard_normal(len(x)), 1500) * np.exp(-x / 0.02), 0.001, 0.02)), t, gain); t += 1 / rate
def stinger(t0, gain=1.0):
    x = tt(2.4); f = 70 * np.exp(-x / 0.3) + 34
    boom = np.sin(TAU * np.cumsum(f) / SR) * np.exp(-x / 0.6)
    cl = sum(I.glock(m2f(m), 0.35, R, 2.4)[: len(x)] for m in (85, 86, 91))
    place(music, st(fades(boom + 0.5 * cl[: len(boom)], 0.002, 0.3)), t0, gain)

bed(0, at("k1"), roomtone, 0.3)
bed(at("k1"), at("s1"), lambda n: crickets(n), 0.2)
bed(at("s1"), at("v1"), lambda n: wind(n) + crickets(n), 0.25)
steps(at("s1") + 1.0, end("s1"), 1.6, 0.18)
place(sfx, st(door_creak()), word("s1", "eine") - 0.2, 0.35)
bed(at("v1"), at("v4"), crowd, 0.08)
place(sfx, st(car_door()), end("v2") - 0.3, 0.3)
place(sfx, st(thud()), word("v4", "ich") + 0.02, 0.8)
place(sfx, st(cuffs()), word("v4", "handschellen"), 0.5)
bed(at("v5"), at("l1"), wind, 0.3)
place(sfx, st(engine(3.5)), at("v5") + 0.2, 0.12)
bed(at("l1"), at("l5"), crowd, 0.18); bed(at("l1"), at("l5"), water, 0.15)
bed(at("l5"), at("u1"), wind, 0.3)
bed(at("u1"), at("a4"), lambda n: wind(n) * 0.6, 0.25)
place(sfx, st(cuffs()), at("u3") + 0.4, 0.5)
place(sfx, st(car_door()), at("u4") + 0.1, 0.4)
steps(at("u4") + 0.3, end("u4"), 4.5, 0.28)
stinger(end("u4") + 0.1, 0.6)
steps(at("u5") + 0.2, end("u5"), 1.6, 0.16)
place(sfx, st(siren_chirp()), at("a1") + 0.1, 0.35)
place(sfx, st(engine(4.0)), at("a1"), 0.1)
for w in ["brechstange", "handschellen", "eispickel"]: place(sfx, st(thud()), word("a2", w), 0.25)
stinger(at("a3") + 0.2, 0.7)
place(sfx, st(glass()), word("a4", "sprang") + 0.15, 0.6)
stinger(end("a4") + 0.15, 1.1)

# reverb sends
ir = make_ir(2.2, 41, hf=1.6)
music = music + 0.3 * convolve_st(music, ir)
sfx = sfx + 0.1 * convolve_st(sfx, ir)

# ---------------------------------------------------------------- voice + mix
if NOVOICE:
    voice = np.zeros((2, N)); vI = -20.0
else:
    v, vsr = read_wav(os.path.join(D, "voice.wav"))
    v = st(v)
    if vsr != SR:
        g = np.gcd(SR, vsr); v = signal.resample_poly(v, SR // g, vsr // g, axis=-1)
    voice = np.zeros((2, N)); voice[:, : min(N, v.shape[1])] = v[:, :N]
    voice = hp(voice, 70)
    # level every line: whispers 3 dB under the normal voice, the man 1 dB over the whispers
    target = {"ben": 0.0, "benw": -3.0, "man": -2.0}
    ref = None
    for s in T["sentences"]:
        a, b = ns(s["start"]), ns(s["end"])
        seg = voice[:, a:b]
        rms = np.sqrt(np.mean(seg ** 2)) + 1e-9
        ref = ref or rms
        voice[:, a:b] *= (ref / rms) * dbg(target.get(s.get("voice", "ben"), 0.0))
    vI = integrated(voice)

key = np.zeros(N)
for s in T["sentences"]:
    for w in s["words"]:
        key[ns(w["start"]): ns(w["end"] + 0.08)] = 1
k2 = signal.lfilter([1 - np.exp(-1 / (0.08 * SR))], [1, -np.exp(-1 / (0.08 * SR))], key)
rel = np.exp(-1 / (0.4 * SR))
for i in range(1, N): k2[i] = max(k2[i], k2[i - 1] * rel)
duck = dbg(-6.0 * np.clip(k2, 0, 1))
music *= dbg((vI - 11.0) - integrated(music))
sfx *= dbg((vI - 10.0) - integrated(sfx))
music *= duck[None, :]
y = voice + music + sfx
y *= dbg(-14.0 - integrated(y))

def limit(x, ceil_db=-1.5):
    from scipy.ndimage import minimum_filter1d
    lim = 10 ** (ceil_db / 20)
    env = np.max(np.abs(x), axis=0)
    g = minimum_filter1d(np.minimum(1.0, lim / (env + 1e-9)), ns(0.006))
    g = np.minimum(g, np.roll(g, -ns(0.003)))
    r = np.exp(-1 / (0.08 * SR)); out = np.copy(g)
    for i in range(1, len(g)): out[i] = min(g[i], 1 - (1 - out[i - 1]) * r)
    return x * out[None, :]
for _ in range(3):
    y = limit(y)
    y *= dbg(-14.0 - integrated(y))
y = limit(y, -2.4)
write_wav(os.path.join(D, "mix.wav"), y)
print(f"[audio] {DUR:.2f} s, mix {integrated(y):.1f} LUFS, peak {true_peak(y):.1f} dBTP, voice {vI:.1f} LUFS")
