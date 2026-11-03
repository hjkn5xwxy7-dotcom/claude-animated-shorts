# Voice audition for the horror short: Ben (first person) and "the man" (one whispered line).
# Renders short WAV samples with Piper voices and lists each voice's licence (from its MODEL_CARD).
#   ben_*.wav   Thorsten (high), plain and slightly higher / faster (younger, nervous); emotional whisper if available
#   mann_*.wav  candidates for the man: Thorsten-emotional whisper pitched down, and the lowest male speakers
#               of the multi-speaker MLS German voice (picked automatically by median pitch)
# Post-processing (pitch / reverb) is done by ffmpeg in the workflow.
# usage: python3 scripts/voice_samples.py out/samples
import json, os, sys, urllib.request, wave
from pathlib import Path
import numpy as np
from piper import PiperVoice, SynthesisConfig
from piper.download_voices import download_voice

OUT = Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
MD = Path(__file__).resolve().parent.parent / "models"; MD.mkdir(exist_ok=True)
BEN = "Es ist drei Uhr zwölf. Ich wurde gerade in einem Foto markiert. Das bin ich. Im Bett. Von draußen fotografiert. Hochgeladen vor einer Minute. Von meinem eigenen Account."
MAN = "Hallo, Ben."
HF = "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/{v}/{q}/MODEL_CARD"
report = []

def load(name):
    if not (MD / f"{name}.onnx").exists():
        download_voice(name, MD)
    return PiperVoice.load(str(MD / f"{name}.onnx"))

def card(name):
    _, v, q = name.split("-")
    try:
        txt = urllib.request.urlopen(HF.format(v=v, q=q), timeout=30).read().decode("utf-8", "replace")
        lic = [l.strip() for l in txt.splitlines() if "icen" in l or "CC" in l or "MIT" in l]
        return " | ".join(lic[:4]) or txt[:300]
    except Exception as e:
        return f"(no model card: {e})"

def save(name, voice, text, cfg):
    x = np.concatenate([c.audio_float_array for c in voice.synthesize(text, syn_config=cfg)])
    x = np.concatenate([np.zeros(int(0.25 * voice.config.sample_rate)), x, np.zeros(int(0.6 * voice.config.sample_rate))])
    x = x / max(1e-6, np.abs(x).max()) * 0.89
    with wave.open(str(OUT / f"{name}.wav"), "wb") as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(voice.config.sample_rate)
        f.writeframes((x * 32767).astype("<i2").tobytes())
    return x, voice.config.sample_rate

def f0(x, sr):
    """median pitch (Hz) by autocorrelation over voiced 40 ms frames"""
    n, out = int(0.04 * sr), []
    for i in range(0, len(x) - n, n):
        fr = x[i:i + n] - x[i:i + n].mean()
        if np.sqrt(np.mean(fr ** 2)) < 0.05: continue
        ac = np.correlate(fr, fr, "full")[n - 1:]
        lo, hi = int(sr / 300), int(sr / 60)
        k = lo + int(np.argmax(ac[lo:hi]))
        if ac[k] > 0.3 * ac[0]: out.append(sr / k)
    return float(np.median(out)) if out else 999.0

# Ben
th = load("de_DE-thorsten-high"); report.append(("de_DE-thorsten-high", card("de_DE-thorsten-high")))
save("ben_A_normal", th, BEN, SynthesisConfig(length_scale=1.0))
save("ben_B_jung_nervoes", th, BEN, SynthesisConfig(length_scale=0.9, noise_scale=0.75))

# emotional Thorsten: whisper for Ben (cold open) and for the man
try:
    em = load("de_DE-thorsten_emotional-medium"); report.append(("de_DE-thorsten_emotional-medium", card("de_DE-thorsten_emotional-medium")))
    spk = em.config.speaker_id_map or {}
    report.append(("thorsten_emotional speakers", ", ".join(spk)))
    w = spk.get("whisper")
    if w is not None:
        save("ben_C_fluestern", em, BEN, SynthesisConfig(speaker_id=w, length_scale=1.05))
        save("mann_A_fluestern", em, MAN, SynthesisConfig(speaker_id=w, length_scale=1.5))
except Exception as e:
    report.append(("thorsten_emotional", f"failed: {e}"))

# MLS German: many speakers, keep the three lowest voices for the man
try:
    mls = load("de_DE-mls-medium"); report.append(("de_DE-mls-medium", card("de_DE-mls-medium")))
    spk = mls.config.speaker_id_map or {str(i): i for i in range(mls.config.num_speakers)}
    pitches = []
    for name, sid in list(spk.items())[:400]:
        x = np.concatenate([c.audio_float_array for c in mls.synthesize("Hallo, Ben. Ich bin hier.", syn_config=SynthesisConfig(speaker_id=sid))])
        pitches.append((f0(x, mls.config.sample_rate), name, sid))
    pitches.sort()
    report.append(("mls lowest speakers (Hz)", ", ".join(f"{n}:{p:.0f}" for p, n, _ in pitches[:8])))
    for k, (p, name, sid) in enumerate(pitches[:3]):
        save(f"mann_{'BCD'[k]}_tief_{int(p)}Hz", mls, MAN, SynthesisConfig(speaker_id=sid, length_scale=1.45))
except Exception as e:
    report.append(("mls", f"failed: {e}"))

with open(OUT / "voices.txt", "w", encoding="utf-8") as f:
    for k, v in report: f.write(f"{k}: {v}\n")
print(open(OUT / "voices.txt", encoding="utf-8").read())
