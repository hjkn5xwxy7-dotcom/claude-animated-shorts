// Screen-space gag overlays (DOM, crisp at any size): phone camera countdown, the posted photo and its likes,
// the lamp-post score, the read receipt, the reef group chat, the "cancelled" stamp and the 2081 sticker.
// Generic made-up UI only (no real app branding). Everything is timed from the narration (Clock).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import "@fontsource/montserrat/600.css";
import { Clock, FPS } from "./timing";

const F = "Montserrat, 'DejaVu Sans', sans-serif";
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
/** overshoot pop-in 0..1 over ~0.25 s */
const popIn = (u: number) => { const x = clamp01(u / 0.25); return x <= 0 ? 0 : 1 + 0.18 * Math.sin(Math.PI * x) * (1 - x) - (1 - x) * (1 - x) * 0.9; };
const card: React.CSSProperties = { background: "#ffffff", borderRadius: 34, boxShadow: "0 18px 0 rgba(0,0,0,0.35)", border: "6px solid #111", fontFamily: F, color: "#111" };

const Post: React.FC<{ likes: string; heartOn: boolean; u: number }> = ({ likes, heartOn, u }) => (
  <div style={{ ...card, width: 620, padding: 26, transform: `translateY(${(1 - clamp01(u / 0.3)) * 900}px) rotate(-3deg) scale(0.72)`, transformOrigin: "top center" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 18 }}>
      <div style={{ width: 70, height: 70, borderRadius: 35, background: "#e8613a", border: "5px solid #111" }} />
      <div style={{ fontWeight: 900, fontSize: 38 }}>ben.guckt.mond</div>
    </div>
    <div style={{ width: 568, height: 568, background: "#05060c", borderRadius: 18, position: "relative", overflow: "hidden" }}>
      {[...Array(28)].map((_, i) => <div key={i} style={{ position: "absolute", left: (i * 197) % 560, top: (i * 131) % 560, width: 5, height: 5, borderRadius: 3, background: "#cfd6ff", opacity: 0.6 }} />)}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 18, fontWeight: 900, fontSize: 44 }}>
      <svg width="58" height="52" viewBox="0 0 58 52"><path d="M29 50 C10 36 2 26 2 15 C2 7 8 2 16 2 C22 2 26 6 29 10 C32 6 36 2 42 2 C50 2 56 7 56 15 C56 26 48 36 29 50Z"
        fill={heartOn ? "#ff3b5c" : "none"} stroke="#111" strokeWidth="5" /></svg>
      <span>{likes}</span>
    </div>
    <div style={{ fontWeight: 600, fontSize: 32, marginTop: 6 }}>vollmond heute so</div>
  </div>
);

