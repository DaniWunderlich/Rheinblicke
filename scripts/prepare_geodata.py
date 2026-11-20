#!/usr/bin/env python3
"""Build the static prototype data from swisstopo releases (GDAL, NumPy, pyproj)."""

import argparse
from concurrent.futures import ThreadPoolExecutor
from hashlib import file_digest
from itertools import product
import json
import math
from pathlib import Path
import struct
from urllib.parse import urlencode
from urllib.request import urlopen

import numpy as np
from osgeo import gdal, ogr
from pyproj import Transformer, datadir

ROOT = Path(__file__).resolve().parents[1]
BOUNDS = (2688468, 1282830, 2690820, 1284020)
TERRAIN_STEP = 7
HISTORY_URL = "https://data.geo.sh.ch/ogd/bombardierung_schaffhausen.zip"
HISTORY_METADATA = "https://opendata.swiss/de/dataset/bombardierung-schaffhausen-kanton-schaffhausen"
HISTORY_MEMBER = "datenabgabe/gpkg/bombardierung_schaffhausen.gpkg"
HISTORY_LAYER = "oeffentlich.sh.bevoelkerungsschutz.bombardierung.sh.bombeneinschlaege"
DATA = "https://data.geo.admin.ch"
GRID = "ch_swisstopo_chgeo2004_ETRS89_LN02.tif"
BUILDINGS = ("1031-24", "1031-42", "1032-13", "1032-31")
RASTERS = tuple(f"{e}-{n}" for e, n in product((2688, 2689, 2690), (1282, 1283, 1284)))
MAP_PARAMS = {
    "SERVICE": "WMS", "VERSION": "1.3.0", "REQUEST": "GetMap",
    "LAYERS": "ch.swisstopo.swisstlm3d-karte-farbe", "STYLES": "", "CRS": "EPSG:2056",
    "BBOX": ",".join(map(str, BOUNDS)), "WIDTH": (BOUNDS[2] - BOUNDS[0]) // 2, "HEIGHT": (BOUNDS[3] - BOUNDS[1]) // 2, "FORMAT": "image/png",
}


def asset(collection, item, suffix):
    return f"{DATA}/ch.swisstopo.{collection}/{item}/{item}{suffix}"


def download(cache, url):
    map_name = f"basiskarte-{'-'.join(map(str, BOUNDS))}.png"
    path = cache / (map_name if "GetMap" in url else url.rsplit("/", 1)[1])
    if not path.exists():
        temporary = path.with_suffix(path.suffix + ".part")
        with urlopen(url, timeout=90) as response, temporary.open("wb") as target:
            while chunk := response.read(1024 * 1024):
                target.write(chunk)
        temporary.replace(path)
        print(f"Downloaded {path.name}", flush=True)
    return path


