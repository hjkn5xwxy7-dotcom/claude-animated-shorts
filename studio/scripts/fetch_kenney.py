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
        # the download button links the kit ZIP, absolute or site-relative, sometimes HTML-escaped
        page = page.replace("&#x2F;", "/").replace("\\/", "/").replace("&amp;", "&")
        links = re.findall(r'(?:https?://(?:www\.)?kenney\.nl)?/media/[^"\'\s<>]+?\.zip', page)
        if not links:
            hrefs = sorted(set(re.findall(r'href=["\']([^"\']+)', page)))
            print(f"[kenney] {kit}: no download link found; {len(page)} bytes, hrefs: {hrefs[:40]}", file=sys.stderr)
            continue
        url = links[0] if links[0].startswith("http") else "https://kenney.nl" + links[0]
        print(f"[kenney] {kit}: {url}")
        z = zipfile.ZipFile(io.BytesIO(get(url)))
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
gh_out = os.environ.get("GITHUB_OUTPUT")
if gh_out:  # lets the workflow cache the models only when the download worked
    with open(gh_out, "a") as f:
        f.write(f"complete={'true' if not missing else 'false'}\n")
