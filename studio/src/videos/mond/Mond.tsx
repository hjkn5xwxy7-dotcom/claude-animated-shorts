// "Was wäre, wenn der Mond verschwindet?" — vertical 1080x1920 What-if short in the bridge short's look
// (flat ink-outlined characters in a painted 3D world, ink pass, lens blur, bloom, grade), timed to the German
// narration (timing.json), with TikTok-style word captions. Audio is muxed after the render (scripts/mix_mond.py).
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, CalculateMetadataFunction, continueRender, delayRender, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import { BlendFunction, BloomEffect, EffectComposer, EffectPass, RenderPass, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import "@fontsource/montserrat/900.css";
import { InkPass, noInkFallback, NOINK } from "../bridge/ink";
import { LensBlur } from "../bridge/lensblur";
import { GradeEffect } from "../bridge/grade";
import { Pool, Actor, Fx, SU } from "../bridge/cast";
import { Clock, FPS, Timing, framesOf, loadTiming } from "./timing";
import { LOOKS } from "./looks";
import { MondWorld } from "./sets";
import { shotAt, Stage } from "./shots";
import { cueDraw, lidAt, fxFish, fxRay, fxBubble, fxEyes, fxClock, fxZzz, fxJobSign, fxPop, fxFlake, fxWord, fxStars, fxPuddle } from "./chars";
import { Pen } from "../bridge/toon";
import { Captions } from "./Captions";
import { Overlays } from "./Overlays";

export type MondProps = { timing: Timing | null };
export const calcMond: CalculateMetadataFunction<MondProps> = async () => {
  const timing = await loadTiming();
  return { durationInFrames: framesOf(timing), props: { timing } };
};

const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.6, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass, setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

/** design-canvas resolution by camera distance: [w, h, scale] (sized for 1080 x 1920) */
const tier = (d: number): [number, number, number] => (d < 2.6 ? [1200, 2000, 2] : d < 6 ? [720, 1200, 1.2] : d < 14 ? [360, 600, 0.6] : [180, 300, 0.3]);
const FXDRAW: Record<string, { cw: number; ch: number; draw: (p: Pen, arg: number, kind: string) => void }> = {
  fish: { cw: 400, ch: 220, draw: (p, a, k) => fxFish(p, k.split(":")[1], Math.round(a * 4) / 4) },
  ray: { cw: 256, ch: 1024, draw: (p) => fxRay(p) },
  bubble: { cw: 64, ch: 64, draw: (p) => fxBubble(p) },
  eyes: { cw: 300, ch: 160, draw: (p, a) => fxEyes(p, Math.round(a * 20) / 20) },
  clock: { cw: 300, ch: 320, draw: (p, a) => fxClock(p, Math.round(a * 4) / 4) },
  zzz: { cw: 300, ch: 260, draw: (p, a) => fxZzz(p, Math.round(a * 6) / 6) },
  jobsign: { cw: 600, ch: 380, draw: (p) => fxJobSign(p) },
  pop: { cw: 500, ch: 500, draw: (p, a) => fxPop(p, Math.round(a * 20) / 20) },
  flake: { cw: 64, ch: 64, draw: (p) => fxFlake(p) },
  word: { cw: 700, ch: 260, draw: (p, _a, k) => fxWord(p, k.split(":")[1]) },
  stars: { cw: 420, ch: 210, draw: (p, a) => fxStars(p, Math.round(a * 12) / 12) },
  puddle: { cw: 400, ch: 200, draw: (p) => fxPuddle(p) },
};

const Inner: React.FC<{ clock: Clock }> = ({ clock }) => {
  const f = useCurrentFrame();
  const { camera, scene, gl } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const world = useMemo(() => new MondWorld(), []);
  const pool = useMemo(() => new Pool(), []);
  const actors = useMemo<Actor[]>(() => [], []), fxs = useMemo<Fx[]>(() => [], []);
  if (!scene.fog) scene.fog = new THREE.Fog(0x000000, 10, 100);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, cam), lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }), bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }), grade: new GradeEffect(LOOKS.night.grade, 1),
  }), [scene, cam]);
  const composer = useMemo(() => {
    const c = new EffectComposer(gl, { multisampling: 4, frameBufferType: THREE.HalfFloatType });
    c.addPass(new RenderPass(scene, cam));
    c.addPass(fx.ink);
    c.addPass(new EffectPass(cam, fx.lens.pre));
    c.addPass(new EffectPass(cam, fx.lens.main));
    c.addPass(new EffectPass(cam, fx.bloom, fx.tone, fx.grade));
    return c;
  }, [gl, scene, cam, fx]);
  useEffect(() => {
    gl.toneMapping = THREE.NoToneMapping; gl.autoClear = false;
    return () => { composer.removePass(fx.ink); composer.dispose(); fx.ink.dispose(); };
  }, [gl, composer, fx]);
  const size = useMemo(() => new THREE.Vector2(-1, -1), []), cur = useMemo(() => new THREE.Vector2(), []);
  useFrame((_, delta) => {
    gl.getSize(cur);
    if (!cur.equals(size)) { composer.setSize(cur.x, cur.y, false); size.copy(cur); }
    composer.render(delta);
  }, 1);

  // ---- pose the frame ----
  const t = f / FPS;
  const { stage: S } = shotAt(clock, t);
  cam.fov = S.cam.fov; cam.near = 0.1; cam.far = 3000; cam.updateProjectionMatrix();
  cam.position.set(...S.cam.pos); cam.up.set(0, 1, 0); cam.lookAt(...S.cam.look); cam.rotateZ(THREE.MathUtils.degToRad(S.cam.roll));
  cam.updateMatrixWorld();
  const at = new THREE.Vector3(...S.cam.look);
  world.apply(S.look, cam, at, scene, S.set);
  poseSky(world, S, cam);
  poseSpace(world, S);
  world.snow.visible = S.gradeId === "snow";
  world.boats.forEach((b, i) => { b.position.y = -2 + 0.15 + 0.06 * Math.sin(t * 1.3 + i * 2); b.rotation.z = 0.025 * Math.sin(t * 1.1 + i); });
  placeCards(S, cam, t, f, pool, actors, fxs, world);
  fx.lens.focus = S.focus; fx.lens.cInf = S.cInf;
  fx.bloom.intensity = 0.6 * S.look.bloom;
  const tag = fx.grade as unknown as { _g?: string };
  if (tag._g !== S.gradeId) { fx.grade.set(LOOKS[S.gradeId].grade); tag._g = S.gradeId; }
  fx.grade.amount = S.look.gradeAmt;
  noInkFallback(world.root);
  return <primitive object={world.root} dispose={null} />;
};

