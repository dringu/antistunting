"""Tahap 2: agregat publik. Kelompok < min_sel menjadi null."""
import glob, json, os
from tahap1_bersih import CFG, ROOT
MIN = CFG["min_sel"]
UMUR = [("0-5", 0, 5), ("6-11", 6, 11), ("12-23", 12, 23), ("24-35", 24, 35), ("36-47", 36, 47), ("48-60", 48, 60)]
def sup(n): n = int(n); return n if n >= MIN else None

def agregat(x, kode):
    desa = {nm: {"total": sup(len(g)), "sangat_pendek": sup((g["TB/U"] == "Sangat Pendek").sum())} for nm, g in x.groupby("desa")}
    jk = {j: sup((x["JK"] == j).sum()) for j in ["L", "P"]}
    um = {n: sup(x["umur_bln"].between(a, b).sum()) for n, a, b in UMUR}
    return {"bulan": kode, "ukuran": "jumlah anak dengan TB/U pendek atau sangat pendek (bukan persentase)", "min_sel": MIN,
            "desa": desa, "kecamatan": {"total": int(len(x)), "sangat_pendek": sup((x["TB/U"] == "Sangat Pendek").sum()), "jk": jk, "umur": um}}

def tulis(kode, hasil):
    d = os.path.join(ROOT, "web", "data"); os.makedirs(d, exist_ok=True)
    json.dump(hasil, open(os.path.join(d, f"{kode}.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    bln = sorted(os.path.basename(f)[:-5] for f in glob.glob(os.path.join(d, "20??-??.json")))
    json.dump({"bulan": bln, "terbaru": bln[-1]}, open(os.path.join(d, "index.json"), "w"))
