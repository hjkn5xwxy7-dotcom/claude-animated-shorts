// Shot plan of "Der Mann unter der Laterne" (horror, part 1). Ben tells it himself; every shot starts on a line of
// the voice track (timing.json). Places: the town street at night (Ben's house, the lamp posts along the quay) and
// Ben's ground-floor bedroom (ROOM). "Photo" shots are the 3D view framed by the post overlay (Overlays.tsx).
import { Clock } from "../mond/timing";
import { LOOKS, LookId, Look, blendLook } from "../mond/looks";
import { SetId, ROOM, QUAY_Z } from "../mond/sets";
import { Cue, BEN } from "../mond/chars";
import { Stage, V3, FxCue } from "../mond/shots";
import { FrontOpts } from "../bridge/toon";

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ss = (x: number) => { const u = clamp01(x); return u * u * u * (u * (u * 6 - 15) + 10); };
const mixV = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const R = (x: number, y: number, z: number): V3 => [ROOM.x + x, ROOM.y + y, ROOM.z + z];
const glide = (t: number, t0: number, t1: number, a: V3, b: V3, la: V3, lb: V3) => {
  const k = ss((t - t0) / Math.max(0.01, t1 - t0));
  return { pos: mixV(a, b, k), look: mixV(la, lb, k) };
};
const kick = (t: number, at: number, amp = 0.05) => { const f = Math.round((t - at) * 30); return f < 0 || f > 7 ? 0 : amp * (f % 2 ? -1 : 1) * (1 - f / 8); };
const base = (set: SetId, look: LookId | Look, gradeId: LookId): Omit<Stage, "cam"> =>
  ({ set, look: typeof look === "string" ? LOOKS[look] : look, gradeId, focus: 10, cInf: 0, cast: [], fx: [], flash: 0 });

// ---- places ----
const DOOR_X = 26.5, HOUSE_Z = -11;                    // Ben's front door (house front faces the quay)
const SPOT: V3 = [34, 0, 0.2];                         // where Ben takes his evening photo (looking -x along the lamps)
const LAMP = (lx: number): V3 => [lx + 0.5, 0, QUAY_Z - 1.3];
const PHOTO_CAM: V3 = [34.2, 1.55, 0.5], PHOTO_LOOK: V3 = [-20, 1.35, 1.2];
const WALL_WIN: V3 = [34.95, 3.7, HOUSE_Z];            // the first-floor window opposite (reflection)
const BED_BEN: V3 = R(0.05, 0.28, -1.55);
const WIN: V3 = R(2.2, 1.5, -0.8);
const OUT_CAM: V3 = R(4.7, 2.0, 0.1), OUT_LOOK: V3 = R(0, 0.75, -1.7);

const ben = (x: number, y: number, z: number, front: FrontOpts, extra: Partial<Cue> = {}): Cue =>
  ({ who: BEN, x, y, z, front: { mode: "stand", ...front }, seed: 4, ...extra });
const man = (p: V3, phone = false, tilt = 0): Cue => ({ who: BEN, x: p[0], y: p[1], z: p[2], custom: phone ? "manPhone" : "man", arg: tilt });
const sleeper = (t: number): FxCue => ({ kind: "sleeper", arg: (t * 0.25) % 1, x: ROOM.x + 0.5, y: 0.98, z: -1.35, w: 1.6, h: 0.67 });

type ShotFn = (t: number, c: Clock, T0: number, T1: number) => Stage;
type Shot = { from: string; at?: (c: Clock) => number; fn: ShotFn };

