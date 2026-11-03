// Cast of the moon short (recurring: Ben) and the hand-drawn effect cards. Characters are drawn with the bridge
// short's Pen / bodyFront / bodySide (toon.ts) on 600 x 1000 design canvases; extra drawings (glasses, sweat, snow,
// werewolf ears, question marks) are painted on top in the same design space.
import { Pen, bodyFront, bodySide, FrontOpts, SideOpts, Outfit, INK, Expr, fxBurst, fxStars } from "../bridge/toon";
export { fxStars };

export const BEN: Outfit = { jacket: "#e8613a", pants: "#2b3550", boots: "#f4f1ea", hat: "hair", hair: "#3b2a20" };
export const FISHER: Outfit[] = [
  { jacket: "#f2c230", pants: "#2f4f6f", boots: "#2b2b2b", hat: "cap", cap: "#1f4e79", moustache: "#5a4030", skin: "#f5c9a0", build: "stout" },
  { jacket: "#f2c230", pants: "#3b3f52", boots: "#2b2b2b", hat: "cap", cap: "#b8322c", skin: "#ecd0b6" },
];
/** Ted (1970s): brown corduroy jacket, light shirt, dark flared trousers, wavy dark-brown hair */
export const TED: Outfit = { jacket: "#7a5236", pants: "#2f3450", boots: "#3a2a20", hat: "hair", hair: "#3e2a1c", skin: "#f3d2b5", buttons: "#d9c7a0" };
export const TED_KID: Outfit = { jacket: "#4f7aa8", pants: "#5a4a3a", boots: "#3a2a20", hat: "hair", hair: "#5a3b22", build: "kid" };
/** young women, 1970s colours; long hair is the "longhair" extra */
export const WOMEN: Outfit[] = [
  { jacket: "#d9a441", pants: "#3b4f7a", boots: "#5a3b2a", hat: "hair", hair: "#6b4426", skin: "#f5d7c0" },
  { jacket: "#3f8f86", pants: "#e9e2d0", boots: "#7a5236", hat: "hair", hair: "#2e2018", skin: "#f1cdb0" },
  { jacket: "#c65a3a", pants: "#2f3a52", boots: "#3a2a20", hat: "hair", hair: "#b98a4a", skin: "#f7dcc6" },
  { jacket: "#8a6bb8", pants: "#4a3a2e", boots: "#2a2420", hat: "hair", hair: "#4a2c18", skin: "#efc9a8" },
];
export const COP: Outfit = { jacket: "#3b4a63", pants: "#2a3346", boots: "#111", hat: "cap", cap: "#1f2838", buttons: "#e2c25a", skin: "#eccbb0", moustache: "#5a4030", build: "stout" };
export const WOLF: Outfit = { jacket: "#5d5a6e", pants: "#3a3646", boots: "#2a2733", hat: "hair", hair: "#6f6b80", skin: "#a7a3b5", build: "stout" };

/** head centre / half width of an adult front drawing in design units (cardshade.ts zones) */
const HX = 300, HY = 309, HW = 118;

