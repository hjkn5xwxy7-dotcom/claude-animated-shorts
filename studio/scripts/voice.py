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


def words_energy(text, audio, sr, t0):
    """fallback with audio: word times proportional to characters, spread over the VOICED part of the chunk only
    (20 ms frames above -38 dB of the chunk peak), so pauses at commas / sentence ends do not drift the captions"""
    hop = int(0.02 * sr)
    fr = np.array([np.sqrt(np.mean(audio[i:i + hop] ** 2)) for i in range(0, len(audio) - hop, hop)]) + 1e-9
    voiced = 20 * np.log10(fr / fr.max()) > -38
    if voiced.sum() < 3:
        return words_prop(text, t0, t0 + len(audio) / sr)
    cum = np.concatenate([[0], np.cumsum(voiced)]) / voiced.sum()   # voiced fraction reached at each frame edge
    def time_at(frac):
        i = int(np.searchsorted(cum, frac))
        return t0 + min(i, len(voiced)) * hop / sr
    ws = text.split()
    tot = sum(len(w) + 1 for w in ws)
    out, c = [], 0
    for w in ws:
        a = time_at(c / tot); c += len(w) + 1; b = time_at(c / tot)
        out.append({"w": w, "start": round(a, 3), "end": round(max(b, a + 0.08), 3)})
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
        vs = S.get("voices", {}).get(s.get("voice", "_"), {})
        d = len(s["text"]) / 17.7 * vs.get("lengthScale", LEN) / 2 ** (float(vs.get("pitch", 0)) / 12)
        sentences.append({"id": s["id"], "text": s["text"], "voice": s.get("voice", ""), "start": round(t, 3), "end": round(t + d, 3), "words": words_prop(s["text"], t, t + d)})
        t += d + GAP + float(s.get("pause", 0))
    sr = 22050
else:
    from piper import PiperVoice, SynthesisConfig
    from piper.download_voices import download_voice
    mdir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models")
    os.makedirs(mdir, exist_ok=True)
    # voices: script "voices" {name: {model, speaker?, lengthScale?, noiseScale?, pitch? (semitones), reverb? (wet 0..1)}};
    # a sentence picks one with "voice" (default: the script-level "voice" model)
    VOICES = S.get("voices", {})
    def pick_by_pitch(v, model, order, n):
        """median f0 of every speaker on a short phrase (cached next to the model), then rank"""
        cache = os.path.join(mdir, model + ".pitch.json")
        if os.path.exists(cache):
            table = json.load(open(cache))
        else:
            vsr = v.config.sample_rate
            table = []
            ids = v.config.speaker_id_map or {str(i): i for i in range(v.config.num_speakers)}
            for name, sid in ids.items():
                x = np.concatenate([c.audio_float_array for c in v.synthesize("Hallo, wie geht es dir heute?", syn_config=SynthesisConfig(speaker_id=sid))])
                nfr, f0s = int(0.04 * vsr), []
                for i in range(0, len(x) - nfr, nfr):
                    fr = x[i:i + nfr] - x[i:i + nfr].mean()
                    if np.sqrt(np.mean(fr ** 2)) < 0.05: continue
                    ac = np.correlate(fr, fr, "full")[nfr - 1:]
                    lo, hi = int(vsr / 400), int(vsr / 60)
                    k = lo + int(np.argmax(ac[lo:hi]))
                    if ac[k] > 0.3 * ac[0]: f0s.append(vsr / k)
                if f0s: table.append([float(np.median(f0s)), name, sid])
            json.dump(table, open(cache, "w"))
        table = sorted(table, reverse=(order == "high"))
        print(f"[voice] pitch:{order}:{n} -> speaker {table[n][1]} ({table[n][0]:.0f} Hz)")
        return table[n][2]
    loaded = {}
    def get_voice(name):
        spec = VOICES.get(name, {"model": MODEL, "lengthScale": LEN})
        model = spec.get("model", MODEL)
        if model not in loaded:
            onnx = os.path.join(mdir, model + ".onnx")
            if not os.path.exists(onnx):
                download_voice(model, __import__("pathlib").Path(mdir))
            loaded[model] = PiperVoice.load(onnx, include_alignments=True)
        v = loaded[model]
        sid = None
        if str(spec.get("speaker", "")).startswith("pitch:"):
            # pick a speaker of a multi-speaker model by voice pitch: "pitch:high:N" = N-th highest, "pitch:low:N" = N-th lowest
            _, order, n = spec["speaker"].split(":")
            sid = pick_by_pitch(v, model, order, int(n))
        elif "speaker" in spec:
            sid = (v.config.speaker_id_map or {}).get(spec["speaker"])
            if sid is None:
                raise SystemExit(f"voice {name}: speaker {spec['speaker']} not in {list((v.config.speaker_id_map or {}).keys())}")
        cfg = SynthesisConfig(speaker_id=sid, length_scale=spec.get("lengthScale", LEN), noise_scale=spec.get("noiseScale"), normalize_audio=False)
        return v, cfg, 2 ** (float(spec.get("pitch", 0)) / 12), float(spec.get("reverb", 0))
    sr = get_voice(S["sentences"][0].get("voice", "_"))[0].config.sample_rate

    def repitch(a, k, src_sr):
        """pitch * k (and duration / k) by resampling, plus conversion from the model rate to sr"""
        n = int(round(len(a) * sr / src_sr / k))
        return np.interp(np.linspace(0, len(a) - 1, n), np.arange(len(a)), a).astype(np.float32) if n != len(a) else a

    def reverb(a, wet):
        r = np.random.default_rng(3)
        n = int(1.4 * sr)
        ir = r.standard_normal(n) * np.exp(-6.9 * np.arange(n) / n)
        ir[0] = 0
        y = np.convolve(a, ir)[: len(a) + n] / np.sqrt(np.sum(ir ** 2)) * 0.35
        out = np.zeros(len(y), np.float32); out[: len(a)] = a
        return (1 - wet * 0.3) * out + wet * y

    audio.append(np.zeros(int(LEAD * sr), np.float32))
    aligned_all = True
    for s in S["sentences"]:
        voice, cfg, k, wet = get_voice(s.get("voice", "_"))
        vsr = voice.config.sample_rate
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
            raw = c.audio_float_array.astype(np.float32)
            a = repitch(raw, k, vsr)
            sc = (len(a) / sr) / max(1e-9, len(raw) / vsr)          # model time -> output time
            w = words_aligned(texts[i], c.phoneme_alignments, vsr, 0.0) if (texts and c.phoneme_alignments) else None
            if w is None:
                ok = False
                w = words_energy(texts[i], raw, vsr, 0.0) if texts else None
            if w is not None:
                words += [{"w": x["w"], "start": round(t + x["start"] * sc, 3), "end": round(t + x["end"] * sc, 3)} for x in w]
            if wet > 0:
                a = reverb(a, wet)
            audio.append(a); t += len(a) / sr
        if not ok:
            aligned_all = False
        if not words or len(words) != len(s["text"].split()):
            words = words_prop(s["text"], start, t)
        sentences.append({"id": s["id"], "text": s["text"], "voice": s.get("voice", ""), "start": round(start, 3), "end": round(t, 3), "words": words, "aligned": ok})
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
json.dump({"total": total, "sampleRate": sr, "fake": FAKE, "captionMap": S.get("captionMap", {}), "sentences": sentences, "alignDebug": DEBUG}, open(os.path.join(out_dir, "timing.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"[voice] {len(sentences)} sentences, {total:.2f} s" + (" (estimated)" if FAKE else ""))
