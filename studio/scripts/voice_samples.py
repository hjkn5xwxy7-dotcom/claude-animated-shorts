# Voice audition: one line per character with the candidate Piper voices, plus each model's licence line.
# usage: python3 scripts/voice_samples.py out/raw
import sys, urllib.request, wave
from pathlib import Path
import numpy as np
from piper import PiperVoice, SynthesisConfig
from piper.download_voices import download_voice

OUT = Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
MD = Path(__file__).resolve().parent.parent / "models"; MD.mkdir(exist_ok=True)
HF = "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/{v}/{q}/MODEL_CARD"
report = []
loaded = {}

def load(name):
    if name not in loaded:
        if not (MD / f"{name}.onnx").exists():
            download_voice(name, MD)
        loaded[name] = PiperVoice.load(str(MD / f"{name}.onnx"))
        _, v, q = name.split("-")
        try:
            txt = urllib.request.urlopen(HF.format(v=v, q=q), timeout=30).read().decode("utf-8", "replace")
            lic = [l.strip() for l in txt.splitlines() if "icen" in l or "CC" in l or "MIT" in l]
            report.append((name, " | ".join(lic[:3]) or txt[:200]))
        except Exception as e:
            report.append((name, f"(no model card: {e})"))
    return loaded[name]

def save(name, model, text, speaker=None, length=1.0, pitch=0.0):
    v = load(model)
    sid = (v.config.speaker_id_map or {}).get(speaker) if speaker else None
    x = np.concatenate([c.audio_float_array for c in v.synthesize(text, syn_config=SynthesisConfig(speaker_id=sid, length_scale=length))])
    k = 2 ** (pitch / 12)
    if k != 1:
        n = int(round(len(x) / k)); x = np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x)
    x = np.concatenate([np.zeros(int(0.2 * v.config.sample_rate)), x, np.zeros(int(0.4 * v.config.sample_rate))])
    x = x / max(1e-6, np.abs(x).max()) * 0.89
    with wave.open(str(OUT / f"{name}.wav"), "wb") as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(v.config.sample_rate)
        f.writeframes((x * 32767).astype("<i2").tobytes())

E = "Morgen heirate ich! Ich kann es immer noch nicht glauben!"
K = "Mach dir keine Sorgen, Süße. Morgen ist dein Tag."
M = "Du wirst die schönste Braut der Welt. Nur ein Lagerraum. Warum fragst du?"
B = "Leute! Ich hab die Torte probiert. Also, nur ein bisschen."
for model in ["de_DE-kerstin-low", "de_DE-ramona-low", "de_DE-eva_k-x_low"]:
    try:
        save(f"erdbeere_{model.split('-')[1]}", model, E)
        save(f"kiwi_{model.split('-')[1]}", model, K, length=1.05)
    except Exception as e:
        report.append((model, f"failed: {e}"))
save("mango_thorsten_neutral", "de_DE-thorsten_emotional-medium", M, speaker="neutral", pitch=-1.5)
save("mango_thorsten_high", "de_DE-thorsten-high", M, length=0.95, pitch=-2.5)
save("banane_amused", "de_DE-thorsten_emotional-medium", B, speaker="amused", length=0.9, pitch=1.0)
save("banane_surprised", "de_DE-thorsten_emotional-medium", B, speaker="surprised", length=0.92, pitch=1.0)
with open(OUT / "voices.txt", "w", encoding="utf-8") as f:
    for k, v in report: f.write(f"{k}: {v}\n")
print(open(OUT / "voices.txt", encoding="utf-8").read())
