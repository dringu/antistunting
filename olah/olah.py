"""Pakai: python olah/olah.py 2025-02 [--berkas mentah/file.xlsx] [--sheet NAMA]"""
import argparse, glob, json, os, re, sys
import pandas as pd
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tahap1_bersih import ROOT, kunci, bersihkan
from tahap2_agregat import agregat, tulis
from tahap3_tindaklanjut import buat
NAMA = ["JANUARI","FEBRUARI","MARET","APRIL","MEI","JUNI","JULI","AGUSTUS","SEPTEMBER","OKTOBER","NOVEMBER","DESEMBER"]
ap = argparse.ArgumentParser(); ap.add_argument("bulan"); ap.add_argument("--berkas"); ap.add_argument("--sheet"); a = ap.parse_args()
if not re.fullmatch(r"20\d\d-(0[1-9]|1[0-2])", a.bulan): sys.exit("Format bulan: TAHUN-BULAN, contoh 2025-02")
berkas = a.berkas or max(glob.glob(os.path.join(ROOT, "mentah", "*.xls*")), key=os.path.getmtime, default=None)
if not berkas: sys.exit("Taruh Excel e-PPGBM di folder mentah/ terlebih dahulu.")
xl = pd.ExcelFile(berkas); nm = NAMA[int(a.bulan[5:]) - 1]
sheet = a.sheet or (nm if nm in [s.upper() for s in xl.sheet_names] else (xl.sheet_names[0] if len(xl.sheet_names) == 1 else None))
if sheet is None: sys.exit(f"Sheet bulan tidak ketemu. Pilihan: {xl.sheet_names}. Pakai --sheet NAMA.")
sheet = next(s for s in xl.sheet_names if s.upper() == sheet.upper())
print(f"Berkas: {os.path.basename(berkas)} | sheet: {sheet} | bulan: {a.bulan}")
df = xl.parse(sheet, dtype={"NIK": str}); k = kunci()
bersih, ident, lap = bersihkan(df, a.bulan, k)
os.makedirs(os.path.join(ROOT, "riwayat"), exist_ok=True)
pb, pi = os.path.join(ROOT, "riwayat", "bersih.pkl"), os.path.join(ROOT, "riwayat", "identitas.pkl")
rw = pd.read_pickle(pb) if os.path.exists(pb) else bersih.iloc[0:0]
rw = pd.concat([rw[rw.bulan != a.bulan], bersih], ignore_index=True); rw.to_pickle(pb)
idn = pd.read_pickle(pi) if os.path.exists(pi) else ident.iloc[0:0]
pd.concat([idn[~idn.id.isin(ident.id)], ident]).to_pickle(pi)
hasil = agregat(bersih, a.bulan); tulis(a.bulan, hasil)
p3, n3, nh = buat(rw, pd.read_pickle(pi), a.bulan)
# pemeriksaan: nama desa harus ada di peta; data publik tidak boleh memuat pola NIK/hash
geo = {f["properties"]["desa"] for f in json.load(open(os.path.join(ROOT, "web", "geo", "desa.geojson")))["features"]}
asing = set(bersih.desa) - geo
if asing: lap.append((f"Desa TIDAK ADA di peta (tambahkan alias di config.yaml): {sorted(asing)}", len(asing)))
for f in glob.glob(os.path.join(ROOT, "web", "data", "*.json")):
    if re.search(r"\b\d{16}\b|\b[0-9a-f]{16}\b", open(f, encoding="utf-8").read()): sys.exit(f"BERBAHAYA: pola NIK/hash ditemukan di {f}. Jangan di-push.")
teks = [f"Laporan kualitas {a.bulan}: {len(bersih)} anak"] + [f"- {t}: {n}" for t, n in lap]
open(os.path.join(ROOT, "riwayat", f"kualitas_{a.bulan}.txt"), "w", encoding="utf-8").write("\n".join(teks))
print("\n".join(teks)); print(f"\nData publik : web/data/{a.bulan}.json (+ index.json)\nTindak lanjut (LOKAL, jangan dibagikan sembarangan): {os.path.relpath(p3, ROOT)} | {n3} anak, {nh} tidak terukur bulan ini")
print("Selanjutnya: periksa laporan di atas, lalu git add web && git commit && git push")