// bedroom shots
const roomStage = (look: LookId, curtains: number, phone: number) => ({ ...base("room", look, "room"), room: { curtains, phone } });
const outsidePhoto = (t: number, T0: number, curtains = 0): Stage => {
  const g = glide(t, T0, T0 + 6, OUT_CAM, mixV(OUT_CAM, OUT_LOOK, 0.12), OUT_LOOK, OUT_LOOK);
  return { ...roomStage("room", curtains, 0), cam: { ...g, fov: 34, roll: 0 }, focus: 4.2, cInf: 4, fx: [sleeper(t)], filter: "saturate(0.6) contrast(1.05)" };
};
const benInBed = (t: number, T0: number, expr: FrontOpts["expr"], push = 0.04): Stage => {
  const g = glide(t, T0, T0 + 6, R(0.75, 1.3, 0.75), R(0.6, 1.25, 0.4), R(0.0, 0.85, -1.5), R(0.0, 0.87, -1.5));
  return { ...roomStage("roomPhone", 0, 1), cam: { ...g, fov: 40, roll: -2 }, focus: 1.6, cInf: 12,
    cast: [ben(BED_BEN[0], BED_BEN[1], BED_BEN[2], { mode: "sit", expr, look: 0 }, { extras: ["phone"] })] };
};
// street "photo" view along the lamps (the man is optional, under a lamp)
const streetPhoto = (t: number, T0: number, manAt: V3 | null, zoom = 0, zoomTo?: V3): Stage => {
  const fov = 46 - zoom * 42;
  const look = zoomTo ? mixV(PHOTO_LOOK, zoomTo, ss(zoom * 1.4)) : PHOTO_LOOK;
  return { ...base("town", "creep", "creep"), cam: { pos: PHOTO_CAM, look, fov, roll: 0 }, focus: 30, cInf: 0,
    cast: manAt ? [man(manAt)] : [] };
};