export type Extra = "glasses" | "sweat" | "snow" | "wolf" | "question" | "shiver" | "phone" | "popsicle" | "sling" | "longhair" | "books" | "badge";
let c_hair = "#5a3b22";
/** long hair behind the head and shoulders (drawn BEFORE the body) */
const drawUnder = (p: Pen, o: Outfit) => {
  c_hair = o.hair ?? "#5a3b22";
  p.poly([[HX - 132, HY - 60], [HX - 120, HY - 128], [HX, HY - 146], [HX + 120, HY - 128], [HX + 132, HY - 60], [HX + 150, HY + 150], [HX + 120, HY + 210], [HX - 120, HY + 210], [HX - 150, HY + 150]], c_hair, 9);
};
export const drawExtras = (p: Pen, ex: Extra[], t: number) => {
  const g = p.g;
  for (const e of ex) {
    if (e === "glasses") {
      p.poly([[HX - 104, HY - 22], [HX - 14, HY - 22], [HX - 20, HY + 22], [HX - 98, HY + 22]], "#15121c", 8);
      p.poly([[HX + 14, HY - 22], [HX + 104, HY - 22], [HX + 98, HY + 22], [HX + 20, HY + 22]], "#15121c", 8);
      p.stroke([[HX - 14, HY - 12], [HX + 14, HY - 12]], 8);
      g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(HX - 84, HY - 14, 22, 8); g.fillRect(HX + 34, HY - 14, 22, 8);
    } else if (e === "sweat") {
      for (const [dx, dy, s] of [[-150, -30, 1], [150, -60, 0.8], [-130, 50, 0.7]] as const) {
        const y = HY + dy + ((t * 60 * s) % 60);
        p.poly([[HX + dx, y - 34 * s], [HX + dx + 16 * s, y], [HX + dx, y + 14 * s], [HX + dx - 16 * s, y]], "#9fdcff", 6);
      }
    } else if (e === "snow") {
      p.ell(HX, HY - 108, 128, 36, "#ffffff", 8);
      p.ell(HX - 40, HY - 128, 50, 26, "#ffffff", 0); p.ell(HX + 50, HY - 124, 44, 22, "#ffffff", 0);
      for (const dx of [-60, 0, 60]) p.poly([[HX + dx - 8, HY + 60], [HX + dx + 8, HY + 60], [HX + dx, HY + 92]], "#dff4ff", 5); // icicles on the chin
    } else if (e === "wolf") {
      for (const s of [-1, 1]) {
        p.poly([[HX + s * 40, HY - 100], [HX + s * 110, HY - 190], [HX + s * 112, HY - 70]], "#6f6b80", 10);
        p.poly([[HX + s * 62, HY - 104], [HX + s * 102, HY - 160], [HX + s * 100, HY - 86]], "#e3a9b8", 0);
      }
      p.ell(HX, HY + 40, 34, 22, "#2a2733", 6); // nose
      for (const s of [-1, 1]) for (const k of [0, 1]) p.stroke([[HX + s * 60, HY + 50 + k * 16], [HX + s * 120, HY + 40 + k * 22]], 4); // whiskers
    } else if (e === "question") {
      g.save(); g.font = "bold 190px sans-serif"; g.textAlign = "center"; g.lineWidth = 14; g.strokeStyle = INK; g.fillStyle = "#ffffff";
      const y = HY - 150 - 10 * Math.sin(t * 5);
      g.strokeText("?", HX + 150, y); g.fillText("?", HX + 150, y); g.restore();
    } else if (e === "phone") {
      // raised right arm (screen left) holding a phone up at head height
      p.line([[HX - 92, HY + 225], [HX - 150, HY + 170], [HX - 170, HY + 95]], BEN.jacket, 26);
      p.poly([[HX - 220, HY + 10], [HX - 130, HY + 2], [HX - 124, HY + 150], [HX - 214, HY + 158]], "#20222c", 9);
      p.poly([[HX - 208, HY + 22], [HX - 140, HY + 16], [HX - 136, HY + 136], [HX - 203, HY + 142]], "#3a5fb0", 0);
      p.ell(HX - 170, HY + 95, 16, 16, "#ffe2c2", 6);
    } else if (e === "popsicle") {
      // the frozen cocoa: a brown popsicle on a stick, held at chest height
      p.line([[HX + 92, HY + 225], [HX + 140, HY + 250], [HX + 150, HY + 200]], BEN.jacket, 26);
      p.poly([[HX + 150, HY + 205], [HX + 162, HY + 205], [HX + 162, HY + 260], [HX + 150, HY + 260]], "#e9c99a", 6);
      p.poly([[HX + 118, HY + 70], [HX + 194, HY + 70], [HX + 194, HY + 200], [HX + 118, HY + 200]], "#6b3e22", 9);
      p.ell(HX + 156, HY + 72, 38, 12, "#dff4ff", 6);
      p.ell(HX + 150, HY + 205, 16, 16, "#ffe2c2", 6);
    } else if (e === "sling") {
      // left arm (screen right) in a white sling / cast across the chest
      p.poly([[HX + 60, HY + 250], [HX + 150, HY + 225], [HX + 40, HY + 400], [HX - 60, HY + 395]], "#f4f3ee", 9);
      p.line([[HX + 96, HY + 218], [HX - 40, HY + 360]], "#ffffff", 46);
      p.stroke([[HX - 70, HY + 170], [HX + 60, HY + 395]], 10, "#dcdad2");
    } else if (e === "books") {
      p.poly([[HX - 120, HY + 330], [HX + 20, HY + 320], [HX + 26, HY + 360], [HX - 116, HY + 372]], "#b8452f", 8);
      p.poly([[HX - 110, HY + 290], [HX + 30, HY + 282], [HX + 34, HY + 322], [HX - 108, HY + 330]], "#2f5d8a", 8);
    } else if (e === "badge") {
      p.poly([[HX - 200, HY + 210], [HX - 120, HY + 205], [HX - 118, HY + 300], [HX - 198, HY + 305]], "#2a2a2a", 7);
      p.poly([[HX - 182, HY + 228], [HX - 136, HY + 226], [HX - 140, HY + 280], [HX - 160, HY + 292], [HX - 180, HY + 280]], "#e2c25a", 6);
    } else if (e === "longhair") {
      // fringe on top (the long part is drawn under the body)
      p.poly([[HX - 120, HY - 40], [HX - 112, HY - 112], [HX, HY - 132], [HX + 112, HY - 112], [HX + 120, HY - 40], [HX + 40, HY - 78], [HX - 40, HY - 74]], c_hair, 8);
    } else if (e === "shiver") {
      for (const s of [-1, 1]) for (const k of [0, 1, 2]) p.stroke([[HX + s * (150 + k * 22), HY + 140 + k * 40], [HX + s * (170 + k * 22), HY + 170 + k * 40]], 7);
    }
  }
};

