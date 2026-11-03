# Score, sound design and mix of the horror short "Der Mann unter der Laterne" (all synthesized; instruments and
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
tm = at("man")
# cold open: drone + music box (D minor, a falling motif)
padc(0, end("c6") + 0.3, [26, 33, 38], 0.42, 300)
box(0.6, end("c5"), [74, 69, 70, 65, 74, 69, 67, 62], 0.62, 0.38, 0.75)
# "5 TAGE VORHER": a low swell into the week
place(music, st(I.timpani(m2f(26), 0.7, R, 3.0)), end("c6") + 0.05, 0.9)
# the week: a slow two-note tension pulse (low strings feel) + drone that thickens day by day
days = [("m1", "d1", [38, 45]), ("d1", "w1", [37, 44]), ("w1", "t1", [36, 43, 46]), ("t1", "f1", [35, 42, 46]), ("f1", "p1", [34, 41, 44])]
for a, b, ch in days:
    padc(at(a), at(b), ch, 0.36, 420)
    t = at(a) + 0.3
    while t < at(b) - 0.3:
        place(music, st(I.pluck(m2f(ch[0]), 0.55, R, 1.4, 0.2)), t, 0.6)
        place(music, st(I.pluck(m2f(ch[0] + 1), 0.4, R, 1.2, 0.2)), t + 0.45, 0.45)
        t += 1.6
# deadpan jokes: the score drops out
for i in ["d4"]:
    a, b = at(i) - 0.1, end(i) + 0.6
    music[:, ns(a):ns(b)] *= np.linspace(1, 0, ns(b) - ns(a))[None, :] * 0
# present: drone + music box again, slower and lower; everything dies before the man speaks
padc(at("p1"), end("p5") + 0.25, [25, 32, 37], 0.45, 280)
box(at("p1") + 0.3, end("p4"), [62, 57, 58, 53], 0.95, 0.36, 0.7, detune=24.0)
music[:, ns(end("p5") + 0.25):] *= 0
# final hit after "Hallo, Ben." + low rumble under the end card
te = end("man") + 0.25
place(music, st(I.timpani(m2f(24), 1.0, R, 4.0)), te, 1.2)
padc(te, DUR - 0.2, [24, 31], 0.35, 220, att=0.4)
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
    return st(lp(colored(n, rng(8), 2.0), 180) * 0.6 + 0.08 * np.sin(TAU * 50 * t))
def buzz(d=0.9):
    t = tt(d); g = ((t % 0.45) < 0.32).astype(float)
    return fades(np.sin(TAU * 155 * t) * (1 + 0.4 * np.sin(TAU * 31 * t)) * lp(g, 60) * 0.7, 0.01, 0.05)
def chime():
    return I.glock(m2f(88), 0.5, R, 1.0) + 0.6 * I.glock(m2f(95), 0.4, R, 1.0)
def shutter():
    t = tt(0.18); n = hp(rng(15).standard_normal(len(t)), 1500)
    return fades(n * (np.exp(-t / 0.008) + 0.6 * np.exp(-np.maximum(t - 0.08, 0) / 0.008) * (t > 0.08)), 0.0005, 0.02)
def doorbell():
    return np.concatenate([I.vibes(m2f(76), 0.7, R, 0.8)[: ns(0.55)], I.vibes(m2f(72), 0.7, R, 1.2)])
def riser(d=1.4):
    n = ns(d); t = np.arange(n) / SR; x = colored(n, rng(19), 0.0)
    y = np.zeros(n)
    for a in range(0, n, 2048):
        fc = 300 + 3500 * (a / n) ** 2
        y[a:a + 2048] = bp(x[a:a + 2048 + 4096], fc * 0.7, fc * 1.3)[: len(y[a:a + 2048])]
    return fades(y * (t / d) ** 2, 0.01, 0.03)
def click():
    t = tt(0.04); return fades(hp(rng(21).standard_normal(len(t)), 2500) * np.exp(-t / 0.004), 0.0005, 0.01)
