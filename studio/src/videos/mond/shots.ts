// Shot plan of "Was wäre, wenn der Mond verschwindet?". Every shot starts on a sentence of the voice-over (Clock),
// so a new voice take re-times the cut. A shot returns, for its local time, the camera, the look, the set and what
// is on stage (characters, effect cards, moon / sun in the sky, space and reef animation).
import * as THREE from "three";
import { Clock } from "./timing";
import { LOOKS, Look, LookId, blendLook } from "./looks";
import { SetId, SPACE, REEF, QUAY_Z, WATER_Y } from "./sets";
import { Cue, BEN, FISHER, WOLF } from "./chars";
import { FrontOpts } from "../bridge/toon";

export type V3 = [number, number, number];
export type FxCue = { kind: string; arg?: number; x: number; y: number; z: number; w: number; h: number; soft?: boolean; rot?: number };
export type Stage = {
  set: SetId; look: Look; gradeId: LookId;
  cam: { pos: V3; look: V3; fov: number; roll: number };
  focus: number; cInf: number;
  cast: Cue[]; fx: FxCue[];
  moon?: { dir: V3; size: number; pop?: number };          // sky moon: direction from the camera, angular size factor
  sunDisc?: { dir: V3; size: number };
  space?: { spin: number; tilt: number; wobble: number; bulge: number; moon: number; moonA: number };
  flash: number;                                            // white flash 0..1
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ss = (x: number) => { const u = clamp01(x); return u * u * u * (u * (u * 6 - 15) + 10); }; // smootherstep
const mixV = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
/** camera move from A to B over [t0, t1] with a smootherstep, plus a slow push toward the target (creep, %/s) */
const glide = (t: number, t0: number, t1: number, a: V3, b: V3, la: V3, lb: V3, creep = 0.03) => {
  const k = ss((t - t0) / Math.max(0.01, t1 - t0)), pos = mixV(a, b, k), look = mixV(la, lb, k);
  const c = Math.min(0.5, creep * Math.max(0, t - t0));
  return { pos: mixV(pos, look, c), look };
};
/** impact shake: flips sign every frame, decays over ~7 frames */
const kick = (t: number, at: number, amp = 0.06) => {
  const f = Math.round((t - at) * 30);
  return f < 0 || f > 7 ? 0 : amp * (f % 2 ? -1 : 1) * (1 - f / 8);
};

export const BEN_AT: V3 = [0, 0, QUAY_Z - 1.1];
const MOON_DIR: V3 = [0.78, 0.5, 0.85];
const ben = (front: FrontOpts, extra: Partial<Cue> = {}): Cue => ({ who: BEN, x: BEN_AT[0], y: 0, z: BEN_AT[2], front: { mode: "stand", ...front }, seed: 4, ...extra });

type ShotFn = (t: number, c: Clock, T0: number, T1: number) => Stage;
type Shot = { from: string; at?: (c: Clock) => number; fn: ShotFn };

const base = (set: SetId, look: LookId | Look, gradeId: LookId): Omit<Stage, "cam"> => ({
  set, look: typeof look === "string" ? LOOKS[look] : look, gradeId, focus: 10, cInf: 0, cast: [], fx: [], flash: 0,
});

export const SHOTS: Shot[] = [
  // 1 hook: Ben on the quay, back to the town, the big moon over the sea; slow push
  { from: "hook", fn: (t, c, T0) => {
    const g = glide(t, T0, T0 + 5, [-3.4, 1.0, -1.4], [-2.8, 1.05, -0.9], [4.5, 3.4, 5.6], [4.5, 3.5, 5.8], 0.015);
    return { ...base("town", "night", "night"), cam: { ...g, fov: 44, roll: 0 }, focus: 4.3, cInf: 9,
      cast: [ben({}, { side: true, sideOpts: { mode: "stand", expr: "smile" } })], moon: { dir: MOON_DIR, size: 1 } };
  } },
  // 2 "und plopp": looking up at the moon, it pops on the word "plopp"
  { from: "plopp", fn: (t, c, T0) => {
    const tp = c.wordOf("plopp", "plopp");
    const g = glide(t, T0, T0 + 3, [-1.2, 1.4, -0.6], [-1.1, 1.3, -0.4], [6, 18, 40], [6, 18.5, 40], 0.02);
    const pop = clamp01((t - tp) / 0.25);
    const fx: FxCue[] = t >= tp && t < tp + 0.6 ? [{ kind: "pop", arg: clamp01((t - tp) / 0.6), x: 0, y: 0, z: 0, w: 1, h: 1 }] : [];
    if (t >= tp && t < tp + 1.2) fx.push({ kind: "word:PLOPP!", x: 0, y: 0, z: 0, w: 1, h: 1 });
    return { ...base("town", "night", "night"), cam: { ...g, fov: 40, roll: kick(t, tp, 0.03) }, moon: { dir: [6.5, 17.3, 41.7], size: 1.25, pop }, fx,
      flash: t >= tp && t < tp + 0.15 ? 1 - (t - tp) / 0.15 : 0 };
  } },
  // 3 "Weg.": Ben close-up, shocked
  { from: "weg", fn: (t, c, T0) => {
    const g = glide(t, T0, T0 + 1, [0.2, 1.75, QUAY_Z + 1.8], [0.15, 1.75, QUAY_Z + 1.6], [0, 1.55, BEN_AT[2]], [0, 1.6, BEN_AT[2]], 0.03);
    return { ...base("town", "night", "night"), cam: { pos: add(g.pos, [kick(t, T0, 0.05), 0, 0]), look: g.look, fov: 38, roll: -2 }, focus: 2.6, cInf: 13,
      cast: [ben({ expr: "shock", look: 0 })] };
  } },
  // 4 "Erst mal passiert gar nichts": wide over the water back to the quiet town, stars, no moon
  { from: "nichts", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [3, 3.2, QUAY_Z + 16], [2, 3.0, QUAY_Z + 13.5], [-1, 2.4, -6], [-1, 2.6, -6], 0);
    return { ...base("town", "night", "night"), cam: { ...g, fov: 46, roll: 0 },
      cast: [ben({ expr: t > c.wordOf("nichts", "gar") ? "dazed" : "nervous", look: 1 })] };
  } },
  // 5 "Es ist dunkel. Richtig dunkel.": the light drains away, Ben close
  { from: "dunkel", fn: (t, c, T0) => {
    const k = ss((t - c.wordOf("dunkel", "dunkel")) / 1.2), k2 = ss((t - c.wordOf("dunkel", "richtig")) / 0.6);
    const L = blendLook(LOOKS.night, LOOKS.dark, 0.6 * k + 0.4 * k2);
    const g = glide(t, T0, T0 + 4, [-1.2, 1.6, QUAY_Z + 2.4], [-1.0, 1.65, QUAY_Z + 1.9], [0, 1.5, BEN_AT[2]], [0, 1.55, BEN_AT[2]], 0.03);
    return { ...base("town", L, "night"), cam: { ...g, fov: 40, roll: 3 }, focus: 3, cInf: 12, cast: [ben({ expr: "nervous", look: -1 })] };
  } },
  // 6 "rund hundertmal heller": the dark sky full of stars, tilt up from the rooftops
  { from: "hundert", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [-6, 1.2, QUAY_Z + 6], [-6, 1.4, QUAY_Z + 6], [-2, 6, -12], [-1, 22, -12], 0);
    return { ...base("town", "dark", "dark"), cam: { ...g, fov: 50, roll: 0 } };
  } },
  // 7 harbour morning: two fishermen scratch their heads
  { from: "hafen", fn: (t, c, T0) => {
    const g = glide(t, T0, T0 + 4, [-9.5, 1.7, QUAY_Z + 4.5], [-8.8, 1.7, QUAY_Z + 3.8], [-3, 1.2, QUAY_Z - 1], [-3, 1.3, QUAY_Z - 1], 0.02);
    const q = t > c.wordOf("hafen", "kratzen");
    return { ...base("town", "day", "day"), cam: { ...g, fov: 40, roll: 0 }, focus: 6, cInf: 8,
      cast: [
        { who: FISHER[0], x: -4.4, y: 0, z: QUAY_Z - 0.9, front: { mode: "stand", expr: q ? "nervous" : "neutral", headTilt: q ? 0.08 : 0 }, extras: q ? ["question"] : [], seed: 2 },
        { who: FISHER[1], x: -2.4, y: 0, z: QUAY_Z - 1.4, front: { mode: "stand", expr: q ? "dazed" : "neutral", headTilt: q ? -0.08 : 0 }, extras: q ? ["question"] : [], seed: 6 },
      ] };
  } },
  // 8 "Ebbe und Flut sind fast verschwunden": the tide gauge, water stuck at the same mark
  { from: "ebbe", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [-16.4, 0.6, QUAY_Z + 6.5], [-15.9, 0.4, QUAY_Z + 5.6], [-14, -0.9, QUAY_Z + 1.35], [-14, -1.0, QUAY_Z + 1.35], 0.02);
    return { ...base("town", "day", "day"), cam: { ...g, fov: 36, roll: 0 }, focus: 5.5, cInf: 8 };
  } },
  // 9 tides: the Earth from space with a water bulge; it shrinks to a third on "Drittel"
  { from: "gezeiten", fn: (t, c, T0, T1) => {
    const td = c.wordOf("gezeiten", "drittel");
    const g = glide(t, T0, T1, [0, 5, 44], [0, 4, 36], [0, 0, 0], [0, 0, 0], 0);
    const bulge = 1 - 0.66 * ss((t - c.wordOf("gezeiten", "ohne")) / 2.4) - 0.0 * ss(t - td);
    return { ...base("space", "space", "space"), cam: { pos: add(g.pos, SPACE.toArray() as V3), look: add(g.look, SPACE.toArray() as V3), fov: 40, roll: 0 },
      space: { spin: t * 0.25, tilt: 23.4, wobble: 0, bulge, moon: 0, moonA: 0 } };
  } },
  // 10 the reef: corals and fish
  { from: "korallen", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [0, 1.6, 7], [0.5, 1.4, 4], [0, 0.6, -6], [0.3, 0.6, -8], 0);
    return { ...base("reef", "reef", "reef"), cam: { pos: add(g.pos, REEF.toArray() as V3), look: add(g.look, REEF.toArray() as V3), fov: 50, roll: 0 },
      focus: 6, cInf: 7, fx: reefFx(t, false) };
  } },
  // 11 "Jetzt warten sie. Und warten.": a coral with sleepy eyes, a ticking clock
  { from: "warten", fn: (t, c, T0) => {
    const g = glide(t, T0, T0 + 3, [0.2, 1.0, 2.6], [0.1, 0.95, 2.2], [0, 0.55, 0], [0, 0.55, 0], 0.02);
    const lid = ss((t - c.wordOf("warten", "und")) / 0.6);
    return { ...base("reef", "reef", "reef"), cam: { pos: add(g.pos, REEF.toArray() as V3), look: add(g.look, REEF.toArray() as V3), fov: 42, roll: 0 },
      focus: 2.2, cInf: 12, fx: [...reefFx(t, true), { kind: "eyes", arg: 0.2 + 0.5 * lid, x: REEF.x, y: REEF.y + 0.5, z: REEF.z + 0.96, w: 0.7, h: 0.37 },
        { kind: "clock", arg: t * 8, x: REEF.x - 0.75, y: REEF.y + 1.55, z: REEF.z + 0.3, w: 0.6, h: 0.64 },
        ...(lid > 0.5 ? [{ kind: "zzz", arg: t, x: REEF.x + 0.7, y: REEF.y + 1.45, z: REEF.z + 0.4, w: 0.55, h: 0.48 }] : [])] };
  } },
  // 12 "Das wirklich Unheimliche kommt aber erst später.": dark quay, slow ominous push on Ben
  { from: "unheim", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [1.6, 1.2, QUAY_Z + 4.5], [0.8, 1.45, QUAY_Z + 2.4], [0, 1.4, BEN_AT[2]], [0, 1.55, BEN_AT[2]], 0);
    return { ...base("town", "dark", "dark"), cam: { ...g, fov: 40, roll: -3 }, focus: 3.5, cInf: 10, cast: [ben({ expr: "nervous", look: 1 })] };
  } },
  // 13 the moon keeps the axis steady like a hand on a spinning top
  { from: "kreisel", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [-14, 6, 26], [-10, 5, 22], [0, 0, 0], [0, 0, 0], 0);
    return { ...base("space", "space", "space"), cam: { pos: add(g.pos, SPACE.toArray() as V3), look: add(g.look, SPACE.toArray() as V3), fov: 46, roll: 0 },
      space: { spin: t * 1.2, tilt: 23.4, wobble: 0, bulge: 1, moon: 1, moonA: 0.6 + t * 0.35 } };
  } },
  // 14 without it the Earth tumbles
  { from: "taumeln", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [-10, 5, 22], [-8, 3, 20], [0, 0, 0], [0, 0, 0], 0);
    const gone = ss((t - T0) / 0.8), wob = ss((t - c.wordOf("taumeln", "taumeln")) / 1.0);
    return { ...base("space", "space", "space"), cam: { pos: add(g.pos, SPACE.toArray() as V3), look: add(g.look, SPACE.toArray() as V3), fov: 46, roll: 0 },
      space: { spin: t * 1.2, tilt: 23.4, wobble: 0.15 + 0.85 * wob, bulge: 0.34, moon: 1 - gone, moonA: 0.6 + t * 0.35 } };
  } },
  // 15 seasons go crazy: heat wave, then (on "eisige") ice winter
  { from: "jahresz", fn: (t, c, T0, T1) => {
    const cold = t >= c.wordOf("jahresz", "eisige") - 0.08;
    const g = cold
      ? glide(t, c.wordOf("jahresz", "eisige"), T1, [0.6, 1.6, QUAY_Z + 2.6], [0.4, 1.6, QUAY_Z + 2.1], [0, 1.45, BEN_AT[2]], [0, 1.5, BEN_AT[2]], 0.03)
      : glide(t, T0, T0 + 3, [-0.8, 1.5, QUAY_Z + 3.4], [-0.5, 1.55, QUAY_Z + 2.4], [0, 1.4, BEN_AT[2]], [0, 1.5, BEN_AT[2]], 0.03);
    const cast = [ben(cold ? { expr: "pained", look: 0 } : { expr: "dazed", look: 0 }, { extras: cold ? ["snow", "shiver"] : ["sweat"] })];
    return { ...base("town", cold ? "snow" : "hot", cold ? "snow" : "hot"), cam: { ...g, fov: 40, roll: cold ? -2 : 2 }, focus: 3, cInf: 11, cast,
      fx: cold ? snowFx(t) : [], sunDisc: cold ? undefined : { dir: [-0.3, 0.75, -1], size: 1.4 } };
  } },
  // 16 no more solar eclipses: Ben with eclipse glasses under the plain sun, disappointed
  { from: "finster", fn: (t, c, T0) => {
    const g = glide(t, T0, T0 + 3, [0.8, 0.7, QUAY_Z + 2.8], [0.6, 0.75, QUAY_Z + 2.3], [-0.3, 3.3, BEN_AT[2] - 3], [-0.3, 3.4, BEN_AT[2] - 3], 0.02);
    const sad = t > c.wordOf("finster", "nie");
    return { ...base("town", "day", "day"), cam: { ...g, fov: 44, roll: 0 }, focus: 3.4, cInf: 9,
      cast: [ben({ expr: sad ? "stern" : "smile", look: 0, headTilt: -0.05 }, { extras: ["glasses"] })], sunDisc: { dir: [-0.2, 0.62, -1], size: 1.1 } };
  } },
  // 17 Ben looks at the empty sky: "Na ja, wenigstens eine gute Nachricht."
  { from: "himmel", fn: (t, c, T0) => {
    const g = glide(t, T0, T0 + 5, [-3.4, 1.0, -1.4], [-2.6, 1.1, -0.7], [4.5, 3.4, 5.6], [4.5, 3.0, 5.8], 0.015);
    const grin = t > c.wordOf("himmel", "na");
    return { ...base("town", "dark", "dark"), cam: { ...g, fov: 42, roll: 0 }, focus: 4.3, cInf: 9,
      cast: [ben({}, { side: true, sideOpts: { mode: "stand", expr: grin ? "grin" : "neutral" } })] };
  } },
  // 18 the werewolf on the bench, out of work
  { from: "werwolf", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [7.6, 1.3, QUAY_Z + 3.2], [7.0, 1.25, QUAY_Z + 2.4], [5.5, 1.1, 0.6], [5.5, 1.15, 0.6], 0);
    return { ...base("town", "lamp", "dark"), cam: { ...g, fov: 40, roll: 0 }, focus: 3.2, cInf: 10,
      cast: [{ who: WOLF, x: 5.5, y: 0.02, z: 0.75, front: { mode: "sit", expr: "pained", look: 0 }, extras: ["wolf"], seed: 9 }],
      fx: [{ kind: "jobsign", x: 5.95, y: 0.6, z: 1.1, w: 0.62, h: 0.39, rot: -0.1 }] };
  } },
];