/** a character request: drawing key, the draw call, card scale */
export type Custom = "man" | "manPhone" | "sleeper" | `fruit:${string}`;
/** extra custom drawers registered by other stories (key = full custom string prefix before the first "|") */
export const EXTRA_CUSTOM: Record<string, (p: Pen, spec: string, blink: number) => void> = {};
export type Cue = {
  who: Outfit; side?: boolean; mirror?: boolean; x: number; y: number; z: number; scale?: number; sy?: number; custom?: Custom; arg?: number;
  front?: FrontOpts; sideOpts?: SideOpts; extras?: Extra[]; seed?: number;
};
/** design canvas key + draw for a cue (t = seconds, for animated extras) */
export const cueDraw = (c: Cue, t: number, blink: number) => {
  const ex = c.extras ?? [];
  const tq = ex.some((e) => e === "sweat" || e === "question") ? Math.round(t * 12) / 12 : 0;
  if (c.custom && c.custom.startsWith("fruit:")) {
    const spec = c.custom;
    return { key: `custom|${spec}|${blink}`, draw: (p: Pen) => EXTRA_CUSTOM.fruit(p, spec, blink) };
  }
  if (c.custom) {
    const a = Math.round((c.arg ?? 0) * 20) / 20;
    return { key: `custom|${c.custom}|${a}|${blink}`, draw: (p: Pen) => CUSTOM[c.custom as "man"](p, a, blink) };
  }
  const key = JSON.stringify([c.who, c.side ? c.sideOpts : c.front, ex, tq, blink, c.seed ?? 1]);
  const draw = (p: Pen) => {
    if (!c.side && ex.includes("longhair")) drawUnder(p, c.who);
    if (c.side) bodySide(p, c.who, { mode: "stand", ...c.sideOpts, blink, seed: c.seed ?? 3 });
    else bodyFront(p, c.who, { mode: "stand", ...c.front, blink, seed: c.seed ?? 3 });
    drawExtras(p, ex, t);
  };
  return { key, draw };
};

// ---------------- the man in the coat (never a face) and Ben asleep ----------------
const COAT = "#1d1c24", COAT_HI = "#2c2a36", VOID = "#050508";
/** the man: long coat, deep hood with a black void, hands in the pockets; 600 x 1000 design, soles at y 975.
 *  arg = head tilt (-1..1). */
