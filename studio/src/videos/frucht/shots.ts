// Shot plan of "Die Erdbeere bekam ein Video aus der Zukunft" (fruit drama, part 1). Places: the wedding hall by
// day / at midnight (HALL), the storage room LAGER 3 behind its side door, Erdbeere's bedroom (ROOM). The phone /
// future-video frames, title and time cards are screen overlays (Overlays.tsx).
import { Clock } from "../mond/timing";
import { LOOKS, LookId, Look, blendLook } from "../mond/looks";
import { SetId, ROOM, HALL } from "../mond/sets";
import { Cue, BEN } from "../mond/chars";
import { Stage, V3, FxCue } from "../mond/shots";
import "./fruits";

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ss = (x: number) => { const u = clamp01(x); return u * u * u * (u * (u * 6 - 15) + 10); };
const mixV = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const glide = (t: number, t0: number, t1: number, a: V3, b: V3, la: V3, lb: V3) => { const k = ss((t - t0) / Math.max(0.01, t1 - t0)); return { pos: mixV(a, b, k), look: mixV(la, lb, k) }; };
const kick = (t: number, at: number, amp = 0.05) => { const f = Math.round((t - at) * 30); return f < 0 || f > 7 ? 0 : amp * (f % 2 ? -1 : 1) * (1 - f / 8); };
const base = (set: SetId, look: LookId | Look, gradeId: LookId): Omit<Stage, "cam"> =>
  ({ set, look: typeof look === "string" ? LOOKS[look] : look, gradeId, focus: 10, cInf: 0, cast: [], fx: [], flash: 0 });
const H = (x: number, y: number, z: number): V3 => [HALL.x + x, HALL.y + y, HALL.z + z];
const R = (x: number, y: number, z: number): V3 => [ROOM.x + x, ROOM.y + y, ROOM.z + z];

// ---- fruit cues with lip sync ----
type Kind = "erd" | "erd2" | "mango" | "kiwi" | "banane";
const VOICE_OF: Record<string, Kind> = { erd: "erd", erdw: "erd", erd2: "erd2", kiwi: "kiwi", kiwi_c: "kiwi", mango: "mango", banane: "banane" };
const mouthAt = (c: Clock, t: number, k: Kind) => {
  for (const s of c.t.sentences) {
    if (t < s.start - 0.05 || t > s.end + 0.05) continue;
    if (VOICE_OF[(s as { voice?: string }).voice ?? ""] !== k) return 0;
    const w = s.words.find((x) => t >= x.start - 0.02 && t <= x.end);
    return w ? 1 + (Math.floor(t * 9) % 2) : 0;
  }
  return 0;
};
type FO = { expr?: string; pose?: string; look?: number; walk?: boolean; phase?: number; scale?: number; mirror?: boolean };
let CLOCK: Clock, T = 0;
const fruit = (k: Kind, p: V3, o: FO = {}): Cue => ({
  who: BEN, x: p[0], y: p[1], z: p[2], scale: o.scale ?? 0.85, mirror: o.mirror,
  custom: `fruit:${k}:${o.expr ?? "smile"}:${mouthAt(CLOCK, T, k)}:${o.pose ?? "down"}:${(o.look ?? 0).toFixed(1)}:${(o.walk ? (o.phase ?? T * 1.6) % 1 : 0).toFixed(2)}:${o.walk ? 1 : 0}` as `fruit:${string}`,
  seed: k.length,
});

// ---- places (hall local coords) ----
const ARCH = H(0, 0.0, -5.2), DOOR = H(9.6, 0.0, -3.0), CAKE = H(7.2, 0.0, 4.6);
const LAGER_GIRL = H(12.4, 0.0, -3.1);
const lagerVideo = (t: number, T0: number): Stage => {
  const g = glide(t, T0, T0 + 4, H(10.55, 0.98, -2.4), H(10.75, 0.94, -2.6), H(12.4, 0.85, -3.2), H(12.4, 0.8, -3.2));
  return { ...base("hall", "lager", "lager"), cam: { pos: [g.pos[0] + 0.02 * Math.sin(t * 7), g.pos[1] + 0.015 * Math.sin(t * 5.3), g.pos[2]], look: g.look, fov: 44, roll: 2 * Math.sin(t * 0.9) },
    focus: 2, cInf: 6, props: { door: 0 }, filter: "contrast(1.15) saturate(0.7) brightness(0.9)",
    cast: [fruit("erd", LAGER_GIRL, { expr: "cry", pose: "shock", look: -0.5 })] };
};
const bedroom = (t: number, T0: number, T1: number, expr: string, close: number, pose = "phone"): Stage => {
  const far: V3 = R(0.9, 1.62, 0.8), near: V3 = R(0.35, 1.48, -0.45);
  const g = glide(t, T0, T1, mixV(far, near, close), mixV(far, near, Math.min(1, close + 0.3)), R(0.05, 1.32, -1.6), R(0.05, 1.35, -1.6));
  return { ...base("room", "roomPhone", "room"), room: { curtains: 1, phone: 0 }, cam: { ...g, fov: 40, roll: 0 }, focus: 2, cInf: 10,
    cast: [fruit("erd", R(0.05, 0.55, -1.55), { expr, pose })] };
};