const fmt = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(".", ",")} Mio.` : Math.round(n).toLocaleString("de-DE"));

export const Overlays: React.FC<{ clock: Clock }> = ({ clock: c }) => {
  const t = useCurrentFrame() / FPS;
  const at = (id: string) => c.at(id), end = (id: string) => c.end(id);
  const inS = (id: string, pad = 0) => t >= at(id) - 0.05 && t < (c.t.sentences[c.t.sentences.findIndex((s) => s.id === id) + 1]?.start ?? c.t.total + 1.2) - 0.05 + pad;
  const out: React.ReactNode[] = [];
  const top = (k: string, node: React.ReactNode, y = 190) =>
    out.push(<AbsoluteFill key={k} style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: y }}>{node}</AbsoluteFill>);

  // phone camera countdown: frame corners, shutter, big 3-2-1
  if (inS("count")) {
    const ws = c.s("count").words, n = ws.filter((w) => t >= w.start).length;
    const corner = (s: React.CSSProperties) => <div style={{ position: "absolute", width: 90, height: 90, borderColor: "#fff", borderStyle: "solid", borderWidth: 0, ...s }} />;
    out.push(<AbsoluteFill key="cam">
      {corner({ left: 70, top: 160, borderLeftWidth: 10, borderTopWidth: 10 })}{corner({ right: 70, top: 160, borderRightWidth: 10, borderTopWidth: 10 })}
      {corner({ left: 70, bottom: 260, borderLeftWidth: 10, borderBottomWidth: 10 })}{corner({ right: 70, bottom: 260, borderRightWidth: 10, borderBottomWidth: 10 })}
      <div style={{ position: "absolute", left: 470, bottom: 90, width: 140, height: 140, borderRadius: 70, border: "10px solid #fff" }} />
      <div style={{ position: "absolute", left: 110, top: 190, fontFamily: F, fontWeight: 900, fontSize: 38, color: "#ff3b5c" }}>● FOTO</div>
      {n > 0 && n <= 3 && <div style={{ position: "absolute", width: "100%", top: 520, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 300, color: "#fff",
        WebkitTextStroke: "14px #111", paintOrder: "stroke fill", transform: `scale(${popIn(t - ws[n - 1].start)})` }}>{4 - n}</div>}
    </AbsoluteFill>);
  }
  // the post goes up (deadpan), and later the likes explode
  if (inS("post") && t >= c.wordOf("post", "postet")) top("post", <Post likes="0" heartOn={false} u={t - c.wordOf("post", "postet")} />, 70);
  if (inS("likes") || inS("bester")) {
    const t0 = c.wordOf("likes", "zwei"), k = clamp01((t - t0) / 1.2);
    const n = t < t0 ? 3 : 3 + (2e6 - 3) * k * k * k;
    top("likes", <Post likes={fmt(n)} heartOn={t >= t0} u={t - at("likes") + 0.3} />, 70);
  }
  // lamp post 1 : 0 Ben (scoreboard)
  const tb = end("dunkel") + 0.35;
  if (t >= tb && t < at("hafen") - 0.05) {
    top("score", <div style={{ ...card, background: "#111", color: "#fff", padding: "22px 40px", fontWeight: 900, fontSize: 64, display: "flex", gap: 30,
      transform: `scale(${popIn(t - tb)})`, border: "6px solid #fff" }}>
      <span>LATERNE</span><span style={{ color: "#ffe14a" }}>1 : 0</span><span>BEN</span></div>, 300);
  }
  // left on read
  if (inS("gelesen")) {
    const u = t - at("gelesen");
    top("chat", <div style={{ ...card, width: 700, padding: 30, transform: `scale(${popIn(u)})` }}>
      <div style={{ fontWeight: 900, fontSize: 44, borderBottom: "4px solid #ddd", paddingBottom: 14, marginBottom: 22 }}>Flut</div>
      <div style={{ marginLeft: "auto", width: "fit-content", background: "#d8f3c8", borderRadius: 26, padding: "16px 24px", fontWeight: 600, fontSize: 40 }}>kommst du heute?</div>
      <div style={{ textAlign: "right", fontWeight: 600, fontSize: 30, color: "#777", marginTop: 10, opacity: clamp01((u - 0.9) / 0.2) }}>Gelesen 06:12</div>
    </div>, 230);
  }
  // reef group chat: nobody knows when
  if (inS("warten")) {
    const u = t - at("warten");
    top("riff", <div style={{ ...card, width: 720, padding: 30, transform: `scale(${popIn(u)})` }}>
      <div style={{ fontWeight: 900, fontSize: 44 }}>Riff-Gruppe</div>
      <div style={{ fontWeight: 600, fontSize: 30, color: "#777", marginBottom: 18 }}>2.341 Mitglieder</div>
      <div style={{ background: "#f0f0f0", borderRadius: 26, padding: "14px 22px", fontWeight: 600, fontSize: 38, width: "fit-content" }}>wann ist laichen???</div>
      <div style={{ fontWeight: 600, fontSize: 32, color: "#999", marginTop: 16, opacity: clamp01((u - 1.2) / 0.2) }}>0 neue Nachrichten</div>
    </div>, 230);
  }
  // CANCELLED stamp
  if (inS("finster")) {
    const ts = c.wordOf("finster", "gek"), u = t - ts;
    if (u >= 0) top("stamp", <div style={{ fontFamily: F, fontWeight: 900, fontSize: 120, color: "#e0242f", border: "14px solid #e0242f", borderRadius: 20, padding: "6px 34px",
      transform: `rotate(-12deg) scale(${u < 0.12 ? 2.2 - 1.2 * (u / 0.12) : 1})`, opacity: u < 0.12 ? u / 0.12 : 1, background: "rgba(255,255,255,0.75)" }}>GECANCELT</div>, 420);
  }
  // 2081 sticker
  if (inS("brille")) {
    const ts = c.wordOf("brille", "zweitausend"), u = t - ts;
    if (u >= 0) top("2081", <div style={{ ...card, background: "#ffe14a", padding: "20px 40px", textAlign: "center", transform: `rotate(4deg) scale(${popIn(u)})` }}>
      <div style={{ fontWeight: 600, fontSize: 36 }}>nächste totale Finsternis in DE</div>
      <div style={{ fontWeight: 900, fontSize: 150, lineHeight: 1 }}>3.9.2081</div></div>, 260);
  }
  return <>{out}</>;
};
