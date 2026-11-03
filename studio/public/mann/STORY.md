# Der Mann unter der Laterne – Serien-Bibel

Grusel-Serie mit Ben (wiederkehrende Figur aus „Was wäre, wenn der Mond verschwindet?“). Ben erzählt selbst in der
Ich-Form, es gibt keinen Erzähler. Der Ton ist echter Grusel mit langsamem Aufbau und kleinen, trockenen Lachern von
Ben („Ohne Hund.“, „Perfekt.“), die die Spannung danach höher wirken lassen. Alles muss logisch aufgehen.

## Stimmen (Piper, CC0)
- Ben normal: `de_DE-thorsten-high`, lengthScale 0.94, noiseScale 0.75, pitch +1
- Ben flüsternd (Gegenwart, 03:12): `de_DE-thorsten_emotional-medium`, Sprecher `whisper`, pitch +1
- Der Mann: `de_DE-thorsten_emotional-medium`, Sprecher `whisper`, lengthScale 1.5, pitch -4, Hall 0.35
  (spricht sehr selten, kurze Sätze)

## Teil 1 (fertig, Release `mann-3`, 1:53 min)
Cold Open um 03:12: Ben wird in einem Foto markiert, das ihn schlafend durchs Fenster zeigt, hochgeladen vor einer
Minute von **seinem eigenen Account**. Dann „5 TAGE VORHER“:
- **Montag:** Ben verkauft sein altes Handy online. Ein Mann holt es an der Haustür ab, zahlt bar, sagt kein Wort.
  *(Hinweis 1: Auf dem alten Handy war Ben noch eingeloggt.)* Abends postet Ben wie immer ein Foto seiner Straße.
- **Dienstag:** Kommentar „Wer ist der Mann unter der letzten Laterne?“ Zoom: langer Mantel, Kapuze, kein Gesicht.
  „Nachbar, geht mit dem Hund raus. Ohne Hund.“
- **Mittwoch:** Der Mann ist zwei Laternen näher. Ben löscht den Kommentar und ändert sein Passwort.
- **Donnerstag:** Ben fotografiert nur die Hauswand gegenüber. In der Fensterscheibe spiegelt sich die Straße: Der Mann
  steht direkt hinter ihm.
- **Freitag:** Ben postet nichts mehr, Tür zweimal abgeschlossen, **Fenster gekippt** weil es warm ist.
  *(Hinweis 2: Gekippte Fenster lassen sich von außen öffnen.)*
Zurück um 03:12: Auf dem Foto sind die Vorhänge offen. Ben dreht sich zum Fenster: Die Vorhänge sind zu. Er hat sie
nicht zugezogen. Der Mann, direkt hinter ihm im Dunkeln: „Hallo, Ben.“ Schwarzbild, TEIL 2 FOLGT.

## Teil 2 – geplante Auflösung (muss zu Teil 1 passen)
- **Wie postet er von Bens Account, obwohl das Passwort geändert wurde?** Auf dem verkauften Handy war Ben noch
  angemeldet. Ein neues Passwort meldet bestehende Geräte nicht automatisch ab, wenn man „überall abmelden“ nicht
  auswählt.
- **Woher kennt er Bens Adresse?** Er hat das Handy bei Ben an der Haustür abgeholt.
- **Wie kam er rein?** Durch das gekippte Fenster (Erdgeschoss).
- **Wer ist er und was will er?** Noch offen. Bei der Planung von Teil 2 festlegen. Die Auflösung muss aus diesen Fakten
  folgen und sollte einen neuen Haken für Teil 3 lassen (oder sauber abschließen).
- Mögliche Hooks für die Fortsetzung: Was steht in der Galerie des alten Handys? Welche Fotos hat der Mann vorher schon
  von Ben gemacht? Warum genau 03:12?
- Start von Teil 2: direkt an „Hallo, Ben.“ anschließen (gleiche Einstellung, Ben erstarrt), kurzer Rückblick in den
  ersten 3 Sekunden für neue Zuschauer.

## Technik
- Projekt: `studio/src/videos/mann/` (Shots `shots.ts`, Einblendungen `Overlays.tsx`), Welt/Figuren/Looks in
  `studio/src/videos/mond/` (Stadt, Schlafzimmer `ROOM`, Mann-Figur `custom: "man"`, schlafender Ben `sleeper`)
- Skript + Stimmen: `studio/public/mann/script.json`, Sound: `studio/scripts/mann_audio.py`
- Für Teil 2: neuen Ordner `studio/public/mann2/` + `studio/src/videos/mann2/` anlegen (von Teil 1 kopieren), Workflow
  „Make video“ mit `video: mann2`, `composition: Mann2Short` starten.
- Offene Verbesserung aus Teil 1: das gekippte Fenster sichtbar machen (schräg geöffneter Fensterflügel).
