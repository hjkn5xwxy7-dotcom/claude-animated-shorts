// The three places of the moon short in one three.js scene, far apart so one camera can visit each:
//   town  (origin)       harbour quay with a row of painted houses, lamps, boats, tide gauge and the open sea
//   space (0, 3000, 0)   the Earth with its axis, tidal bulge, the moon and the sun
//   reef  (0, -3000, 0)  sandy sea floor with corals, rocks and light shafts
// Houses, facades and the two-tone world shading come from the bridge short (build.ts / paint.ts / shade.ts).
import * as THREE from "three";
import { Batch, boxGeo, house, lam, V } from "../bridge/build";
import { cobbleHD, ctex, rep, rng, stoneHD, planksHD } from "../bridge/paint";
import { CHAR, TONE, untone, twoTone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { Look } from "./looks";

export const SPACE = new THREE.Vector3(0, 3000, 0);
export const REEF = new THREE.Vector3(0, -3000, 0);
export const WATER_Y = -2.0;
export const QUAY_Z = 3.0;
export const ROOM = new THREE.Vector3(3000, 0, 0);
export const STAGE = new THREE.Vector3(-3000, 0, 0);
export const WOODS = new THREE.Vector3(0, 0, -3000);
export const HALL = new THREE.Vector3(6000, 0, 0);
export type SetId = "town" | "space" | "reef" | "room" | "stage" | "woods" | "hall";

// ---------------- painted textures ----------------
const earthTex = () => ctex("earthMap", 2048, 1024, (g, r) => {
  const W = 2048, H = 1024;
  const og = g.createLinearGradient(0, 0, 0, H);
  og.addColorStop(0, "#2a6fc4"); og.addColorStop(0.5, "#2f86d8"); og.addColorStop(1, "#2a6fc4");
  g.fillStyle = og; g.fillRect(0, 0, W, H);
  // cartoon continents: clusters of soft blobs (lon/lat roughly like the real ones)
  const land = (cx: number, cy: number, rx: number, ry: number, n: number, col: string) => {
    g.fillStyle = col;
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r());
      g.beginPath(); g.ellipse(cx + Math.cos(a) * d * rx, cy + Math.sin(a) * d * ry, rx * (0.25 + 0.3 * r()), ry * (0.25 + 0.3 * r()), r() * 3, 0, 7); g.fill();
    }
  };
  const conts: [number, number, number, number][] = [
    [470, 300, 210, 140], [600, 660, 110, 220], [1060, 280, 150, 110], [1080, 560, 150, 210], [1450, 300, 330, 150], [1700, 700, 120, 80],
  ];
  for (const [cx, cy, rx, ry] of conts) land(cx, cy, rx, ry, 26, "#58b25a");
  for (const [cx, cy, rx, ry] of conts) land(cx, cy, rx * 0.55, ry * 0.5, 10, "#79c25f");
  land(1120, 470, 120, 60, 10, "#e3c27a"); // desert band
  g.fillStyle = "#f4f8fc"; g.fillRect(0, 0, W, 70); g.fillRect(0, H - 80, W, 80);
  for (let i = 0; i < 40; i++) { g.beginPath(); g.ellipse(r() * W, i % 2 ? 70 : H - 80, 60 + 80 * r(), 30, 0, 0, 7); g.fill(); }
  // cloud streaks
  g.fillStyle = "rgba(255,255,255,0.35)";
  for (let i = 0; i < 26; i++) { g.beginPath(); g.ellipse(r() * W, 120 + r() * (H - 240), 40 + 120 * r(), 10 + 12 * r(), (r() - 0.5) * 0.4, 0, 7); g.fill(); }
});
const moonTex = () => ctex("moonMap", 1024, 512, (g, r) => {
  g.fillStyle = "#d9d6cc"; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(120,118,130,${0.25 + 0.3 * r()})`; g.beginPath(); g.ellipse(r() * 1024, 60 + r() * 392, 30 + 70 * r(), 20 + 50 * r(), r() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 60; i++) { const x = r() * 1024, y = r() * 512, rr = 4 + 14 * r(); g.strokeStyle = "rgba(90,88,100,0.45)"; g.lineWidth = 3; g.beginPath(); g.arc(x, y, rr, 0, 7); g.stroke(); }
});
/** flat moon disc as seen from the ground (sky prop, unlit, bright enough to bloom) */
const moonDisc = () => ctex("moonDisc", 512, 512, (g, r) => {
  const gr = g.createRadialGradient(230, 220, 40, 256, 256, 250);
  gr.addColorStop(0, "#fffbe9"); gr.addColorStop(1, "#e9e2c4");
  g.fillStyle = gr; g.beginPath(); g.arc(256, 256, 248, 0, 7); g.fill();
  for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(170,165,150,${0.25 + 0.25 * r()})`; g.beginPath(); g.ellipse(80 + r() * 350, 80 + r() * 350, 18 + 50 * r(), 14 + 36 * r(), r() * 3, 0, 7); g.fill(); }
  g.save(); g.globalCompositeOperation = "destination-in"; g.beginPath(); g.arc(256, 256, 248, 0, 7); g.fill(); g.restore();
});
const sandTex = () => ctex("sand", 1024, 1024, (g, r) => {
  g.fillStyle = "#e9d7a8"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${150 + 60 * r()},${130 + 50 * r()},${90 + 40 * r()},0.35)`; g.fillRect(r() * 1024, r() * 1024, 3, 3); }
  g.strokeStyle = "rgba(180,150,100,0.35)"; g.lineWidth = 6;
  for (let i = 0; i < 40; i++) { const y = r() * 1024; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + 14 * Math.sin(x / 90 + i)); g.stroke(); }
});
const gaugeTex = () => ctex("gauge", 128, 1024, (g) => {
  for (let i = 0; i < 10; i++) {
    g.fillStyle = i % 2 ? "#f4f1e6" : "#d63a2f"; g.fillRect(0, i * 102.4, 128, 102.4);
    g.fillStyle = i % 2 ? "#222" : "#fff"; g.font = "bold 64px sans-serif"; g.textAlign = "center"; g.fillText(String(9 - i), 64, i * 102.4 + 76);
  }
});

const mat = (key: string, col: string, map?: THREE.Texture) => lam(key, () => ({ color: col, map: map ?? null }));
const basic = (col: THREE.ColorRepresentation, extra: THREE.MeshBasicMaterialParameters = {}) => new THREE.MeshBasicMaterial({ color: col, fog: false, ...extra });

// ---------------- world ----------------
export class MondWorld {
  root = new THREE.Group();
  town = new THREE.Group(); space = new THREE.Group(); reef = new THREE.Group(); room = new THREE.Group();
  hall = new THREE.Group(); lagerDoor!: THREE.Mesh; cakeFull!: THREE.Object3D; cakeHalf!: THREE.Object3D; bulb!: THREE.MeshBasicMaterial; fairy!: THREE.MeshBasicMaterial;
  stage = new THREE.Group(); woods = new THREE.Group(); beetle = new THREE.Group(); police = new THREE.Group();
  lineup!: THREE.Mesh; policeRed!: THREE.MeshBasicMaterial; policeBlue!: THREE.MeshBasicMaterial; spot!: THREE.Mesh;
  curtainL!: THREE.Mesh; curtainR!: THREE.Mesh; phoneGlow!: THREE.Mesh; poolMat!: THREE.MeshBasicMaterial;
  sun = new THREE.DirectionalLight(0xffffff, 1);
  sky: THREE.Mesh; skyMat: THREE.ShaderMaterial;
  stars: THREE.Points; starMat: THREE.PointsMaterial;
  moonSky = new THREE.Group(); moonSkyMat: THREE.MeshBasicMaterial; moonGlowMat: THREE.MeshBasicMaterial;
  sunSky = new THREE.Group();
  windows: THREE.MeshBasicMaterial; lampGlow: THREE.MeshBasicMaterial;
  water: THREE.MeshLambertMaterial; snow: THREE.Mesh;
  earth = new THREE.Group(); earthSpin = new THREE.Group(); bulge: THREE.Mesh; moon3d: THREE.Mesh; sun3d: THREE.Mesh; axis: THREE.Group;
  boats: THREE.Object3D[] = [];
  corals: THREE.Object3D[] = [];
  bench = V(5.5, 0, 0.6);
  constructor() {
    const R = this.root;
    R.add(this.town, this.space, this.reef, this.room, this.stage, this.woods, this.beetle, this.police, this.hall);
    this.hall.position.copy(HALL);
    this.stage.position.copy(STAGE); this.woods.position.copy(WOODS);
    this.room.position.copy(ROOM);
    this.space.position.copy(SPACE); this.reef.position.copy(REEF);
    // key light (moon / sun): the only shadow caster
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera; sc.left = -30; sc.right = 30; sc.top = 30; sc.bottom = -30; sc.near = 1; sc.far = 220;
    this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.03;
    R.add(this.sun, this.sun.target);
    // sky dome (follows the camera), stars, sky moon + sun discs
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() } },
      vertexShader: "varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "uniform vec3 top; uniform vec3 hor; varying vec3 vD; void main(){ float e = clamp(vD.y, -0.2, 1.0); float k = smoothstep(-0.05, 0.55, e); gl_FragColor = vec4(mix(hor, top, k), 1.0); }",
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1400, 32, 16), this.skyMat);
    this.sky.renderOrder = -10; this.sky.layers.set(NOINK); this.sky.frustumCulled = false;
    R.add(this.sky);
    const rs = rng(7), sp: number[] = [], scol: number[] = [];
    for (let i = 0; i < 2600; i++) {
      const u = rs() * 2 - 1, a = rs() * Math.PI * 2, rr = Math.sqrt(1 - u * u), k = 0.5 + 0.5 * rs();
      sp.push(1300 * rr * Math.cos(a), 1300 * u, 1300 * rr * Math.sin(a)); scol.push(k, k, k * (0.9 + 0.2 * rs()));
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute("color", new THREE.Float32BufferAttribute(scol, 3));
    this.starMat = new THREE.PointsMaterial({ size: 2.6, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, fog: false });
    this.stars = new THREE.Points(sg, this.starMat); this.stars.layers.set(NOINK); this.stars.frustumCulled = false; this.stars.renderOrder = -9;
    R.add(this.stars);
    this.moonSkyMat = basic(new THREE.Color(1, 1, 1).multiplyScalar(1.6), { map: moonDisc(), transparent: true, depthWrite: false });
    this.moonGlowMat = basic(new THREE.Color("#9fb4ff").multiplyScalar(0.6), { transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, map: glowTex() });
    const md = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.moonSkyMat), mg = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), this.moonGlowMat);
    md.renderOrder = -7; mg.renderOrder = -8;
    this.moonSky.add(mg, md); this.moonSky.traverse((o) => o.layers.set(NOINK)); R.add(this.moonSky);
    const sd = new THREE.Mesh(new THREE.CircleGeometry(0.5, 48), basic(new THREE.Color("#fff6dc").multiplyScalar(3)));
    const sg2 = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), basic(new THREE.Color("#ffd9a0").multiplyScalar(0.8), { transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending, map: glowTex() }));
    sd.renderOrder = -7; sg2.renderOrder = -8; this.sunSky.add(sg2, sd); this.sunSky.traverse((o) => o.layers.set(NOINK)); R.add(this.sunSky);

    this.windows = basic(new THREE.Color("#ffc46b").multiplyScalar(1.6));
    this.lampGlow = basic(new THREE.Color("#ffd28a").multiplyScalar(2.2));
    this.poolMat = new THREE.MeshBasicMaterial({ map: glowTex(), color: "#ffb860", transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    this.water = twoTone(new THREE.MeshLambertMaterial({ color: "#1f86b8", map: rep(seaTex(), 40, 40) }));
    this.snow = new THREE.Mesh(new THREE.PlaneGeometry(140, 14), twoTone(new THREE.MeshLambertMaterial({ color: "#f4f8ff" })));
    this.bulge = new THREE.Mesh(new THREE.SphereGeometry(6.04, 64, 32), basic("#9fe0ff", { transparent: true, opacity: 0.3, depthWrite: false }));
    this.moon3d = new THREE.Mesh(new THREE.SphereGeometry(1.7, 48, 24), mat("moon3d", "#ffffff", moonTex()));
    this.sun3d = new THREE.Mesh(new THREE.CircleGeometry(30, 64), basic(new THREE.Color("#fff3d2").multiplyScalar(3.2)));
    this.axis = new THREE.Group();
    this.buildTown(); this.buildSpace(); this.buildReef(); this.buildRoom(); this.buildStage(); this.buildWoods(); this.buildHall(); this.buildBeetle(); this.buildPolice();
  }

  private buildTown() {
    const T = this.town, b = new Batch(), r = rng(11);
    // street, quay coping, quay wall, sea
    b.add(boxGeo(V(-80, -0.6, -11), V(80, 0, QUAY_Z), 3), lam("cobbleM", () => ({ map: cobbleHD() })));
    b.add(boxGeo(V(-80, -0.2, QUAY_Z), V(80, 0.12, QUAY_Z + 0.7), 2), lam("copeM", () => ({ map: stoneHD("copeHD") })));
    b.add(boxGeo(V(-80, WATER_Y - 3, QUAY_Z + 0.1), V(80, -0.2, QUAY_Z + 0.7), 2.5), lam("quayWall", () => ({ map: stoneHD("quayHD", ["#a99c8a", "#9d917f", "#b3a693", "#958a7a"], "#7a6f62") })));
    // front row of houses (fronts face the sea, +z) and a higher back row on the hill
    let x = -58;
    for (let i = 0; x < 58; i++) {
      const w = [7, 8, 9, 7.5][i % 4], h = [8.4, 9.8, 7, 11.2][(i * 3) % 4];
      house(b, x + w / 2, -15, 0, w, 8, h, i, 0);
      this.addWindows(T, x + w / 2, -11, w, h, r);
      x += w + 0.2;
    }
    b.add(boxGeo(V(-90, 0, -40), V(90, 3.2, -19), 6), lam("hillM", () => ({ color: "#6f9a52" })));
    x = -70;
    for (let i = 0; x < 70; i++) {
      const w = [8, 9, 7][i % 3], h = [10, 12.5, 9][(i * 2) % 3];
      house(b, x + w / 2, -26, 0, w, 8, h, i + 5, 3.2);
      this.addWindows(T, x + w / 2, -22, w, h, r, 3.2);
      x += w + 1.5;
    }
    // lamp posts along the quay
    for (let lx = -40; lx <= 40; lx += 11) {
      b.add(new THREE.CylinderGeometry(0.07, 0.1, 3.6, 10).translate(lx, 1.8, QUAY_Z - 0.6), mat("iron", "#2b2d36"));
      b.add(boxGeo(V(lx - 0.22, 3.55, QUAY_Z - 0.82), V(lx + 0.22, 3.62, QUAY_Z - 0.38)), mat("iron", "#2b2d36"));
      const g = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 10), this.lampGlow); g.position.set(lx, 3.4, QUAY_Z - 0.6); T.add(g);
      // warm light pool on the ground under the lamp (additive, scaled by the look's lamps)
      const pool = new THREE.Mesh(new THREE.CircleGeometry(2.6, 40), this.poolMat);
      pool.rotation.x = -Math.PI / 2; pool.position.set(lx, 0.025, QUAY_Z - 1.2); pool.layers.set(NOINK); pool.renderOrder = 1; T.add(pool);
    }
    // bench
    const bm = lam("benchWood", () => ({ map: rep(planksHD(), 0.5, 0.5) }));
    b.add(boxGeo(V(this.bench.x - 1, 0.42, this.bench.z - 0.25), V(this.bench.x + 1, 0.5, this.bench.z + 0.25)), bm);
    b.add(boxGeo(V(this.bench.x - 1, 0.5, this.bench.z - 0.3), V(this.bench.x + 1, 0.95, this.bench.z - 0.24)), bm);
    for (const dx of [-0.85, 0.85]) b.add(boxGeo(V(this.bench.x + dx - 0.05, 0, this.bench.z - 0.25), V(this.bench.x + dx + 0.05, 0.42, this.bench.z + 0.2)), mat("iron", "#2b2d36"));
    // tide gauge in the water
    b.add(boxGeo(V(-14.2, WATER_Y - 2, QUAY_Z + 1.2), V(-13.8, WATER_Y + 4, QUAY_Z + 1.5)), lam("gaugeM", () => ({ map: gaugeTex() })));
    b.build(T);
    // sea
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1200), this.water);
    sea.rotation.x = -Math.PI / 2; sea.position.set(0, WATER_Y, QUAY_Z + 600); sea.receiveShadow = true; T.add(sea);
    // boats
    const hull = (col: string, len: number) => {
      const g = new THREE.Group(), bb = new Batch();
      bb.add(boxGeo(V(-len / 2, -0.5, -1), V(len / 2, 0.6, 1)), mat("hull" + col, col));
      bb.add(boxGeo(V(-len / 2 - 0.3, 0.6, -1.05), V(len / 2 + 0.3, 0.78, 1.05)), mat("rim", "#f1ece0"));
      bb.add(boxGeo(V(-len * 0.15, 0.78, -0.7), V(len * 0.2, 2.0, 0.7)), mat("cabin", "#f4f1e6"));
      bb.add(boxGeo(V(-len * 0.2, 2.0, -0.8), V(len * 0.25, 2.15, 0.8)), mat("cabRoof", "#3a6ea5"));
      bb.add(new THREE.CylinderGeometry(0.06, 0.08, 5, 8).translate(len * 0.3, 2.6, 0), mat("mast", "#7a5a3a"));
      bb.build(g);
      return g;
    };
    const boats: [string, number, number, number, number][] = [["#d9483b", 6, -12, 9, 0.2], ["#2f7a5a", 7, 6, 11, -0.15], ["#e8b23a", 5, 18, 8, 0.4]];
    for (const [col, len, bx, bz, yaw] of boats) { const h = hull(col, len); h.position.set(bx, WATER_Y + 0.15, QUAY_Z + bz); h.rotation.y = yaw; T.add(h); this.boats.push(h); }
    // snow cover (winter look only)
    this.snow.rotation.x = -Math.PI / 2; this.snow.position.set(0, 0.03, -4); this.snow.receiveShadow = true; this.snow.visible = false; T.add(this.snow);
  }

  /** warm night windows on a house front (facadeHD layout: n = floor(w / 2.2) windows per 2.8 m floor) */
  addWindows(T: THREE.Group, cx: number, z: number, w: number, h: number, r: () => number, y0 = 0) {
    const n = Math.max(1, Math.floor(w / 2.2)), floors = Math.max(1, Math.floor(h / 2.8)), geo = new THREE.PlaneGeometry(0.78, 1.05);
    for (let fl = 0; fl < floors; fl++) for (let i = 0; i < n; i++) {
      if (fl === 0 && i === Math.floor(n / 2)) continue;
      if (r() > 0.55) continue;
      const m = new THREE.Mesh(geo, this.windows);
      m.position.set(cx - w / 2 + ((i + 0.5) / n) * w, y0 + fl * 2.8 + 0.9 + 0.6, z + 0.03);
      m.layers.set(NOINK); T.add(m);
    }
  }

  private buildSpace() {
    const S = this.space;
    const earthMat = twoTone(new THREE.MeshLambertMaterial({ map: earthTex() }));
    const globe = new THREE.Mesh(new THREE.SphereGeometry(6, 96, 48), earthMat);
    this.earthSpin.add(globe);
    // axis: a red-white pole through the poles
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 16, 12), mat("axisM", "#e8e4dc"));
    for (let i = -3; i <= 3; i++) { const band = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 1, 12), mat("axisR", "#d63a2f")); band.position.y = i * 2.2; pole.add(band); }
    this.axis.add(pole);
    this.earth.add(this.earthSpin, this.axis);
    this.earth.rotation.z = THREE.MathUtils.degToRad(-23.4);
    S.add(this.earth);
    this.bulge.layers.set(NOINK); S.add(this.bulge);
    S.add(this.moon3d);
    this.sun3d.layers.set(NOINK); S.add(this.sun3d);
  }

  private buildReef() {
    const F = this.reef, b = new Batch(), r = rng(23);
    const sand = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), twoTone(new THREE.MeshLambertMaterial({ map: rep(sandTex(), 24, 24) })));
    sand.rotation.x = -Math.PI / 2; sand.receiveShadow = true; F.add(sand);
    const cols = ["#ff7a8a", "#ff9f43", "#b86bff", "#ffd35c", "#5fd6c5", "#ff5f9e"];
    const place = (o: THREE.Object3D) => { F.add(o); this.corals.push(o); };
    for (let i = 0; i < 140; i++) {
      const near = i < 60, x = (r() - 0.5) * (near ? 9 : 40), z = near ? -r() * 9 + 1.5 : -r() * 34 + 2, col = cols[i % cols.length], kind = i % 4;
      if (Math.abs(x) < 0.9 && z > -1.5 && z < 1.2) continue;
      const g = new THREE.Group(); g.position.set(x, 0, z);
      const m = mat("coral" + col, col);
      if (kind === 0) { // brain coral
        const s = new THREE.Mesh(new THREE.SphereGeometry(0.6 + 0.6 * r(), 20, 12), m); s.scale.y = 0.7; s.castShadow = true; s.receiveShadow = true; g.add(s);
      } else if (kind === 1) { // branches
        for (let k = 0; k < 5; k++) {
          const c = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.12, 1 + r(), 8), m);
          c.position.set((r() - 0.5) * 0.5, 0.5, (r() - 0.5) * 0.5); c.rotation.set((r() - 0.5) * 0.9, 0, (r() - 0.5) * 0.9); c.castShadow = true; g.add(c);
          const tip = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), m); tip.position.set(0, 0.55 + 0.5 * r(), 0); c.add(tip);
        }
      } else if (kind === 2) { // tube sponges
        for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.8 + 1.2 * r(), 14, 1, true), m); c.position.set((k - 1) * 0.35, 0.5, (r() - 0.5) * 0.3); c.castShadow = true; g.add(c); }
      } else { // fan
        const f = new THREE.Mesh(new THREE.CircleGeometry(0.9 + 0.5 * r(), 24, 0, Math.PI), m); f.position.y = 0.05; f.rotation.y = r() * 3; (f.material as THREE.Material).side = THREE.DoubleSide; g.add(f);
      }
      g.rotation.y = r() * 6; g.scale.setScalar(near ? 1.1 + 0.6 * r() : 1);
      place(g);
    }
    // the hero coral of the "warten" close-up (eyes are an effect card in front of it)
    const hero = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 20), mat("coral#ff7a8a", "#ff7a8a"));
    hero.position.set(0, 0.42, 0.3); hero.scale.y = 0.78; hero.castShadow = true; F.add(hero);
    for (let i = 0; i < 16; i++) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1 + 1.6 * r(), 0), mat("rock", "#7d7a8c"));
      rock.position.set((r() - 0.5) * 50, 0.2, -r() * 30 - 12); rock.scale.y = 0.6; rock.rotation.set(r(), r(), r()); rock.castShadow = true; rock.receiveShadow = true; F.add(rock);
    }
    b.build(F);
  }

  /** Ben's ground-floor bedroom (local coords, floor at y 0): bed against the back wall (z -), window in the right wall
   *  (x +2.2, centre z -0.8, sill 0.9 m, top 2.1 m) with curtains, nightstand with the phone, wardrobe, door; outside: the
   *  street side with a house across the road */
  private buildRoom() {
    const Rm = this.room, b = new Batch();
    const paper = lam("wallpaper", () => ({ map: rep(wallpaperTex(), 2, 1) }));
    const floor = lam("roomFloor", () => ({ map: rep(planksHD(), 1.2, 1.2) }));
    const W = 2.2, D = 2.4, H = 2.6, t = 0.12;
    b.add(boxGeo(V(-W, -0.1, -D), V(W, 0, D)), floor);
    b.add(boxGeo(V(-W, H, -D), V(W, H + 0.1, D)), lam("ceiling", () => ({ color: "#d9d4cc" })));
    b.add(boxGeo(V(-W - t, 0, -D - t), V(W + t, H, -D)), paper);            // back wall
    b.add(boxGeo(V(-W - t, 0, D), V(W + t, H, D + t)), paper);              // front wall (door side)
    b.add(boxGeo(V(-W - t, 0, -D), V(-W, H, D)), paper);                    // left wall
    // right wall with the window opening (z -1.4 .. -0.2, y 0.9 .. 2.1)
    const z0 = -1.4, z1 = -0.2, y0 = 0.9, y1 = 2.1;
    b.add(boxGeo(V(W, 0, -D), V(W + t, H, z0)), paper);
    b.add(boxGeo(V(W, 0, z1), V(W + t, H, D)), paper);
    b.add(boxGeo(V(W, 0, z0), V(W + t, y0, z1)), paper);
    b.add(boxGeo(V(W, y1, z0), V(W + t, H, z1)), paper);
    const frame = lam("winFrame", () => ({ color: "#efece6" }));
    b.add(boxGeo(V(W - 0.06, y0 - 0.06, z0 - 0.06), V(W + t + 0.02, y0, z1 + 0.06)), frame);   // sill
    b.add(boxGeo(V(W + 0.02, y0, z0 - 0.05), V(W + 0.08, y1, z0)), frame);
    b.add(boxGeo(V(W + 0.02, y0, z1), V(W + 0.08, y1, z1 + 0.05)), frame);
    b.add(boxGeo(V(W + 0.02, y1, z0 - 0.05), V(W + 0.08, y1 + 0.05, z1 + 0.05)), frame);
    b.add(boxGeo(V(W + 0.02, y0, (z0 + z1) / 2 - 0.025), V(W + 0.08, y1, (z0 + z1) / 2 + 0.025)), frame);
    // outside: plaster facade around the window, pavement, the house across the street
    const plaster = lam("facadeOut", () => ({ color: "#cfc4b2" }));
    b.add(boxGeo(V(W + t, -0.6, -D - 4), V(W + t + 0.02, H + 0.8, z0)), plaster);
    b.add(boxGeo(V(W + t, -0.6, z1), V(W + t + 0.02, H + 0.8, D + 4)), plaster);
    b.add(boxGeo(V(W + t, -0.6, z0), V(W + t + 0.02, y0, z1)), plaster);
    b.add(boxGeo(V(W + t, y1, z0), V(W + t + 0.02, H + 0.8, z1)), plaster);
    b.add(boxGeo(V(W + t, -0.7, -30), V(W + 30, -0.6, 30), 3), lam("cobbleM", () => ({ map: cobbleHD() })));
    house(b, W + 16, -2, -Math.PI / 2, 9, 8, 9.8, 3, -0.6);
    // furniture
    const wood = lam("furnWood", () => ({ color: "#8a6446" })), sheet = lam("sheet", () => ({ color: "#e9edf3" })), duvet = lam("duvet", () => ({ color: "#5d7fb8" }));
    b.add(boxGeo(V(-0.95, 0, -D), V(0.95, 0.35, -0.2)), wood);                         // bed frame
    b.add(boxGeo(V(-0.9, 0.35, -D + 0.05), V(0.9, 0.55, -0.25)), sheet);              // mattress
    b.add(boxGeo(V(-0.95, 0, -D), V(0.95, 1.1, -D + 0.08)), wood);                     // headboard
    b.add(boxGeo(V(-0.55, 0.55, -D + 0.1), V(0.55, 0.7, -D + 0.6)), sheet);           // pillow
    b.add(boxGeo(V(-0.92, 0.55, -1.55), V(0.92, 0.68, -0.22)), duvet);                // duvet (lower half)
    b.add(boxGeo(V(-1.6, 0, -D + 0.05), V(-1.1, 0.55, -D + 0.5)), wood);              // nightstand
    b.add(boxGeo(V(-2.15, 0, 0.2), V(-1.55, 2.1, 1.6)), lam("wardrobe", () => ({ color: "#6f5a4a" })));
    b.add(boxGeo(V(-1.6, 0, D - 0.04), V(-0.7, 2.05, D)), lam("doorM", () => ({ color: "#7a5a40" })));
    b.add(boxGeo(V(-0.85, 0.95, D - 0.1), V(-0.78, 1.0, D - 0.04)), mat("iron", "#2b2d36"));
    b.add(boxGeo(V(-1.45, 0.55, -2.25), V(-1.25, 0.9, -2.05)), lam("lampFoot", () => ({ color: "#ddd" })));
    b.build(Rm);
    // phone on the nightstand (glows when it lights up)
    this.phoneGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.15), basic(new THREE.Color("#bcd7ff").multiplyScalar(2)));
    this.phoneGlow.rotation.x = -Math.PI / 2; this.phoneGlow.position.set(-1.33, 0.56, -2.1); this.phoneGlow.layers.set(NOINK); Rm.add(this.phoneGlow);
    // curtains (scale.z: 1 = closed half, ~0.3 = bunched open)
    const cm = twoTone(new THREE.MeshLambertMaterial({ color: "#c45a6a", side: THREE.DoubleSide, map: rep(curtainTex(), 1, 1) }));
    const half = (z1 - z0) / 2 + 0.12;
    const mk = (side: number) => {
      const g = new THREE.PlaneGeometry(half, 1.5); g.translate(-side * half / 2, 0, 0);
      const m = new THREE.Mesh(g, cm); m.rotation.y = Math.PI / 2; m.position.set(W - 0.08, (y0 + y1) / 2 + 0.05, side < 0 ? z1 + 0.12 : z0 - 0.12);
      m.castShadow = true; Rm.add(m); return m;
    };
    this.curtainL = mk(-1); this.curtainR = mk(1);
  }

  /** the wedding venue: cream hall with parquet, round tables, a flower arch, fairy lights, the cake; a side door
   *  "LAGER 3" in the right wall leads to a bare storage room with one bulb (local coords, floor y 0) */
  private buildHall() {
    const H = this.hall, b = new Batch(), r = rng(71);
    const wall = lam("hallWall", () => ({ color: "#efe4d2" })), wain = lam("hallWain", () => ({ color: "#c9b18c" }));
    b.add(boxGeo(V(-10, -0.1, -7), V(10, 0, 7)), lam("parquet", () => ({ map: rep(planksHD(), 2, 2) })));
    b.add(boxGeo(V(-10, 6, -7), V(10, 6.1, 7)), lam("hallCeil", () => ({ color: "#f6efe4" })));
    b.add(boxGeo(V(-10.2, 0, -7.2), V(10.2, 6, -7)), wall); b.add(boxGeo(V(-10.2, 0, 7), V(10.2, 6, 7.2)), wall);
    b.add(boxGeo(V(-10.2, 0, -7), V(-10, 6, 7)), wall);
    b.add(boxGeo(V(10, 0, -7), V(10.2, 6, -3.6)), wall); b.add(boxGeo(V(10, 0, -2.4), V(10.2, 6, 7)), wall); b.add(boxGeo(V(10, 2.3, -3.6), V(10.2, 6, -2.4)), wall);
    for (const [a, c] of [[V(-10, 0, -7), V(10, 1.0, -6.95)], [V(-10, 0, 6.95), V(10, 1.0, 7)], [V(-10, 0, -7), V(-9.95, 1.0, 7)]] as const) b.add(boxGeo(a, c), wain);
    // tall windows (dark blue glass) on the left wall
    for (let z = -5; z <= 5; z += 2.5) b.add(boxGeo(V(-9.99, 1.4, z - 0.6), V(-9.95, 4.8, z + 0.6)), lam("hallGlass", () => ({ color: "#5d7fb8" })));
    // round tables with cloths, chairs, flowers
    const cloth = lam("cloth", () => ({ color: "#ffffff" })), chairM = lam("goldChair", () => ({ color: "#d8b45a" }));
    const flowers = ["#ff6f9a", "#ffd34e", "#ff9f43", "#c77dff"].map((c) => lam("flower" + c, () => ({ color: c })));
    for (const [x, z] of [[-5.5, -2.5], [-5.5, 2.5], [-1.8, 0.5], [4.5, -2.0], [5.0, 2.8], [-5.5, 6.0]]) {
      b.add(new THREE.CylinderGeometry(1.0, 1.15, 0.78, 28).translate(x, 0.39, z), cloth);
      for (let k = 0; k < 6; k++) b.add(new THREE.SphereGeometry(0.11, 10, 8).translate(x + 0.15 * Math.cos(k), 0.92, z + 0.15 * Math.sin(k)), flowers[k % 4]);
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2, cx = x + 1.45 * Math.cos(a), cz = z + 1.45 * Math.sin(a); b.add(boxGeo(V(cx - 0.2, 0.45, cz - 0.2), V(cx + 0.2, 0.5, cz + 0.2)), chairM); b.add(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 6).translate(cx, 0.22, cz), chairM); }
    }
    // flower arch + altar at the back
    for (let i = 0; i <= 24; i++) { const a = Math.PI * (i / 24), x = -2.2 * Math.cos(a), y = 3.6 * Math.sin(a); b.add(new THREE.SphereGeometry(0.28, 12, 10).translate(x, y + 0.2, -6.3), flowers[i % 4]); b.add(new THREE.SphereGeometry(0.22, 10, 8).translate(x * 1.06, y * 1.04 + 0.2, -6.2), lam("leaf", () => ({ color: "#4fa45a" }))); }
    b.add(boxGeo(V(-0.6, 0, -6.4), V(0.6, 1.0, -5.8)), lam("altar", () => ({ color: "#f8f4ec" })));
    // the door to LAGER 3 + its sign
    // the door (hinged at z -3.6, swings into the storage room) is a separate mesh: props.door 0..1
    const dg = boxGeo(V(0, 0, 0), V(0.08, 2.3, 1.2)); dg.translate(-0.04, 0, 0);
    this.lagerDoor = new THREE.Mesh(dg, lam("lagerDoor", () => ({ color: "#8a6446" }))); this.lagerDoor.position.set(10.06, 0, -3.6); this.lagerDoor.castShadow = true; H.add(this.lagerDoor);
    b.add(boxGeo(V(10.21, 1.8, -1.9), V(10.25, 2.15, -1.1)), lam("lagerSign", () => ({ map: signTex("LAGER 3") })));
    b.add(boxGeo(V(9.88, 2.4, -3.4), V(9.95, 2.75, -2.6)), lam("lagerSign", () => ({ map: signTex("LAGER 3") })));
    // the storage room behind (x 10.2 .. 14, z -5 .. -1)
    const conc = lam("concrete", () => ({ color: "#7d7a78" }));
    b.add(boxGeo(V(10.2, -0.1, -5), V(14, 0, -1)), conc); b.add(boxGeo(V(10.2, 3, -5), V(14, 3.1, -1)), conc);
    b.add(boxGeo(V(10.2, 0, -5.2), V(14, 3, -5)), conc); b.add(boxGeo(V(10.2, 0, -1), V(14, 3, -0.8)), conc); b.add(boxGeo(V(14, 0, -5), V(14.2, 3, -1)), conc);
    for (const [x, z, h] of [[13.4, -4.4, 1.4], [13.4, -1.6, 0.9], [12.8, -4.5, 0.6]]) b.add(boxGeo(V(x - 0.4, 0, z - 0.4), V(x + 0.4, h, z + 0.4)), lam("box", () => ({ color: "#b08a5a" })));
    b.add(boxGeo(V(12.1, 0.45, -3.3), V(12.6, 0.5, -2.8)), lam("chairWood", () => ({ color: "#6b4a32" })));
    b.add(boxGeo(V(12.55, 0.5, -3.3), V(12.6, 1.05, -2.8)), lam("chairWood", () => ({ color: "#6b4a32" })));
    b.build(H);
    this.bulb = basic(new THREE.Color("#ffd28a").multiplyScalar(3));
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), this.bulb); bulb.position.set(12.0, 2.4, -3.0); bulb.layers.set(NOINK); H.add(bulb);
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.6, 4), basic("#222")); wire.position.set(12.0, 2.7, -3.0); H.add(wire);
    // fairy lights across the ceiling
    this.fairy = basic(new THREE.Color("#ffe2a0").multiplyScalar(2.2));
    for (let k = 0; k < 6; k++) for (let i = 0; i < 26; i++) { const x = -9 + (18 * i) / 25, z = -6 + k * 2.4, y = 5.4 - 0.5 * Math.sin((Math.PI * i) / 25); const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), this.fairy); m.position.set(x, y, z); m.layers.set(NOINK); H.add(m); }
    // the cake: full and half-eaten
    const icing = lam("icing", () => ({ color: "#fff6f0" })), pinkC = lam("icingPink", () => ({ color: "#ffb6c9" }));
    const cake = (half: boolean) => {
      const g = new THREE.Group(), th = half ? Math.PI : Math.PI * 2;
      [[0.55, 0.35], [0.42, 0.32], [0.3, 0.3]].forEach(([rad, h], i) => {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, h, 32, 1, false, 0, th), i % 2 ? pinkC : icing);
        m.position.y = 0.8 + 0.17 + i * 0.32; m.castShadow = true; g.add(m);
        if (half) { const cut = new THREE.Mesh(new THREE.PlaneGeometry(rad * 2, h), lam("sponge", () => ({ color: "#f3d39a" }))); cut.position.copy(m.position); cut.rotation.y = Math.PI / 2; g.add(cut); }
      });
      g.position.set(7.2, 0, 4.6); H.add(g); return g;
    };
    b.add(new THREE.CylinderGeometry(0.8, 0.9, 0.8, 24).translate(7.2, 0.4, 4.6), cloth); b.build(H);
    this.cakeFull = cake(false); this.cakeHalf = cake(true); this.cakeHalf.visible = false;
    void r;
  }

  /** black void with one hard spotlight and a wooden chair (interview / confession shots) */
  private buildStage() {
    const St = this.stage, b = new Batch();
    b.add(boxGeo(V(-30, -0.1, -30), V(30, 0, 30)), lam("stageFloor", () => ({ color: "#141217" })));
    const wood = lam("chairWood", () => ({ color: "#6b4a32" }));
    b.add(boxGeo(V(-0.28, 0.42, -0.25), V(0.28, 0.48, 0.25)), wood);
    b.add(boxGeo(V(-0.28, 0.48, -0.27), V(0.28, 1.05, -0.22)), wood);
    for (const [x, z] of [[-0.24, -0.22], [0.24, -0.22], [-0.24, 0.22], [0.24, 0.22]]) b.add(boxGeo(V(x - 0.03, 0, z - 0.03), V(x + 0.03, 0.42, z + 0.03)), wood);
    b.build(St);
    const coneMat = new THREE.MeshBasicMaterial({ color: "#fff1d6", transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
    this.spot = new THREE.Mesh(new THREE.ConeGeometry(1.5, 6, 40, 1, true), coneMat);
    this.spot.position.set(0, 3, -0.1); this.spot.layers.set(NOINK); St.add(this.spot);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(1.6, 48), new THREE.MeshBasicMaterial({ map: glowTex(), color: "#ffe2b0", transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.02, -0.1); pool.layers.set(NOINK); St.add(pool);
    // police line-up wall with height marks (toggled per shot)
    this.lineup = new THREE.Mesh(new THREE.PlaneGeometry(8, 3.2), twoTone(new THREE.MeshLambertMaterial({ map: lineupTex() })));
    this.lineup.position.set(5, 1.6, -1.6); this.lineup.receiveShadow = true; this.lineup.visible = false; St.add(this.lineup);
  }

  /** dark conifer woods along a gravel road (where the remains were found) */
  private buildWoods() {
    const Wd = this.woods, b = new Batch(), r = rng(57);
    b.add(boxGeo(V(-60, -0.1, -60), V(60, 0, 60)), lam("forestFloor", () => ({ color: "#3b3a2a" })));
    b.add(boxGeo(V(-1.8, 0, -60), V(1.8, 0.02, 60)), lam("gravel", () => ({ color: "#6e675a" })));
    const trunk = lam("trunk", () => ({ color: "#4a3626" })), needles = ["#2f4a32", "#284030", "#36553a"].map((c) => lam("needle" + c, () => ({ color: c })));
    for (let i = 0; i < 150; i++) {
      const x = (r() < 0.5 ? -1 : 1) * (3 + r() * 40), z = (r() - 0.5) * 110, h = 9 + r() * 9;
      b.add(new THREE.CylinderGeometry(0.18, 0.28, h * 0.35, 7).translate(x, h * 0.17, z), trunk);
      for (let k = 0; k < 3; k++) b.add(new THREE.ConeGeometry((3 - k * 0.7) * (h / 14), h * 0.35, 9).translate(x, h * (0.3 + k * 0.22), z), needles[(i + k) % 3]);
    }
    b.build(Wd);
  }

  /** a light-brown 1968-style Beetle, built from ellipsoids (local: nose +x, ground y 0) */
  private buildBeetle() {
    const Bt = this.beetle, tan = lam("beetleTan", () => ({ color: "#c9a46c" })), glass = lam("beetleGlass", () => ({ color: "#263040" }));
    const tyre = lam("tyre", () => ({ color: "#1b1b1f" })), chrome = lam("chrome", () => ({ color: "#d8dde2" }));
    const ell = (m: THREE.Material, rx: number, ry: number, rz: number, x: number, y: number, z: number) => {
      const g = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 18), m); g.scale.set(rx, ry, rz); g.position.set(x, y, z); g.castShadow = true; g.receiveShadow = true; Bt.add(g); return g;
    };
    ell(tan, 1.95, 0.55, 0.82, 0, 0.72, 0);                       // body
    ell(glass, 1.08, 0.6, 0.74, -0.18, 1.0, 0);                   // cabin glass
    ell(tan, 1.02, 0.34, 0.7, -0.22, 1.28, 0);                    // roof
    for (const [x, z] of [[1.15, 0.72], [1.15, -0.72], [-1.2, 0.72], [-1.2, -0.72]]) {
      ell(tan, 0.5, 0.42, 0.28, x, 0.55, z * 1.02);                // fenders
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.22, 20), tyre); w.rotation.x = Math.PI / 2; w.position.set(x, 0.33, z); w.castShadow = true; Bt.add(w);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.24, 14), chrome); hub.rotation.x = Math.PI / 2; hub.position.set(x, 0.33, z); Bt.add(hub);
    }
    for (const z of [0.5, -0.5]) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), basic(new THREE.Color("#fff2c8").multiplyScalar(1.4))); h.position.set(1.72, 0.78, z); h.layers.set(NOINK); Bt.add(h); }
    const bump = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.6), chrome); bump.position.set(1.95, 0.42, 0); Bt.add(bump);
    const bump2 = bump.clone(); bump2.position.x = -1.98; Bt.add(bump2);
    Bt.visible = false;
  }

  /** a 1970s patrol car with a red / blue light bar (local: nose +x) */
  private buildPolice() {
    const P = this.police, b = new Batch();
    b.add(boxGeo(V(-2.4, 0.35, -0.9), V(2.4, 0.95, 0.9)), lam("copWhite", () => ({ color: "#ecebe6" })));
    b.add(boxGeo(V(-1.0, 0.95, -0.82), V(0.9, 1.5, 0.82)), lam("copGlass", () => ({ color: "#263040" })));
    b.add(boxGeo(V(-1.05, 1.5, -0.84), V(0.95, 1.56, 0.84)), lam("copRoof", () => ({ color: "#1d2230" })));
    b.add(boxGeo(V(1.0, 0.95, -0.9), V(2.4, 0.97, 0.9)), lam("copHood", () => ({ color: "#1d2230" })));
    b.add(boxGeo(V(-0.4, 1.56, -0.7), V(0.2, 1.64, 0.7)), lam("copBar", () => ({ color: "#222" })));
    b.build(P);
    for (const [x, z] of [[1.6, 0.9], [1.6, -0.9], [-1.6, 0.9], [-1.6, -0.9]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.24, 20), lam("tyre", () => ({ color: "#1b1b1f" }))); w.rotation.x = Math.PI / 2; w.position.set(x, 0.36, z); P.add(w); }
    this.policeRed = basic(new THREE.Color("#ff2a2a").multiplyScalar(3)); this.policeBlue = basic(new THREE.Color("#2a5bff").multiplyScalar(3));
    const lr = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.5), this.policeRed); lr.position.set(-0.1, 1.72, 0.4); lr.layers.set(NOINK); P.add(lr);
    const lb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.5), this.policeBlue); lb.position.set(-0.1, 1.72, -0.4); lb.layers.set(NOINK); P.add(lb);
    P.visible = false;
  }

  /** curtains: 0 = open (bunched at the sides), 1 = closed */
  setCurtains(k: number) { const s = 0.28 + 0.72 * k; this.curtainL.scale.x = s; this.curtainR.scale.x = s; }

  /** set every light / colour uniform from a look; `at` = the point the camera looks at (shadow box centre) */
  apply(L: Look, cam: THREE.Camera, at: THREE.Vector3, scene: THREE.Scene, setId: SetId) {
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift); TONE.uSat.value = L.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade;
    const sd = new THREE.Vector3(...L.sun).normalize();
    this.sun.target.position.copy(at); this.sun.position.copy(at).addScaledVector(sd, 90);
    this.sun.castShadow = setId !== "space";
    this.skyMat.uniforms.top.value.copy(untone(L.skyTop)); this.skyMat.uniforms.hor.value.copy(untone(L.skyHor));
    this.sky.position.copy(cam.position); this.stars.position.copy(cam.position);
    this.starMat.opacity = L.stars; this.stars.visible = L.stars > 0.01;
    const fog = scene.fog as THREE.Fog;
    fog.color.copy(untone(L.fog)); fog.near = L.fogNear; fog.far = L.fogFar;
    this.windows.color.set("#ffc46b").multiplyScalar(1.6 * L.windows); this.windows.visible = L.windows > 0.01;
    this.lampGlow.color.set("#ffd28a").multiplyScalar(2.4 * L.lamps);
    this.water.color.set(L.water);
    this.town.visible = setId === "town"; this.space.visible = setId === "space"; this.reef.visible = setId === "reef"; this.room.visible = setId === "room";
    this.stage.visible = setId === "stage"; this.woods.visible = setId === "woods"; this.hall.visible = setId === "hall";
    this.poolMat.opacity = Math.min(0.85, 0.5 * L.lamps);
  }
}

/** painted sea: light base with darker swell bands and white ripple dashes (tinted by the look's water colour) */
const seaTex = () => ctex("seaPaint", 512, 512, (g, r) => {
  g.fillStyle = "#d8e8f4"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "rgba(90,120,170,0.35)"; g.lineWidth = 10;
  for (let y = 16; y < 512; y += 42) { g.beginPath(); for (let x = 0; x <= 512; x += 16) g.lineTo(x, y + 6 * Math.sin((x / 512) * Math.PI * 4 + y)); g.stroke(); }
  g.strokeStyle = "rgba(255,255,255,0.9)"; g.lineWidth = 4; g.lineCap = "round";
  for (let i = 0; i < 70; i++) { const x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 10, y - 5, x + 22, y); g.stroke(); }
});
/** door sign: dark plate with white letters (256 x 96) */
const signTex = (txt: string) => ctex("sign" + txt, 256, 96, (g) => {
  g.fillStyle = "#2b2d36"; g.fillRect(0, 0, 256, 96); g.fillStyle = "#f2efe6"; g.font = "bold 44px sans-serif"; g.textAlign = "center"; g.fillText(txt, 128, 64);
});
/** line-up wall: grey with height lines every 10 cm and labels every 50 cm (8 x 3.2 m) */
const lineupTex = () => ctex("lineup", 1024, 410, (g) => {
  g.fillStyle = "#b9bcc0"; g.fillRect(0, 0, 1024, 410);
  g.fillStyle = "#2a2c30"; g.font = "bold 22px sans-serif";
  for (let cm = 0; cm <= 320; cm += 10) { const y = 410 - (cm / 320) * 410; g.fillRect(0, y - (cm % 50 ? 1 : 2), 1024, cm % 50 ? 2 : 4); if (cm % 50 === 0 && cm) { g.fillText(`${(cm / 100).toFixed(1)}`, 14, y - 6); g.fillText(`${(cm / 100).toFixed(1)}`, 960, y - 6); } }
});
/** faded floral wallpaper */
const wallpaperTex = () => ctex("wallpaper", 512, 512, (g, r) => {
  g.fillStyle = "#b9b39f"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "rgba(90,80,70,0.18)"; for (let x = 0; x < 512; x += 64) g.fillRect(x, 0, 6, 512);
  for (let i = 0; i < 40; i++) { const x = (i % 8) * 64 + 32, y = Math.floor(i / 8) * 102 + 50 + (i % 2) * 40; g.fillStyle = "rgba(120,70,70,0.25)"; g.beginPath(); g.ellipse(x, y, 12, 16, 0, 0, 7); g.fill(); }
});
/** curtain folds */
const curtainTex = () => ctex("curtain", 256, 256, (g) => {
  for (let x = 0; x < 256; x += 2) { const k = 0.75 + 0.25 * Math.sin(x / 9); g.fillStyle = `rgb(${Math.round(255 * k)},${Math.round(255 * k)},${Math.round(255 * k)})`; g.fillRect(x, 0, 2, 256); }
});
/** soft round glow for sky discs */
const glowTex = () => ctex("glow", 256, 256, (g) => {
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,0.5)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
});
