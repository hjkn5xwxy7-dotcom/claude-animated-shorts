// Light / colour presets of the moon short. One preset per shot (or a blend of two during a change of light):
// world two-tone colours (shade.ts TONE), character card tint (shade.ts CHAR), key light direction for shadows,
// sky gradient, fog, stars / moon / window glow, and the colour grade (grade.ts).
import * as THREE from "three";
import { GradeParams } from "../bridge/grade";

type C3 = [number, number, number];
export type Look = {
  lit: C3; shade: C3; lift: C3; sat: number;           // world two-tone
  charTint: C3; charShade: number;                      // character cards
  sun: C3;                                              // direction TOWARD the key light (world space, normalised later)
  skyTop: string; skyHor: string; fog: string; fogNear: number; fogFar: number;
  stars: number; windows: number; lamps: number;         // 0..1
  water: string; grade: GradeParams; gradeAmt: number; bloom: number;
};

const G = (ky: number[], sat: [number, number, number], tS: [number, number], tM: [number, number], tH: [number, number], vig: [number, number]): GradeParams =>
  ({ ky, sat, tintS: tS, tintM: tM, tintH: tH, vig });
const GDAY = G([0, 0.1, 0.28, 0.6, 0.835, 0.945, 1], [1.0, 1.08, 1.0], [0.01, 0.002], [0, 0], [0.006, 0], [0.12, 0.45]);
const GNIGHT = G([0, 0.09, 0.25, 0.55, 0.8, 0.93, 1], [0.95, 1.1, 1.0], [0.035, -0.01], [0.02, -0.01], [0, 0], [0.3, 0.38]);
const GHOT = G([0, 0.1, 0.29, 0.61, 0.84, 0.95, 1], [1.0, 1.15, 1.05], [-0.02, 0.03], [-0.03, 0.04], [-0.02, 0.02], [0.2, 0.42]);
const GHORROR = G([0, 0.07, 0.22, 0.5, 0.76, 0.9, 1], [0.8, 0.85, 0.9], [0.045, -0.02], [0.025, -0.015], [0, 0], [0.42, 0.32]);
const G70 = G([0.04, 0.13, 0.3, 0.58, 0.81, 0.92, 0.97], [0.85, 0.95, 0.9], [-0.02, 0.03], [-0.015, 0.02], [-0.02, 0.015], [0.3, 0.38]);
const G70N = G([0.02, 0.08, 0.23, 0.5, 0.76, 0.9, 0.97], [0.85, 0.95, 0.9], [0.03, -0.005], [-0.01, 0.02], [-0.02, 0.02], [0.42, 0.32]);
const GCOLD = G([0, 0.11, 0.3, 0.6, 0.83, 0.94, 1], [0.9, 0.85, 0.9], [0.04, -0.02], [0.03, -0.02], [0.01, -0.005], [0.2, 0.42]);

