// Prints (and appends to $GITHUB_OUTPUT) `matrix=[{index, from, to}, ...]` for the render workflow: the frame range split into equal chunks.
// env: COMP (composition id), FRAMES ("first-last" or empty = all), CHUNKS (1-20)
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { selectComposition } from "@remotion/renderer";

const comp = process.env.COMP || "BridgeShort";
let first = 0, last = -1;
if (process.env.FRAMES) [first, last] = process.env.FRAMES.split("-").map(Number);
if (last < 0) {
  // read the duration from the composition itself (bundle + headless metadata only, no frames rendered)
  const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
  last = (await selectComposition({ serveUrl, id: comp, chromiumOptions: { gl: "swangle" }, browserExecutable: process.env.CHROME_PATH || null })).durationInFrames - 1;
}
const n = Math.max(1, Math.min(20, Number(process.env.CHUNKS || 20), last - first + 1));
const size = Math.ceil((last - first + 1) / n);
const chunks = [];
for (let i = 0, a = first; a <= last; i++, a += size) chunks.push({ index: String(i).padStart(2, "0"), from: a, to: Math.min(last, a + size - 1) });
const line = `matrix=${JSON.stringify(chunks)}`;
// write straight to $GITHUB_OUTPUT: Remotion may print its own notices to stdout
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, line + "\n");
console.log(line);
