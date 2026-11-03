// Narration timing (public/mond/timing.json, written by scripts/voice.py): every shot, caption and sound cue is
// placed relative to a sentence or word of the voice-over, so a new voice take re-times the whole video.
import { staticFile } from "remotion";

export const FPS = 30;
export type Word = { w: string; start: number; end: number };
export type Sentence = { id: string; text: string; start: number; end: number; words: Word[] };
export type Timing = { total: number; sentences: Sentence[]; fake?: boolean; captionMap?: Record<string, string> };

export const TIMING_URL = () => staticFile("mond/timing.json");
export const loadTiming = async (): Promise<Timing> => (await fetch(TIMING_URL())).json();

/** frames of the whole video: voice + a short tail for the last gag */
export const framesOf = (t: Timing) => Math.ceil((t.total + 1.2) * FPS);

export class Clock {
  readonly byId = new Map<string, Sentence>();
  constructor(readonly t: Timing) { for (const s of t.sentences) this.byId.set(s.id, s); }
  s(id: string) { const s = this.byId.get(id); if (!s) throw new Error(`timing: no sentence ${id}`); return s; }
  /** start of a sentence (s) */
  at(id: string) { return this.s(id).start; }
  end(id: string) { return this.s(id).end; }
  /** start of the n-th word of a sentence (negative n counts from the end) */
  word(id: string, n: number) { const w = this.s(id).words; return w[(n + w.length) % w.length].start; }
  /** start of the first word in a sentence that begins with the given text (case-insensitive) */
  wordOf(id: string, text: string) {
    const w = this.s(id).words.find((x) => x.w.toLowerCase().replace(/[^a-zäöüß]/g, "").startsWith(text.toLowerCase()));
    if (!w) throw new Error(`timing: no word ${text} in ${id}`);
    return w.start;
  }
  get words() { return this.t.sentences.flatMap((s) => s.words); }
}
