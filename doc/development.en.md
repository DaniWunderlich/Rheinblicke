# Development and geodata

[Deutsch](development.md) · [English](development.en.md)

[Back to the README](../README.en.md)

## Geodata

The area measures 6,000 × 9,000 metres (LV95: 2,685,000 / 1,276,000 to 2,691,000 / 1,285,000) and contains 12,203 buildings from Swiss coverage. Sources: © swisstopo, with historical data from the Canton of Schaffhausen.

| Dataset | Use |
| --- | --- |
| [swissBUILDINGS3D 3.0](https://www.swisstopo.admin.ch/de/landschaftmodell-swissbuildings3d-3-0-beta), 2025 edition | Original triangle surfaces and available building attributes as 3D Tiles |
| [swissALTI3D](https://www.swisstopo.admin.ch/de/hoehenmodell-swissalti3d), 2026 edition | 2-metre elevation model sampled on a 10-metre grid for the viewer |
| [swissALTIRegio](https://www.swisstopo.admin.ch/de/hoehenmodell-swissaltiregio) | Fills missing terrain heights in Germany |
| [National map](https://map.geo.admin.ch/#/map?lang=en&bgLayer=ch.swisstopo.pixelkarte-farbe) | Labelled base map with cross-border coverage |
| [Bombing of Schaffhausen](https://data.europa.eu/data/datasets/868d4efd-0f2e-46ab-adfb-ffc1056861d9-amt-geoinformation-kanton-schaffhausen?locale=en) | Documented impact locations from 1 April 1944 |
| [SWISSIMAGE](https://www.swisstopo.admin.ch/de/orthobilder-swissimage-10-cm), 2025 edition | Optional orthophotography at 2-metre ground resolution; gaps show the base map |

Buildings and terrain are transformed together from LV95/LN02 to WGS 84 with ellipsoidal heights. Building information continues to show published heights in metres above sea level. Roads, squares, green spaces and water are projected onto the terrain. Building attributes may be missing.

Terrain in Germany is coarser, and no additional German 3D buildings are included. The Celtic rampart can be explored through its place marker, terrain and base map; there is no separate detailed rampart model.

## Regenerating geodata

Ready-to-use data is included in `public/geodata/`. Regeneration requires Python with GDAL including OpenFileGDB support, NumPy and pyproj with PROJ 9.2 or later. Debian 13 provides `python3-gdal`, `python3-numpy` and `python3-pyproj`.

```sh
python3 scripts/prepare_geodata.py
```

The script discovers published terrain, imagery and building tiles through the official STAC catalogue for the configured area and fixed editions. Sources and the swisstopo height transformation grid are cached in `.cache/`. The base map comes from the federal WMS. Missing swissALTI3D heights are filled using swissALTIRegio tile `2685-1274`. Output, configurable with `--output`, includes the area, 3D Tiles with building attributes and two terrain models with embedded textures.

The [original cantonal archive](https://data.geo.sh.ch/ogd/bombardierung_schaffhausen.zip) supplies the 354 impact points in a GeoPackage. The script transforms LV95 to WGS 84 and preserves the original ID, UUID and type. Display heights come from the present-day terrain model. The GeoJSON records the download URL, archive SHA-256, GeoPackage path and layer name.

## Validation

```sh
npm test
npm run check:links
npm run check:links -- --external
npm run build
npm run preview -- --host 127.0.0.1
```

In a second terminal, using the actual preview address:

```sh
npm run check:links -- --base http://127.0.0.1:4173/ --external
```

Tests cover all 354 historical markers, source identities, cluster updates, clickable places, language switching and translations for every source classification in the included data. The link checker validates local documentation references and model files. `--base` also checks served map, build and Cesium resources; the address must end in `/` and may include a subpath. `--external` performs real HTTP GET requests with redirects and a timeout. Unreachable destinations produce a failing exit status. External availability is a snapshot; repeat the check before releases.