const tmp = new THREE.Vector3();
function poseSky(w: MondWorld, S: Stage, cam: THREE.PerspectiveCamera) {
  w.moonSky.visible = !!S.moon && (S.moon.pop ?? 0) < 1;
  if (S.moon) {
    const d = tmp.set(...S.moon.dir).normalize();
    w.moonSky.position.copy(cam.position).addScaledVector(d, 900);
    w.moonSky.quaternion.copy(cam.quaternion);
    const pop = S.moon.pop ?? 0, s = 900 * 0.11 * S.moon.size * (1 + 0.35 * Math.sin(Math.min(1, pop) * Math.PI));
    w.moonSky.scale.setScalar(s);
  }
  w.sunSky.visible = !!S.sunDisc;
  if (S.sunDisc) {
    const d = tmp.set(...S.sunDisc.dir).normalize();
    w.sunSky.position.copy(cam.position).addScaledVector(d, 900);
    w.sunSky.quaternion.copy(cam.quaternion);
    w.sunSky.scale.setScalar(900 * 0.09 * S.sunDisc.size);
  }
}

function poseSpace(w: MondWorld, S: Stage) {
  const sp = S.space;
  if (!sp) return;
  const deg = THREE.MathUtils.degToRad;
  const tilt = deg(sp.tilt + sp.wobble * 38 * Math.sin(sp.spin * 0.45));
  w.earth.rotation.set(0, sp.wobble * sp.spin * 0.6, -tilt);
  w.earthSpin.rotation.y = sp.spin;
  w.axis.visible = S.gradeId === "space" && (sp.moon > 0 || sp.wobble > 0);
  const b = Math.max(0, sp.bulge);
  w.bulge.visible = b > 0.02 && sp.moon === 0 && sp.wobble === 0;
  w.bulge.scale.set(1 + 0.16 * b, 1, 1 + 0.02 * b);
  (w.bulge.material as THREE.MeshBasicMaterial).opacity = 0.1 + 0.16 * b;
  w.moon3d.visible = sp.moon > 0.01;
  w.moon3d.scale.setScalar(Math.max(0.01, sp.moon));
  w.moon3d.position.set(16 * Math.cos(sp.moonA), 1.5 * Math.sin(sp.moonA), 16 * Math.sin(sp.moonA));
  w.sun3d.position.set(-700, 105, 245);
  w.sun3d.lookAt(0, 0, 0);
}

