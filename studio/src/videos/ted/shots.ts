// Shot plan of "Ich hieß Ted" (true crime, part 1). Ted Bundy tells it himself, calm and cold; the violence is never
// shown — it lives in cuts to objects (crowbar, handcuffs), darkness and silence. Victims appear alive, with their
// name cards (Overlays.tsx). Places: the town (Seattle / Utah streets, the lake shore), the bedroom set, the woods,
// the black confession stage.
import { Clock } from "../mond/timing";
import { LOOKS, LookId, Look, blendLook } from "../mond/looks";
import { SetId, ROOM, STAGE, WOODS, QUAY_Z } from "../mond/sets";
import { Cue, TED, TED_KID, WOMEN, COP, FISHER } from "../mond/chars";
import { Stage, V3, FxCue } from "../mond/shots";
import { FrontOpts, PARENT, townsfolk } from "../bridge/toon";

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ss = (x: number) => { const u = clamp01(x); return u * u * u * (u * (u * 6 - 15) + 10); };
const mixV = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const glide = (t: number, t0: number, t1: number, a: V3, b: V3, la: V3, lb: V3) => { const k = ss((t - t0) / Math.max(0.01, t1 - t0)); return { pos: mixV(a, b, k), look: mixV(la, lb, k) }; };
const kick = (t: number, at: number, amp = 0.05) => { const f = Math.round((t - at) * 30); return f < 0 || f > 7 ? 0 : amp * (f % 2 ? -1 : 1) * (1 - f / 8); };
const base = (set: SetId, look: LookId | Look, gradeId: LookId): Omit<Stage, "cam"> =>
  ({ set, look: typeof look === "string" ? LOOKS[look] : look, gradeId, focus: 10, cInf: 0, cast: [], fx: [], flash: 0 });
const S0 = STAGE.toArray() as V3, W0 = WOODS.toArray() as V3, R0 = ROOM.toArray() as V3;
const FILM = "sepia(0.18) contrast(1.06) saturate(0.9)";
const FLASHBACK = "sepia(0.75) contrast(1.05) brightness(0.95)";

const ted = (x: number, z: number, front: FrontOpts, extra: Partial<Cue> = {}): Cue => ({ who: TED, x, y: 0, z, front: { mode: "stand", ...front }, seed: 7, ...extra });
const woman = (i: number, x: number, z: number, front: FrontOpts = {}, extra: Partial<Cue> = {}): Cue =>
  ({ who: WOMEN[i % WOMEN.length], x, y: 0, z, front: { mode: "stand", expr: "smile", ...front }, extras: ["longhair"], seed: 11 + i, ...extra });

/** the confession stage: Ted on the chair under the spotlight */
const confession = (t: number, T0: number, T1: number, expr: FrontOpts["expr"], close = 0): Stage => {
  const far: V3 = add(S0, [0.4, 1.35, 3.6]), near: V3 = add(S0, [0.15, 1.2, 1.7]);
  const g = glide(t, T0, T1, mixV(far, near, close), mixV(far, near, Math.min(1, close + 0.35)), add(S0, [0, 1.0, 0]), add(S0, [0, 1.05, 0]));
  return { ...base("stage", "stage", "stage"), cam: { ...g, fov: 38, roll: 0 }, focus: g.pos[2] - S0[2], cInf: 9, filter: FILM,
    cast: [{ who: TED, x: S0[0], y: 0.05, z: S0[2] + 0.05, front: { mode: "sit", expr, look: 0 }, seed: 7 }] };
};
const crowd = (n: number, t: number): Cue[] => Array.from({ length: n }, (_, i) => {
  const x = -12 + ((i * 37) % 26), z = QUAY_Z - 0.6 - ((i * 13) % 9) * 0.5;
  return i % 3 === 0 ? woman(i + 1, x, z, { expr: "smile", look: (i % 3) - 1 }) : { who: townsfolk(i), x, y: 0, z, front: { mode: "stand", expr: i % 2 ? "smile" : "neutral", look: (i % 3) - 1 }, seed: 20 + i };
});

type ShotFn = (t: number, c: Clock, T0: number, T1: number) => Stage;
type Shot = { from: string; at?: (c: Clock) => number; fn: ShotFn };

