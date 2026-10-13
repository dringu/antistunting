"""Tahap 1: baca Excel e-PPGBM -> samarkan NIK -> normalkan -> cek kualitas."""
import hmac, hashlib, os, re, sys, yaml
import pandas as pd
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CFG = yaml.safe_load(open(os.path.join(ROOT, "olah", "config.yaml"), encoding="utf-8"))
WAJIB = ["NIK","JK","Tgl Lahir","BB Lahir","TB Lahir","Nama","Nama Ortu","RT","RW","Desa/Kel","Alamat","Tanggal Pengukuran",
         "Berat","Tinggi","Cara Ukur","BB/U","ZS BB/U","TB/U","ZS TB/U","BB/TB","ZS BB/TB","Naik Berat Badan"]

def kunci():
    k = os.environ.get("ANTISTUNTING_KUNCI")
    p = os.path.join(ROOT, "kunci.txt")
    if not k and os.path.exists(p): k = open(p).read().strip()
    if not k: sys.exit("Kunci hash tidak ditemukan. Buat file kunci.txt (lihat README, langkah 3).")
    return k.encode()

def hash_id(v, k): return hmac.new(k, re.sub(r"\D", "", str(v)).encode(), hashlib.sha256).hexdigest()[:16]
def rapikan(s): return re.sub(r"\s+", " ", str(s).upper()).strip()

def desa_posyandu(desa, alamat):
    d = rapikan(desa); d = CFG["alias_desa"].get(d, d)
    m = re.search(r"POSY?\.?\s*(.+)$", rapikan(alamat))
    p = m.group(1).strip() if m else None
    return d, (CFG["alias_posyandu"].get(p, p) if p else None)

def bersihkan(df, kode_bulan, k):
    """Kembalikan (bersih, identitas, laporan). 'bersih' aman dari data pribadi; 'identitas' hanya untuk lokal."""
    a = CFG["ambang"]; lap = []
    kurang = [c for c in WAJIB if c not in df.columns]
    if kurang: sys.exit(f"Kolom tidak ditemukan di Excel: {kurang}. Format e-PPGBM berubah?")
    df = df[WAJIB].copy()
    df["NIK"] = df["NIK"].astype(str).str.strip()
    s = (~df["NIK"].str.fullmatch(r"\d{16}")).sum()
    if s: lap.append(("NIK bukan 16 digit", int(s)))
    dup = df["NIK"].duplicated()
    if dup.any(): lap.append(("NIK ganda dalam bulan (baris kedua dibuang)", int(dup.sum()))); df = df[~dup]
    df["id"] = df["NIK"].map(lambda v: hash_id(v, k))
    dp = [desa_posyandu(d, al) for d, al in zip(df["Desa/Kel"], df["Alamat"])]
    df["desa"] = [x[0] for x in dp]; df["posyandu"] = [x[1] for x in dp]
    t = df["posyandu"].isna().sum()
    if t: lap.append(("Posyandu tidak tertulis di Alamat (jadi TANPA POSYANDU)", int(t)))
    df["posyandu"] = df["posyandu"].fillna("TANPA POSYANDU")
    df["umur_bln"] = ((df["Tanggal Pengukuran"] - df["Tgl Lahir"]).dt.days / 30.4375).astype(int)
    df["bulan"] = kode_bulan
    df["bb_valid"] = df["Berat"].between(1, a["berat_maks_kg"]); df["tb_valid"] = df["Tinggi"].between(a["tinggi_min_cm"], a["tinggi_maks_cm"])
    for z, n in [("ZS BB/U","BB/U"),("ZS TB/U","TB/U"),("ZS BB/TB","BB/TB")]:
        df[n + "_valid"] = df[z].abs() <= a["z_maks"]
        if (~df[n + "_valid"]).any(): lap.append((f"z-score {n} tidak valid / Outlier", int((~df[n + '_valid']).sum())))
    for c, n in [("bb_valid","Berat di luar rentang"),("tb_valid","Tinggi di luar rentang")]:
        if (~df[c]).any(): lap.append((n, int((~df[c]).sum())))
    g = df["BB Lahir"] > 10
    if g.any(): lap.append(("BB Lahir tampak dalam gram (dibagi 1000)", int(g.sum()))); df.loc[g, "BB Lahir"] /= 1000
    sc = ((df["Cara Ukur"] == "Terlentang") & (df["umur_bln"] >= 24)) | ((df["Cara Ukur"] == "Berdiri") & (df["umur_bln"] < 24))
    if sc.any(): lap.append(("Cara ukur tidak sesuai umur (periksa tinggi)", int(sc.sum())))
    ident = df[["id","Nama","Nama Ortu","RT","RW","Alamat","desa","posyandu"]].drop_duplicates("id")
    bersih = df.drop(columns=["NIK","Nama","Nama Ortu","RT","RW","Alamat","Desa/Kel"])
    return bersih, ident, lap
