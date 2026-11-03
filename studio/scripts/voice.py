# German narration with Piper (voice "thorsten", CC0) plus exact word timings from Piper's phoneme alignments.
# Writes <out>/voice.wav (mono, model rate) and <out>/timing.json:
#   {"total": s, "sentences": [{"id", "text", "start", "end", "words": [{"w", "start", "end"}]}]}
# Everything in the video (shots, captions, sound cues) is timed from timing.json.
# usage: python3 scripts/voice.py public/mond/script.json public/mond [--fake]
#   --fake: no audio, timings estimated from text length (for local stills without the voice model)
import json, os, sys, wave
import numpy as np

script_path, out_dir = sys.argv[1], sys.argv[2]
FAKE = "--fake" in sys.argv
S = json.load(open(script_path, encoding="utf-8"))
V = S.get("voice", {})
MODEL = V.get("model", "de_DE-thorsten-high")
LEN = float(V.get("lengthScale", 1.0))
GAP = float(V.get("gap", 0.2))          # silence between sentences (s)
LEAD = float(V.get("lead", 0.12))       # silence before the first word
TAIL = float(V.get("tail", 0.6))        # silence after the last word
INNER = 0.12                            # extra silence when Piper splits one script sentence into several chunks
os.makedirs(out_dir, exist_ok=True)


def words_prop(text, t0, t1):
    """fallback: word times proportional to character count (+1 for the space)"""
    ws = text.split()
    tot = sum(len(w) + 1 for w in ws)
    out, t = [], t0
    for w in ws:
        d = (t1 - t0) * (len(w) + 1) / tot
        out.append({"w": w, "start": round(t, 3), "end": round(t + d, 3)})
        t += d
    return out


def words_aligned(text, al, sr, t0):
    """word times from phoneme alignments: a space phoneme ends a word; BOS/EOS/punctuation padding is skipped"""
    spans, cur, t = [], None, t0
    for a in al:
        d = a.num_samples / sr
        if a.phoneme == " ":
            if cur:
                spans.append(cur)
            cur = None
        elif a.phoneme.isalpha() or a.phoneme in "ːˈˌ̃ʔ" or ord(a.phoneme[0]) > 0x24F:
            cur = [cur[0] if cur else t, t + d]
        t += d
    if cur:
        spans.append(cur)
    ws = text.split()
    if len(spans) != len(ws):
        DEBUG.append({"text": text, "words": len(ws), "spans": len(spans), "phonemes": "".join(a.phoneme for a in al)})
        return None
    return [{"w": w, "start": round(a, 3), "end": round(b, 3)} for w, (a, b) in zip(ws, spans)]


sentences, audio, t, DEBUG = [], [], LEAD, []
if FAKE:
    for s in S["sentences"]:
        d = len(s["text"]) / 14.5 * LEN
        sentences.append({"id": s["id"], "text": s["text"], "start": round(t, 3), "end": round(t + d, 3), "words": words_prop(s["text"], t, t + d)})
        t += d + GAP + float(s.get("pause", 0))
    sr = 22050
else:
    from piper import PiperVoice, SynthesisConfig
    from piper.download_voices import download_voice
    mdir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models")
    os.makedirs(mdir, exist_ok=True)
    onnx = os.path.join(mdir, MODEL + ".onnx")
    if not os.path.exists(onnx):
        download_voice(MODEL, __import__("pathlib").Path(mdir))
    voice = PiperVoice.load(onnx, include_alignments=True)
    sr = voice.config.sample_rate
    cfg = SynthesisConfig(length_scale=LEN, normalize_audio=False)
    audio.append(np.zeros(int(LEAD * sr), np.float32))
    aligned_all = True
    for s in S["sentences"]:
        chunks = list(voice.synthesize(s["text"], syn_config=cfg, include_alignments=True))
        start, words, ok = t, [], True
        texts = [s["text"]] if len(chunks) == 1 else None
        if texts is None:  # Piper split the sentence: split our text the same way (at . ! ? followed by a space)
            import re
            texts = [x for x in re.split(r"(?<=[.!?])\s+", s["text"]) if x]
            if len(texts) != len(chunks):
                texts, ok = None, False
        for i, c in enumerate(chunks):
            if i:
                audio.append(np.zeros(int(INNER * sr), np.float32)); t += INNER
            a = c.audio_float_array.astype(np.float32)
            w = words_aligned(texts[i], c.phoneme_alignments, sr, t) if (ok and c.phoneme_alignments) else None
            if w is None:
                ok = False
            else:
                words += w
            audio.append(a); t += len(a) / sr
        if not ok:
            aligned_all = False
            words = words_prop(s["text"], start, t)
        sentences.append({"id": s["id"], "text": s["text"], "start": round(start, 3), "end": round(t, 3), "words": words, "aligned": ok})
        pause = GAP + float(s.get("pause", 0))
        audio.append(np.zeros(int(pause * sr), np.float32)); t += pause
    t -= GAP
    audio.append(np.zeros(int(TAIL * sr), np.float32))
    x = np.concatenate(audio)
    x = x / max(1e-6, np.abs(x).max()) * 0.89  # -1 dBFS peak; loudness is set in the mix
    with wave.open(os.path.join(out_dir, "voice.wav"), "wb") as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(sr)
        f.writeframes((x * 32767).astype("<i2").tobytes())
    print(f"[voice] alignments for all sentences: {aligned_all}")

total = round((t if FAKE else len(x) / sr) + (TAIL if FAKE else 0), 3)
if DEBUG:
    print("[voice] alignment mismatches:", json.dumps(DEBUG[:4], ensure_ascii=False))
json.dump({"total": total, "sampleRate": sr, "fake": FAKE, "sentences": sentences, "alignDebug": DEBUG}, open(os.path.join(out_dir, "timing.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"[voice] {len(sentences)} sentences, {total:.2f} s" + (" (estimated)" if FAKE else ""))