export const SHOTS: Shot[] = [
  // ---- cold open: the confession chair ----
  { from: "c1", fn: (t, c, T0, T1) => confession(t, T0, T1 + 4, "smile", 0) },
  { from: "c2", fn: (t, c, T0, T1) => confession(t, c.at("c1"), T1 + 2, "smile", 0.2) },
  { from: "c3", fn: (t, c, T0, T1) => ({ ...confession(t, T0, T1, "neutral", 0.75), zoom: 1 + 0.04 * ss((t - c.wordOf("c3", "dreißig")) / 0.3) }) },
  // ---- childhood (flashback) ----
  { from: "k1", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [-9.5, 1.5, -2.5], [-8.6, 1.45, -3.6], [-5.8, 1.0, -9.6], [-5.8, 1.05, -9.6]);
    return { ...base("town", "seventies", "seventies"), cam: { ...g, fov: 40, roll: 0 }, focus: 6, cInf: 6, filter: FLASHBACK,
      cast: [{ who: TED_KID, x: -5.8, y: 0, z: -9.4, front: { mode: "stand", expr: "smile" }, seed: 3 },
        { who: PARENT, x: -6.9, y: 0, z: -9.8, front: { mode: "stand", expr: "smile", look: 1 }, seed: 5 }, { who: townsfolk(2), x: -4.7, y: 0, z: -9.9, front: { mode: "stand", expr: "neutral", look: -1 }, seed: 8 }] };
  } },
  { from: "k2", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [-6.6, 1.3, -6.8], [-6.5, 1.25, -7.3], [-6.2, 1.15, -9.6], [-6.2, 1.15, -9.6]);
    return { ...base("town", "seventies", "seventies"), cam: { ...g, fov: 40, roll: 0 }, focus: 2.5, cInf: 10, filter: FLASHBACK,
      cast: [{ who: TED_KID, x: -5.9, y: 0, z: -9.4, front: { mode: "stand", expr: "neutral", look: -1 }, seed: 3 }, woman(2, -6.7, -9.6, { expr: "smile", look: 1 })] };
  } },
  // ---- Seattle, 1 Feb 1974 ----
  { from: "s1", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [-9.2, 1.5, -2.6], [-11.2, 1.55, -5.0], [-14.5, 1.8, -11], [-14.5, 1.6, -11]);
    const walk = clamp01((t - T0 - 1.0) / (T1 - T0 - 1.0));
    return { ...base("town", "seventiesNight", "seventiesNight"), cam: { ...g, fov: 42, roll: 0 }, focus: 6, cInf: 5, filter: FILM,
      cast: [{ who: TED, x: -9.6 - 4.4 * walk, y: 0, z: -9.6, side: true, mirror: true, sideOpts: { mode: "march", phase: (t * 0.8) % 1, stride: 0.5, expr: "neutral" }, seed: 7 }] };
  } },
  { from: "s2", fn: (t, c, T0, T1) => {
    // the basement room: she sleeps, his shape in the door
    const R = (x: number, y: number, z: number): V3 => add(R0, [x, y, z]);
    const g = glide(t, T0, T1, R(0.9, 1.35, -1.9), R(0.8, 1.3, -1.5), R(-1.15, 1.1, 2.2), R(-1.15, 1.15, 2.2));
    const f: FxCue[] = [{ kind: "sleeperW", arg: (t * 0.25) % 1, x: R0[0] + 0.3, y: 0.98, z: -1.35, w: 1.6, h: 0.67 }];
    return { ...base("room", "room", "room"), room: { curtains: 1, phone: 0 }, cam: { ...g, fov: 46, roll: 0 }, focus: 4, cInf: 6, fx: f, filter: FILM,
      cast: [{ who: TED, x: R0[0] - 1.15, y: 0, z: 2.0, front: { mode: "stand", expr: "neutral", look: 0 }, seed: 7 }] };
  } },
  // ---- the method ----
  { from: "v1", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [8.2, 1.55, 3.0], [9.0, 1.5, 2.4], [11, 1.3, -1.2], [11, 1.35, -1.2]);
    return { ...base("town", "seventies", "seventies"), cam: { ...g, fov: 40, roll: 0 }, focus: 4, cInf: 8, filter: FILM, props: { beetle: [13.6, -3.0, 0] },
      cast: [ted(11, -1.2, { expr: "smile", look: 1 }, { extras: ["sling"] })] };
  } },
  { from: "v2", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [9.4, 1.5, 3.0], [10.2, 1.45, 2.2], [12, 1.2, -1.2], [12.6, 1.2, -1.8]);
    const drop = t > c.wordOf("v2", "bücher") + 0.2;
    const fx: FxCue[] = drop ? [{ kind: "books", x: 11.5, y: 0.03, z: -0.6, w: 0.6, h: 0.3, flat: true, rot: 0.4 }] : [];
    return { ...base("town", "seventies", "seventies"), cam: { ...g, fov: 40, roll: 0 }, focus: 4, cInf: 8, filter: FILM, props: { beetle: [13.6, -3.0, 0] }, fx,
      cast: [ted(11, -1.2, { expr: drop ? "nervous" : "smile", look: 1 }, { extras: drop ? ["sling"] : ["sling", "books"] }), woman(0, 12.4, -0.5, { expr: "smile", look: -1 })] };
  } },
  { from: "v3", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [15.6, 1.25, -0.6], [15.0, 1.2, -1.3], [13.6, 0.9, -3.0], [13.4, 0.85, -3.0]);
    return { ...base("town", blendLook(LOOKS.seventies, LOOKS.seventiesNight, 0.5), "seventies"), cam: { ...g, fov: 38, roll: 0 }, focus: 2.8, cInf: 10, filter: FILM, props: { beetle: [13.6, -3.0, 0] } };
  } },
  { from: "v4", fn: (t, c, T0, T1) => {
    const hit = c.wordOf("v4", "ich");
    const g = glide(t, T0, T1, [12.6, 0.55, -1.0], [12.8, 0.5, -1.3], [12.6, 0.0, -2.0], [12.7, 0.0, -2.0]);
    const fx: FxCue[] = [{ kind: "crowbar", x: 12.6, y: 0.03, z: -2.0, w: 1.0, h: 0.27, flat: true, rot: 0.3 }];
    if (t > c.wordOf("v4", "handschellen") - 0.1) fx.push({ kind: "cuffs", x: 12.2, y: 0.03, z: -1.75, w: 0.42, h: 0.23, flat: true, rot: -0.5 });
    return { ...base("town", "seventiesNight", "seventiesNight"), cam: { ...g, fov: 38, roll: kick(t, hit, 1.5) }, focus: 1.2, cInf: 12, filter: FILM, props: { beetle: [13.6, -3.0, 0] }, fx,
      flash: t >= hit && t < hit + 0.22 ? 1 : 0, flashColor: "#000" };
  } },
  { from: "v5", fn: (t, c, T0, T1) => {
    // nothing shown: the parked car on a forest road at night, very slow push
    const g = glide(t, T0, T1, add(W0, [5.5, 1.4, 9]), add(W0, [4.6, 1.35, 7.2]), add(W0, [0.3, 0.8, 0]), add(W0, [0.3, 0.8, 0]));
    return { ...base("woods", blendLook(LOOKS.woods, LOOKS.seventiesNight, 0.75), "seventiesNight"), cam: { ...g, fov: 40, roll: 0 }, focus: 8, cInf: 5, filter: FILM, props: { beetle: [0.3, 0, -1.4] } };
  } },
  { from: "v6", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, add(W0, [0.4, 1.6, 14]), add(W0, [0.2, 1.6, 4]), add(W0, [0, 1.4, -20]), add(W0, [0, 1.3, -24]));
    return { ...base("woods", "woods", "stage"), cam: { ...g, fov: 44, roll: 0 }, focus: 20, cInf: 0, filter: FILM };
  } },
  { from: "v7", fn: (t, c, T0, T1) => confession(t, T0, T1, "smile", 0.8) },
  // ---- Lake Sammamish, 14 July 1974 ----
  { from: "l1", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [-14, 3.2, 5.5], [-9, 3.0, 5.0], [0, 0.6, -2], [3, 0.6, -2]);
    return { ...base("town", "seventies", "seventies"), cam: { ...g, fov: 48, roll: 0 }, focus: 12, cInf: 0, filter: FILM, cast: crowd(14, t) };
  } },
  { from: "l2", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [0.8, 1.6, 3.4], [1.2, 1.55, 2.9], [2.5, 1.35, 1.2], [2.6, 1.4, 1.2]);
    return { ...base("town", "seventies", "seventies"), cam: { ...g, fov: 40, roll: 0 }, focus: 2.2, cInf: 10, filter: FILM,
      cast: [ted(2.0, 1.2, { expr: "smile", look: 1 }, { extras: ["sling"] }), woman(1, 3.1, 1.45, { expr: t > c.wordOf("l2", "kannst") ? "smile" : "neutral", look: -1 })] };
  } },
  { from: "l3", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [7.2, 1.6, 3.4], [7.6, 1.55, 2.9], [9.0, 1.35, 1.0], [9.1, 1.4, 1.0]);
    return { ...base("town", blendLook(LOOKS.seventies, LOOKS.dusk, 0.35), "seventies"), cam: { ...g, fov: 40, roll: 0 }, focus: 2.2, cInf: 10, filter: FILM,
      cast: [ted(8.5, 1.0, { expr: "smile", look: 1 }, { extras: ["sling"] }), woman(3, 9.6, 1.3, { expr: "smile", look: -1 })] };
  } },
  { from: "l4", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [14, 1.6, 3.2], [12, 1.6, 3.0], [12, 1.0, -3], [10, 1.0, -3]);
    return { ...base("town", blendLook(LOOKS.seventies, LOOKS.dusk, 0.35), "seventies"), cam: { ...g, fov: 44, roll: 0 }, focus: 6, cInf: 5, filter: FILM, props: { beetle: [13.6, -3.0, 0] },
      cast: crowd(8, t).map((q, i) => ({ ...q, x: q.x + 6, front: { ...q.front, look: 1, expr: "neutral" } })) };
  } },
  { from: "l5", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, add(W0, [3, 1.2, 6]), add(W0, [2.2, 1.1, 2.5]), add(W0, [8, 0.4, -6]), add(W0, [8, 0.3, -8]));
    return { ...base("woods", "woods", "stage"), cam: { ...g, fov: 42, roll: 0 }, focus: 9, cInf: 6, filter: FILM };
  } },
  // ---- Utah, November 1974 ----
  { from: "u1", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [-20, 6, 8], [-24, 5, 6], [-32, 2, -8], [-34, 2, -8]);
    return { ...base("town", "seventiesNight", "seventiesNight"), cam: { ...g, fov: 46, roll: 0 }, filter: FILM, props: { beetle: [-31, -4.5, 0.2] } };
  } },
  { from: "u2", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [-27.2, 1.6, -0.6], [-27.8, 1.58, -1.2], [-29.6, 1.35, -3.6], [-29.6, 1.38, -3.6]);
    return { ...base("town", "seventiesNight", "seventiesNight"), cam: { ...g, fov: 40, roll: 0 }, focus: 2.6, cInf: 10, filter: FILM, props: { beetle: [-31.5, -5.3, 0.2] },
      cast: [ted(-30.2, -3.7, { expr: "neutral", look: 1 }, { extras: ["badge"] }), woman(2, -29.0, -3.4, { expr: "nervous", look: -1 })] };
  } },
  { from: "u3", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [-29.2, 1.0, -3.0], [-29.4, 0.95, -3.4], [-30.4, 0.8, -4.6], [-30.5, 0.75, -4.6]);
    const fx: FxCue[] = [{ kind: "cuffs", x: -30.4, y: 0.95, z: -4.4, w: 0.42, h: 0.23 }];
    if (t > c.wordOf("u3", "brechstange")) fx.push({ kind: "crowbar", x: -30.6, y: 0.7, z: -4.5, w: 1.0, h: 0.27, rot: 0.5 });
    return { ...base("town", "seventiesNight", "seventiesNight"), cam: { ...g, fov: 38, roll: -2 }, focus: 1.6, cInf: 12, filter: FILM, props: { beetle: [-31.5, -5.3, 0.2] }, fx };
  } },
  { from: "u4", fn: (t, c, T0, T1) => {
    const run = clamp01((t - T0) / (T1 - T0));
    const g = glide(t, T0, T1, [-25.5, 1.4, 1.8], [-25.0, 1.4, 2.2], [-29, 1.0, -2], [-27, 1.0, -0.5]);
    return { ...base("town", "seventiesNight", "seventiesNight"), cam: { pos: add(g.pos, [kick(t, T0 + 0.1, 0.06), 0, 0]), look: g.look, fov: 44, roll: 0 }, focus: 4, cInf: 6, filter: FILM, props: { beetle: [-31.5, -5.3, 0.2] },
      cast: [{ ...woman(2, -30 + 5 * run, -3.4 + 4 * run), side: true, sideOpts: { mode: "march", phase: (t * 2.2) % 1, stride: 1.4, expr: "shock" }, extras: [] }] };
  } },
  { from: "u5", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [-34.5, 1.5, -3.2], [-35.2, 1.5, -4.2], [-38.1, 1.6, -11], [-38.1, 1.5, -11]);
    const walk = clamp01((t - T0) / (T1 - T0));
    return { ...base("town", "seventiesNight", "seventiesNight"), cam: { ...g, fov: 42, roll: 0 }, focus: 4.5, cInf: 8, filter: FILM, props: { beetle: [-33.2, -6.8, -0.4] },
      cast: [{ ...woman(3, -38.1 + 1.6 * walk, -9.8 + 1.0 * walk), side: true, sideOpts: { mode: "march", phase: (t * 0.9) % 1, stride: 0.6, expr: "smile" }, extras: [] },
        ted(-34.6, -7.6, { expr: "neutral", look: -1 })] };
  } },
  // ---- the arrest, August 1975 ----
  { from: "a1", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [-41.5, 1.4, 3.2], [-42.5, 1.4, 2.4], [-47, 1.0, -2], [-47.5, 1.0, -2]);
    return { ...base("town", "seventiesNight", "seventiesNight"), cam: { ...g, fov: 44, roll: 0 }, focus: 5, cInf: 6, filter: FILM, props: { beetle: [-46, -2.2, 0], police: [-51.6, -2.2, 0, t] },
      cast: [ted(-45.2, -0.6, { expr: "smile", look: -1 }), { who: COP, x: -47.0, y: 0, z: -0.4, front: { mode: "stand", expr: "stern", look: 1 }, seed: 9 }] };
  } },
  { from: "a2", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [-45.6, 1.3, 0.2], [-45.9, 1.2, -0.3], [-46, 0.05, -1.0], [-46, 0.05, -1.0]);
    const fx: FxCue[] = [];
    if (t > c.wordOf("a2", "brechstange") - 0.1) fx.push({ kind: "crowbar", x: -46.4, y: 0.03, z: -1.2, w: 0.9, h: 0.24, flat: true, rot: 0.1 });
    if (t > c.wordOf("a2", "handschellen") - 0.1) fx.push({ kind: "cuffs", x: -45.7, y: 0.03, z: -0.8, w: 0.38, h: 0.21, flat: true, rot: -0.4 });
    if (t > c.wordOf("a2", "eispickel") - 0.1) fx.push({ kind: "icepick", x: -46.0, y: 0.03, z: -0.55, w: 0.7, h: 0.2, flat: true, rot: 0.2 });
    return { ...base("town", "seventiesNight", "seventiesNight"), cam: { ...g, fov: 40, roll: 0 }, focus: 1.3, cInf: 10, filter: FILM, props: { beetle: [-46, -2.2, 0], police: [-51.6, -2.2, 0, t] }, fx };
  } },
  { from: "a3", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, add(S0, [5, 1.6, 3.2]), add(S0, [5, 1.62, 2.6]), add(S0, [5, 1.6, -1.6]), add(S0, [5, 1.62, -1.6]));
    return { ...base("stage", blendLook(LOOKS.stage, LOOKS.seventies, 0.5), "stage"), cam: { ...g, fov: 46, roll: 0 }, focus: 3, cInf: 4, filter: FILM, props: { lineup: true },
      cast: [-1.4, 0, 1.4].map((dx, i) => ({ who: i === 1 ? TED : FISHER[i % 2], x: S0[0] + 5 + dx, y: 0, z: S0[2] - 1.2, front: { mode: "stand", expr: i === 1 ? "neutral" : "stern" }, seed: 7 + i } as Cue)) };
  } },
  // ---- the window: cliffhanger ----
  { from: "a4", fn: (t, c, T0, T1) => {
    const tj = c.wordOf("a4", "sprang"), fall = clamp01((t - tj) / 0.7);
    const g = glide(t, T0, T1, [22.5, 0.7, -4.5], [23.2, 0.6, -5.6], [26.5, 3.2, -11], [26.5, 2.4, -11]);
    const y = 3.0 * (1 - fall * fall);
    const cast: Cue[] = t >= tj ? [{ who: TED, x: 26.5, y, z: -10.4, front: { mode: fall < 1 ? "fall" : "stand", expr: "neutral" }, seed: 7 }] : [];
    return { ...base("town", "seventies", "seventies"), cam: { ...g, fov: 44, roll: 0 }, focus: 6, cInf: 4, filter: FILM, cast,
      flash: t > c.end("a4") + 0.15 ? 1 : 0, flashColor: "#000" };
  } },
];

export const shotAt = (c: Clock, t: number) => {
  const starts = SHOTS.map((s) => (s.at ? s.at(c) : c.at(s.from)) - 0.06);
  starts[0] = 0;
  let i = 0;
  while (i + 1 < SHOTS.length && t >= starts[i + 1]) i++;
  const T1 = i + 1 < SHOTS.length ? starts[i + 1] : c.t.total + 1.2;
  return { i, T0: starts[i], T1, stage: SHOTS[i].fn(t, c, starts[i], T1) };
};
