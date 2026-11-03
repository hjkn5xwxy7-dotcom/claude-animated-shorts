# Studio (Phase 0): Cloud-Rendering-Grundgerüst

Lauffähiges Remotion-Projekt um die Vorlage `templates/bridge/` herum, gerendert ohne GPU (Chromium + SwiftShader),
lokal oder in GitHub Actions.

## Inhalt
| Pfad | Zweck |
|---|---|
| `src/videos/bridge/` | Kopie von `templates/bridge/`; `Bridge.tsx` mit synchronem Composer (siehe unten) |
| `src/videos/smoke/` | Minimaler WebGL-Test (rotierender Würfel) |
| `scripts/bench.mjs` | Rendert einen Frame-Bereich oder Standbilder, schreibt Zeiten als JSON |
| `scripts/plan-chunks.mjs` | Teilt die Komposition in bis zu 20 parallele Render-Jobs auf |
| `scripts/join_parts.py` | Fügt die Teile ohne Neukodierung zusammen und schreibt den Benchmark-Bericht |
| `scripts/fetch_kenney.py` | Lädt die CC0-Modelle von Kenney (Nature Kit, Fantasy Town Kit) nach `public/bridge/kenney/` |
| `../.github/workflows/render-benchmark.yml` | Workflow „Render benchmark“: planen → parallel rendern → zusammenfügen → Release |

## Vom iPhone starten
GitHub-App → Repository → Actions → „Render benchmark“ → „Run workflow“. Am Ende steht in der Zusammenfassung ein
direkter MP4-Link (Release `bench-<Nummer>`): in Safari öffnen → Teilen → „Video sichern“.
Hinweis: „Run workflow“ erscheint erst, wenn die Workflow-Datei im Standard-Branch liegt. Bis dahin startet jeder
Push, der die Workflow-Datei auf dem Studio-Branch ändert, einen Lauf mit den Standardwerten.

## Lokal
```bash
npm ci
python3 scripts/fetch_kenney.py                     # optional, ohne Modelle fehlen nur Bäume/Stände
node scripts/bench.mjs --stills 200,1000 --scale 0.5 --out out/local/still.mp4
node scripts/bench.mjs --from 0 --to 59 --concurrency 2 --out out/local/part.mp4
```
`CHROME_PATH=<chrome-headless-shell>` setzen, wenn Remotion seinen Browser nicht herunterladen kann.
Diagnose per inputProps: `--props '{"timing":true}'` (Zeit pro Frame im Browser-Log),
`--props '{"post":{"ink":false,"lens":false,"msaa":0,"shadows":false}}'`.

## Änderungen gegenüber der Vorlage
- `@react-three/postprocessing` v3 legt seinen Composer erst in einem Effect an. Remotion fotografiert beim ersten
  `advance()` deshalb eine leere Leinwand (headless war jedes Bild nur Himmelblau). `Bridge.tsx` baut die gleiche
  Kette (Ink → Lens pre → Lens main → Bloom + Tonemapping + Grade) jetzt synchron mit `postprocessing` und rendert
  sie aus einem `useFrame` mit Priorität 1.
- Neue Schalter `msaa`, `shadows` und `timing` (nur Diagnose; Standard = Look der Vorlage).

## Messwerte (lokal, 4 vCPU Xeon 2,8 GHz, ohne GPU, 1080×1920)
- ~10 s GPU-Renderzeit pro Frame und Browser-Tab; mit 2 Tabs auf 4 Kernen **8,8 s pro Frame** (60 Frames in 527 s).
- Post-Processing ist nicht der Engpass (ohne Ink/Lens/Bloom/Grade ~12 statt ~14 s pro Frame), ebenso wenig
  MSAA, Schatten oder anisotrope Filterung. Die Zeit steckt in der Szene selbst (Software-Rasterung) und in den
  Textur-Uploads der Figuren-Canvases bei jedem neuen Frame.
- Hochrechnung 90-s-Video (2.700 Frames): ~400 Maschinenminuten, mit 20 parallelen Jobs ~20–25 min Gesamtzeit.
- Der Workflow misst die echten Werte auf den GitHub-Runnern.

Phase 0 rendert ohne Ton: Stimme und Wort-Zeiten der Brücke liegen nicht im Repository. Die deutsche
Audio-Pipeline kommt in Phase 1.