export const SHOTS: Shot[] = [
  // ---------------- cold open: 03:12 ----------------
  { from: "c1", fn: (t, c, T0) => {
    const g = glide(t, T0, T0 + 5, R(0.9, 1.45, 0.9), R(0.7, 1.35, 0.6), R(-1.2, 0.6, -1.9), R(-1.1, 0.6, -1.9));
    return { ...roomStage("room", 0, t > T0 + 0.4 ? 1 : 0), cam: { ...g, fov: 44, roll: 0 }, focus: 3, cInf: 8, fx: [sleeper(t)] };
  } },
  { from: "c2", fn: (t, c, T0) => benInBed(t, T0, "nervous") },
  { from: "c3", fn: (t, c, T0) => outsidePhoto(t, T0) },
  { from: "c4", fn: (t, c, T0) => outsidePhoto(t, c.at("c3")) },
  { from: "c5", fn: (t, c, T0) => outsidePhoto(t, c.at("c3")) },
  { from: "c6", fn: (t, c, T0) => benInBed(t, T0, "stern") },
  // ---------------- Monday: the old phone ----------------
  { from: "m1", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [22.8, 1.7, -4.8], [23.6, 1.65, -5.6], [26.6, 1.35, -10.2], [26.8, 1.4, -10.2]);
    return { ...base("town", "dusk", "night"), cam: { ...g, fov: 40, roll: 0 }, focus: 5.5, cInf: 8,
      cast: [ben(DOOR_X - 0.55, 0, HOUSE_Z + 0.7, { expr: "smile", look: 1 }, { extras: ["phone"] }), man([DOOR_X + 0.75, 0, HOUSE_Z + 1.9])] };
  } },
  { from: "m2", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, [25.6, 1.75, -6.6], [25.8, 1.8, -7.0], [27.25, 1.85, -9.1], [27.25, 1.9, -9.1]);
    return { ...base("town", "dusk", "night"), cam: { ...g, fov: 34, roll: 2 }, focus: 2.6, cInf: 13,
      cast: [man([DOOR_X + 0.75, 0, HOUSE_Z + 1.9], true, -0.3)] };
  } },
  { from: "m3", fn: (t, c, T0) => {
    if (t < c.wordOf("m3", "laternen") - 0.1) {
      const g = glide(t, T0, T0 + 4, [37.5, 1.3, 3.6], [37.0, 1.35, 3.2], [33.6, 1.3, 0.2], [33.6, 1.35, 0.2]);
      return { ...base("town", "creep", "creep"), cam: { ...g, fov: 42, roll: 0 }, focus: 4.6, cInf: 9,
        cast: [ben(SPOT[0], 0, SPOT[2], { expr: "neutral", look: -1 }, { extras: ["phone"] })] };
    }
    return streetPhoto(t, T0, null);
  } },
  // ---------------- Tuesday: the comment ----------------
  { from: "d1", fn: (t, c, T0) => streetPhoto(t, T0, LAMP(-18)) },
  { from: "d2", fn: (t, c, T0) => streetPhoto(t, T0, LAMP(-18), ss((t - c.wordOf("d2", "zoome")) / 1.6) * 0.95, [-17.5, 1.15, 1.7]) },
  { from: "d3", fn: (t, c, T0) => {
    const g = glide(t, T0, T0 + 4, [34.6, 1.62, 2.1], [34.5, 1.64, 1.8], [34, 1.55, 0.2], [34, 1.57, 0.2]);
    return { ...base("town", "creep", "creep"), cam: { ...g, fov: 40, roll: -2 }, focus: 1.9, cInf: 12,
      cast: [ben(SPOT[0], 0, SPOT[2], { expr: "neutral", look: 1 }, { extras: ["phone"] })] };
  } },
  { from: "d4", fn: (t, c, T0) => {
    return { ...base("town", "creep", "creep"), cam: { pos: [34.45, 1.65, 1.45], look: [34, 1.6, 0.2], fov: 36, roll: 0 }, focus: 1.35, cInf: 14,
      cast: [ben(SPOT[0], 0, SPOT[2], { expr: "stern", look: 0 }, { extras: ["phone"] })], zoom: 1.0 + 0.08 * ss((t - T0) / 0.2) };
  } },
  // ---------------- Wednesday: two lamps closer ----------------
  { from: "w1", fn: (t, c, T0) => streetPhoto(t, T0, LAMP(4)) },
  { from: "w2", fn: (t, c, T0) => streetPhoto(t, T0, LAMP(4), ss((t - T0) / 1.0) * 0.6, [4.5, 1.3, 1.7]) },
  { from: "w3", fn: (t, c, T0) => {
    const g = glide(t, T0, T0 + 5, [34.3, 1.62, 1.6], [34.25, 1.6, 1.3], [33.9, 1.4, 0.2], [33.9, 1.38, 0.2]);
    return { ...base("town", "creep", "creep"), cam: { ...g, fov: 38, roll: 1 }, focus: 1.5, cInf: 13,
      cast: [ben(SPOT[0], 0, SPOT[2], { expr: "stern", look: 0, headTilt: 0.06 }, { extras: ["phone"] })] };
  } },
  // ---------------- Thursday: the window ----------------
  { from: "t1", fn: (t, c, T0) => {
    // Ben's phone at the house front opposite
    return { ...base("town", "creep", "creep"), cam: { pos: [34.6, 1.6, -6.4], look: [34.95, 3.4, HOUSE_Z], fov: 50, roll: 0 }, focus: 6, cInf: 0 };
  } },
  { from: "t2", fn: (t, c, T0) => {
    const tr = c.wordOf("t2", "in");
    if (t < tr - 0.05) {
      const k = ss((t - T0) / 1.8);
      return { ...base("town", "creep", "creep"), cam: { pos: [34.6, 1.6, -6.4], look: mixV([34.95, 3.4, HOUSE_Z], WALL_WIN, k), fov: 50 - 32 * k, roll: 0 }, focus: 6, cInf: 0 };
    }
    return reflection(t, tr, null);
  } },
  { from: "t3", fn: (t, c, T0) => reflection(t, c.wordOf("t2", "in"), [34.2, 0, 0.6]) },
  { from: "t4", fn: (t, c, T0) => ({ ...reflection(t, c.wordOf("t2", "in"), [34.7, 0, -6.3], 0.5), flash: t < T0 + 0.08 ? 0.6 : 0, flashColor: "#fff" }) },
  // ---------------- Friday ----------------
  { from: "f1", fn: (t, c, T0, T1) => {
    // the bedroom in the evening: door (locked twice), then the tilted window
    const k = ss((t - c.wordOf("f1", "fenster")) / 1.2);
    const g = glide(t, T0, T0 + 0.1, R(0.6, 1.5, -0.6), R(0.6, 1.5, -0.6), R(-1.15, 1.1, 2.4), R(-1.15, 1.1, 2.4));
    const look = mixV(g.look, WIN, k);
    return { ...roomStage("room", 0, 0), look: blendLook(LOOKS.room, LOOKS.dusk, 0.35), cam: { pos: g.pos, look, fov: 46, roll: 0 }, focus: 3, cInf: 6 };
  } },
  // ---------------- back to 03:12 ----------------
  { from: "p1", fn: (t, c, T0) => benInBed(t, T0, "nervous") },
  { from: "p2", fn: (t, c, T0) => outsidePhoto(t, T0) },
  { from: "p3", fn: (t, c, T0, T1) => {
    // Ben's eyes turn slowly from the phone to the window
    const k = ss((t - T0) / Math.max(1, T1 - T0 - 0.4));
    const pos = R(0.05, 1.12, -1.25);
    return { ...roomStage("roomPhone", 1, 1), cam: { pos, look: mixV(R(0.0, 0.85, 0.2), WIN, k), fov: 44, roll: 3 * k }, focus: 2.4, cInf: 8 };
  } },
  { from: "p4", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, R(0.4, 1.3, -1.1), R(1.0, 1.4, -0.95), WIN, WIN);
    return { ...roomStage("room", 1, 1), cam: { ...g, fov: 40, roll: 0 }, focus: 1.6, cInf: 8 };
  } },
  { from: "p5", fn: (t, c, T0, T1) => {
    const g = glide(t, T0, T1, R(1.0, 1.4, -0.95), R(1.35, 1.45, -0.88), WIN, WIN);
    return { ...roomStage("room", 1, 1), cam: { ...g, fov: 40, roll: 0 }, focus: 1.2, cInf: 9 };
  } },
  // "Hallo, Ben." – behind him, in the dark
  { from: "man", at: (c) => c.at("man") - 0.35, fn: (t, c, T0) => {
    const te = c.end("man") + 0.25;
    const g = glide(t, T0, te, R(1.15, 1.35, 0.7), R(0.95, 1.3, 0.35), R(-0.4, 1.0, -1.7), R(-0.45, 1.02, -1.7));
    return { ...roomStage("roomPhone", 1, 1), cam: { pos: [g.pos[0] + kick(t, c.at("man"), 0.02), g.pos[1], g.pos[2]], look: g.look, fov: 40, roll: -2 }, focus: 1.7, cInf: 10,
      cast: [ben(BED_BEN[0], BED_BEN[1], BED_BEN[2], { mode: "sit", expr: "shock", look: 0 }, { extras: ["phone"] }), man(R(-0.95, 0, -1.95), false, 0.4)],
      flash: t >= te ? 1 : 0, flashColor: "#000" };
  } },
];

