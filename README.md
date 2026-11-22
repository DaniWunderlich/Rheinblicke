# Rheinblicke

[Deutsch](README.md) · [English](README.en.md)

**Schaffhausen und die Rheinregion als interaktive 3D-Karte.** Rheinblicke zeigt amtliche Gebäudegeometrien mit modellierten Dächern und Wänden auf dem tatsächlichen Gelände, von Schaffhausen bis Rheinau und Altenburg. Verfügbare Gebäudedaten umfassen unter anderem Höhe, Erfassungsjahr und den eidgenössischen Gebäudeidentifikator (EGID).

## Starten

Voraussetzung: Node.js 22.12 oder neuer.

```sh
npm ci
npm run dev
```

Öffne die im Terminal angezeigte Adresse. Unter Windows PowerShell kann bei gesperrten Skripten `npm.cmd` statt `npm` verwendet werden.

```sh
npm run build
npm run preview
```

Der Produktionsbuild liegt in `dist/` und kann auf einem statischen Webserver auch unter einem Unterpfad bereitgestellt werden. Daten und CesiumJS-Ressourcen werden vom eigenen Server geladen. Backend, API-Schlüssel und Cesium-ion-Konto sind nicht erforderlich.

## Bedienung und Sprache

**Deutsch / English** wechselt die gesamte Bedienoberfläche, Kartenbeschriftungen, Gebäudeattribute, historischen Texte und Meldungen. Die Sprachwahl wird lokal gespeichert. Beim ersten Besuch wird die erste unterstützte Browsersprache verwendet, ansonsten Deutsch. Ein Sprachwechsel erhält Kamera, Layer und Auswahl. Eigennamen, Quellenkennungen und amtliche Rohdaten bleiben erhalten; externe Originalquellen können deutschsprachig sein.

