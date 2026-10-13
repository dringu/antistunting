"""Tahap 3: daftar tindak lanjut kader (INTERNAL, berisi nama). Tidak pernah masuk web/."""
import os
import pandas as pd
from tahap1_bersih import CFG, ROOT

def berturut(riwayat, kode, ids):
    bln = sorted(riwayat["bulan"].unique()); bln = [b for b in bln if b <= kode][::-1]
    ada = {b: set(riwayat.loc[riwayat.bulan == b, "id"]) for b in bln}; hasil = {}
    for i in ids:
        n = 0
        for b in bln:
            if i in ada[b]: n += 1
            else: break
        hasil[i] = n
    return hasil

def buat(riwayat, ident, kode):
    now = riwayat[riwayat.bulan == kode].copy()
    bulan_lalu = sorted(b for b in riwayat.bulan.unique() if b < kode)
    now["bulan_berturut"] = now["id"].map(berturut(riwayat, kode, set(now["id"])))
    now["baru"] = now["bulan_berturut"] == 1
    now["BB tidak naik"] = now["Naik Berat Badan"] == CFG["kode_tidak_naik"]
    now["Prioritas"] = (now["TB/U"] == "Sangat Pendek").astype(int) + now["BB/U"].isin(["Sangat Kurang"]).astype(int) \
        + now["BB/TB"].isin(["Gizi Buruk", "Gizi Kurang"]).astype(int) + now["BB tidak naik"].astype(int)
    t = now.merge(ident[["id", "Nama", "Nama Ortu", "RT", "RW"]], on="id", how="left")
    t = t.sort_values(["desa", "posyandu", "Prioritas", "bulan_berturut"], ascending=[True, True, False, False])
    kol = {"desa": "Desa", "posyandu": "Posyandu", "Nama": "Nama", "Nama Ortu": "Orang tua", "RT": "RT", "RW": "RW", "JK": "JK", "umur_bln": "Umur (bln)",
           "TB/U": "TB/U", "BB/U": "BB/U", "BB/TB": "BB/TB", "Naik Berat Badan": "Naik BB", "bulan_berturut": "Bulan berturut-turut", "baru": "Baru masuk daftar", "Prioritas": "Skor"}
    daftar = t[list(kol)].rename(columns=kol)
    hilang = pd.DataFrame()
    if bulan_lalu:
        lalu = riwayat[riwayat.bulan == bulan_lalu[-1]]; h = lalu[~lalu["id"].isin(now["id"])]
        hilang = h.merge(ident[["id", "Nama", "Nama Ortu", "RT", "RW"]], on="id", how="left")[["desa", "posyandu", "Nama", "Nama Ortu", "RT", "RW", "umur_bln", "TB/U"]]
        hilang.columns = ["Desa", "Posyandu", "Nama", "Orang tua", "RT", "RW", "Umur (bln)", f"TB/U {bulan_lalu[-1]}"]
        hilang["Kemungkinan lulus balita (umur 58+ bln)"] = hilang["Umur (bln)"] >= 58
        hilang = hilang.sort_values(["Kemungkinan lulus balita (umur 58+ bln)", "Desa", "Posyandu"])
    p = os.path.join(ROOT, "riwayat", f"tindaklanjut_{kode}.xlsx")
    with pd.ExcelWriter(p) as w:
        daftar.to_excel(w, sheet_name="Tindak lanjut", index=False)
        hilang.to_excel(w, sheet_name="Tidak terukur bulan ini", index=False)
    return p, len(daftar), len(hilang)
