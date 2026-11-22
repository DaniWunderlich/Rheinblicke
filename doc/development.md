# Entwicklung und Geodaten

[Deutsch](development.md) · [English](development.en.md)

[Zur README](../README.md)

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