Die Ortsleiste führt zu **Übersicht**, **Altstadt**, **Munot**, **Rheinufer**, **Neuhausen**, **Rheinfall**, **Kloster Rheinau**, **Doppelrheinschleife** und **Keltenschanze**. Die Orte sind auch über Kartenmarkierungen erreichbar. Auf schmalen Bildschirmen ist die Ortsleiste horizontal scrollbar. Die Keltenschanze bezeichnet den [Keltenwall «Schanz» in Altenburg](https://www.outdooractive.com/de/poi/schwarzwald/keltenwall-altenburg/53673782/); seine Zielkoordinaten stammen vom Regionalen Naturpark Schaffhausen.

- Maus: ziehen zum Verschieben, rechts ziehen zum Drehen und Neigen, Mausrad zum Zoomen.
- Touch: ein Finger zum Verschieben, zwei Finger zum Zoomen, Drehen und Neigen.
- Tastatur: Karte mit Tab fokussieren; Pfeiltasten verschieben, `+` / `−` zoomen, `N` richtet nach Norden aus. Die Schaltflächen bieten ebenfalls Zoom und Nordausrichtung.
- Ein Klick auf ein Gebäude öffnet seine Angaben. **Karteninhalt** schaltet 3D-Gebäude, Luftbild und den historischen Layer.

## Historischer Layer

**Bombardierung 1944** zeigt 354 dokumentierte Einschlagorte vom 1. April 1944 und fliegt das historische Gebiet an. Hellblaue Punkte bleiben über Gebäuden sichtbar. **Einschlagorte zeigen** kehrt zu dieser Ansicht zurück. Ein Klick zeigt Typ, Datum, WGS-84-Koordinaten und Quell-ID. Nahe Punkte werden mit ihrer Anzahl gruppiert; ein Klick öffnet die Ortsliste. **Historischer Hintergrund** öffnet die Einordnung mit Quellen des Bundes, des Museums zu Allerheiligen und des Stadtarchivs.

Die historischen Unterlagen dokumentieren einen Teil aller Einschläge. [Kantonaler Datensatz und Nutzungsbedingungen](https://data.europa.eu/data/datasets/868d4efd-0f2e-46ab-adfb-ffc1056861d9-amt-geoinformation-kanton-schaffhausen?locale=de).

## Geodaten

Das Gebiet misst 6’000 × 9’000 Meter (LV95: 2’685’000 / 1’276’000 bis 2’691’000 / 1’285’000) und enthält 12’203 Gebäude aus der Schweizer Datenabdeckung. Quellen: © swisstopo sowie Kanton Schaffhausen für historische Daten.

| Datensatz | Verwendung |
| --- | --- |
| [swissBUILDINGS3D 3.0](https://www.swisstopo.admin.ch/de/landschaftmodell-swissbuildings3d-3-0-beta), Ausgabe 2025 | Originale Dreiecksflächen und verfügbare Gebäudeattribute als 3D Tiles |
| [swissALTI3D](https://www.swisstopo.admin.ch/de/hoehenmodell-swissalti3d), Ausgabe 2026 | 2-Meter-Höhenmodell, für den Viewer auf 10-Meter-Raster abgetastet |
| [swissALTIRegio](https://www.swisstopo.admin.ch/de/hoehenmodell-swissaltiregio) | Ergänzt fehlende Geländehöhen auf deutschem Gebiet |
| [Landeskarte](https://map.geo.admin.ch/#/map?lang=de&bgLayer=ch.swisstopo.pixelkarte-farbe) | Beschriftete Basiskarte mit grenzüberschreitender Abdeckung |
| [Bombardierung Schaffhausen](https://data.europa.eu/data/datasets/868d4efd-0f2e-46ab-adfb-ffc1056861d9-amt-geoinformation-kanton-schaffhausen?locale=de) | Dokumentierte Einschlagpunkte vom 1. April 1944 |
| [SWISSIMAGE](https://www.swisstopo.admin.ch/de/orthobilder-swissimage-10-cm), Ausgabe 2025 | Umschaltbares Orthofoto mit 2 Metern Bodenauflösung; fehlende Bereiche zeigen die Basiskarte |

Gebäude und Gelände werden gemeinsam von LV95/LN02 nach WGS 84 mit ellipsoidischen Höhen transformiert. Gebäudeinformationen zeigen publizierte Höhen weiterhin in Metern über Meer. Strassen, Plätze, Grünflächen und Gewässer sind auf das Gelände projiziert. Gebäudeattribute können fehlen.

Auf deutschem Gebiet ist das Gelände gröber; zusätzliche deutsche 3D-Gebäude sind nicht eingebunden. Die Keltenschanze ist über Ortsmarkierung, Gelände und Basiskarte erkundbar; ein Detailmodell des Walls ist nicht enthalten.

## Geodaten neu erzeugen

Startdaten liegen bereits in `public/geodata/`. Für die Neuaufbereitung benötigt Python GDAL mit OpenFileGDB-Unterstützung, NumPy sowie pyproj mit PROJ 9.2 oder neuer. Debian 13 bietet `python3-gdal`, `python3-numpy` und `python3-pyproj`.

```sh
python3 scripts/prepare_geodata.py
```

Das Skript ermittelt veröffentlichte Gelände-, Bild- und Gebäudekacheln im amtlichen STAC-Katalog für das konfigurierte Gebiet und die festgelegten Ausgaben. Quellen und swisstopo-Höhentransformationsgitter werden in `.cache/` gespeichert. Die Basiskarte stammt vom Bundes-WMS. Fehlende swissALTI3D-Höhen ergänzt die swissALTIRegio-Kachel `2685-1274`. Die mit `--output` einstellbare Ausgabe enthält Gebiet, 3D Tiles mit Gebäudeattributen und zwei Geländemodelle mit eingebetteten Texturen.

Das [kantonale Originalarchiv](https://data.geo.sh.ch/ogd/bombardierung_schaffhausen.zip) liefert die 354 Einschlagpunkte im GeoPackage. Das Skript transformiert LV95 nach WGS 84 und bewahrt Original-ID, UUID und Typ. Die Anzeigehöhe stammt aus dem heutigen Geländemodell. Das GeoJSON enthält Downloadadresse, SHA-256 des Archivs, GeoPackage-Pfad und Layername.

## Prüfen

```sh
npm test
npm run check:links
npm run check:links -- --external
npm run build
npm run preview -- --host 127.0.0.1
```

In einem zweiten Terminal, mit der tatsächlich angezeigten Vorschauadresse:

```sh
npm run check:links -- --base http://127.0.0.1:4173/ --external
```

Die Tests prüfen alle 354 historischen Marker, Quellenidentitäten, Cluster-Aktualisierung, anklickbare Orte, Sprachwechsel und die Übersetzung sämtlicher vorhandener Quellklassifikationen. Die Linkprüfung validiert lokale Dokumentverweise und Modelldateien. `--base` prüft zusätzlich ausgelieferte Karten-, Build- und Cesium-Ressourcen; die Adresse muss mit `/` enden und kann einen Unterpfad enthalten. `--external` führt echte HTTP-GET-Anfragen mit Weiterleitungen und Zeitlimit aus. Nicht erreichbare Ziele führen zu einem Fehlerstatus. Externe Verfügbarkeit ist eine Momentaufnahme; die Prüfung vor Veröffentlichungen wiederholen.
