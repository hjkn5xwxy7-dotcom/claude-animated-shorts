// Headless render benchmark for CI (no GPU): bundles once, renders a frame range of a composition with
// Chromium + software WebGL (SwiftShader via ANGLE), and writes timing stats as JSON.
// usage: node scripts/bench.mjs --comp BridgeShort --from 0 --to 89 --scale 1 --concurrency 2 --out out/part.mp4 [--gl swangle] [--stills 100,400]
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : "true"]] : acc), []));
const comp = args.comp ?? "BridgeShort";
const gl = args.gl ?? "swangle";
const scale = Number(args.scale ?? 1);
const out = path.resolve(args.out ?? "out/part.mp4");
fs.mkdirSync(path.dirname(out), { recursive: true });
const chromiumOptions = { gl };
const inputProps = args.props ? JSON.parse(args.props) : {};
const browserExecutable = process.env.CHROME_PATH || null;
const log = (...a) => console.log(`[bench ${new Date().toISOString().slice(11, 19)}]`, ...a);
const onBrowserLog = (l) => { if (l.type === "error" || process.env.BENCH_VERBOSE) console.log("[browser]", l.text.slice(0, 300)); };

const t0 = Date.now();
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const tBundle = (Date.now() - t0) / 1000;
log(`bundle ${tBundle.toFixed(1)} s`);
const composition = await selectComposition({ serveUrl, id: comp, inputProps, chromiumOptions, browserExecutable });
const stats = { comp, gl, scale, cpus: os.cpus().length, cpuModel: os.cpus()[0]?.model, memGB: Math.round(os.totalmem() / 2 ** 30), bundleS: tBundle };

if (args.stills) {
  stats.stills = [];
  for (const f of args.stills.split(",").map(Number)) {
    const t = Date.now();
    const file = out.replace(/\.mp4$/, `_${f}.jpg`);
    await renderStill({ composition, serveUrl, inputProps, frame: f, output: file, imageFormat: "jpeg", jpegQuality: 88, scale, chromiumOptions, browserExecutable, timeoutInMilliseconds: 600000, onBrowserLog });
    const s = (Date.now() - t) / 1000;
    stats.stills.push({ frame: f, s });
    log(`still ${f}: ${s.toFixed(1)} s`);
  }
} else {
  const from = Number(args.from ?? 0), to = Math.min(Number(args.to ?? composition.durationInFrames - 1), composition.durationInFrames - 1);
  const concurrency = Number(args.concurrency ?? Math.max(1, Math.floor(os.cpus().length / 2)));
  const t = Date.now();
  let last = 0;
  await renderMedia({
    composition, serveUrl, inputProps, codec: "h264", crf: 18, outputLocation: out, frameRange: [from, to], scale, concurrency,
    chromiumOptions, browserExecutable, muted: true, timeoutInMilliseconds: 600000, onBrowserLog,
    onProgress: ({ renderedFrames }) => { if (renderedFrames - last >= 10) { last = renderedFrames; log(`${renderedFrames}/${to - from + 1} frames, ${((Date.now() - t) / 1000).toFixed(0)} s`); } },
  });
  const s = (Date.now() - t) / 1000;
  Object.assign(stats, { from, to, frames: to - from + 1, concurrency, renderS: s, secPerFrame: s / (to - from + 1), fps: (to - from + 1) / s });
  log(`rendered ${stats.frames} frames in ${s.toFixed(1)} s -> ${stats.secPerFrame.toFixed(2)} s/frame`);
}
fs.writeFileSync(out.replace(/\.mp4$/, ".json"), JSON.stringify(stats, null, 1));