/** the reflection in the window opposite: the camera sits at the glass and looks back at Ben and the street;
 *  a cold glass tint is laid over it by the overlay */
function reflection(t: number, t0: number, manAt: V3 | null, push = 0): Stage {
  const k = ss((t - t0) / 3);
  const pos = mixV([34.95, 2.2, HOUSE_Z + 0.3], [34.85, 2.0, HOUSE_Z + 1.2 + push], k);
  return { ...base("town", "creep", "creep"), cam: { pos, look: [34.45, 1.1, -3.5], fov: 44, roll: 0 }, focus: 5, cInf: 4,
    cast: [ben(34.4, 0, -7.6, { expr: "smile", look: 0 }, { extras: ["phone"] }), ...(manAt ? [man(manAt)] : [])],
    filter: "saturate(0.55) brightness(1.35) contrast(1.05) blur(0.3px)" };
}

export const shotAt = (c: Clock, t: number) => {
  const starts = SHOTS.map((s) => (s.at ? s.at(c) : c.at(s.from)) - 0.06);
  starts[0] = 0;
  let i = 0;
  while (i + 1 < SHOTS.length && t >= starts[i + 1]) i++;
  const T1 = i + 1 < SHOTS.length ? starts[i + 1] : c.t.total + 1.2;
  return { i, T0: starts[i], T1, stage: SHOTS[i].fn(t, c, starts[i], T1) };
};