def lock():
    t = tt(0.25); return fades(hp(rng(22).standard_normal(len(t)), 900) * (np.exp(-t / 0.01) + 0.7 * np.exp(-np.maximum(t - 0.11, 0) / 0.012) * (t > 0.11)) + np.sin(TAU * 900 * t) * np.exp(-t / 0.03) * 0.3, 0.0005, 0.02)
def creak(d=1.1):
    t = tt(d); f = 260 + 60 * np.sin(TAU * 1.3 * t) + 40 * smooth_noise(len(t), rng(23), 3)
    src = np.sign(np.sin(TAU * np.cumsum(f) / SR)) * (0.5 + 0.5 * smooth_noise(len(t), rng(24), 9))
    return fades(bp(src, 400, 2600) * np.sin(np.pi * t / d), 0.01, 0.05)
def heart(bpm_from, bpm_to, t0, t1, gain):
    t = t0
    while t < t1:
        k = (t - t0) / max(0.1, t1 - t0); bpm = bpm_from + (bpm_to - bpm_from) * k
        for dt, v in [(0, 1.0), (0.17, 0.7)]:
            x = tt(0.35); thump = np.sin(TAU * 52 * x) * np.exp(-x / 0.07) + lp(rng(25).standard_normal(len(x)), 120) * np.exp(-x / 0.03) * 0.4
            place(sfx, st(fades(thump, 0.002, 0.05)), t + dt, gain * v)
        t += 60 / bpm
def stinger(t0, gain=1.0):
    """reveal hit: low boom + a dissonant high cluster that rings out"""
    x = tt(2.4); f = 70 * np.exp(-x / 0.3) + 34
    boom = np.sin(TAU * np.cumsum(f) / SR) * np.exp(-x / 0.6)
    cl = sum(I.glock(m2f(m), 0.35, R, 2.4)[: len(x)] for m in (85, 86, 91))
    place(music, st(fades(boom + 0.5 * cl[: len(boom)], 0.002, 0.3)), t0, gain)

# beds
bed(0, at("m1"), roomtone, 0.35)
bed(at("m1"), at("m3"), wind, 0.10)
bed(at("m3"), at("f1"), wind, 0.22)
bed(at("f1"), DUR, roomtone, 0.35)
# cold open
place(sfx, st(buzz()), 0.6, 0.5); place(sfx, st(buzz()), 1.6, 0.5)
place(sfx, st(chime()), at("c2") + 0.1, 0.25)
stinger(word("c5", "von") - 0.05, 0.8)
# the week
place(sfx, st(doorbell()), end("m1") - 0.2, 0.3)
for i, w in [("m3", "laternen"), ("d1", "dienstag"), ("w1", "mittwoch"), ("t1", "ich")]:
    place(sfx, st(shutter()), word(i, w) - 0.15, 0.4)
place(sfx, st(riser(1.5)), word("d2", "zoome"), 0.35)
stinger(word("d2", "kein"), 0.9)
stinger(at("w2"), 0.9)
for k in range(9): place(sfx, st(click()), word("w3", "kommentar") + 0.06 * k, 0.25)
for k in range(11): place(sfx, st(click()), word("w3", "passwort") + 0.055 * k, 0.25)
place(sfx, st(riser(1.0)), word("t2", "in") - 1.0, 0.25)
stinger(at("t3") + 0.1, 0.9)
stinger(at("t4"), 1.1)
place(sfx, st(lock()), word("f1", "tür") + 0.2, 0.5); place(sfx, st(lock()), word("f1", "tür") + 0.65, 0.5)
place(sfx, st(creak()), word("f1", "fenster") + 0.1, 0.25)
# present
place(sfx, st(buzz()), at("p1") + 0.1, 0.45)
heart(64, 118, at("p3"), end("p5") + 0.2, 0.55)
place(sfx, st(creak(1.6)), at("p4") - 0.3, 0.12)
stinger(at("p4") + 0.05, 0.8)
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
