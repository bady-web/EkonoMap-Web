# EkonoMap — Versi Desain Modern 🌿🌸

Portal visualisasi data pertumbuhan ekonomi Indonesia (Tema 3). Desain modern dengan landing page, dashboard, dan halaman fitur. Data bersumber dari **Badan Pusat Statistik (BPS)**.

## 🎨 Palet Warna
- Forest Green `#457359`
- Rose Pink `#D37897`

## 📁 Struktur
```
ekonomap-modern/
├─ index.html          # Landing page (modern hero + fitur)
├─ dashboard.html      # Dashboard ringkasan
├─ pdb.html            # Statistik PDB + CRUD
├─ inflasi.html        # Inflasi bulanan
├─ ekspor-impor.html   # Ekspor-Impor + komoditas
├─ kalkulator.html     # Kalkulator simulasi inflasi
├─ tentang.html        # Tentang
├─ css/style.css       # Satu design system modern
├─ js/  api.js · charts.js · main.js · kalkulator.js
└─ assets/ logo.png · favicon.ico
```

## ▶️ Menjalankan
```bash
cd ekonomap-modern
python3 -m http.server 8080
# buka http://localhost:8080
```

## 🔌 Sumber Data: 3 mode (atur di `js/api.js` baris `DATA_MODE`)
| Mode | Keterangan |
|------|------------|
| `mock` | Data contoh bawaan (default) — langsung jalan tanpa backend. |
| `backend` | Ambil dari API backend tim data: `GET /api/pdb`, `/api/inflasi`, `/api/trade` (+ CRUD). **Rekomendasi untuk data BPS final.** |
| `worldbank` | Ambil LANGSUNG dari API publik World Bank (tanpa API key, CORS aman) — untuk demo data live. |

### Kenapa BPS sebaiknya lewat backend/database, bukan langsung dari frontend?
1. **API key bocor** — key BPS akan terlihat publik di kode browser. Berbahaya.
2. **CORS** — API BPS umumnya menolak request langsung dari browser.
3. **Rubrik CRUD/Backend (35%)** — wajib ada database + CRUD; data perlu disimpan, bukan sekadar diteruskan.
4. **Stabil & cepat** — data tersimpan di DB, tidak bergantung uptime API BPS saat halaman dibuka.

> Alur ideal: **API BPS → Backend (simpan ke DB) → Frontend baca dari backend**. Saat backend siap, ubah `DATA_MODE = 'backend'`.

## 🧩 Kontrak data untuk tim backend
Backend cukup mengembalikan JSON dengan format **sama persis** seperti objek `MOCK` di `js/api.js`. Jika nama variabel berbeda, tambahkan fungsi adapter kecil (lihat komentar di `api.js`).