type ShotFn = (t: number, c: Clock, T0: number, T1: number) => Stage;
type Shot = { from: string; at?: (c: Clock) => number; fn: ShotFn };
export const SHOTS: Shot[] = [
  // HOOK: the future video on her phone (overlay frame), then her face
  { from: "h1", fn: (t, c, T0) => lagerVideo(t, T0) },
  { from: "h2", fn: (t, c, T0, T1) => ({ ...bedroom(t, T0, T1, "shock", 0.2), zoom: 1 + 0.06 * ss((t - T0) / 0.25) }) },
  { from: "h3", fn: (t, c, T0, T1) => bedroom(t, T0, T1, t > c.wordOf("h3", "einsperrte") ? "cry" : "shock", 0.6) },
  // 12 hours earlier: the hall by day
  { from: "z1", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, H(-6, 4.5, 6.5), H(-3, 3.2, 5), H(0, 1.17, -4), H(0, 1.01, -4));
    return { ...base("hall", "hallDay", "day"), cam: { ...g, fov: 50, roll: 0 }, focus: 8, cInf: 0,
      cast: [fruit("erd", H(-0.8, 0.0, -3.8), { expr: "happy", pose: "wave" }), fruit("kiwi", H(1.6, 0.0, -3.4), { expr: "smile", pose: "hold" })] };
  } },
  { from: "e1", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, H(-0.4, 1.25, -0.6), H(-0.6, 1.13, -1.3), H(-0.8, 0.94, -3.8), H(-0.8, 0.98, -3.8));
    return { ...base("hall", "hallDay", "day"), cam: { ...g, fov: 40, roll: -2 }, focus: 2.4, cInf: 10, cast: [fruit("erd", H(-0.8, 0.0, -3.8), { expr: "happy", pose: "wave" })] };
  } },
  { from: "m1", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, H(0.6, 1.17, -0.4), H(0.4, 1.13, -0.9), H(0.2, 0.9, -3.6), H(0.2, 0.9, -3.6));
    return { ...base("hall", "hallDay", "day"), cam: { ...g, fov: 42, roll: 0 }, focus: 3, cInf: 9,
      cast: [fruit("erd", H(-0.6, 0.0, -3.8), { expr: "smile", look: 1 }), fruit("mango", H(0.9, 0.0, -3.6), { expr: "smile", look: -1, pose: "hips" })] };
  } },
  { from: "e1b", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, H(-0.2, 1.05, -1.6), H(-0.3, 1.01, -2.0), H(-0.6, 0.94, -3.8), H(-0.6, 0.94, -3.8));
    return { ...base("hall", "hallDay", "day"), cam: { ...g, fov: 40, roll: 0 }, focus: 2, cInf: 11,
      cast: [fruit("erd", H(-0.6, 0.0, -3.8), { expr: "happy", look: 1 }), fruit("mango", H(0.9, 0.0, -3.6), { expr: "smile", look: -1, pose: "hips" })] };
  } },
  { from: "n1", fn: (t, c, T0, T1) => {
    const k = clamp01((t - T0 - 0.6) / (T1 - T0 - 0.6));
    const g = glide(t, T0, T1, H(-1.6, 1.17, -1.0), H(-1.2, 1.17, 0.4), H(0.9, 0.86, -3.4), H(1.8, 0.86, 2.5));
    return { ...base("hall", "hallDay", "day"), cam: { ...g, fov: 44, roll: 0 }, focus: 4, cInf: 7,
      cast: [fruit("erd", H(-0.6, 0.0, -3.8), { expr: "worried", look: 1 }), fruit("mango", H(0.9 + 0.6 * k, 0, -3.6 + 6.4 * k), { expr: "worried", pose: "phone", walk: k > 0 && k < 1 })] };
  } },
  { from: "k1", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, H(-6.6, 1.15, 1.8), H(-6.9, 1.1, 1.3), H(-8.5, 0.85, -0.8), H(-8.5, 0.85, -0.8));
    return { ...base("hall", "hallDay", "day"), cam: { ...g, fov: 42, roll: 0 }, focus: 2.8, cInf: 9,
      cast: [fruit("erd", H(-8.9, 0, -1.3), { expr: "worried", look: 1 }), fruit("kiwi", H(-8.1, 0, -0.3), { expr: "smile", look: -1, pose: "hold" })] };
  } },
  { from: "n2", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, H(-7.3, 1.0, 1.1), H(-7.45, 0.98, 0.85), H(-8.1, 0.85, -0.3), H(-8.1, 0.82, -0.3));
    return { ...base("hall", "hallDay", "day"), cam: { ...g, fov: 36, roll: -3 }, focus: 1.4, cInf: 13,
      cast: [fruit("kiwi", [H(-4.5, 0.0, -2.2)[0] + 0.012 * Math.sin(t * 60), 0, H(0, 0.0, -2.2)[2]], { expr: "worried", look: 1, pose: "hold" })] };
  } },
  { from: "b1", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, H(3.2, 1.1, 5.6), H(3.6, 1.05, 5.4), H(6.2, 0.9, 4.6), H(6.2, 0.9, 4.6));
    return { ...base("hall", "hallDay", "day"), cam: { ...g, fov: 46, roll: 0 }, focus: 2.6, cInf: 8, props: { cakeHalf: true },
      cast: [fruit("banane", H(5.7, 0, 4.4), { expr: "happy", pose: "wave", look: -1 })] };
  } },
  { from: "b2", fn: (t, c, T0, T1) => ({ ...base("hall", "hallDay", "day"), cam: { pos: H(4.5, 1.0, 5.6), look: H(5.9, 0.85, 5.7), fov: 36, roll: 0 }, focus: 1.5, cInf: 13, props: { cakeHalf: true },
    zoom: 1 + 0.08 * ss((t - T0) / 0.2), cast: [fruit("banane", H(5.9, 0, 5.7), { expr: "sly", pose: "hips", look: -1 })] }) },
  { from: "e2", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, H(2.6, 1.15, 4.6), H(2.9, 1.12, 4.8), H(5.4, 0.85, 5.9), H(5.4, 0.85, 5.9));
    return { ...base("hall", "hallDay", "day"), cam: { ...g, fov: 46, roll: 0 }, focus: 2.4, cInf: 8, props: { cakeHalf: true },
      cast: [fruit("erd", H(4.6, 0, 6.1), { expr: "happy", pose: "hips", look: 1 }), fruit("kiwi", H(5.2, 0, 6.5), { expr: "happy", look: 1 }), fruit("banane", H(5.9, 0, 5.7), { expr: "happy", look: -1 })] };
  } },
  // evening: the video arrives
  { from: "n3", fn: (t, c, T0, T1) => bedroom(t, T0, T1, "worried", 0.1) },
  { from: "h1b", fn: (t, c, T0) => lagerVideo(t, T0) },
  { from: "n4", fn: (t, c, T0, T1) => bedroom(t, T0, T1, t > c.wordOf("n4", "und") ? "shock" : "sad", 0.7) },
  { from: "e3", fn: (t, c, T0, T1) => {
    // inside the future video: zoom to the sign on the wall
    const k = ss((t - T0) / 1.6);
    return { ...lagerVideo(t, c.at("h1b")), cam: { pos: H(11.9, 1.25, -2.6), look: mixV(H(12.4, 0.9, -3.2), H(10.22, 1.97, -1.5), k), fov: 44 - 30 * k, roll: 0 } };
  } },
  // the question
  { from: "e4", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, H(2.6, 1.17, 1.0), H(2.2, 1.13, 0.4), H(3.6, 0.9, -1.6), H(3.6, 0.9, -1.6));
    return { ...base("hall", blendLook(LOOKS.hallDay, LOOKS.dusk, 0.6), "day"), cam: { ...g, fov: 42, roll: 0 }, focus: 3, cInf: 9, props: { fairy: 1.2 },
      cast: [fruit("erd", H(2.9, 0.0, -1.6), { expr: "worried", look: 1 }), fruit("mango", H(4.3, 0.0, -1.8), { expr: "neutral", look: -1 })] };
  } },
  { from: "m2", fn: (t, c, T0, T1) => ({ ...base("hall", blendLook(LOOKS.hallDay, LOOKS.dusk, 0.6), "day"), cam: { pos: H(3.75, 1.08, -0.4), look: H(4.3, 0.94, -1.8), fov: 38, roll: 2 }, focus: 1.5, cInf: 13, props: { fairy: 1.2 },
    cast: [fruit("mango", H(4.3, 0.0, -1.8), { expr: "smile", look: 1 })] }) },
  { from: "e4b", fn: (t, c, T0, T1) => ({ ...base("hall", blendLook(LOOKS.hallDay, LOOKS.dusk, 0.6), "day"), cam: { pos: H(3.3, 1.06, -0.3), look: H(2.9, 0.94, -1.6), fov: 38, roll: -2 }, focus: 1.4, cInf: 13, props: { fairy: 1.2 },
    cast: [fruit("erd", H(2.9, 0.0, -1.6), { expr: "worried", look: 1 })] }) },
  { from: "n5", fn: (t, c, T0, T1) => ({ ...base("hall", blendLook(LOOKS.hallDay, LOOKS.dusk, 0.6), "day"), cam: { pos: mixV(H(3.8, 1.08, -0.6), H(3.95, 1.06, -0.95), ss((t - T0) / (T1 - T0))), look: H(4.3, 0.95, -1.8), fov: 34, roll: 0 }, focus: 1.1, cInf: 14, props: { fairy: 1.2 },
    cast: [fruit("mango", H(4.3, 0.0, -1.8), { expr: "smile", look: -1 })] }) },
  // Kiwi in the bedroom; the key
  { from: "k2", fn: (t, c, T0, T1) => {
    void 0;
    const g = glide(t, T0, T1, R(0.9, 1.3, 1.6), R(0.75, 1.25, 1.3), R(-0.2, 0.9, -0.5), R(-0.2, 0.9, -0.5));
    return { ...base("room", "roomLamp", "room"), room: { curtains: 1, phone: 0 }, cam: { ...g, fov: 44, roll: 0 }, focus: 2.4, cInf: 9,
      cast: [fruit("erd", R(0.05, 0.55, -1.55), { expr: "worried", look: 1 }), fruit("kiwi", R(-0.35, 0, 0.1), { expr: "worried", look: 1, pose: "point" })] };
  } },
  { from: "n6", fn: (t, c, T0, T1) => {
    const k = clamp01((t - T0) / (T1 - T0 + 0.4)), drop = t > c.wordOf("n6", "fiel");
    const fx: FxCue[] = drop ? [{ kind: "key", x: R(-0.9, 0.0, 0)[0], y: 0.03, z: 1.0, w: 0.3, h: 0.16, flat: true, rot: 0.6 }] : [];
    return { ...base("room", "roomLamp", "room"), room: { curtains: 1, phone: 0 }, cam: { pos: R(0.6, 1.01, -0.6), look: R(-1.0, 0.6, 1.8), fov: 46, roll: 0 }, focus: 2.6, cInf: 7, fx,
      cast: [fruit("kiwi", R(-0.9, 0, 0.6 + 1.6 * k), { expr: "worried", walk: true, look: 1 })] };
  } },
  { from: "e5", fn: (t, c, T0, T1) => ({ ...base("room", "roomLamp", "room"), room: { curtains: 1, phone: 0 }, cam: { pos: mixV(R(-0.6, 0.7, 0.4), R(-0.75, 0.5, 0.75), ss((t - T0) / (T1 - T0))), look: R(-0.9, 0.0, 1.0), fov: 36, roll: 0 }, focus: 0.7, cInf: 14,
    fx: [{ kind: "key", x: R(-0.9, 0.0, 0)[0], y: 0.03, z: 1.0, w: 0.3, h: 0.16, flat: true, rot: 0.6 }] }) },
  { from: "e5b", fn: (t, c, T0, T1) => bedroom(t, T0, T1, "cold", 0.65, "hold") },
  // midnight in the hall
  { from: "n7", fn: (t, c, T0, T1) => {
    const k = clamp01((t - T0) / (T1 - T0 + 1));
    const g = glide(t, T0, T1, H(-3, 1.25, 6.8), H(0, 1.17, 5.2), H(2, 0.78, 0), H(6, 0.78, -2));
    return { ...base("hall", "hallNight", "night"), cam: { ...g, fov: 48, roll: 0 }, focus: 5, cInf: 6, props: { fairy: 0 },
      cast: [fruit("erd", H(1 + 4 * k, 0, 3.5 - 4 * k), { expr: "worried", pose: "hold", walk: true, look: 1 })] };
  } },
  { from: "e6", fn: (t, c, T0, T1) => ({ ...base("hall", "hallNight", "night"), cam: { pos: H(6.6, 1.05, -0.2), look: H(5.6, 0.94, -1.2), fov: 38, roll: -3 }, focus: 1.3, cInf: 13, props: { fairy: 0 },
    cast: [fruit("erd", H(5.6, 0.0, -1.2), { expr: "worried", pose: "hold", look: 1 })] }) },
  { from: "n7b", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, H(6.5, 1.09, 0.5), H(8.3, 1.01, -1.6), DOOR, DOOR);
    return { ...base("hall", "hallNight", "night"), cam: { pos: g.pos, look: [DOOR[0] + 0.4, 1.3, DOOR[2]], fov: 42, roll: 0 }, focus: 3, cInf: 8, props: { fairy: 0, door: 0 } };
  } },
  { from: "n8", fn: (t, c, T0, T1) => {
    const op = ss((t - T0 - 0.4) / 1.6);
    return { ...base("hall", "hallNight", "night"), cam: { pos: H(8.9, 1.05, -2.4), look: H(11.5, 0.86, -3.0), fov: 42, roll: 0 }, focus: 3, cInf: 6, props: { fairy: 0, door: op },
      cast: [fruit("erd", H(9.3, 0.0, -2.1), { expr: "worried", pose: "hold", look: 1 })] };
  } },
  { from: "n9", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, H(10.4, 1.01, -2.8), H(11.0, 0.94, -2.95), LAGER_GIRL, LAGER_GIRL);
    return { ...base("hall", "lager", "lager"), cam: { pos: g.pos, look: [LAGER_GIRL[0], 0.95, LAGER_GIRL[2]], fov: 42, roll: 0 }, focus: 1.6, cInf: 9, props: { door: 1 },
      cast: [fruit("erd2", LAGER_GIRL, { expr: "sad", look: -1 })] };
  } },
  { from: "x1", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, H(11.35, 0.94, -3.0), H(11.6, 0.9, -3.05), H(12.4, 0.82, -3.1), H(12.4, 0.84, -3.1));
    return { ...base("hall", "lager", "lager"), cam: { ...g, fov: 38, roll: 0 }, focus: 1.0, cInf: 14, props: { door: 1 },
      cast: [fruit("erd2", LAGER_GIRL, { expr: t > c.wordOf("x1", "dann") ? "cold" : "sly", look: -1, pose: t > c.wordOf("x1", "kiwi") ? "point" : "down" })] };
  } },
  { from: "e7", fn: (t, c, T0, T1) => {
    const turn = ss((t - c.end("e7")) / 0.35);
    return { ...base("hall", "lager", "lager"), cam: { pos: H(11.95, 0.94, -2.85), look: mixV(H(11.1, 0.86, -3.0), H(10.3, 0.94, -2.2), turn), fov: 40, roll: kick(t, c.end("e7"), 2) }, focus: 1.0, cInf: 12, props: { door: 1 },
      cast: [fruit("erd", H(11.2, 0.0, -3.0), { expr: "shock", pose: "shock", look: 1 })] };
  } },
  { from: "k3", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, c.end("k3") + 0.3, H(11.5, 0.94, -2.85), H(11.1, 0.92, -2.6), H(10.35, 0.9, -2.3), H(10.35, 0.9, -2.3));
    return { ...base("hall", "lager", "lager"), cam: { ...g, fov: 40, roll: 0 }, focus: 1.0, cInf: 12, props: { door: 1 },
      cast: [fruit("kiwi", H(10.35, 0.0, -2.3), { expr: "cold", look: 0 })], flash: t > c.end("k3") + 0.35 ? 1 : 0, flashColor: "#000" };
  } },
];

export const shotAt = (c: Clock, t: number) => {
  CLOCK = c; T = t;
  const starts = SHOTS.map((s) => (s.at ? s.at(c) : c.at(s.from)) - 0.06);
  starts[0] = 0;
  let i = 0;
  while (i + 1 < SHOTS.length && t >= starts[i + 1]) i++;
  const T1 = i + 1 < SHOTS.length ? starts[i + 1] : c.t.total + 1.2;
  return { i, T0: starts[i], T1, stage: SHOTS[i].fn(t, c, starts[i], T1) };
};
