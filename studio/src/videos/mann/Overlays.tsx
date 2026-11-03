// Screen overlays of the horror short: lock-screen clock, the tag notification, the post frame around "photo"
// shots (the photo area is see-through: the 3D view IS the photo), comments, chapter stamps, the window-glass tint,
// "5 TAGE VORHER" and "TEIL 2 FOLGT". Generic made-up UI only.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/900.css";
import { Clock, FPS } from "../mond/timing";

const F = "Montserrat, 'DejaVu Sans', sans-serif";
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const popIn = (u: number) => { const x = clamp01(u / 0.25); return x <= 0 ? 0 : 1 + 0.15 * Math.sin(Math.PI * x) * (1 - x) - (1 - x) * (1 - x) * 0.9; };
const fadeIn = (u: number, d = 0.25) => clamp01(u / d);

/** post frame: white header + footer, transparent photo window between them */
const PostFrame: React.FC<{ user: string; time: string; likes: string; comment?: { who: string; text: string; u: number }; badge?: string }> = ({ user, time, likes, comment, badge }) => (
  <AbsoluteFill>
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 300, background: "#0b0b0f" }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 200, height: 130, background: "#fff", display: "flex", alignItems: "center", gap: 22, padding: "0 40px", fontFamily: F }}>
      <div style={{ width: 82, height: 82, borderRadius: 41, background: "#e8613a", border: "5px solid #111" }} />
      <div><div style={{ fontWeight: 900, fontSize: 40, color: "#111" }}>{user}</div><div style={{ fontWeight: 600, fontSize: 28, color: "#777" }}>{time}</div></div>
      {badge && <div style={{ marginLeft: "auto", fontWeight: 900, fontSize: 26, color: "#fff", background: "#e0242f", padding: "8px 16px", borderRadius: 14 }}>{badge}</div>}
    </div>
    <div style={{ position: "absolute", left: 0, top: 330, width: 1080, height: 1080, boxShadow: "inset 0 0 0 6px #fff" }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 1410, bottom: 0, background: "#fff", padding: "26px 40px", fontFamily: F, color: "#111" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontWeight: 900, fontSize: 40 }}>
        <svg width="54" height="48" viewBox="0 0 58 52"><path d="M29 50 C10 36 2 26 2 15 C2 7 8 2 16 2 C22 2 26 6 29 10 C32 6 36 2 42 2 C50 2 56 7 56 15 C56 26 48 36 29 50Z" fill="none" stroke="#111" strokeWidth="5" /></svg>
        {likes}
      </div>
      {comment && comment.u >= 0 && <div style={{ marginTop: 22, fontSize: 38, lineHeight: 1.25, opacity: fadeIn(comment.u), transform: `translateY(${(1 - fadeIn(comment.u)) * 20}px)` }}>
        <span style={{ fontWeight: 900 }}>{comment.who} </span><span style={{ fontWeight: 600 }}>{comment.text}</span></div>}
    </div>
  </AbsoluteFill>
);

const Stamp: React.FC<{ text: string; u: number }> = ({ text, u }) => u < 0 || u > 1.6 ? null : (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 300 }}>
    <div style={{ fontFamily: F, fontWeight: 900, fontSize: 96, color: "#fff", letterSpacing: 8, textShadow: "0 6px 0 #000", opacity: u < 1.3 ? fadeIn(u, 0.12) : 1 - (u - 1.3) / 0.3,
      transform: `scale(${1.15 - 0.15 * clamp01(u / 0.2)})` }}>{text}</div>
  </AbsoluteFill>
);

