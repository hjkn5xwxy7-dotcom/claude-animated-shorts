// Anthropomorphic fruit characters on the 600 x 1000 design canvas (soles at y 975), drawn with the Pen API:
// glossy fruit body with its own texture, big cartoon eyes (lashes for the women), expressive brows and mouth,
// stick arms and legs with gloves and shoes, a piece of clothing each. Spec string:
//   fruit:<kind>:<expr>:<mouth 0..2>:<pose>:<look -1..1>:<phase 0..1>:<walk 0|1>
//   kind: erd | erd2 | mango | kiwi | banane      expr: neutral smile happy shock sad cry worried cold sly angry
//   pose: down | phone | shock | hold | point | wave | hips
import { Pen, INK } from "../bridge/toon";
import { EXTRA_CUSTOM } from "../mond/chars";

type P2 = [number, number];
const KIND: Record<string, { body: string; dark: string; hi: string; female: boolean; cy: number; rx: number; ry: number }> = {
  erd: { body: "#e8323f", dark: "#b81f2d", hi: "#ff7a82", female: true, cy: 560, rx: 190, ry: 250 },
  erd2: { body: "#c9283a", dark: "#8a1626", hi: "#e86070", female: true, cy: 560, rx: 190, ry: 250 },
  mango: { body: "#ffb22e", dark: "#e0702a", hi: "#ffe07a", female: false, cy: 545, rx: 205, ry: 265 },
  kiwi: { body: "#8a6236", dark: "#5e4022", hi: "#b88a56", female: true, cy: 565, rx: 175, ry: 235 },
  banane: { body: "#ffd93b", dark: "#d9a91e", hi: "#fff29a", female: false, cy: 540, rx: 120, ry: 300 },
};

const strawberryPath = (cx: number, cy: number, rx: number, ry: number): P2[] => {
  const pts: P2[] = [];
  for (let i = 0; i <= 64; i++) {
    const t = (i / 64) * Math.PI * 2, s = Math.sin(t), c = Math.cos(t);
    const w = rx * (1 - 0.42 * Math.max(0, s) ** 1.6) * (1 + 0.05 * Math.cos(3 * t));
    pts.push([cx + w * c, cy + ry * s * (s > 0 ? 1.0 : 0.82)]);
  }
  return pts;
};
const ovalPath = (cx: number, cy: number, rx: number, ry: number, tilt = 0): P2[] => {
  const pts: P2[] = [];
  for (let i = 0; i <= 64; i++) {
    const t = (i / 64) * Math.PI * 2, x = rx * Math.cos(t) * (1 + 0.06 * Math.sin(t)), y = ry * Math.sin(t);
    pts.push([cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)]);
  }
  return pts;
};
const bananaPath = (cx: number, cy: number): P2[] => {
  const out: P2[] = [], inn: P2[] = [];
  for (let i = 0; i <= 32; i++) {
    const u = i / 32, a = -1.25 + 2.5 * u, R = 520;
    const x = cx - R * Math.cos(a) * 0.55 + 230, y = cy + R * Math.sin(a) * 0.62;
    const w = 125 * Math.sin(Math.PI * (0.08 + 0.84 * u)) + 18;
    out.push([x - w, y]); inn.push([x + w * 0.7, y]);
  }
  return [...out, ...inn.reverse()];
};

const limb = (p: Pen, pts: P2[], col: string) => p.line(pts, col, 22);
const glove = (p: Pen, x: number, y: number) => p.ell(x, y, 30, 26, "#ffffff", 9);
const shoe = (p: Pen, x: number, y: number, col: string, dir: number) => p.poly([[x - 34 * dir - 10, y - 26], [x + 44 * dir, y - 22], [x + 52 * dir, y + 6], [x - 34 * dir, y + 8]].map(([a, b]) => [a, b] as P2), col, 9);

