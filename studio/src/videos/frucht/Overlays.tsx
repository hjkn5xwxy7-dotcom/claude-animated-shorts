// Screen overlays of the fruit drama: the phone frame around the future video (date stamp, REC, glitch lines),
// the episode title, the time cards, the incoming-video notification, the rewatch counter and the end card.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/900.css";
import { Clock, FPS } from "../mond/timing";

const F = "Montserrat, 'DejaVu Sans', sans-serif";
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const pop = (u: number) => { const x = clamp01(u / 0.22); return x <= 0 ? 0 : 1 + 0.18 * Math.sin(Math.PI * x) * (1 - x) - (1 - x) * (1 - x) * 0.9; };

const PhoneVideo: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill>
    {/* bezel: black around a rounded screen window */}
    <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 0 46px #0b0b10", borderRadius: 90 }} />
    <div style={{ position: "absolute", left: 46, right: 46, top: 46, bottom: 46, borderRadius: 60, boxShadow: "0 0 0 4px #2a2a33" }} />
    <div style={{ position: "absolute", left: 420, top: 70, width: 240, height: 46, borderRadius: 23, background: "#000" }} />
    <div style={{ position: "absolute", left: 90, top: 160, fontFamily: F, fontWeight: 900, fontSize: 40, color: "#fff", textShadow: "0 2px 8px #000" }}>
      <span style={{ color: "#ff3b3b", opacity: Math.floor(t * 2) % 2 ? 1 : 0.2 }}>● </span>REC</div>
    <div style={{ position: "absolute", right: 90, top: 160, fontFamily: F, fontWeight: 600, fontSize: 36, color: "#fff", textAlign: "right", textShadow: "0 2px 8px #000" }}>
      MORGEN · 23:47</div>
    <div style={{ position: "absolute", left: 90, top: 214, fontFamily: F, fontWeight: 600, fontSize: 30, color: "#ffdede" }}>Absender: unbekannt</div>
    {/* glitch scanlines */}
    <div style={{ position: "absolute", left: 46, right: 46, top: 300 + ((t * 700) % 1300), height: 8, background: "rgba(255,255,255,0.18)" }} />
    <div style={{ position: "absolute", inset: 46, borderRadius: 60, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0 3px, rgba(0,0,0,0) 3px 6px)" }} />
  </AbsoluteFill>
);

export const Overlays: React.FC<{ clock: Clock }> = ({ clock: c }) => {
  const t = useCurrentFrame() / FPS;
  const at = (id: string) => c.at(id), end = (id: string) => c.end(id);
  const inS = (a: string, b: string) => t >= at(a) - 0.06 && t < at(b) - 0.06;
  const out: React.ReactNode[] = [];
  // future video frame
  if (inS("h1", "h2") || inS("h1b", "n4") || inS("e3", "e4")) out.push(<PhoneVideo key="pv" t={t} />);
  // episode title over the hook
  if (t >= at("h2") && t < end("h3") + 0.4) {
    const u = t - at("h2");
    out.push(<AbsoluteFill key="title" style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 180 }}>
      <div style={{ transform: `scale(${pop(u)}) rotate(-2deg)`, background: "#ff3d6e", padding: "22px 34px", borderRadius: 26, border: "6px solid #111", boxShadow: "0 12px 0 rgba(0,0,0,0.4)", width: 900, textAlign: "center" }}>
        <div style={{ fontFamily: F, fontWeight: 900, fontSize: 58, color: "#fff", lineHeight: 1.08, WebkitTextStroke: "3px #111", paintOrder: "stroke fill" }}>
          Die Erdbeere bekam ein Video aus der Zukunft</div>
        <div style={{ fontFamily: F, fontWeight: 900, fontSize: 34, color: "#ffe14a", marginTop: 10 }}>TEIL 1</div>
      </div></AbsoluteFill>);
  }
  // time cards
  for (const [id, txt] of [["z1", "12 STUNDEN VORHER"], ["n3", "AM ABEND"], ["n7", "00:00 UHR"]] as const) {
    const u = t - at(id);
    if (u >= 0 && u < 2.2) out.push(<AbsoluteFill key={id} style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 300, opacity: clamp01((2.2 - u) / 0.3) }}>
      <div style={{ fontFamily: F, fontWeight: 900, fontSize: 84, color: "#fff", letterSpacing: 4, WebkitTextStroke: "10px #111", paintOrder: "stroke fill", transform: `scale(${pop(u)})` }}>{txt}</div>
    </AbsoluteFill>);
  }
  // incoming video notification
  if (inS("n3", "h1b")) {
    const u = t - (c.wordOf("n3", "video") - 0.1);
    if (u >= 0) out.push(<AbsoluteFill key="notif" style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 140 }}>
      <div style={{ width: 960, background: "rgba(245,245,250,0.95)", borderRadius: 40, padding: "26px 32px", fontFamily: F, display: "flex", gap: 22, alignItems: "center", transform: `translateY(${(1 - clamp01(u / 0.3)) * -260}px)` }}>
        <div style={{ width: 84, height: 84, borderRadius: 22, background: "#222", display: "flex", alignItems: "center", justifyContent: "center", color: "#ff3b3b", fontSize: 44, fontWeight: 900 }}>?</div>
        <div style={{ color: "#111" }}><div style={{ fontWeight: 900, fontSize: 34 }}>Unbekannt · jetzt</div><div style={{ fontWeight: 600, fontSize: 34 }}>hat dir ein Video gesendet</div></div>
      </div></AbsoluteFill>);
  }
  // rewatch counter
  if (inS("n4", "e3")) {
    const n = Math.min(11, 1 + Math.floor((t - at("n4")) / ((end("n4") - at("n4")) / 11)));
    out.push(<AbsoluteFill key="cnt" style={{ alignItems: "flex-end", justifyContent: "flex-start", padding: "200px 70px" }}>
      <div style={{ fontFamily: F, fontWeight: 900, fontSize: 72, color: n >= 11 ? "#ffe14a" : "#fff", WebkitTextStroke: "8px #111", paintOrder: "stroke fill" }}>{n}×</div>
    </AbsoluteFill>);
  }
  // red shock flash on the twins + on Kiwi
  for (const id of ["n9", "k3"]) { const u = t - at(id); if (u >= 0 && u < 0.25) out.push(<AbsoluteFill key={"r" + id} style={{ background: "#ff1e3c", opacity: 0.35 * (1 - u / 0.25), mixBlendMode: "screen" }} />); }
  // end card
  const te = end("k3") + 0.35;
  if (t >= te) {
    const u = t - te;
    out.push(<AbsoluteFill key="end" style={{ background: "#000", alignItems: "center", justifyContent: "center", gap: 34 }}>
      <div style={{ fontFamily: F, fontWeight: 900, fontSize: 190, color: "#ff3d6e", transform: `scale(${pop(u - 0.3)})`, WebkitTextStroke: "6px #fff", paintOrder: "stroke fill" }}>TEIL 2?</div>
      <div style={{ fontFamily: F, fontWeight: 900, fontSize: 62, color: "#fff", opacity: clamp01((u - 1.0) / 0.3) }}>Wer ist die echte Erdbeere?</div>
      <div style={{ fontFamily: F, fontWeight: 600, fontSize: 40, color: "#bbb", opacity: clamp01((u - 1.7) / 0.3) }}>Schreib es in die Kommentare</div>
    </AbsoluteFill>);
  }
  return <>{out}</>;
};