export const LOOKS = {
  /** moonlit night: cool blue key from the moon over the sea, warm windows */
  night: {
    lit: [0.62, 0.72, 1.05], shade: [0.13, 0.15, 0.3], lift: [0.03, 0.04, 0.1], sat: 0.9,
    charTint: [0.72, 0.78, 1.0], charShade: 0.8, sun: [0.15, 0.55, 1],
    skyTop: "#0b1638", skyHor: "#2c4a86", fog: "#20335f", fogNear: 30, fogFar: 260,
    stars: 0.7, windows: 1, lamps: 1, water: "#1b3f7a", grade: GNIGHT, gradeAmt: 1, bloom: 0.9,
  },
  /** no moon: much darker, only windows and lamps */
  dark: {
    lit: [0.16, 0.19, 0.32], shade: [0.06, 0.07, 0.15], lift: [0.02, 0.02, 0.06], sat: 0.8,
    charTint: [0.42, 0.46, 0.66], charShade: 0.8, sun: [0.15, 0.55, 1],
    skyTop: "#03060f", skyHor: "#0d1630", fog: "#0b1226", fogNear: 20, fogFar: 160,
    stars: 1, windows: 1, lamps: 1, water: "#0b1a38", grade: GNIGHT, gradeAmt: 1, bloom: 1.1,
  },
  /** dark night under a street lamp: warm light on the characters */
  lamp: {
    lit: [0.3, 0.27, 0.3], shade: [0.07, 0.07, 0.15], lift: [0.02, 0.02, 0.06], sat: 0.85,
    charTint: [0.95, 0.82, 0.66], charShade: 0.85, sun: [-0.3, 0.9, 0.2],
    skyTop: "#03060f", skyHor: "#0d1630", fog: "#0b1226", fogNear: 20, fogFar: 160,
    stars: 1, windows: 1, lamps: 1, water: "#0b1a38", grade: GNIGHT, gradeAmt: 1, bloom: 1.1,
  },
  /** horror street at night: cold, desaturated, close fog, the lamps make warm pools */
  creep: {
    lit: [0.2, 0.25, 0.4], shade: [0.05, 0.06, 0.13], lift: [0.02, 0.02, 0.06], sat: 0.7,
    charTint: [0.62, 0.66, 0.85], charShade: 0.8, sun: [0.2, 0.6, 1],
    skyTop: "#02040b", skyHor: "#0c1428", fog: "#0a1022", fogNear: 28, fogFar: 170,
    stars: 0.5, windows: 0.7, lamps: 1.5, water: "#0b1a38", grade: GHORROR, gradeAmt: 1, bloom: 1.2,
  },
  /** Ben's bedroom at night: moonlight through the window, almost no colour */
  room: {
    lit: [0.3, 0.36, 0.55], shade: [0.05, 0.06, 0.12], lift: [0.015, 0.02, 0.05], sat: 0.65,
    charTint: [0.55, 0.6, 0.8], charShade: 0.82, sun: [1, 0.35, -0.25],
    skyTop: "#02040b", skyHor: "#0c1428", fog: "#05070f", fogNear: 30, fogFar: 140,
    stars: 0.6, windows: 0.6, lamps: 1, water: "#0b1a38", grade: GHORROR, gradeAmt: 1, bloom: 1.2,
  },
  /** the same room, Ben's face lit by the phone */
  roomPhone: {
    lit: [0.3, 0.36, 0.55], shade: [0.05, 0.06, 0.12], lift: [0.015, 0.02, 0.05], sat: 0.65,
    charTint: [0.78, 0.88, 1.1], charShade: 0.86, sun: [1, 0.35, -0.25],
    skyTop: "#02040b", skyHor: "#0c1428", fog: "#05070f", fogNear: 30, fogFar: 140,
    stars: 0.6, windows: 0.6, lamps: 1, water: "#0b1a38", grade: GHORROR, gradeAmt: 1, bloom: 1.2,
  },
  /** Monday evening at the door: dusk */
  dusk: {
    lit: [1.05, 0.82, 0.78], shade: [0.2, 0.2, 0.34], lift: [0.04, 0.04, 0.1], sat: 0.95,
    charTint: [0.95, 0.85, 0.85], charShade: 0.86, sun: [-0.6, 0.25, 0.7],
    skyTop: "#3a3c6e", skyHor: "#e0977a", fog: "#9a7c8c", fogNear: 25, fogFar: 220,
    stars: 0.1, windows: 0.8, lamps: 0.8, water: "#2a4a7a", grade: GNIGHT, gradeAmt: 0.8, bloom: 0.9,
  },
  /** 1970s daylight: warm, slightly faded film */
  seventies: {
    lit: [1.5, 1.38, 1.15], shade: [0.32, 0.29, 0.33], lift: [0.07, 0.06, 0.07], sat: 0.85,
    charTint: [1.0, 0.94, 0.86], charShade: 0.86, sun: [-0.45, 0.75, 0.55],
    skyTop: "#6f97c4", skyHor: "#dcd3bf", fog: "#d6cdb8", fogNear: 40, fogFar: 380,
    stars: 0, windows: 0, lamps: 0, water: "#3f7f95", grade: G70, gradeAmt: 1, bloom: 0.5,
  },
  /** 1970s night: sodium-orange street light, deep shadows */
  seventiesNight: {
    lit: [0.55, 0.38, 0.22], shade: [0.06, 0.06, 0.12], lift: [0.03, 0.02, 0.04], sat: 0.8,
    charTint: [0.95, 0.72, 0.5], charShade: 0.82, sun: [0.3, 0.8, 0.4],
    skyTop: "#05060c", skyHor: "#1c1620", fog: "#141018", fogNear: 25, fogFar: 160,
    stars: 0.3, windows: 0.9, lamps: 1.4, water: "#141e33", grade: G70N, gradeAmt: 1, bloom: 1.1,
  },
  /** black void, one hard spotlight from above */
  stage: {
    lit: [1.3, 1.2, 1.05], shade: [0.03, 0.03, 0.05], lift: [0.0, 0.0, 0.01], sat: 0.85,
    charTint: [0.95, 0.9, 0.85], charShade: 0.7, sun: [0.1, 1, 0.25],
    skyTop: "#000000", skyHor: "#000000", fog: "#000000", fogNear: 2.5, fogFar: 9,
    stars: 0, windows: 0, lamps: 0, water: "#000000", grade: GHORROR, gradeAmt: 0.8, bloom: 0.8,
  },
  /** woods at dusk: cold, misty */
  woods: {
    lit: [0.5, 0.55, 0.6], shade: [0.1, 0.12, 0.16], lift: [0.03, 0.04, 0.06], sat: 0.7,
    charTint: [0.7, 0.75, 0.8], charShade: 0.8, sun: [-0.3, 0.6, 0.6],
    skyTop: "#3a4450", skyHor: "#8a9294", fog: "#7c8486", fogNear: 6, fogFar: 70,
    stars: 0, windows: 0, lamps: 0, water: "#3a4a5a", grade: GHORROR, gradeAmt: 0.8, bloom: 0.5,
  },
  /** the bedroom in the evening with the bedside lamp on */
  roomLamp: {
    lit: [0.95, 0.75, 0.55], shade: [0.12, 0.1, 0.16], lift: [0.04, 0.03, 0.05], sat: 0.9,
    charTint: [1.0, 0.86, 0.72], charShade: 0.84, sun: [-0.6, 0.7, -0.5],
    skyTop: "#02040b", skyHor: "#0c1428", fog: "#120d10", fogNear: 30, fogFar: 140,
    stars: 0.4, windows: 0.6, lamps: 1, water: "#0b1a38", grade: GNIGHT, gradeAmt: 0.8, bloom: 1.0,
  },
  /** the wedding hall by day: warm, glowing, soft */
  hallDay: {
    lit: [1.45, 1.32, 1.12], shade: [0.4, 0.33, 0.36], lift: [0.08, 0.06, 0.07], sat: 1.12,
    charTint: [1.0, 0.95, 0.9], charShade: 0.88, sun: [-0.6, 0.8, 0.3],
    skyTop: "#8fb4e6", skyHor: "#f6e1c2", fog: "#f3e2cb", fogNear: 30, fogFar: 160,
    stars: 0, windows: 0, lamps: 0, water: "#3f7f95", grade: GDAY, gradeAmt: 0.9, bloom: 0.9,
  },
  /** the hall at midnight: blue moonlight through the tall windows */
  hallNight: {
    lit: [0.28, 0.33, 0.55], shade: [0.05, 0.06, 0.12], lift: [0.02, 0.02, 0.06], sat: 0.75,
    charTint: [0.7, 0.75, 0.95], charShade: 0.82, sun: [-1, 0.5, 0.2],
    skyTop: "#02040b", skyHor: "#0c1428", fog: "#05070f", fogNear: 12, fogFar: 60,
    stars: 0, windows: 0, lamps: 0, water: "#0b1a38", grade: GHORROR, gradeAmt: 1, bloom: 1.2,
  },
  /** LAGER 3: one warm bulb, deep shadows */
  lager: {
    lit: [0.9, 0.66, 0.4], shade: [0.04, 0.04, 0.07], lift: [0.01, 0.01, 0.03], sat: 0.85,
    charTint: [0.95, 0.78, 0.6], charShade: 0.75, sun: [0.15, 1, 0.1],
    skyTop: "#000000", skyHor: "#000000", fog: "#050404", fogNear: 3, fogFar: 14,
    stars: 0, windows: 0, lamps: 0, water: "#000000", grade: GHORROR, gradeAmt: 0.9, bloom: 1.3,
  },
  /** bright harbour morning */
  day: {
    lit: [1.58, 1.5, 1.33], shade: [0.3, 0.29, 0.36], lift: [0.05, 0.06, 0.11], sat: 1.08,
    charTint: [1.0, 0.95, 0.93], charShade: 0.86, sun: [-0.45, 0.75, 0.55],
    skyTop: "#3e7fd2", skyHor: "#b8d0ec", fog: "#b8d0ec", fogNear: 40, fogFar: 420,
    stars: 0, windows: 0, lamps: 0, water: "#1f86b8", grade: GDAY, gradeAmt: 1, bloom: 0.5,
  },
  /** heat wave: orange sky, washed light */
  hot: {
    lit: [1.75, 1.35, 0.95], shade: [0.42, 0.28, 0.3], lift: [0.08, 0.04, 0.03], sat: 1.12,
    charTint: [1.0, 0.86, 0.72], charShade: 0.88, sun: [-0.2, 0.9, 0.4],
    skyTop: "#e8743a", skyHor: "#ffd28a", fog: "#ffc98a", fogNear: 25, fogFar: 260,
    stars: 0, windows: 0, lamps: 0, water: "#3a8fb0", grade: GHOT, gradeAmt: 1, bloom: 0.7,
  },
  /** ice winter: pale blue, snow */
  snow: {
    lit: [1.25, 1.35, 1.55], shade: [0.36, 0.42, 0.62], lift: [0.06, 0.08, 0.14], sat: 0.85,
    charTint: [0.88, 0.94, 1.0], charShade: 0.86, sun: [-0.4, 0.45, 0.6],
    skyTop: "#8fa7c8", skyHor: "#dfe7f0", fog: "#d5dfea", fogNear: 12, fogFar: 140,
    stars: 0, windows: 0.6, lamps: 0, water: "#5f7f9a", grade: GCOLD, gradeAmt: 1, bloom: 0.5,
  },
  /** outer space: hard white sunlight from the left, black-blue sky */
  space: {
    lit: [1.7, 1.65, 1.55], shade: [0.07, 0.08, 0.16], lift: [0.02, 0.03, 0.08], sat: 1.1,
    charTint: [1, 1, 1], charShade: 0.9, sun: [-1, 0.15, 0.35],
    skyTop: "#02030a", skyHor: "#070b1e", fog: "#000000", fogNear: 5000, fogFar: 9000,
    stars: 1, windows: 0, lamps: 0, water: "#1b3f7a", grade: GDAY, gradeAmt: 0.8, bloom: 1.0,
  },
  /** coral reef: blue water, light from above, strong blue fog */
  reef: {
    lit: [1.05, 1.35, 1.45], shade: [0.2, 0.32, 0.5], lift: [0.04, 0.1, 0.16], sat: 1.15,
    charTint: [0.85, 0.97, 1.0], charShade: 0.86, sun: [0.2, 1, 0.3],
    skyTop: "#2fa8d8", skyHor: "#0d5a8f", fog: "#1673a8", fogNear: 4, fogFar: 46,
    stars: 0, windows: 0, lamps: 0, water: "#1673a8", grade: GDAY, gradeAmt: 0.9, bloom: 0.6,
  },
} satisfies Record<string, Look>;
export type LookId = keyof typeof LOOKS;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const l3 = (a: C3, b: C3, t: number): C3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const lc = (a: string, b: string, t: number) => "#" + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
/** blend of two presets (t = 0 -> a, 1 -> b) */
export const blendLook = (a: Look, b: Look, t: number): Look => t <= 0 ? a : t >= 1 ? b : ({
  lit: l3(a.lit, b.lit, t), shade: l3(a.shade, b.shade, t), lift: l3(a.lift, b.lift, t), sat: lerp(a.sat, b.sat, t),
  charTint: l3(a.charTint, b.charTint, t), charShade: lerp(a.charShade, b.charShade, t), sun: l3(a.sun, b.sun, t),
  skyTop: lc(a.skyTop, b.skyTop, t), skyHor: lc(a.skyHor, b.skyHor, t), fog: lc(a.fog, b.fog, t),
  fogNear: lerp(a.fogNear, b.fogNear, t), fogFar: lerp(a.fogFar, b.fogFar, t),
  stars: lerp(a.stars, b.stars, t), windows: lerp(a.windows, b.windows, t), lamps: lerp(a.lamps, b.lamps, t),
  water: lc(a.water, b.water, t), grade: t < 0.5 ? a.grade : b.grade, gradeAmt: lerp(a.gradeAmt, b.gradeAmt, t), bloom: lerp(a.bloom, b.bloom, t),
});
