# Joins the rendered chunk MP4s (same encoder settings, so stream copy) and writes the benchmark report.
# usage: python3 scripts/join_parts.py <parts dir> <out.mp4>   (prints a Markdown summary to stdout)
import glob, json, os, subprocess, sys

parts_dir, out = sys.argv[1], sys.argv[2]
parts = sorted(glob.glob(os.path.join(parts_dir, "part_*.mp4")))
if not parts:
    sys.exit("no parts found")
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
lst = os.path.join(parts_dir, "list.txt")
with open(lst, "w") as f:
    f.writelines(f"file '{os.path.abspath(p)}'\n" for p in parts)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", "-movflags", "+faststart", out], check=True)

stats = [json.load(open(p[:-4] + ".json")) for p in parts]
probe = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=width,height,nb_frames,r_frame_rate:format=duration,size",
                                   "-of", "json", out], capture_output=True, text=True, check=True).stdout)
v, fmt = probe["streams"][0], probe["format"]
frames = sum(s["frames"] for s in stats)
render = [s["renderS"] for s in stats]
spf = [s["secPerFrame"] for s in stats]
machine_min = sum(render) / 60
report = {
    "video": {"width": v["width"], "height": v["height"], "frames": int(v.get("nb_frames", 0)), "durationS": float(fmt["duration"]), "sizeMB": int(fmt["size"]) / 2**20},
    "chunks": len(stats), "framesRendered": frames, "cpus": stats[0]["cpus"], "cpuModel": stats[0]["cpuModel"], "concurrency": stats[0]["concurrency"],
    "secPerFramePerJob": {"min": min(spf), "max": max(spf), "mean": sum(spf) / len(spf)},
    "slowestChunkMin": max(render) / 60, "renderMachineMinutes": machine_min,
    "projected90sVideo": {"frames": 2700, "machineMinutes": machine_min / frames * 2700, "wallMinutesWith20Jobs": machine_min / frames * 2700 / 20},
}
json.dump(report, open(os.path.join(os.path.dirname(os.path.abspath(out)), "benchmark.json"), "w"), indent=1)
md = f"""## Render benchmark

| | |
|---|---|
| Video | {v['width']}x{v['height']}, {report['video']['frames']} frames, {report['video']['durationS']:.2f} s, {report['video']['sizeMB']:.1f} MB |
| Jobs | {len(stats)} parallel x {report['concurrency']} tabs, {report['cpus']} vCPU ({report['cpuModel']}) |
| Seconds per frame per job | mean {report['secPerFramePerJob']['mean']:.2f} (min {report['secPerFramePerJob']['min']:.2f}, max {report['secPerFramePerJob']['max']:.2f}) |
| Slowest chunk (render only) | {report['slowestChunkMin']:.1f} min |
| Render machine time | {machine_min:.0f} min |
| Projection 90 s video (2,700 frames) | {report['projected90sVideo']['machineMinutes']:.0f} machine min, ~{report['projected90sVideo']['wallMinutesWith20Jobs']:.0f} min wall time with 20 jobs (+ ~3 min setup) |
"""
open(os.path.join(os.path.dirname(os.path.abspath(out)), "benchmark.md"), "w").write(md)
print(md)
