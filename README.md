# Pantauan Gizi Balita – Kecamatan Krejengan

Web Statis
Data pribadi **tetap lokal** 
Yang naik ke GitHub hanya JSON agregat.

```
mentah/    ← Excel e-PPGBM (LOKAL, .gitignore)
riwayat/   ← riwayat bersih, daftar tindak lanjut, laporan kualitas (LOKAL, .gitignore)
kunci.txt  ← kunci hash rahasia (LOKAL, .gitignore)
olah/      ← skrip Python (aman dipublikasikan)
acuan/     ← daftar posyandu + koordinat (diisi kader)
web/       ← situs publik: index.html, js/, css/, geo/, data/
.github/workflows/deploy.yml
```

## A. Persiapan sekali saja

1. **Pasang Python 3.10+** dan Git di komputer 
2. **Siapkan lingkungan** (di folder proyek):
   ```
   python -m venv .venv
   .venv\Scripts\activate          (Windows)   |   source .venv/bin/activate   (Linux/Mac)
   pip install -r requirements.txt
   mkdir mentah
   ```
3. **Buat kunci hash** (satu kali, jangan diganti lagi, kalau diganti anak tidak bisa dilacak antarbulan):
   ```
   python -c "import secrets; print(secrets.token_urlsafe(32))" > kunci.txt
   ```
   Salin `kunci.txt` ke **dua tempat aman** di luar repositori (misalnya flashdisk dan drive bersama puskesmas). Jangan dikirim lewat WhatsApp atau email.
4. **Folder `mentah/` dan `riwayat/`** sebaiknya berada di drive bersama puskesmas agar operator bisa bergantian.
7. **Lengkapi alias** di `olah/config.yaml` (ejaan desa dan posyandu yang berbeda-beda di Excel) bersama kader.
8. **Pastikan kode "Naik Berat Badan"**: skrip menganggap `T` = berat badan tidak naik (`kode_tidak_naik` di config). Konfirmasikan arti kode N, T, O, B dengan puskesmas.

## B. Rutinitas bulanan (sekitar 10 menit)

1. Unduh Excel dari e-PPGBM, taruh di `mentah/` (satu berkas, sheet bulan itu, atau berkas dengan sheet bernama bulan).
2. Jalankan:
   ```
   python olah/olah.py 2025-05
   ```
   Opsi bila perlu: `--berkas mentah\nama.xlsx` dan `--sheet NAMA_SHEET`.
3. Baca laporan kualitas di layar (disimpan juga di `riwayat/kualitas_2025-05.txt`). Perbaiki hal yang penting, misalnya desa yang tidak ada di peta.
4. Berikan `riwayat/tindaklanjut_2025-05.xlsx` kepada bidan/kader desa (berisi nama anak: **jangan diunggah ke GitHub atau grup umum**).
5. Publikasikan:
   ```
   git add web
   git status          ← hanya berkas di web/ yang boleh muncul
   git commit -m "data 2025-05"
   git push
   ```
   Situs ter-update otomatis dalam 1-2 menit.
6. **Rapor desa:** buka situs, pilih desa lalu klik *Buka rapor desa* (atau langsung `rapor.html?desa=NAMA`), klik *Cetak / simpan PDF*. Di jendela cetak pilih ukuran A4, margin *Tidak ada*, dan centang *Grafik latar belakang*. Isi catatan petugas dan tanda tangan secara manual setelah dicetak.

Skrip berhenti dengan pesan **BERBAHAYA** bila menemukan pola NIK atau hash di `web/data/`. Jangan push bila itu muncul.

## C. Yang sudah dan belum ada

| Bagian | Status |
|---|---|
| Tahap 1: pembersihan, hash NIK, cek kualitas | siap, diuji pada data Januari-April 2025 |
| Tahap 2: agregat desa, jenis kelamin, umur (sel < 5 disembunyikan) | siap |
| Tahap 3: daftar tindak lanjut kader + anak yang tidak terukur bulan ini | siap (aturan skor sederhana di `tahap3_tindaklanjut.py`, sesuaikan dengan bidan) |
| Peta desa, kartu ringkas, pilih bulan, offline (PWA) | siap |
| Persentase stunting | menunggu data seluruh balita yang ditimbang atau jumlah sasaran per desa |
| Titik posyandu di peta | menunggu koordinat di `acuan/posyandu_daftar.csv` |
| Grafik tren per bulan | siap |
| Rapor desa (1 halaman A4, cetak atau simpan PDF dari browser): `rapor.html?desa=SOKAAN&bulan=2025-04` | siap, perlu dicek tata letaknya di printer/PDF puskesmas |
| Kalkulator z-score, edukasi | tahap berikutnya |

## D. Catatan penting

- **Angka di situs adalah jumlah anak, bukan persentase**, karena berkas yang dipakai hanya berisi anak dengan TB/U pendek/sangat pendek.
- Anak yang "tidak terukur bulan ini" belum tentu membaik: bisa tidak datang, pindah, atau sudah berumur 5 tahun.
- Menambah bulan baru cukup menjalankan `olah.py`; `index.json` diperbarui otomatis.
- Mengganti operator: serahkan akses ke drive bersama dan `kunci.txt`.
