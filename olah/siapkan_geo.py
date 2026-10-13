"""Gabung 17 GeoJSON desa -> web/geo/desa.geojson (+ batas kecamatan). Pakai: python siapkan_geo.py <folder_geojson>"""
import json, glob, os, sys
from shapely.geometry import shape, mapping
from shapely.ops import unary_union
NAMA = {"2004": "OPO-OPO", "2012": "SEBOROH", "2016": "DAWUHAN", "2017": "SOKAAN"}  # ejaan sumber -> ejaan e-PPGBM
src = sys.argv[1]; out = "../web/geo"; os.makedirs(out, exist_ok=True)
fitur, geoms = [], []
for f in sorted(glob.glob(os.path.join(src, "35_13_15_*.geojson"))):
    g = json.load(open(f, encoding="utf-8")); k = g["properties"]["code"][-4:]
    s = shape(g["geometry"])
    if not s.is_valid: s = s.buffer(0)
    s = s.simplify(0.00003, preserve_topology=True)   # sekitar 3 m
    nama = NAMA.get(k, g["properties"]["name"].upper())
    geoms.append(s)
    fitur.append({"type": "Feature", "properties": {"kode": g["properties"]["code"], "desa": nama}, "geometry": mapping(s)})
def bulat(o):
    return [bulat(x) for x in o] if isinstance(o, (list, tuple)) else round(o, 5)
for ft in fitur: ft["geometry"]["coordinates"] = bulat(ft["geometry"]["coordinates"])
json.dump({"type": "FeatureCollection", "features": fitur}, open(f"{out}/desa.geojson", "w"), separators=(",", ":"))
kec = json.load(open(os.path.join(src, "batas_krejengan.geojson"), encoding="utf-8"))
u = unary_union(geoms); ks = shape(kec["features"][0]["geometry"])
print("desa:", len(fitur), "| union bounds:", [round(v, 4) for v in u.bounds])
print("batas kecamatan bounds:", [round(v, 4) for v in ks.bounds])
print("luas union desa / luas kecamatan:", round(u.area / ks.area, 3), "| beda simetris/kecamatan:", round(u.symmetric_difference(ks).area / ks.area, 3))
print("ukuran desa.geojson:", os.path.getsize(f"{out}/desa.geojson") // 1024, "KB")