def json_bytes(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode()


def padded(data, alignment, byte=b" ", offset=0):
    return data + byte * (-(len(data) + offset) % alignment)


class LocalFrame:
    def __init__(self, cache):
        datadir.append_data_dir(str(cache))
        self.geographic = Transformer.from_crs(
            "EPSG:2056+5728", "EPSG:4979", always_xy=True, only_best=True
        )
        self.cartesian = Transformer.from_crs(4979, 4978, always_xy=True)
        e = (BOUNDS[0] + BOUNDS[2]) / 2
        n = (BOUNDS[1] + BOUNDS[3]) / 2
        lon, lat, height = self.geographic.transform(e, n, 400, errcheck=True)
        self.origin = np.array(self.cartesian.transform(lon, lat, height))
        longitude, latitude = map(math.radians, (lon, lat))
        slon, clon = math.sin(longitude), math.cos(longitude)
        slat, clat = math.sin(latitude), math.cos(latitude)
        self.axes = np.array([
            [-slon, clon, 0],
            [-slat * clon, -slat * slon, clat],
            [clat * clon, clat * slon, slat],
        ])
        self.center = [lon, lat, height]

    def enu(self, xyz):
        lon_lat_height = self.geographic.transform(*xyz.T, errcheck=True)
        ecef = np.column_stack(self.cartesian.transform(*lon_lat_height, errcheck=True))
        return (ecef - self.origin) @ self.axes.T

    def transform(self):
        return [*(v for row in self.axes for v in [*row, 0]), *self.origin, 1]


def y_up(enu):
    return enu[:, [0, 2, 1]] * [1, 1, -1]


class Glb:
    def __init__(self):
        self.data = bytearray()
        self.document = {
            "asset": {"version": "2.0", "copyright": "© swisstopo"},
            "scene": 0, "scenes": [{"nodes": [0]}], "nodes": [{"mesh": 0}],
            "meshes": [{"primitives": []}], "bufferViews": [], "accessors": [],
        }

    def view(self, raw, target=None):
        self.data = bytearray(padded(self.data, 4, b"\0"))
        view = {"buffer": 0, "byteOffset": len(self.data), "byteLength": len(raw)}
        if target:
            view["target"] = target
        self.data.extend(raw)
        self.document["bufferViews"].append(view)
        return len(self.document["bufferViews"]) - 1

    def accessor(self, values, target=34962, bounds=False):
        dtype = {5126: "<f4", 5125: "<u4", 5123: "<u2"}
        if values.dtype.kind == "f":
            component = 5126
        else:
            component = 5125 if values.max() > 65535 else 5123
        values = np.asarray(values, dtype=dtype[component])
        kind = "SCALAR" if values.ndim == 1 else f"VEC{values.shape[1]}"
        accessor = {
            "bufferView": self.view(values.tobytes(), target),
            "componentType": component, "count": len(values), "type": kind,
        }
        if bounds:
            accessor.update(min=values.min(axis=0).tolist(), max=values.max(axis=0).tolist())
        self.document["accessors"].append(accessor)
        return len(self.document["accessors"]) - 1

    def encode(self, alignment=4):
        self.document["buffers"] = [{"byteLength": len(self.data)}]
        info = padded(json_bytes(self.document), 4)
        data = padded(self.data, alignment, b"\0", 28 + len(info))
        length = 28 + len(info) + len(data)
        return (struct.pack("<4sII", b"glTF", 2, length)
                + struct.pack("<I4s", len(info), b"JSON") + info
                + struct.pack("<I4s", len(data), b"BIN\0") + data)


def texture(source, cache, name):
    path = cache / f"{name}.jpg"
    gdal.Translate(str(path), source, format="JPEG", bandList=[1, 2, 3],
                   creationOptions=["QUALITY=88", "WORLDFILE=NO"])
    return path.read_bytes()


def terrain_model(terrain, photo, cartography, cache, out, frame):
    # Sample the 2 m elevation source on a regular 7 m mesh for interactive rendering.
    west, south, east, north = BOUNDS
    width = (east - west) // TERRAIN_STEP + 1
    height = (north - south) // TERRAIN_STEP + 1
    margin = TERRAIN_STEP / 2
    dem = gdal.BuildVRT("", [str(p) for p in terrain])
    dem = gdal.Warp("", dem, format="MEM", outputBounds=(west-margin, south-margin, east+margin, north+margin),
                    width=width, height=height, resampleAlg="bilinear", dstNodata=-9999)
    elevation = dem.ReadAsArray()
    if not np.all(np.isfinite(elevation) & (elevation != -9999)):
        raise ValueError("Missing terrain samples in the prototype area")
    x, y = np.meshgrid(np.linspace(west, east, width), np.linspace(north, south, height))
    positions = y_up(frame.enu(np.column_stack([x.ravel(), y.ravel(), elevation.ravel()])))
    uv = np.column_stack([(x.ravel() - west) / (east - west), (north - y.ravel()) / (north - south)])
    top_left = np.arange(width * height).reshape(height, width)[:-1, :-1].ravel()
    indices = np.column_stack([
        top_left, top_left + width, top_left + 1,
        top_left + 1, top_left + width, top_left + width + 1,
    ]).ravel()

    imagery = gdal.BuildVRT("", [str(p) for p in photo])
    imagery = gdal.Warp("", imagery, format="MEM", outputBounds=BOUNDS,
                        width=MAP_PARAMS["WIDTH"], height=MAP_PARAMS["HEIGHT"], resampleAlg="bilinear")
    for name, source in [("basiskarte", str(cartography)), ("luftbild", imagery)]:
        glb = Glb()
        glb.document["extensionsUsed"] = ["KHR_materials_unlit"]
        glb.document["images"] = [{"bufferView": glb.view(texture(source, cache, name)), "mimeType": "image/jpeg"}]
        glb.document["samplers"] = [{"wrapS": 33071, "wrapT": 33071, "minFilter": 9987, "magFilter": 9729}]
        glb.document["textures"] = [{"source": 0, "sampler": 0}]
        glb.document["materials"] = [{
            "pbrMetallicRoughness": {"baseColorTexture": {"index": 0}},
            "extensions": {"KHR_materials_unlit": {}},
        }]
        glb.document["meshes"][0]["primitives"] = [{
            "attributes": {"POSITION": glb.accessor(positions, bounds=True), "TEXCOORD_0": glb.accessor(uv)},
            "indices": glb.accessor(indices, target=34963),
            "material": 0,
        }]
        (out / f"{name}.glb").write_bytes(glb.encode())
    return elevation


def buildings_model(archives, out, frame):
    west, south, east, north = BOUNDS
    attributes = {
        "uuid": "UUID", "name": "NAME_KOMPLETT", "type": "OBJEKTART",
        "use": "GEBAEUDE_NUTZUNG", "egid": "EGID", "height": "GESAMTHOEHE",
        "roofHeight": "DACH_MAX", "year": "HERKUNFT_JAHR",
    }
    metadata = []
    surfaces = []
    covered = set()
    for archive in archives:
        dataset = ogr.Open(f"/vsizip/{archive}")
        layer = dataset.GetLayerByName("Building_solid")
        # Inspect TIN envelopes directly. Some GDAL versions cannot intersect TIN
        # geometries with OGR's rectangular spatial filter.
        for building in layer:
            shape = building.GetGeometryRef()
            if shape is None or shape.IsEmpty():
                continue
            min_x, max_x, min_y, max_y, _, _ = shape.GetEnvelope3D()
            if not (west <= (min_x + max_x) / 2 <= east and south <= (min_y + max_y) / 2 <= north):
                continue
            uuid = building["UUID"]
            if uuid in covered:
                continue
            triangles = [
                shape.GetGeometryRef(i).GetGeometryRef(0).GetPoints()[:3]
                for i in range(shape.GetGeometryCount())
            ]
            if not triangles:
                continue
            covered.add(uuid)
            surfaces.extend(triangles)
            metadata.append((len(triangles), {
                key: building.GetField(column) for key, column in attributes.items()
            }))

    if not metadata:
        raise ValueError("No buildings were found for the prototype area")
    faces = y_up(frame.enu(np.asarray(surfaces).reshape(-1, 3))).reshape(-1, 3, 3)
    normals = np.cross(faces[:, 1] - faces[:, 0], faces[:, 2] - faces[:, 0])
    lengths = np.linalg.norm(normals, axis=1)
    normals /= np.where(lengths > 0, lengths, 1)[:, None]
    batch = np.repeat(np.arange(len(metadata)), [count for count, _ in metadata])
    glb = Glb()
    glb.document["materials"] = [{
        "pbrMetallicRoughness": {"baseColorFactor": [0.50, 0.27, 0.18, 1], "metallicFactor": 0, "roughnessFactor": 1},
        "doubleSided": True,
    }, {
        "pbrMetallicRoughness": {"baseColorFactor": [0.85, 0.76, 0.61, 1], "metallicFactor": 0, "roughnessFactor": 1},
        "doubleSided": True,
    }]
    roofs = normals[:, 1] > 0.15
    for material, mask in enumerate([roofs, ~roofs]):
        # Reuse vertices on coplanar triangles while preserving hard roof and wall edges.
        vertices, indices = np.unique(np.column_stack([
            faces[mask].reshape(-1, 3).astype(np.float32),
            np.repeat(normals[mask].round(4), 3, axis=0),
            np.repeat(batch[mask], 3),
        ]), axis=0, return_inverse=True)
        glb.document["meshes"][0]["primitives"].append({
            "attributes": {
                "POSITION": glb.accessor(vertices[:, :3], bounds=True),
                "NORMAL": glb.accessor(vertices[:, 3:6]),
                "_BATCHID": glb.accessor(vertices[:, 6].astype(np.uint16)),
            },
            "indices": glb.accessor(indices, target=34963),
            "material": material,
        })
    feature_table = padded(json_bytes({"BATCH_LENGTH": len(metadata)}), 8, offset=28)
    batch_table = padded(json_bytes({
        key: [info[key] for _, info in metadata] for key in attributes
    }), 8)
    model = glb.encode(alignment=8)
    length = 28 + len(feature_table) + len(batch_table) + len(model)
    (out / "gebaeude.b3dm").write_bytes(
        struct.pack("<4s6I", b"b3dm", 1, length, len(feature_table), 0, len(batch_table), 0)
        + feature_table + batch_table + model
    )

    vertices = faces.reshape(-1, 3)[:, [0, 2, 1]] * [1, -1, 1]
    minimum, maximum = vertices.min(axis=0), vertices.max(axis=0)
    center, half = (maximum + minimum) / 2, (maximum - minimum) / 2 + 1
    box = [*center, half[0], 0, 0, 0, half[1], 0, 0, 0, half[2]]
    (out / "tileset.json").write_bytes(json_bytes({
        "asset": {"version": "1.0"}, "geometricError": 800,
        "root": {"transform": frame.transform(), "boundingVolume": {"box": box},
                 "geometricError": 0, "refine": "ADD", "content": {"uri": "gebaeude.b3dm"}},
    }))
    return len(metadata), len(faces)


def history_points(archive, out, frame, elevation):
    dataset = ogr.Open(f"/vsizip/{archive}/{HISTORY_MEMBER}")
    layer = dataset.GetLayerByName(HISTORY_LAYER)
    if layer is None or layer.GetSpatialRef().GetAuthorityCode(None) != "2056":
        raise ValueError("Expected the cantonal impact point layer in LV95")
    west, south, east, north = BOUNDS
    features = []
    for record in layer:
        geometry = record.GetGeometryRef()
        if geometry is None or geometry.GetGeometryName() != "POINT" or geometry.IsEmpty():
            raise ValueError(f"Invalid impact geometry (ID {record.GetFID()})")
        e, n = geometry.GetX(), geometry.GetY()
        if not (west < e < east and south < n < north):
            raise ValueError(f"Impact outside the terrain coverage (ID {record.GetFID()})")

        # Interpolate on the same triangles used for the displayed terrain.
        column, row = (e - west) / TERRAIN_STEP, (north - n) / TERRAIN_STEP
        i, j = int(column), int(row)
        u, v = column - i, row - j
        a, b = elevation[j, i:i+2]
        c, d = elevation[j+1, i:i+2]
        z = a + u * (b-a) + v * (c-a) if u + v <= 1 else d + (1-u) * (c-d) + (1-v) * (b-d)
        lon, lat, height = frame.geographic.transform(e, n, z, errcheck=True)
        features.append({
            "type": "Feature", "id": record.GetFID(),
            "geometry": {"type": "Point", "coordinates": [round(lon, 8), round(lat, 8)]},
            "properties": record.items() | {"groundHeightWgs84": round(height, 2)},
        })

    if not features:
        raise ValueError("The cantonal impact layer is empty")
    with archive.open("rb") as source:
        checksum = file_digest(source, "sha256").hexdigest()
    (out / "bombardierung-1944.geojson").write_bytes(json_bytes({
        "type": "FeatureCollection",
        "source": {"url": HISTORY_URL, "metadata": HISTORY_METADATA, "sha256": checksum,
                   "member": HISTORY_MEMBER, "layer": HISTORY_LAYER, "crs": "EPSG:2056"},
        "features": features,
    }) + b"\n")
    return len(features)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache", type=Path, default=ROOT / ".cache")
    parser.add_argument("--output", type=Path, default=ROOT / "public/geodata")
    args = parser.parse_args()
    cache = args.cache.resolve()
    out = args.output.resolve()
    cache.mkdir(parents=True, exist_ok=True)
    out.mkdir(parents=True, exist_ok=True)
    gdal.UseExceptions()
    ogr.UseExceptions()

    building_urls = [asset("swissbuildings3d_3_0", f"swissbuildings3d_3_0_2025_{tile}", "_2056_5728.gdb.zip")
                     for tile in BUILDINGS]
    terrain_urls = [asset("swissalti3d", f"swissalti3d_2026_{tile}", "_2_2056_5728.tif") for tile in RASTERS]
    photo_urls = [asset("swissimage-dop10", f"swissimage-dop10_2025_{tile}", "_2_2056.tif") for tile in RASTERS]
    map_url = f"https://wms.geo.admin.ch/?{urlencode(MAP_PARAMS)}"
    grid_url = f"https://cdn.proj.org/{GRID}"
    with ThreadPoolExecutor(max_workers=6) as pool:
        files = dict(zip(
            urls := [*building_urls, *terrain_urls, *photo_urls, map_url, grid_url, HISTORY_URL],
            pool.map(lambda url: download(cache, url), urls),
        ))

    frame = LocalFrame(cache)
    elevation = terrain_model([files[url] for url in terrain_urls], [files[url] for url in photo_urls],
                              files[map_url], cache, out, frame)
    points = history_points(files[HISTORY_URL], out, frame, elevation)
    low, high = float(elevation.min()), float(elevation.max())
    count, triangles = buildings_model([files[url] for url in building_urls], out, frame)
    (out / "gebiet.json").write_text(json.dumps({
        "center": frame.center, "transform": frame.transform(), "boundsLv95": BOUNDS,
        "buildings": count, "terrainHeightLn02": [round(low), round(high)],
    }, indent=2) + "\n")
    print(f"{count} buildings, {triangles} triangles, terrain {low:.1f}–{high:.1f} m LN02, {points} historical impact points")


if __name__ == "__main__":
    main()
