<div align="center">

# 🌿 EkonoMap

### Portal Visualisasi Data Pertumbuhan Ekonomi Indonesia

*Website sumber informasi pertumbuhan ekonomi Indonesia — menyajikan data PDB, inflasi, dan ekspor-impor secara interaktif, dengan data resmi dari BPS & World Bank.*

🌐 **Live:** [ekonomap.site](https://ekonomap.site)

![Status](https://img.shields.io/badge/status-live-success) ![Tema](https://img.shields.io/badge/tema-5%20warna-ec4899) ![Data](https://img.shields.io/badge/data-BPS%20%26%20World%20Bank-457359)

</div>

---

## 📌 Tentang Proyek

**EkonoMap** adalah website interaktif yang menampilkan perkembangan ekonomi Indonesia dari tahun ke tahun. Data ditarik dari **API resmi Badan Pusat Statistik (BPS)** dan **World Bank**, disimpan di database **Supabase**, lalu divisualisasikan dalam bentuk grafik dinamis yang mudah dipahami.

Proyek ini dibuat untuk memenuhi tugas **Tema 3: Website Sumber Informasi Pertumbuhan Ekonomi Indonesia**.

---

## ✨ Fitur Utama

| Fitur | Keterangan |
|-------|------------|
| 📊 **Dashboard Ringkasan** | Ikhtisar indikator ekonomi utama dalam satu halaman. |
| 📈 **Statistik PDB** | Tren pertumbuhan PDB tahunan + **CRUD** (tambah, edit, hapus data). |
| 💹 **Inflasi** | Inflasi bulanan (MoM) dengan KPI rata-rata, tertinggi, & terendah. |
| 📦 **Ekspor–Impor** | Tren ekspor-impor & neraca dagang + rincian per komoditas. |
| 🧮 **Kalkulator Inflasi** | Simulasi nilai uang antar tahun dengan perhitungan inflasi majemuk. |
| 🔍 **Filter per Tahun** | Grafik & tabel menyesuaikan tahun yang dipilih (kumulatif). |
| 🔄 **Data Live** | Terhubung langsung ke database, dengan keterangan "terakhir diperbarui". |
| 📱 **Responsif** | Tampil rapi di desktop maupun mobile. |
| 🎨 **5 Tema Warna** | Ganti tema instan lewat tombol melayang (floating button). |

---

## 🎨 Tema Warna

Tersedia **5 pilihan tema** yang bisa diganti langsung dari tombol 🎨 di pojok kanan bawah (pilihan tersimpan otomatis di browser):

| Tema | Nuansa Warna |
|------|--------------|
| 🌿 **Forest** *(default)* | Hijau — segar & natural |
| 🌹 **Crimson** | Merah marun + aksen oranye — berani & hangat |
| 🌊 **Navy** | Biru tua — elegan & formal |
| 🔷 **Cobalt** | Biru cerah — modern & bersih |
| 🔮 **Indigo** | Ungu — kalem & profesional |

---

## 🛠️ Teknologi

- **Frontend:** HTML5, CSS3, JavaScript (vanilla)
- **Visualisasi:** [Chart.js](https://www.chartjs.org/)
- **Ikon:** [Lucide Icons](https://lucide.dev/)
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL) — diakses via REST API
- **Sumber Data:** API **BPS** (inflasi, ekspor-impor) & **World Bank** (PDB)
- **Backend (terpisah):** Node.js + Express — penarik & pembaru data ke Supabase
- **Hosting:** [Flaz.id](https://flaz.id) (cloud Indonesia) · Domain: ekonomap.site

---

## 📁 Struktur Proyek

```
ekonomap-modern/
├─ index.html            # Landing page (hero + ringkasan)
├─ dashboard.html        # Dashboard ringkasan indikator
├─ pdb.html              # Statistik PDB + CRUD
├─ inflasi.html          # Inflasi bulanan
├─ ekspor-impor.html     # Ekspor-Impor + komoditas
├─ kalkulator.html       # Kalkulator simulasi inflasi
├─ tentang.html          # Tentang tim & proyek
├─ css/
│  └─ style.css          # Design system + 5 tema warna
├─ js/
│  ├─ api.js             # Koneksi & pengambilan data (Supabase)
│  ├─ charts.js          # Helper grafik (Chart.js)
│  ├─ main.js            # Logika halaman & render
│  ├─ kalkulator.js      # Logika kalkulator inflasi
│  └─ theme.js           # Pengatur tema warna
└─ assets/               # logo, favicon, foto tim
```

---

## ▶️ Menjalankan Secara Lokal

Karena berupa web statis, cukup jalankan server lokal sederhana:

```bash
cd ekonomap-modern
python3 -m http.server 8080
# lalu buka http://localhost:8080
```

> Data otomatis diambil dari Supabase, jadi langsung tampil tanpa setup tambahan.

---

## 🔄 Alur Data

```
API BPS & World Bank  →  Backend Node.js (fetcher)  →  Supabase (PostgreSQL)  →  Frontend (baca langsung)
```

Frontend membaca data langsung dari Supabase, sehingga begitu database diperbarui, website ikut menampilkan data terbaru — termasuk keterangan **"Data terakhir diperbarui"**.

---

## 👥 Tim Pengembang

| Nama | Peran |
|------|-------|
| **Labadiya Tarapu** | Developer |
| **Putry Vi'azdha** | Developer |
| **Ahida Nasyiro** | Developer |
| **Emmanuella Winarto** | Developer |

**Dosen Pembimbing:** Dr. Asep Maulana, S.Si., M.Sc., Ph.D.

---

<div align="center">

*Dibuat dengan 💚 untuk memahami arah ekonomi Indonesia.*

</div>