const drawMan = (p: Pen, tilt: number, phone = false) => {
  const g = p.g;
  // legs + shoes under the coat hem
  p.poly([[262, 860], [292, 860], [290, 968], [256, 968]], "#15141b", 10);
  p.poly([[308, 860], [338, 860], [344, 968], [310, 968]], "#15141b", 10);
  p.poly([[236, 952], [292, 952], [294, 978], [232, 978]], "#0d0c12", 8);
  p.poly([[308, 952], [366, 952], [368, 978], [306, 978]], "#0d0c12", 8);
  // coat: narrow shoulders, long A-line to below the knee
  p.poly([[214, 420], [386, 420], [420, 600], [446, 878], [154, 878], [180, 600]], COAT, 12);
  g.save(); g.globalAlpha = 0.5; p.poly([[300, 430], [386, 420], [420, 600], [446, 878], [310, 878]], COAT_HI, 0); g.restore();
  p.stroke([[300, 450], [300, 870]], 6, "#0b0a10");
  for (const y of [520, 600, 680]) p.ell(316, y, 8, 8, "#3a3846", 0);
  // arms: sleeves down to the pockets (or one hand up with a phone)
  p.poly([[214, 430], [182, 600], [196, 700], [228, 700], [236, 560]], COAT, 10);
  if (phone) {
    p.poly([[386, 430], [440, 540], [404, 600], [378, 560]], COAT, 10);
    p.poly([[392, 560], [452, 556], [456, 650], [396, 654]], "#20222c", 8);
    p.ell(404, 600, 18, 18, "#d9c8b8", 6);
  } else p.poly([[386, 430], [418, 600], [404, 700], [372, 700], [364, 560]], COAT, 10);
  // hood: rounded peak, deep opening = flat black void, slight tilt
  g.save(); g.translate(300, 330); g.rotate(tilt * 0.12); g.translate(-300, -330);
  p.poly([[200, 430], [196, 330], [222, 250], [300, 205], [378, 250], [404, 330], [400, 430]], COAT, 12);
  p.ell(300, 345, 70, 86, VOID, 0);
  g.restore();
  // lamp light from above: a cold-warm rim on the hood crown and shoulders so the silhouette reads against the dark
  g.save(); g.globalAlpha = 0.85;
  p.stroke([[214, 300], [236, 240], [300, 210], [364, 240], [386, 300]], 12, "#8a7f74");
  p.stroke([[214, 426], [180, 600]], 9, "#6e655e"); p.stroke([[386, 426], [420, 600]], 9, "#6e655e");
  g.restore();
};
/** Ben asleep on his side under the duvet, head on the pillow (side view, 1000 x 420 canvas) */
export const drawSleeper = (p: Pen, breath: number) => {
  const b = 6 * Math.sin(breath * Math.PI * 2);
  p.poly([[60, 300], [70, 240], [140, 225], [220, 240], [228, 300]], "#e9edf3", 10);              // pillow
  p.ell(170, 222, 78, 72, "#ffe2c2", 10);                                                           // head
  p.poly([[96, 200], [120, 150], [190, 140], [246, 178], [248, 215], [200, 196], [130, 214]], BEN.hair!, 10); // hair
  p.stroke([[150, 232], [176, 236]], 6); p.stroke([[196, 228], [218, 232]], 6);                    // closed eyes
  p.poly([[230, 250 - b], [330, 205 - b], [600, 215 - b], [880, 250], [960, 300], [960, 380], [210, 380]], "#5d7fb8", 12); // duvet
  p.line([[300, 260 - b], [520, 250 - b], [760, 268]], "#4a6aa0", 6, false);
};
/** a young woman asleep, long hair over the pillow (same canvas as drawSleeper) */
export const drawSleeperW = (p: Pen, breath: number) => {
  const b = 6 * Math.sin(breath * Math.PI * 2);
  p.poly([[60, 300], [70, 240], [140, 225], [220, 240], [228, 300]], "#e9edf3", 10);
  p.poly([[40, 230], [80, 150], [190, 132], [262, 190], [270, 300], [160, 310], [60, 300]], "#6b4426", 10);
  p.ell(170, 226, 70, 66, "#f5d7c0", 10);
  p.poly([[104, 196], [130, 150], [200, 142], [248, 182], [236, 206], [190, 186], [130, 206]], "#6b4426", 0);
  p.stroke([[150, 236], [174, 240]], 6); p.stroke([[194, 232], [214, 236]], 6);
  p.poly([[230, 250 - b], [330, 210 - b], [600, 220 - b], [880, 250], [960, 300], [960, 380], [210, 380]], "#c9b48a", 12);
};
const CUSTOM: Record<Custom, (p: Pen, a: number, blink: number) => void> = {
  man: (p, a) => drawMan(p, a), manPhone: (p, a) => drawMan(p, a, true), sleeper: (p, a) => drawSleeper(p, a),
};