export const Overlays: React.FC<{ clock: Clock }> = ({ clock: c }) => {
  const t = useCurrentFrame() / FPS;
  const at = (id: string) => c.at(id);
  const between = (a: string, b: string) => t >= at(a) - 0.06 && t < at(b) - 0.06;
  const out: React.ReactNode[] = [];

  // 03:12 lock screen clock (cold open and back in the present)
  const clockOn = t >= 0 && t < at("c2") - 0.06;
  if (clockOn) {
    const u = t - (t < at("c3") ? 0.2 : at("p1"));
    out.push(<AbsoluteFill key="clock" style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 230, opacity: fadeIn(u, 0.4) }}>
      <div style={{ fontFamily: F, fontWeight: 600, fontSize: 210, color: "#e8eeff", textShadow: "0 0 40px rgba(140,170,255,0.6)", letterSpacing: -4 }}>03:12</div>
    </AbsoluteFill>);
  }
  // tag notification
  if (between("c2", "c3") || between("p1", "p2")) {
    const u = t - (t < at("p1") ? at("c2") + 0.1 : at("p1") + 0.6);
    if (u >= 0) out.push(<AbsoluteFill key="notif" style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 110 }}>
      <div style={{ width: 960, background: "rgba(245,245,250,0.94)", borderRadius: 40, padding: "28px 34px", fontFamily: F, display: "flex", gap: 24, alignItems: "center",
        transform: `translateY(${(1 - fadeIn(u, 0.3)) * -260}px)`, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ width: 86, height: 86, borderRadius: 22, background: "linear-gradient(135deg,#ff5e62,#8a2be2)" }} />
        <div style={{ color: "#111" }}><div style={{ fontWeight: 900, fontSize: 34 }}>Neue Markierung · 03:12</div>
          <div style={{ fontWeight: 600, fontSize: 34 }}>Du wurdest in einem Foto markiert.</div></div>
      </div>
    </AbsoluteFill>);
  }
  // the tagged photo (cold open + present): posted from Ben's own account
  if (between("c3", "c6") || between("p2", "p3")) {
    const own = t >= at("c5") - 0.06 && t < at("c6");
    out.push(<PostFrame key="tagpost" user="ben.nachts" time={t >= at("c4") || t >= at("p2") ? "vor 1 Minute" : "gerade eben"} likes="0" badge={own ? "DEIN ACCOUNT" : undefined} />);
  }
  // "5 TAGE VORHER"
  if (t >= c.end("c6") && t < at("m1") + 0.3) out.push(<AbsoluteFill key="flash5" style={{ background: "#000", alignItems: "center", justifyContent: "center", opacity: t < at("m1") ? 1 : 1 - (t - at("m1")) / 0.3 }}>
    <div style={{ fontFamily: F, fontWeight: 900, fontSize: 110, color: "#fff", letterSpacing: 6 }}>5 TAGE VORHER</div></AbsoluteFill>);
  // chapter stamps
  for (const [id, label] of [["m1", "MONTAG"], ["d1", "DIENSTAG"], ["w1", "MITTWOCH"], ["t1", "DONNERSTAG"], ["f1", "FREITAG"]] as const)
    out.push(<Stamp key={label} text={label} u={t - at(id) - 0.05} />);
  // Monday evening photo: 12 likes
  const photoM = t >= c.wordOf("m3", "laternen") - 0.1 && t < at("d1") - 0.06;
  if (photoM) out.push(<PostFrame key="pm" user="ben.nachts" time="Montag, 22:41" likes="12" />);
  // Tuesday photo + the comment
  if (between("d1", "d3")) out.push(<PostFrame key="pd" user="ben.nachts" time="Dienstag, 22:38" likes="12"
    comment={{ who: "nachtschicht_", text: "Wer ist der Mann unter der letzten Laterne?", u: t - c.end("d1") + 0.1 }} />);
  // Wednesday photo
  if (between("w1", "w3")) out.push(<PostFrame key="pw" user="ben.nachts" time="Mittwoch, 22:40" likes="9"
    comment={{ who: "nachtschicht_", text: "Er kommt näher.", u: t - at("w2") }} />);
  // comment deleted, password changed
  if (between("w3", "t1")) {
    const t1 = c.wordOf("w3", "kommentar"), t2 = c.wordOf("w3", "passwort");
    out.push(<AbsoluteFill key="ok" style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 340, gap: 26 }}>
      {[["Kommentar gelöscht", t1], ["Passwort geändert", t2]].map(([txt, tt]) => t >= (tt as number) && (
        <div key={txt as string} style={{ fontFamily: F, fontWeight: 900, fontSize: 52, color: "#111", background: "#fff", borderRadius: 24, padding: "18px 34px",
          border: "5px solid #111", transform: `scale(${popIn(t - (tt as number))})` }}>✓ {txt}</div>))}
    </AbsoluteFill>);
  }
  // Thursday: the house front photo (no frame while zooming to the window)
  if (between("t1", "t2")) out.push(<PostFrame key="pt" user="ben.nachts" time="Donnerstag, 22:35" likes="31" comment={{ who: "ben.nachts", text: "kein mann. perfekt.", u: t - c.wordOf("t1", "perfekt") }} />);
  // window glass: cold tint, reflections, the frame bars
  const refl = t >= c.wordOf("t2", "in") - 0.05 && t < at("f1") - 0.06;
  if (refl) out.push(<AbsoluteFill key="glass" style={{ background: "linear-gradient(115deg, rgba(120,160,220,0.18) 0%, rgba(255,255,255,0.08) 30%, rgba(80,110,170,0.22) 60%, rgba(255,255,255,0.05) 100%)" }}>
    <div style={{ position: "absolute", left: 520, top: 0, bottom: 0, width: 40, background: "#ddd9cf", boxShadow: "0 0 0 5px #111" }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 900, height: 40, background: "#ddd9cf", boxShadow: "0 0 0 5px #111" }} />
  </AbsoluteFill>);
  // the end: black, TEIL 2 FOLGT
  const te = c.end("man") + 0.25;
  if (t >= te) {
    const u = t - te;
    out.push(<AbsoluteFill key="end" style={{ background: "#000", alignItems: "center", justifyContent: "center", gap: 30 }}>
      <div style={{ fontFamily: F, fontWeight: 900, fontSize: 130, color: "#fff", letterSpacing: 6, opacity: fadeIn(u - 0.5, 0.4) }}>TEIL 2</div>
      <div style={{ fontFamily: F, fontWeight: 900, fontSize: 80, color: "#e0242f", letterSpacing: 10, opacity: fadeIn(u - 0.9, 0.4) }}>FOLGT</div>
      <div style={{ fontFamily: F, fontWeight: 600, fontSize: 44, color: "#bbb", marginTop: 40, opacity: fadeIn(u - 1.6, 0.4) }}>Wer ist der Mann? Schreib es in die Kommentare.</div>
    </AbsoluteFill>);
  }
  return <>{out}</>;
};
