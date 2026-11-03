// TikTok-style captions: 1-3 words at a time, big white Montserrat Black with a heavy outline, the spoken word in
// yellow, a small pop when a new group appears. Groups break at punctuation or after ~14 characters.
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Clock, FPS, Word } from "./timing";

type Group = { words: Word[]; start: number; end: number };
const groupsOf = (clock: Clock): Group[] => {
  const out: Group[] = [];
  for (const s of clock.t.sentences) {
    let cur: Word[] = [];
    const flush = () => { if (cur.length) out.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end }); cur = []; };
    for (const w of s.words) {
      const len = cur.reduce((a, x) => a + x.w.length + 1, 0);
      if (cur.length && (cur.length >= 3 || len + w.w.length > 14)) flush();
      cur.push(w);
      if (/[.,!?:;]$/.test(w.w)) flush();
    }
    flush();
  }
  // each group stays until the next one starts (or 0.4 s after its last word)
  for (let i = 0; i < out.length; i++) out[i].end = Math.min(out[i].end + 0.4, i + 1 < out.length ? out[i + 1].start : Infinity);
  return out;
};

export const Captions: React.FC<{ clock: Clock }> = ({ clock }) => {
  const f = useCurrentFrame(), t = f / FPS;
  const groups = useMemo(() => groupsOf(clock), [clock]);
  const g = groups.find((x) => t >= x.start - 0.04 && t < x.end);
  if (!g) return null;
  const age = t - g.start, pop = age < 0.1 ? 0.86 + 1.4 * age : 1;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 1180 }}>
      <div style={{ transform: `scale(${pop})`, textAlign: "center", width: 960, lineHeight: 1.05,
        fontFamily: "Montserrat, 'DejaVu Sans', sans-serif", fontWeight: 900, fontSize: 92, letterSpacing: -1 }}>
        {g.words.map((w, i) => {
          const active = t >= w.start - 0.03 && (i + 1 >= g.words.length || t < g.words[i + 1].start - 0.03);
          return (
            <span key={i} style={{ color: active ? "#ffe14a" : "#ffffff", WebkitTextStroke: "16px #111", paintOrder: "stroke fill",
              textShadow: "0 8px 0 rgba(0,0,0,0.55)", margin: "0 12px", display: "inline-block" }}>{(clock.t.captionMap?.[w.w] ?? w.w).replace(/[,;:]$/, "")}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