const drawFruit = (p: Pen, spec: string, blink: number) => {
  const [, kind, expr, mouthS, pose, lookS, phaseS, walkS] = spec.split(":");
  const K = KIND[kind] ?? KIND.erd, mouth = Number(mouthS) || 0, look = Number(lookS) || 0, phase = Number(phaseS) || 0, walk = walkS === "1";
  const g = p.g, cx = 300, cy = K.cy, top = cy - K.ry, bot = cy + K.ry * (kind === "erd" || kind === "erd2" ? 1 : 1);
  const legTop = Math.min(bot - 40, 830), sw = walk ? Math.sin(phase * Math.PI * 2) : 0;
  // legs + shoes
  const shoeCol = kind === "mango" ? "#3a2a22" : kind === "banane" ? "#3b6fd6" : kind === "kiwi" ? "#f3f0ea" : "#ff4f86";
  for (const s of [-1, 1]) {
    const hx = cx + s * 60, fx = hx + s * 6 + (walk ? s * 40 * sw : 0), fy = 960 - (walk ? Math.max(0, s * sw) * 30 : 0);
    limb(p, [[hx, legTop], [hx + s * 8 + (walk ? s * 20 * sw : 0), (legTop + fy) / 2], [fx, fy]], INK);
    shoe(p, fx, fy + 6, shoeCol, s);
  }
  // arms (behind the body for down / hips; in front for the others)
  const shL: P2 = [cx - K.rx * 0.86, cy + 30], shR: P2 = [cx + K.rx * 0.86, cy + 30];
  const armsBack = pose === "down" || pose === "hips";
  const arms = () => {
    const swing = walk ? 30 * sw : 0;
    const L: P2[] = pose === "shock" ? [shL, [cx - 230, cy - 40], [cx - 120, top + 150]]
      : pose === "hips" ? [shL, [cx - 280, cy + 70], [cx - 190, cy + 130]]
      : pose === "wave" ? [shL, [cx - 270, cy - 80], [cx - 250, cy - 220]]
      : [shL, [cx - 250, cy + 120 + swing], [cx - 240, cy + 250 + swing]];
    const R: P2[] = pose === "shock" ? [shR, [cx + 230, cy - 40], [cx + 120, top + 150]]
      : pose === "hips" ? [shR, [cx + 280, cy + 70], [cx + 190, cy + 130]]
      : pose === "phone" ? [shR, [cx + 250, cy + 40], [cx + 170, cy - 40]]
      : pose === "hold" ? [shR, [cx + 280, cy + 60], [cx + 330, cy - 10]]
      : pose === "point" ? [shR, [cx + 300, cy - 10], [cx + 400, cy - 60]]
      : [shR, [cx + 250, cy + 120 - swing], [cx + 240, cy + 250 - swing]];
    limb(p, L, INK); limb(p, R, INK);
    glove(p, L[2][0], L[2][1]); glove(p, R[2][0], R[2][1]);
    if (pose === "phone") { p.poly([[cx + 130, cy - 120], [cx + 210, cy - 126], [cx + 216, cy + 6], [cx + 136, cy + 12]], "#1f2230", 8); p.poly([[cx + 142, cy - 108], [cx + 200, cy - 112], [cx + 204, cy - 4], [cx + 146, cy]], "#7fb6ff", 0); }
    if (pose === "hold") { p.line([[cx + 330, cy - 10], [cx + 370, cy - 60]], "#f2c230", 14); p.ell(cx + 380, cy - 76, 26, 26, null, 10); }
  };
  if (armsBack) arms();
  // body
  const body = kind === "erd" || kind === "erd2" ? strawberryPath(cx, cy, K.rx, K.ry) : kind === "banane" ? bananaPath(cx, cy) : ovalPath(cx, cy, K.rx, K.ry, kind === "mango" ? 0.12 : 0);
  p.poly(body, K.body, 14);
  g.save(); p.path(body, true); g.clip();
  const gr = g.createRadialGradient(cx - K.rx * 0.35, cy - K.ry * 0.45, 20, cx, cy, K.ry * 1.25);
  gr.addColorStop(0, K.hi); gr.addColorStop(0.45, K.body); gr.addColorStop(1, K.dark);
  g.fillStyle = gr; g.fillRect(0, 0, 600, 1000);
  if (kind === "mango") { const m2 = g.createLinearGradient(0, top, 0, bot); m2.addColorStop(0, "rgba(120,190,60,0.55)"); m2.addColorStop(0.35, "rgba(255,190,60,0)"); m2.addColorStop(1, "rgba(230,60,60,0.45)"); g.fillStyle = m2; g.fillRect(0, 0, 600, 1000); }
  if (kind === "erd" || kind === "erd2") for (let i = 0; i < 46; i++) { const a = i * 2.39996, rr = Math.sqrt(i / 46); const x = cx + Math.cos(a) * K.rx * 0.85 * rr, y = cy + 40 + Math.sin(a) * K.ry * 0.8 * rr; if (Math.abs(x - cx) < 120 && y > cy - 120 && y < cy + 110) continue; p.ell(x, y, 7, 11, "#ffe36b", 0); }
  if (kind === "kiwi") { g.fillStyle = "rgba(60,40,20,0.25)"; for (let i = 0; i < 260; i++) { const a = i * 2.4, rr = Math.sqrt(i / 260); g.fillRect(cx + Math.cos(a) * K.rx * rr, cy + Math.sin(a) * K.ry * rr, 3, 9); } }
  if (kind === "banane") { g.strokeStyle = "rgba(170,120,20,0.45)"; g.lineWidth = 6; g.beginPath(); g.moveTo(cx + 40, top + 40); g.quadraticCurveTo(cx + 120, cy, cx + 40, bot - 40); g.stroke(); }
  g.fillStyle = "rgba(255,255,255,0.35)"; g.beginPath(); g.ellipse(cx - K.rx * 0.45, cy - K.ry * 0.5, K.rx * 0.18, K.ry * 0.1, -0.5, 0, 7); g.fill();
  g.restore(); p.poly(body, null, 14);
  // tops: leaves / stem / tips
  if (kind === "erd" || kind === "erd2") {
    const lc = kind === "erd2" ? "#2f6b34" : "#3fae49";
    for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.42; p.poly([[cx, top + 30], [cx + Math.cos(a - 0.2) * 70, top + 30 + Math.sin(a - 0.2) * 40 + 28], [cx + Math.cos(a) * 120, top + 30 + Math.sin(a) * 30 + 40], [cx + Math.cos(a + 0.2) * 70, top + 30 + Math.sin(a + 0.2) * 40 + 28]], lc, 8); }
    p.line([[cx, top + 20], [cx + 6, top - 34]], "#3f8a3a", 14);
  } else if (kind === "mango") {
    p.line([[cx + 10, top + 10], [cx + 20, top - 30]], "#5a3a20", 12);
    p.poly([[cx + 20, top - 20], [cx + 120, top - 70], [cx + 170, top - 40], [cx + 80, top - 5]], "#3fae49", 8);
  } else if (kind === "kiwi") {
    p.ell(cx, top + 4, 18, 10, "#5e4022", 6);
  } else {
    p.poly([[cx - 10, top - 10], [cx + 20, top - 40], [cx + 36, top - 30], [cx + 14, top + 10]], "#5a4320", 8);
  }
  // clothing
  const fy = cy - 40;                          // eye line
  if (kind === "erd" || kind === "erd2") {
    p.poly([[cx - 150, cy + 150], [cx + 150, cy + 150], [cx + 120, cy + 230], [cx - 120, cy + 230]], kind === "erd2" ? "#d9d4cf" : "#ffffff", 9);   // white lace band
    for (let i = -5; i <= 5; i++) p.ell(cx + i * 26, cy + 232, 12, 9, kind === "erd2" ? "#d9d4cf" : "#ffffff", 5);
  } else if (kind === "mango") {
    p.poly([[cx - 190, cy + 90], [cx - 40, cy + 70], [cx, cy + 250], [cx + 40, cy + 70], [cx + 190, cy + 90], [cx + 150, cy + 250], [cx - 150, cy + 250]], "#2a3550", 10);
    p.poly([[cx - 40, cy + 70], [cx, cy + 110], [cx + 40, cy + 70], [cx, cy + 250]], "#f4f1ea", 8);
    p.poly([[cx - 46, cy + 76], [cx, cy + 98], [cx + 46, cy + 76], [cx + 46, cy + 116], [cx, cy + 98], [cx - 46, cy + 116]], "#c0263a", 7);
  } else if (kind === "kiwi") {
    p.poly([[cx - 160, cy + 60], [cx + 160, cy + 60], [cx + 150, cy + 110], [cx - 150, cy + 110]], "#8a5bd6", 9);
    p.poly([[cx + 80, cy + 100], [cx + 130, cy + 100], [cx + 120, cy + 220], [cx + 70, cy + 220]], "#8a5bd6", 9);
  } else {
    p.poly([[cx - 60, top + 40], [cx + 90, top + 30], [cx + 110, top + 80], [cx - 70, top + 90]], "#e2453c", 9);
    p.poly([[cx + 90, top + 70], [cx + 190, top + 80], [cx + 110, top + 95]], "#e2453c", 8);
  }
  // face plate for kiwi: the green cross-section
  const fx0 = kind === "banane" ? cx + 70 : cx;
  if (kind === "kiwi") {
    p.ell(fx0, fy + 50, 140, 130, "#9ed24a", 10);
    p.ell(fx0, fy + 50, 60, 52, "#e9f3c4", 0);
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; p.ell(fx0 + Math.cos(a) * 82, fy + 50 + Math.sin(a) * 74, 5, 9, INK, 0); }
  }
  // eyes
  const eyeR = kind === "banane" ? 34 : 44, ex = kind === "banane" ? 44 : 70;
  const shut = blink > 0.5 || expr === "happy";
  for (const s of [-1, 1]) {
    const x = fx0 + s * ex, y = fy;
    if (shut) { p.stroke([[x - 30, y + 6], [x, y - 12], [x + 30, y + 6]], 10); continue; }
    const half = expr === "cold" || expr === "sly";
    p.ell(x, y, eyeR, eyeR * 1.18, "#ffffff", 9);
    const pr = expr === "shock" ? 13 : 22;
    p.ell(x + look * 14, y + 6, pr, pr * 1.1, kind === "erd2" ? "#3a1020" : "#2a1a14", 0);
    if (kind !== "erd2") p.ell(x + look * 14 - 7, y - 4, 7, 7, "#ffffff", 0);
    if (half) { g.save(); g.beginPath(); g.rect(x - eyeR - 4, y - eyeR * 1.3, eyeR * 2 + 8, eyeR * 1.05); g.clip(); p.ell(x, y, eyeR, eyeR * 1.18, K.body, 9); g.restore(); p.stroke([[x - eyeR, y - 8], [x + eyeR, y - 8]], 9); }
    if (K.female) for (const k of [-1, 0, 1]) p.stroke([[x + s * (eyeR * 0.6 + k * 12), y - eyeR * 1.0], [x + s * (eyeR * 0.85 + k * 16), y - eyeR * 1.4]], 7);
    // brows
    const by = y - eyeR * 1.45;
    const tilt = expr === "angry" || expr === "cold" ? 16 : expr === "worried" || expr === "sad" || expr === "cry" ? -16 : expr === "shock" ? -6 : 0;
    p.stroke([[x - 30 * s - 4, by + (expr === "shock" ? -16 : 0) + s * 0], [x + 30 * s, by + tilt * s * -1 + (expr === "shock" ? -16 : 0)]].map(([a, b]) => [a, b] as P2), kind === "mango" ? 14 : 9);
    if (expr === "cry" || expr === "sad") p.poly([[x + 10, y + eyeR], [x + 22, y + eyeR + 50], [x + 4, y + eyeR + 62], [x - 6, y + eyeR + 46]], "#9fdcff", 6);
  }
  if (K.female && kind !== "kiwi") { g.fillStyle = "rgba(255,120,150,0.45)"; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(fx0 + s * 120, fy + 62, 26, 16, 0, 0, 7); g.fill(); } }
  // mouth: shape by expression, opened by speech (mouth 0 closed .. 2 wide)
  const my = fy + 105, mw = kind === "banane" ? 40 : 52;
  if (mouth > 0 || expr === "shock") {
    const h = expr === "shock" ? 46 : 14 + 16 * mouth;
    p.ell(fx0, my + 4, mw * (expr === "shock" ? 0.6 : 0.75), h, "#5a1e28", 9);
    p.ell(fx0, my + 4 + h * 0.45, mw * 0.4, h * 0.35, "#e86e78", 0);
  } else if (expr === "smile" || expr === "happy" || expr === "sly") {
    p.stroke([[fx0 - mw, my - 6], [fx0 - mw * 0.4, my + 14], [fx0 + mw * 0.4, my + 14], [fx0 + mw, my - 6]], 10);
  } else if (expr === "sad" || expr === "cry" || expr === "worried") {
    p.stroke([[fx0 - mw * 0.8, my + 14], [fx0, my - 4], [fx0 + mw * 0.8, my + 14]], 10);
  } else if (expr === "cold" || expr === "angry") {
    p.stroke([[fx0 - mw * 0.8, my + 6], [fx0 + mw * 0.8, my]], 10);
  } else p.stroke([[fx0 - mw * 0.6, my + 4], [fx0 + mw * 0.6, my + 4]], 10);
  if (!armsBack) arms();
};

EXTRA_CUSTOM.fruit = drawFruit;
export const FRUIT_READY = true;
