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
export type FxCue = { kind: string; arg?: number; x: number; y: number; z: number; w: number; h: number; soft?: boolean; rot?: number; flat?: boolean };
export type Stage = {
  set: SetId; look: Look; gradeId: LookId;
  cam: { pos: V3; look: V3; fov: number; roll: number };
  focus: number; cInf: number;
  cast: Cue[]; fx: FxCue[];
  moon?: { dir: V3; size: number; pop?: number };          // sky moon: direction from the camera, angular size factor
  sunDisc?: { dir: V3; size: number };
  space?: { spin: number; tilt: number; wobble: number; bulge: number; moon: number; moonA: number };
  flash: number;                                            // white flash 0..1
  zoom?: number; filter?: string;                           // whole-frame punch zoom / CSS filter (freeze-frame gag)
  flashColor?: string;                                      // flash colour (default white; black = blackout)
  room?: { curtains: number; phone: number };               // bedroom set state
  props?: { beetle?: [number, number, number]; police?: [number, number, number, number]; lineup?: boolean; cakeHalf?: boolean; fairy?: number; door?: number }; // [x, z, yaw] / police: [x, z, yaw, t]
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
  // hook: Ben on the quay in profile, the big moon over the sea; slow push
  { from: "hook", fn: (t, c, T0) => {
    const g = glide(t, T0, T0 + 5, [-3.4, 1.0, -1.4], [-2.8, 1.05, -0.9], [4.5, 3.4, 5.6], [4.5, 3.5, 5.8], 0.015);
    return { ...base("town", "night", "night"), cam: { ...g, fov: 44, roll: 0 }, focus: 4.3, cInf: 9,
      cast: [ben({}, { side: true, sideOpts: { mode: "stand", expr: "smile" } })], moon: { dir: MOON_DIR, size: 1 } };
  } },
  // "Das ist Ben": Ben front, phone up, proud
  { from: "ben", fn: (t, c, T0) => {
    const g = glide(t, T0, T0 + 3, [0.25, 1.6, QUAY_Z + 2.3], [0.2, 1.62, QUAY_Z + 1.9], [0, 1.45, BEN_AT[2]], [0, 1.5, BEN_AT[2]], 0.03);
    return { ...base("town", "night", "night"), cam: { ...g, fov: 40, roll: -2 }, focus: 3, cInf: 12,
      cast: [ben({ expr: t > c.wordOf("ben", "wollte") ? "grin" : "smile", look: 1 }, { extras: ["phone"] })] };
  } },
  // "Drei. Zwei. Eins." through the phone at the moon; it pops right after "Eins"
  { from: "count", fn: (t, c, T0) => {
    const tp = c.end("count") + 0.18;
    const g = glide(t, T0, T0 + 3, [-1.2, 1.4, -0.6], [-1.1, 1.3, -0.4], [6, 18, 40], [6, 18.5, 40], 0.02);
    const pop = clamp01((t - tp) / 0.25);
    const fx: FxCue[] = t >= tp && t < tp + 0.6 ? [{ kind: "pop", arg: clamp01((t - tp) / 0.6), x: 0, y: 0, z: 0, w: 1, h: 1 }] : [];
    return { ...base("town", "night", "night"), cam: { ...g, fov: 40, roll: kick(t, tp, 0.03) }, moon: { dir: [6.5, 17.3, 41.7], size: 1.25, pop }, fx,
      flash: t >= tp && t < tp + 0.12 ? 0.8 * (1 - (t - tp) / 0.12) : 0 };
  } },
  // "... Okay.": freeze on Ben's face, punch zoom, desaturated
  { from: "okay", fn: (t, c, T0) => {
    return { ...base("town", "night", "night"), cam: { pos: [0.12, 1.66, QUAY_Z + 1.1], look: [0, 1.58, BEN_AT[2]], fov: 36, roll: 0 }, focus: 2.2, cInf: 13,
      cast: [ben({ expr: "shock", look: 0 }, { extras: ["phone"] })], zoom: 1.12 + 0.05 * ss((t - T0) / 0.15), filter: "saturate(0.35) contrast(1.1)" };
  } },
  // "Der Mond ist einfach offline.": wide over the water to the quiet town, Ben tiny, no moon
  { from: "offline", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [3, 3.2, QUAY_Z + 16], [2, 3.0, QUAY_Z + 13.5], [-1, 2.4, -6], [-1, 2.6, -6], 0);
    return { ...base("town", "night", "night"), cam: { ...g, fov: 46, roll: 0 }, cast: [ben({ expr: "dazed", look: 1 }, { extras: ["phone"] })] };
  } },
  // "Er postet das Foto trotzdem.": Ben deadpan, typing
  { from: "post", fn: (t, c, T0) => {
    const g = glide(t, T0, T0 + 4, [-0.6, 1.62, QUAY_Z + 2.0], [-0.5, 1.64, QUAY_Z + 1.7], [0, 1.5, BEN_AT[2]], [0, 1.52, BEN_AT[2]], 0.03);
    return { ...base("town", "night", "night"), cam: { ...g, fov: 40, roll: 2 }, focus: 2.8, cInf: 12,
      cast: [ben({ expr: "neutral", look: 1 }, { extras: ["phone"] })] };
  } },
  // "Dann wird es dunkel.": the light drains, Ben walks along the quay ... straight into the lamp post (in the pause)
  { from: "dunkel", fn: (t, c, T0, T1) => {
    const k = ss((t - T0) / 1.4);
    const L = blendLook(LOOKS.night, LOOKS.dark, k);
    const tb = c.end("dunkel") + 0.35;                         // bonk
    const walk = clamp01((t - (T0 + 0.6)) / (tb - T0 - 0.6));
    const x = -1.2 + 5.0 * walk - (t > tb ? 0.25 * ss((t - tb) / 0.2) : 0);
    const bonked = t >= tb;
    const g = glide(t, T0, tb, [0.6, 1.25, QUAY_Z + 5.2], [2.4, 1.3, QUAY_Z + 4.6], [0.4, 1.2, QUAY_Z - 0.9], [3.3, 1.25, QUAY_Z - 0.9], 0);
    const fx: FxCue[] = bonked ? [{ kind: "stars", arg: (t - tb) * 1.5, x: x, y: 2.15, z: QUAY_Z - 0.8, w: 0.9, h: 0.45 }] : [];
    const cast: Cue[] = [bonked
      ? { who: BEN, x, y: 0, z: QUAY_Z - 0.9, front: { mode: "stand", expr: "dazed", look: 0 }, seed: 4 }
      : { who: BEN, x, y: 0, z: QUAY_Z - 0.9, side: true, sideOpts: { mode: "march", phase: (t * 0.9) % 1, stride: 0.6, expr: "neutral" }, seed: 4 }];
    return { ...base("town", L, "night"), cam: { pos: add(g.pos, [kick(t, tb, 0.05), kick(t, tb, 0.03), 0]), look: g.look, fov: 42, roll: 0 },
      focus: 4.5, cInf: 8, cast, fx };
  } },
  // harbour morning: Fischer Hein waits for the tide
  { from: "hafen", fn: (t, c, T0) => {
    const g = glide(t, T0, T0 + 4, [-9.5, 1.7, QUAY_Z + 4.5], [-8.8, 1.7, QUAY_Z + 3.8], [-3, 1.2, QUAY_Z - 1], [-3, 1.3, QUAY_Z - 1], 0.02);
    return { ...base("town", "day", "day"), cam: { ...g, fov: 40, roll: 0 }, focus: 6, cInf: 8,
      cast: [{ who: FISHER[0], x: -3.4, y: 0, z: QUAY_Z - 0.9, front: { mode: "stand", expr: "neutral", look: 1 }, seed: 2 }],
      fx: [{ kind: "clock", arg: t * 3, x: -2.4, y: 2.35, z: QUAY_Z - 0.8, w: 0.42, h: 0.45 }] };
  } },
  // "Die Flut lässt ihn auf gelesen.": close on Hein (the chat card is a screen overlay)
  { from: "gelesen", fn: (t, c, T0) => {
    const g = glide(t, T0, T0 + 3, [-3.2, 1.62, QUAY_Z + 1.4], [-3.25, 1.64, QUAY_Z + 1.15], [-3.4, 1.5, QUAY_Z - 0.9], [-3.4, 1.52, QUAY_Z - 0.9], 0.02);
    return { ...base("town", "day", "day"), cam: { ...g, fov: 38, roll: -2 }, focus: 2.3, cInf: 13,
      cast: [{ who: FISHER[0], x: -3.4, y: 0, z: QUAY_Z - 0.9, front: { mode: "stand", expr: t > c.end("gelesen") ? "stern" : "nervous", look: 0 }, seed: 2 }] };
  } },
  // tides from space: the bulge shrinks to a third
  { from: "gezeiten", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [0, 5, 44], [0, 4, 36], [0, 0, 0], [0, 0, 0], 0);
    const bulge = 1 - 0.66 * ss((t - c.wordOf("gezeiten", "und")) / 1.6);
    return { ...base("space", "space", "space"), cam: { pos: add(g.pos, SPACE.toArray() as V3), look: add(g.look, SPACE.toArray() as V3), fov: 40, roll: 0 },
      space: { spin: t * 0.25, tilt: 23.4, wobble: 0, bulge, moon: 0, moonA: 0 } };
  } },
  // the reef
  { from: "korallen", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [0, 1.6, 7], [0.5, 1.4, 4], [0, 0.6, -6], [0.3, 0.6, -8], 0);
    return { ...base("reef", "reef", "reef"), cam: { pos: add(g.pos, REEF.toArray() as V3), look: add(g.look, REEF.toArray() as V3), fov: 50, roll: 0 },
      focus: 6, cInf: 7, fx: reefFx(t, false) };
  } },
  // "Jetzt weiß keiner mehr, wann.": the hero coral waits (group chat card is an overlay)
  { from: "warten", fn: (t, c, T0) => {
    const g = glide(t, T0, T0 + 3, [0.2, 1.0, 2.6], [0.1, 0.95, 2.2], [0, 0.55, 0], [0, 0.55, 0], 0.02);
    const lid = ss((t - c.end("warten")) / 0.6);
    return { ...base("reef", "reef", "reef"), cam: { pos: add(g.pos, REEF.toArray() as V3), look: add(g.look, REEF.toArray() as V3), fov: 42, roll: 0 },
      focus: 2.2, cInf: 12, fx: [...reefFx(t, true), { kind: "eyes", arg: 0.15 + 0.5 * lid, x: REEF.x, y: REEF.y + 0.5, z: REEF.z + 0.96, w: 0.7, h: 0.37 }] };
  } },
  // "Und dann wird es richtig unheimlich.": dark quay, slow push on Ben
  { from: "unheim", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [1.6, 1.2, QUAY_Z + 4.5], [0.8, 1.45, QUAY_Z + 2.4], [0, 1.4, BEN_AT[2]], [0, 1.55, BEN_AT[2]], 0);
    return { ...base("town", "dark", "dark"), cam: { ...g, fov: 40, roll: -3 }, focus: 3.5, cInf: 10, cast: [ben({ expr: "nervous", look: 1 })] };
  } },
  // the moon keeps the axis steady
  { from: "kreisel", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [-14, 6, 26], [-10, 5, 22], [0, 0, 0], [0, 0, 0], 0);
    return { ...base("space", "space", "space"), cam: { pos: add(g.pos, SPACE.toArray() as V3), look: add(g.look, SPACE.toArray() as V3), fov: 46, roll: 0 },
      space: { spin: t * 1.2, tilt: 23.4, wobble: 0, bulge: 1, moon: 1, moonA: 0.6 + t * 0.35 } };
  } },
  // without it the Earth tumbles
  { from: "taumeln", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [-10, 5, 22], [-8, 3, 20], [0, 0, 0], [0, 0, 0], 0);
    const gone = ss((t - T0) / 0.8), wob = ss((t - c.wordOf("taumeln", "taumeln")) / 1.0);
    return { ...base("space", "space", "space"), cam: { pos: add(g.pos, SPACE.toArray() as V3), look: add(g.look, SPACE.toArray() as V3), fov: 46, roll: 0 },
      space: { spin: t * 1.2, tilt: 23.4, wobble: 0.15 + 0.85 * wob, bulge: 0.34, moon: 1 - gone, moonA: 0.6 + t * 0.35 } };
  } },
  // summer: Ben melts
  { from: "sommer", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [-0.8, 1.5, QUAY_Z + 3.4], [-0.5, 1.45, QUAY_Z + 2.6], [0, 1.4, BEN_AT[2]], [0, 1.3, BEN_AT[2]], 0.03);
    const melt = ss((t - c.wordOf("sommer", "schmilzt")) / 1.2);
    return { ...base("town", "hot", "hot"), cam: { ...g, fov: 40, roll: 2 }, focus: 3, cInf: 11,
      cast: [ben({ expr: "dazed", look: 0 }, { extras: ["sweat"], sy: 1 - 0.22 * melt })], fx: melt > 0 ? [{ kind: "puddle", x: 0, y: 0.03, z: BEN_AT[2] + 0.1, w: 1.0 * melt + 0.2, h: 0.35, flat: true }] : [],
      sunDisc: { dir: [-0.3, 0.75, -1], size: 1.4 } };
  } },
  // winter: the cocoa is now a popsicle
  { from: "winter", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [0.6, 1.6, QUAY_Z + 2.6], [0.4, 1.6, QUAY_Z + 2.1], [0, 1.45, BEN_AT[2]], [0, 1.5, BEN_AT[2]], 0.03);
    return { ...base("town", "snow", "snow"), cam: { ...g, fov: 40, roll: -2 }, focus: 3, cInf: 11,
      cast: [ben({ expr: "pained", look: 0 }, { extras: ["snow", "shiver", "popsicle"] })], fx: snowFx(t) };
  } },
  // eclipses: cancelled (stamp overlay)
  { from: "finster", fn: (t, c, T0) => {
    const g = glide(t, T0, T0 + 3, [0.8, 0.7, QUAY_Z + 2.8], [0.6, 0.75, QUAY_Z + 2.3], [-0.3, 3.3, BEN_AT[2] - 3], [-0.3, 3.4, BEN_AT[2] - 3], 0.02);
    return { ...base("town", "day", "day"), cam: { ...g, fov: 44, roll: 0 }, focus: 3.4, cInf: 9,
      cast: [ben({ expr: "smile", look: 0, headTilt: -0.05 }, { extras: ["glasses"] })], sunDisc: { dir: [-0.2, 0.62, -1], size: 1.1 } };
  } },
  // "Ben hat die Brille schon gekauft ... 2081.": close on Ben, deadpan
  { from: "brille", fn: (t, c, T0) => {
    const g = glide(t, T0, T0 + 4, [0.15, 1.66, QUAY_Z + 1.6], [0.1, 1.66, QUAY_Z + 1.3], [0, 1.58, BEN_AT[2]], [0, 1.6, BEN_AT[2]], 0.02);
    return { ...base("town", "day", "day"), cam: { ...g, fov: 38, roll: 0 }, focus: 2.6, cInf: 13,
      cast: [ben({ expr: t > c.wordOf("brille", "für") ? "stern" : "neutral", look: 0 }, { extras: ["glasses"] })] };
  } },
  // werewolves are out of work
  { from: "werwolf", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [7.6, 1.3, QUAY_Z + 3.2], [7.0, 1.25, QUAY_Z + 2.4], [5.5, 1.1, 0.6], [5.5, 1.15, 0.6], 0);
    return { ...base("town", "lamp", "dark"), cam: { ...g, fov: 40, roll: 0 }, focus: 3.2, cInf: 10,
      cast: [{ who: WOLF, x: 5.5, y: 0.02, z: 0.75, front: { mode: "sit", expr: "pained", look: 0 }, extras: ["wolf"], seed: 9 }],
      fx: [{ kind: "jobsign", x: 5.95, y: 0.6, z: 1.1, w: 0.62, h: 0.39, rot: -0.1 }] };
  } },
  // the photo of the black sky blows up (likes overlay); Ben looks at his phone
  { from: "likes", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [-0.4, 1.62, QUAY_Z + 2.0], [-0.3, 1.64, QUAY_Z + 1.5], [0, 1.5, BEN_AT[2]], [0, 1.53, BEN_AT[2]], 0.03);
    return { ...base("town", blendLook(LOOKS.night, LOOKS.dark, 0.4), "night"), cam: { ...g, fov: 40, roll: -2 }, focus: 2.8, cInf: 12,
      cast: [ben({ expr: t > c.wordOf("likes", "zwei") ? "shock" : "neutral", look: 1 }, { extras: ["phone"] })] };
  } },
  // "Bester Post seines Lebens.": Ben, proud, slow push (end)
  { from: "bester", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [0.3, 1.62, QUAY_Z + 2.2], [0.2, 1.62, QUAY_Z + 1.6], [0, 1.5, BEN_AT[2]], [0, 1.55, BEN_AT[2]], 0.03);
    return { ...base("town", blendLook(LOOKS.night, LOOKS.dark, 0.4), "night"), cam: { ...g, fov: 40, roll: 0 }, focus: 2.8, cInf: 12,
      cast: [ben({ expr: "grin", look: 1 }, { extras: ["phone"] })] };
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