/** blink lid 0..1 for a character (4-frame blink every 0.5-2.3 s, deterministic) */
const LID = [0.5, 1, 1, 0.5];
const hh = (i: number) => { const v = Math.sin(i * 127.1) * 43758.5453; return v - Math.floor(v); };
export const lidAt = (f: number, who: number) => {
  let s = Math.round(10 + 40 * hh(who + 1));
  for (let n = 0; s <= f && n < 2000; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 54 * hh(who * 31 + n));
  }
  return 0;
};

// ---------------- effect cards ----------------
/** cartoon fish on a 400 x 220 canvas, facing right */
export const fxFish = (p: Pen, col: string, wag: number) => {
  p.poly([[60, 110], [10, 50 + wag * 20], [10, 170 + wag * 20]], col, 9);
  p.ell(200, 110, 150, 80, col, 10);
  p.ell(280, 90, 22, 22, "#ffffff", 6); p.ell(286, 92, 10, 10, INK, 0);
  p.stroke([[150, 60], [170, 160]], 6, "rgba(0,0,0,0.25)");
};
/** light shaft (soft, additive-looking) on a 256 x 1024 canvas */
export const fxRay = (p: Pen) => {
  const g = p.g, gr = g.createLinearGradient(0, 0, 0, 1024);
  gr.addColorStop(0, "rgba(220,250,255,0.55)"); gr.addColorStop(1, "rgba(220,250,255,0)");
  g.fillStyle = gr; g.beginPath(); g.moveTo(90, 0); g.lineTo(166, 0); g.lineTo(256, 1024); g.lineTo(0, 1024); g.closePath(); g.fill();
};
/** bubble on a 64 x 64 canvas */
export const fxBubble = (p: Pen) => { p.ell(32, 32, 24, 24, "rgba(220,245,255,0.35)", 4); p.ell(24, 22, 6, 5, "#ffffff", 0); };
/** cartoon eyes (sleepy / open) for a coral, 300 x 160 */
export const fxEyes = (p: Pen, lid: number) => {
  for (const x of [90, 210]) {
    p.ell(x, 80, 50, 56, "#ffffff", 8);
    p.ell(x + 6, 90, 18, 20, INK, 0);
    if (lid > 0) { p.g.save(); p.g.beginPath(); p.g.rect(x - 60, 20, 120, 120 * lid * 0.6); p.g.clip(); p.ell(x, 80, 50, 56, "#ff8fa0", 8); p.g.restore(); p.stroke([[x - 50, 22 + 70 * lid], [x + 50, 22 + 70 * lid]], 8); }
  }
};
/** alarm clock on a 300 x 320 canvas, hand angle a */
export const fxClock = (p: Pen, a: number) => {
  p.ell(70, 60, 40, 30, "#f2c230", 8); p.ell(230, 60, 40, 30, "#f2c230", 8);
  p.ell(150, 180, 120, 120, "#f6f1e4", 12);
  p.ell(150, 180, 100, 100, "#ffffff", 0);
  p.stroke([[150, 180], [150, 110]], 12);
  p.stroke([[150, 180], [150 + 80 * Math.sin(a), 180 - 80 * Math.cos(a)]], 9, "#d63a2f");
  p.ell(150, 180, 12, 12, INK, 0);
};
/** "Zzz" on a 300 x 260 canvas */
export const fxZzz = (p: Pen, t: number) => {
  const g = p.g; g.save(); g.textAlign = "center"; g.lineWidth = 10; g.strokeStyle = INK; g.fillStyle = "#ffffff";
  for (let i = 0; i < 3; i++) { const s = 70 + 30 * i; g.font = `bold ${s}px sans-serif`; const y = 230 - i * 80 - 10 * Math.sin(t * 3 + i); g.strokeText("Z", 70 + i * 80, y); g.fillText("Z", 70 + i * 80, y); }
  g.restore();
};
/** cardboard sign held by the werewolf, 600 x 380 */
export const fxJobSign = (p: Pen) => {
  p.poly([[20, 30], [580, 14], [570, 360], [30, 350]], "#c99a5e", 12);
  const g = p.g; g.save(); g.font = "bold 120px sans-serif"; g.textAlign = "center"; g.fillStyle = INK;
  g.fillText("SUCHE", 300, 160); g.fillText("JOB", 300, 300); g.restore();
};
/** pop star burst for the vanishing moon (500 x 500), t 0..1 */
export const fxPop = (p: Pen, t: number) => fxBurst(p, t, "#fff6c8", 14, 50, 240);
/** crowbar lying on the ground (600 x 160) */
export const fxCrowbar = (p: Pen) => { p.line([[40, 110], [520, 70]], "#5d6470", 22); p.line([[520, 70], [565, 40], [560, 18]], "#5d6470", 18); p.line([[40, 110], [18, 140]], "#5d6470", 16); };
/** handcuffs (400 x 220) */
export const fxCuffs = (p: Pen) => { p.ell(110, 120, 70, 70, null, 16); p.ell(290, 120, 70, 70, null, 16); p.stroke([[178, 112], [222, 112]], 12, "#9aa3ad"); p.g.strokeStyle = "#c9d0d8"; };
/** ice pick (500 x 140) */
export const fxIcepick = (p: Pen) => { p.poly([[30, 50], [170, 44], [176, 96], [36, 100]], "#8a5a32", 8); p.line([[176, 72], [470, 70]], "#b7bdc6", 9); };
/** two dropped books on the ground (300 x 150) */
export const fxBooks = (p: Pen) => { p.poly([[20, 40], [180, 20], [200, 90], [40, 110]], "#b8452f", 8); p.poly([[120, 70], [280, 80], [270, 140], [110, 130]], "#2f5d8a", 8); };
/** a brass key on a ring with a paper tag "LAGER 3" (300 x 160) */
export const fxKey = (p: Pen) => {
  p.ell(60, 80, 34, 34, null, 10); p.line([[92, 80], [220, 80]], "#e2b84a", 18); p.line([[180, 80], [180, 108]], "#e2b84a", 12); p.line([[205, 80], [205, 104]], "#e2b84a", 12);
  p.poly([[20, 120], [120, 110], [126, 150], [26, 158]], "#f2e7c9", 6);
  const g = p.g; g.save(); g.fillStyle = "#3a2a20"; g.font = "bold 22px sans-serif"; g.fillText("LAGER 3", 32, 142); g.restore();
};
/** evidence tag (300 x 140), arg-less */
export const fxTag = (p: Pen) => { p.poly([[10, 20], [250, 20], [290, 70], [250, 120], [10, 120]], "#f2e7c9", 7); p.ell(255, 70, 9, 9, "#3a3a3a", 0); };
/** melt puddle (flat on the ground) on a 400 x 200 canvas */
export const fxPuddle = (p: Pen) => { p.ell(200, 100, 180, 80, "#e8613a", 8); p.ell(150, 80, 50, 18, "rgba(255,255,255,0.5)", 0); };
/** snowflake on a 64 x 64 canvas */
export const fxFlake = (p: Pen) => { for (let i = 0; i < 3; i++) { const a = (i * Math.PI) / 3; p.stroke([[32 - 26 * Math.cos(a), 32 - 26 * Math.sin(a)], [32 + 26 * Math.cos(a), 32 + 26 * Math.sin(a)]], 7, "#ffffff"); } };
/** "PLOPP!" comic word, 700 x 260 */
export const fxWord = (p: Pen, word: string, col = "#ffd84a") => {
  const g = p.g; g.save(); g.font = "900 170px sans-serif"; g.textAlign = "center"; g.lineJoin = "round";
  g.lineWidth = 34; g.strokeStyle = INK; g.strokeText(word, 350, 190); g.fillStyle = col; g.fillText(word, 350, 190); g.restore();
};

export type { Expr };