function placeCards(S: Stage, cam: THREE.PerspectiveCamera, t: number, f: number, pool: Pool, actors: Actor[], fxs: Fx[], w: MondWorld) {
  const root = w.root;
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
  let ai = 0;
  const used: Actor[] = [];
  S.cast.forEach((c, i) => {
    while (actors.length <= ai) actors.push(new Actor(root));
    const a = actors[ai++], sc = c.scale ?? 1;
    const d = cam.position.distanceTo(tmp.set(c.x, c.y + 1.2, c.z)) / sc;
    const [cw, ch, k] = tier(d);
    const { key, draw } = cueDraw(c, t, lidAt(f, i + (c.seed ?? 0)));
    a.r = pool.req(key, cw, ch, k, draw);
    a.mesh.visible = true;
    a.mesh.position.set(c.x, c.y, c.z);
    a.mesh.rotation.set(0, Math.atan2(cam.position.x - c.x, cam.position.z - c.z), 0);
    a.mesh.scale.set(c.mirror ? -sc : sc, sc * (c.sy ?? 1), sc);
    a.mesh.castShadow = false;
    used.push(a);
  });
  for (let i = ai; i < actors.length; i++) actors[i].mesh.visible = false;
  let fi = 0;
  const fused: Fx[] = [];
  for (const q of S.fx) {
    const kind = q.kind.split(":")[0], spec = FXDRAW[kind];
    if (!spec) continue;
    while (fxs.length <= fi) fxs.push(new Fx(root));
    const e = fxs[fi++];
    const arg = q.arg ?? 0, key = `${q.kind}|${spec.draw.length > 1 ? Math.round(arg * 20) / 20 : 0}`;
    e.r = pool.req(key, spec.cw, spec.ch, 1, (p) => spec.draw(p, arg, q.kind));
    e.use(!!q.soft);
    e.mesh.visible = true;
    if (kind === "pop" || kind === "word") {
      // sky effects: at the moon (pop) or just below it (word), facing the camera
      const base = w.moonSky.position, s = w.moonSky.scale.x;
      e.mesh.position.copy(base).addScaledVector(right, kind === "word" ? -0.1 * s : 0);
      if (kind === "word") e.mesh.position.y -= 1.25 * s;
      e.mesh.quaternion.copy(cam.quaternion);
      e.mesh.scale.set(kind === "word" ? 2.4 * s : 2.2 * s, kind === "word" ? 0.9 * s : 2.2 * s, 1);
      e.mesh.renderOrder = 5;
    } else {
      e.mesh.position.set(q.x, q.y, q.z);
      if (q.flat) e.mesh.rotation.set(-Math.PI / 2, 0, q.rot ?? 0);
      else { e.mesh.quaternion.copy(cam.quaternion); e.mesh.rotateZ(q.rot ?? 0); }
      e.mesh.scale.set(q.w, q.h, 1);
    }
    e.mesh.layers.set(NOINK);
    fused.push(e);
  }
  for (let i = fi; i < fxs.length; i++) fxs[i].mesh.visible = false;
  pool.flush();
  for (const a of used) a.bind();
  for (const e of fused) e.bind();
}

const useFont = () => {
  const [h] = useState(() => delayRender("captions font"));
  useEffect(() => { document.fonts.load("900 80px Montserrat").catch(() => null).finally(() => continueRender(h)); }, [h]);
};

export const MondShort: React.FC<MondProps> = ({ timing }) => {
  useFont();
  const f = useCurrentFrame();
  const clock = useMemo(() => (timing ? new Clock(timing) : null), [timing]);
  if (!clock) return null;
  const S = shotAt(clock, f / FPS).stage;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${S.zoom ?? 1})`, filter: S.filter ?? "none" }}>
        <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 40, near: 0.1, far: 3000 }}>
          <Inner clock={clock} />
        </ThreeCanvas>
      </AbsoluteFill>
      <Overlays clock={clock} />
      {S.flash > 0 && <AbsoluteFill style={{ background: "#fff", opacity: S.flash }} />}
      <Captions clock={clock} />
    </AbsoluteFill>
  );
};
export { SU };
