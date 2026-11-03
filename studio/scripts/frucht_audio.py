# Score, sound design and mix of the fruit drama "Die Erdbeere bekam ein Video aus der Zukunft" (from mann_audio.py) (all synthesized; instruments and
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
# drama: dark hook drone + music box, a warm romantic theme for the wedding day, a playful bit for Banane,
# a mystery pulse from the video on, a tense crescendo at midnight, silence before the reveals, big hits at the end
padc(0, end("h3") + 0.6, [26, 33, 38], 0.42, 320)
box(0.4, end("h3"), [74, 69, 70, 65], 0.8, 0.35, 0.65, detune=16.0)
place(music, st(I.timpani(m2f(26), 0.9, R, 3.0)), at("h2"), 1.0)
# wedding day (z1 .. e2): romantic pad + arpeggio (C major), shadow chord on Mango's phone and Kiwi's hands
padc(at("z1"), at("n1"), [48, 55, 60, 64], 0.32, 1100)
t = at("z1")
while t < at("n1") - 0.2:
    for k, m in enumerate([72, 76, 79, 84]): place(music, st(I.vibes(m2f(m), 0.35, R, 1.0)), t + k * 0.18, 0.55)
    t += 0.9
padc(at("n1"), at("b1"), [45, 52, 57, 60], 0.32, 700)
box(at("n2"), at("b1") - 0.1, [69, 68, 69, 65], 0.5, 0.3, 0.5, detune=12.0)
# Banane: bouncy plucks + a boing on "die Hälfte"
t = at("b1")
while t < at("n3") - 0.2:
    place(music, st(I.pluck(m2f(48 if int((t - at("b1")) / 0.25) % 2 else 55), 0.6, R, 0.4, 0.6)), t, 0.6); t += 0.25
x = tt(0.6); boing = fades(np.sin(TAU * np.cumsum(220 + 300 * np.exp(-x / 0.08) * np.cos(TAU * 9 * x)) / SR) * np.exp(-x / 0.25), 0.002, 0.05)
place(music, st(boing), at("b2") + 0.05, 0.6)
# evening / the video: mystery pulse
for a, b, ch in [("n3", "e4", [38, 45, 50]), ("e4", "k2", [37, 44, 49]), ("k2", "n7", [36, 43, 48])]:
    padc(at(a), at(b), ch, 0.36, 450)
    t = at(a) + 0.2
    while t < at(b) - 0.3:
        place(music, st(I.pluck(m2f(ch[0]), 0.55, R, 1.2, 0.25)), t, 0.55); place(music, st(I.pluck(m2f(ch[0] + 1), 0.4, R, 1.0, 0.25)), t + 0.5, 0.4); t += 1.5
box(at("h1b"), end("n4"), [74, 69, 70, 65], 0.8, 0.32, 0.6, detune=16.0)
# midnight: rising tension, faster pulse, then silence before the door
padc(at("n7"), at("n9"), [33, 40, 45, 46], 0.42, 380)
t = at("n7")
while t < at("n8") + 0.4:
    sp = 1.2 - 0.7 * min(1, (t - at("n7")) / (at("n8") - at("n7") + 0.01))
    place(music, st(I.pluck(m2f(33), 0.6, R, 0.6, 0.2)), t, 0.6); t += sp
music[:, ns(end("n8") + 0.2):ns(at("n9") + 0.1)] *= 0
# the twin, Kiwi: low drone, silence after "Was?", big hit at the blackout
padc(at("n9"), end("x1") + 0.5, [25, 32, 37], 0.45, 280)
music[:, ns(end("e7")):ns(at("k3"))] *= 0
te = end("k3") + 0.35
place(music, st(I.timpani(m2f(24), 1.0, R, 4.0)), te, 1.2)
padc(te + 0.2, DUR - 0.2, [36, 43, 48, 51], 0.3, 600)
music = lp(music, 8000)