/** fish, light shafts and bubbles in the reef (world positions) */
const reefFx = (t: number, near: boolean): FxCue[] => {
  const out: FxCue[] = [];
  const fish: [number, number, number, number, string][] = [[-3, 1.2, -3, 0.8, "#ffb03a"], [2, 2.0, -6, 0.6, "#3ac3ff"], [-1, 2.6, -9, 0.7, "#ff5f7a"], [3.5, 1.0, -4, 0.5, "#ffe14a"], [-4, 2.2, -7, 0.9, "#8a6bff"]];
  fish.forEach(([x, y, z, sp, col], i) => {
    const xx = ((x + t * sp + 6) % 12) - 6;
    out.push({ kind: `fish:${col}`, arg: Math.sin(t * 8 + i), x: REEF.x + xx, y: REEF.y + y + 0.15 * Math.sin(t * 2 + i), z: REEF.z + z, w: 0.7, h: 0.38 });
  });
  for (let i = 0; i < 5; i++) out.push({ kind: "ray", x: REEF.x - 6 + i * 3.2, y: REEF.y + 6, z: REEF.z - 8 - i * 2, w: 2.2, h: 11, soft: true, rot: 0.2 });
  if (!near) for (let i = 0; i < 8; i++) out.push({ kind: "bubble", x: REEF.x + ((i * 1.7) % 6) - 3, y: REEF.y + ((t * 0.6 + i * 0.37) % 4), z: REEF.z - 2 - i * 0.4, w: 0.12, h: 0.12, soft: true });
  return out;
};
/** falling snow around the camera target */
const snowFx = (t: number): FxCue[] => {
  const out: FxCue[] = [];
  for (let i = 0; i < 60; i++) {
    const h = (i * 0.6180339) % 1, x = -3 + 6 * ((i * 0.37) % 1), z = QUAY_Z - 3 + 6 * h, y = 4 - ((t * (0.6 + h * 0.5) + i * 0.13) % 4.2);
    out.push({ kind: "flake", x, y, z, w: 0.06 + 0.05 * h, h: 0.06 + 0.05 * h, soft: true });
  }
  return out;
};

/** which shot plays at time t, its start / end */
export const shotAt = (c: Clock, t: number) => {
  const starts = SHOTS.map((s) => (s.at ? s.at(c) : c.at(s.from)) - 0.08);
  starts[0] = 0;
  let i = 0;
  while (i + 1 < SHOTS.length && t >= starts[i + 1]) i++;
  const T1 = i + 1 < SHOTS.length ? starts[i + 1] : c.t.total + 1.2;
  return { i, T0: starts[i], T1, stage: SHOTS[i].fn(t, c, starts[i], T1) };
};
export { WATER_Y };
export const tmpV = new THREE.Vector3();
