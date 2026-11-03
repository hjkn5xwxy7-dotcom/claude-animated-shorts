// Cast of the moon short (recurring: Ben) and the hand-drawn effect cards. Characters are drawn with the bridge
// short's Pen / bodyFront / bodySide (toon.ts) on 600 x 1000 design canvases; extra drawings (glasses, sweat, snow,
// werewolf ears, question marks) are painted on top in the same design space.
import { Pen, bodyFront, bodySide, FrontOpts, SideOpts, Outfit, INK, Expr, fxBurst } from "../bridge/toon";

export const BEN: Outfit = { jacket: "#e8613a", pants: "#2b3550", boots: "#f4f1ea", hat: "hair", hair: "#3b2a20" };
export const FISHER: Outfit[] = [
  { jacket: "#f2c230", pants: "#2f4f6f", boots: "#2b2b2b", hat: "cap", cap: "#1f4e79", moustache: "#5a4030", skin: "#f5c9a0", build: "stout" },
  { jacket: "#f2c230", pants: "#3b3f52", boots: "#2b2b2b", hat: "cap", cap: "#b8322c", skin: "#ecd0b6" },
];
export const WOLF: Outfit = { jacket: "#5d5a6e", pants: "#3a3646", boots: "#2a2733", hat: "hair", hair: "#6f6b80", skin: "#a7a3b5", build: "stout" };

/** head centre / half width of an adult front drawing in design units (cardshade.ts zones) */
const HX = 300, HY = 309, HW = 118;

export type Extra = "glasses" | "sweat" | "snow" | "wolf" | "question" | "shiver" | "phone";
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
    } else if (e === "shiver") {
      for (const s of [-1, 1]) for (const k of [0, 1, 2]) p.stroke([[HX + s * (150 + k * 22), HY + 140 + k * 40], [HX + s * (170 + k * 22), HY + 170 + k * 40]], 7);
    }
  }
};

/** a character request: drawing key, the draw call, card scale */
export type Cue = {
  who: Outfit; side?: boolean; mirror?: boolean; x: number; y: number; z: number; scale?: number;
  front?: FrontOpts; sideOpts?: SideOpts; extras?: Extra[]; seed?: number;
};
/** design canvas key + draw for a cue (t = seconds, for animated extras) */
export const cueDraw = (c: Cue, t: number, blink: number) => {
  const ex = c.extras ?? [];
  const tq = ex.some((e) => e === "sweat" || e === "question") ? Math.round(t * 12) / 12 : 0;
  const key = JSON.stringify([c.who, c.side ? c.sideOpts : c.front, ex, tq, blink, c.seed ?? 1]);
  const draw = (p: Pen) => {
    if (c.side) bodySide(p, c.who, { mode: "stand", ...c.sideOpts, blink, seed: c.seed ?? 3 });
    else bodyFront(p, c.who, { mode: "stand", ...c.front, blink, seed: c.seed ?? 3 });
    drawExtras(p, ex, t);
  };
  return { key, draw };
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
/** snowflake on a 64 x 64 canvas */
export const fxFlake = (p: Pen) => { for (let i = 0; i < 3; i++) { const a = (i * Math.PI) / 3; p.stroke([[32 - 26 * Math.cos(a), 32 - 26 * Math.sin(a)], [32 + 26 * Math.cos(a), 32 + 26 * Math.sin(a)]], 7, "#ffffff"); } };
/** "PLOPP!" comic word, 700 x 260 */
export const fxWord = (p: Pen, word: string, col = "#ffd84a") => {
  const g = p.g; g.save(); g.font = "900 170px sans-serif"; g.textAlign = "center"; g.lineJoin = "round";
  g.lineWidth = 34; g.strokeStyle = INK; g.strokeText(word, 350, 190); g.fillStyle = col; g.fillText(word, 350, 190); g.restore();
};

export type { Expr };