# ---------------------------------------------------------------- sfx
def bed(t0, t1, fn, gain):
    if t1 > t0 + 0.1:
        n = ns(t1 - t0); xx = fn(n)
        e = np.ones(n); f = min(n // 2, ns(0.5)); e[:f] = np.linspace(0, 1, f); e[-f:] = np.linspace(1, 0, f)
        place(sfx, xx * e, t0, gain)
def roomtone(n):
    return st(lp(colored(n, rng(8), 2.0), 180) * 0.6)
def crowd(n):
    return np.stack([bp(colored(n, rng(30), 0.5), 300, 2400) * (0.7 + 0.3 * smooth_noise(n, rng(31), 0.6)), bp(colored(n, rng(32), 0.5), 300, 2400) * (0.7 + 0.3 * smooth_noise(n, rng(33), 0.6))])
def buzz(d=0.9):
    x = tt(d); g = ((x % 0.45) < 0.32).astype(float)
    return fades(np.sin(TAU * 155 * x) * (1 + 0.4 * np.sin(TAU * 31 * x)) * lp(g, 60) * 0.7, 0.01, 0.05)
def ding():
    return I.glock(m2f(88), 0.5, R, 1.0) + 0.6 * I.glock(m2f(95), 0.4, R, 1.0)
def thud():
    x = tt(0.4); return fades(lp(rng(16).standard_normal(len(x)), 500) * np.exp(-x / 0.05), 0.001, 0.05)
def keydrop():
    x = tt(0.5); y = sum(np.sin(TAU * f * x) * np.exp(-x / d) for f, d in [(2700, 0.08), (3900, 0.05), (5300, 0.03)])
    return fades(y * 0.4, 0.0005, 0.05)
def creak(d=1.6):
    x = tt(d); f = 230 + 70 * np.sin(TAU * 0.9 * x) + 30 * smooth_noise(len(x), rng(23), 3)
    src = np.sign(np.sin(TAU * np.cumsum(f) / SR)) * (0.5 + 0.5 * smooth_noise(len(x), rng(24), 9))
    return fades(bp(src, 400, 2400) * np.sin(np.pi * x / d), 0.01, 0.05)
def steps(t0, t1, rate=1.8, gain=0.2):
    t = t0
    while t < t1:
        x = tt(0.12); place(sfx, st(fades(lp(rng(int(t * 100)).standard_normal(len(x)), 1500) * np.exp(-x / 0.02), 0.001, 0.02)), t, gain); t += 1 / rate
def sob(t0, t1, gain):
    t = t0
    while t < t1:
        x = tt(0.5); f = 420 + 120 * np.sin(np.pi * x / 0.5)
        place(sfx, st(fades(bp(np.sin(TAU * np.cumsum(f) / SR) + 0.3 * colored(len(x), rng(int(t * 10)), 0.0), 300, 1800) * np.sin(np.pi * x / 0.5) ** 2, 0.01, 0.05)), t, gain); t += 1.1
def heart(t0, t1, gain, bpm=90):
    t = t0
    while t < t1:
        for dt, v in [(0, 1.0), (0.17, 0.7)]:
            x = tt(0.35); place(sfx, st(fades(np.sin(TAU * 52 * x) * np.exp(-x / 0.07), 0.002, 0.05)), t + dt, gain * v)
        t += 60 / bpm
def stinger(t0, gain=1.0):
    x = tt(2.4); f = 70 * np.exp(-x / 0.3) + 34
    boom = np.sin(TAU * np.cumsum(f) / SR) * np.exp(-x / 0.6)
    cl = sum(I.glock(m2f(m), 0.35, R, 2.4)[: len(x)] for m in (85, 86, 91))
    place(music, st(fades(boom + 0.5 * cl[: len(boom)], 0.002, 0.3)), t0, gain)
def whoosh(d=0.6):
    n = ns(d); xx = colored(n, rng(9), 0.0); y = np.zeros(n)
    for a in range(0, n, 1024):
        fc = 300 + 3000 * a / n; y[a:a + 1024] = bp(xx[a:a + 1024 + 2048], fc * 0.6, fc * 1.4)[: len(y[a:a + 1024])]
    return fades(y * np.sin(np.pi * np.arange(n) / n) ** 2, 0.01, 0.05)

bed(0, at("z1"), roomtone, 0.3)
sob(0.3, end("h1") + 0.6, 0.12)
stinger(at("h2"), 0.7)
place(sfx, st(whoosh()), at("z1") - 0.3, 0.3)
bed(at("z1"), at("n3"), crowd, 0.06)
place(sfx, st(buzz()), at("n1") + 0.2, 0.45)
steps(at("n1") + 0.6, end("n1"), 2.0, 0.18)
place(sfx, st(thud()), at("b1") + 0.1, 0.3)
bed(at("n3"), at("n7"), roomtone, 0.3)
place(sfx, st(buzz()), c_word := at("n3") + 0.6, 0.45); place(sfx, st(ding()), c_word + 0.2, 0.3)
sob(at("h1b"), end("h1b") + 0.4, 0.12)
for k in range(10): place(sfx, st(whoosh(0.25)), at("n4") + 0.3 * k, 0.08)
stinger(at("e3"), 0.6)
place(sfx, st(keydrop()), at("n6") + 1.2, 0.5)
stinger(at("e5"), 0.5)
bed(at("n7"), DUR, roomtone, 0.35)
steps(at("n7") + 0.4, end("n7"), 1.6, 0.22)
sob(at("n7b"), end("n7b") + 0.6, 0.1)
heart(at("n7b"), at("n9"), 0.5, 80)
place(sfx, st(creak()), at("n8") + 0.4, 0.4)
stinger(at("n9") + 0.1, 1.0)
heart(at("x1"), end("e7"), 0.5, 110)
stinger(at("k3") - 0.1, 1.1)

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
    target = {"erdw": -2.0, "erd2": -1.0, "kiwi_c": -1.0, "mango_v": -1.5}
    ref = None
    for s in T["sentences"]:
        a, b = ns(s["start"]), ns(s["end"])
        seg = voice[:, a:b]
        rms = np.sqrt(np.mean(seg ** 2)) + 1e-9
        ref = ref or rms
        voice[:, a:b] *= (ref / rms) * dbg(target.get(s.get("voice", ""), 0.0))
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
