# Downloads the CC0 Kenney kits the bridge world uses (Nature Kit + Fantasy Town Kit) and copies the GLB models listed
# in src/videos/bridge/world.ts (KENNEY) to public/bridge/kenney/. Best effort: missing models only drop props, and the
# world still renders (world.ts skips models that fail to load). Kenney assets are CC0 (https://kenney.nl).
# usage: python3 scripts/fetch_kenney.py
import io, os, re, sys, urllib.request, zipfile

KITS = ["nature-kit", "fantasy-town-kit"]
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DEST = os.path.join(ROOT, "public", "bridge", "kenney")
src = open(os.path.join(ROOT, "src", "videos", "bridge", "world.ts"), encoding="utf-8").read()
want = set(re.findall(r'"([\w-]+)"', re.search(r"const KENNEY = \[(.*?)\];", src, re.S).group(1)))
os.makedirs(DEST, exist_ok=True)
UA = {"User-Agent": "animated-shorts-ci/1.0"}

def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
        return r.read()

found = set()
for kit in KITS:
    try:
        page = get(f"https://kenney.nl/assets/{kit}").decode("utf-8", "replace")
        links = re.findall(r'https://kenney\.nl/media/pages/assets/[^"\']+\.zip', page)
        if not links:
            print(f"[kenney] {kit}: no download link found", file=sys.stderr)
            continue
        z = zipfile.ZipFile(io.BytesIO(get(links[0])))
        for name in z.namelist():
            base, ext = os.path.splitext(os.path.basename(name))
            if ext.lower() == ".glb" and base in want and base not in found:
                with open(os.path.join(DEST, base + ".glb"), "wb") as f:
                    f.write(z.read(name))
                found.add(base)
        print(f"[kenney] {kit}: ok")
    except Exception as e:  # network or format change: keep going, the render degrades gracefully
        print(f"[kenney] {kit}: failed ({e})", file=sys.stderr)

missing = sorted(want - found)
print(f"[kenney] {len(found)}/{len(want)} models" + (f", missing: {', '.join(missing)}" if missing else ""))
