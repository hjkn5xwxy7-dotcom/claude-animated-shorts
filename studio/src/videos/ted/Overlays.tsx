// Screen overlays of "Ich hieß Ted": place / date cards, the victims' name cards (shown with respect, never with an
// image of violence), the title card, and the end card (TEIL 2 FOLGT + "nachgestellt nach ..." note).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/900.css";
import { Clock, FPS } from "../mond/timing";

const F = "Montserrat, 'DejaVu Sans', sans-serif";
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const fade = (u: number, dur: number, fi = 0.25, fo = 0.4) => clamp01(u / fi) * clamp01((dur - u) / fo);

type Card = { at: (c: Clock) => number; dur: number; kind: "place" | "name" | "title"; a: string; b?: string };
const after = (id: string, d = 0.15) => (c: Clock) => c.end(id) + d;
const start = (id: string, d = 0.05) => (c: Clock) => c.at(id) + d;
const CARDS: Card[] = [
  { at: after("c3"), dur: 2.4, kind: "title", a: "THEODORE ROBERT BUNDY", b: "1946 – 1989" },
  { at: start("k1"), dur: 2.6, kind: "place", a: "BURLINGTON, VERMONT", b: "1946" },
  { at: start("s1"), dur: 2.6, kind: "place", a: "SEATTLE", b: "1. FEBRUAR 1974" },
  { at: after("s2"), dur: 2.4, kind: "name", a: "LYNDA ANN HEALY · 21", b: "nie lebend wiedergesehen" },
  { at: start("l1"), dur: 2.6, kind: "place", a: "LAKE SAMMAMISH", b: "14. JULI 1974" },
  { at: after("l2"), dur: 2.2, kind: "name", a: "JANICE OTT · 23" },
  { at: after("l3"), dur: 2.2, kind: "name", a: "DENISE NASLUND" },
  { at: start("u1"), dur: 2.6, kind: "place", a: "SALT LAKE CITY", b: "HERBST 1974" },
  { at: start("u2"), dur: 2.6, kind: "place", a: "MURRAY, UTAH", b: "8. NOVEMBER 1974" },
  { at: after("u4"), dur: 2.2, kind: "name", a: "CAROL DaRONCH · 18", b: "überlebt" },
  { at: after("u5"), dur: 2.4, kind: "name", a: "DEBRA KENT · 17" },
  { at: start("a1"), dur: 2.6, kind: "place", a: "GRANGER, UTAH", b: "16. AUGUST 1975" },
  { at: start("a4"), dur: 2.4, kind: "place", a: "ASPEN, COLORADO", b: "7. JUNI 1977" },
];

export const Overlays: React.FC<{ clock: Clock }> = ({ clock: c }) => {
  const t = useCurrentFrame() / FPS;
  const out: React.ReactNode[] = [];
  CARDS.forEach((k, i) => {
    const u = t - k.at(c);
    if (u < 0 || u > k.dur) return;
    const o = fade(u, k.dur);
    if (k.kind === "place") out.push(
      <AbsoluteFill key={i} style={{ alignItems: "flex-start", justifyContent: "flex-start", padding: "230px 70px", opacity: o }}>
        <div style={{ fontFamily: F, fontWeight: 900, fontSize: 64, color: "#f2ead8", letterSpacing: 6, textShadow: "0 4px 18px #000" }}>{k.a}</div>
        <div style={{ fontFamily: F, fontWeight: 600, fontSize: 40, color: "#d8c9a6", letterSpacing: 4, marginTop: 8, textShadow: "0 4px 18px #000" }}>{k.b}</div>
        <div style={{ width: 120 * clamp01(u / 0.6), height: 6, background: "#b22a2a", marginTop: 18 }} />
      </AbsoluteFill>);
    else if (k.kind === "name") out.push(
      <AbsoluteFill key={i} style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 260, opacity: o }}>
        <div style={{ background: "rgba(5,5,8,0.82)", padding: "26px 46px", borderLeft: "10px solid #b22a2a", textAlign: "left" }}>
          <div style={{ fontFamily: F, fontWeight: 900, fontSize: 58, color: "#ffffff", letterSpacing: 3 }}>{k.a}</div>
          {k.b && <div style={{ fontFamily: F, fontWeight: 600, fontSize: 36, color: "#cfcfcf", marginTop: 6 }}>{k.b}</div>}
        </div>
      </AbsoluteFill>);
    else out.push(
      <AbsoluteFill key={i} style={{ alignItems: "center", justifyContent: "center", opacity: o }}>
        <div style={{ fontFamily: F, fontWeight: 900, fontSize: 70, color: "#ffffff", letterSpacing: 5, textAlign: "center", textShadow: "0 6px 24px #000" }}>{k.a}</div>
        <div style={{ fontFamily: F, fontWeight: 600, fontSize: 44, color: "#b22a2a", letterSpacing: 8, marginTop: 14 }}>{k.b}</div>
      </AbsoluteFill>);
  });
  const te = c.end("a4") + 0.15;
  if (t >= te) {
    const u = t - te;
    out.push(<AbsoluteFill key="end" style={{ background: "#000", alignItems: "center", justifyContent: "center", gap: 26 }}>
      <div style={{ fontFamily: F, fontWeight: 900, fontSize: 120, color: "#fff", letterSpacing: 6, opacity: clamp01((u - 0.4) / 0.4) }}>TEIL 2</div>
      <div style={{ fontFamily: F, fontWeight: 900, fontSize: 76, color: "#b22a2a", letterSpacing: 10, opacity: clamp01((u - 0.8) / 0.4) }}>FOLGT</div>
      <div style={{ fontFamily: F, fontWeight: 600, fontSize: 32, color: "#9a9a9a", marginTop: 60, textAlign: "center", width: 900, opacity: clamp01((u - 1.4) / 0.4) }}>
        Nachgestellt nach Geständnissen, Interviews und Gerichtsakten.<br />In Erinnerung an die Opfer.</div>
    </AbsoluteFill>);
  }
  return <>{out}</>;
};
