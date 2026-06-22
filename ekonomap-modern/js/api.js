/* =============================================================
   EkonoMap - Data Layer
   Ganti DATA_MODE untuk memilih sumber data:
   - 'supabase'  : ambil dari database Supabase tim (AKTIF SEKARANG)
   - 'mock'      : data contoh bawaan (untuk uji tampilan offline)
   - 'backend'   : ambil dari API backend PHP (alternatif lama)
   - 'worldbank' : ambil LANGSUNG dari API publik World Bank (tanpa key)
   ============================================================= */
const DATA_MODE = 'supabase';
const BACKEND_BASE = '/api';
const WB = 'https://api.worldbank.org/v2/country/IDN/indicator';

/* ---------- Konfigurasi Supabase (database teman) ---------- */
const SB_URL = 'https://xebadufchtfjuqiwfpba.supabase.co';
// Publishable key = aman dipakai di frontend (browser).
const SB_KEY = 'sb_publishable_HU0Hphz7L2HBMm4W-qZLCw_zn_M1WF2';

/* Ambil semua baris dari sebuah tabel Supabase (REST / PostgREST).
   Contoh query tambahan: sb('inflasi', 'order=tahun.asc') */
async function sb(table, query){
  const sel = (query && query.includes('select=')) ? '' : 'select=*';
  const qs = [sel, query].filter(Boolean).join('&');
  const url = `${SB_URL}/rest/v1/${table}${qs ? ('?' + qs) : ''}`;
  const res = await fetch(url, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
  });
  if(!res.ok) throw new Error('Supabase ' + table + ' HTTP ' + res.status);
  return res.json();
}

/* ---------- MOCK DATA (cadangan + kontrak bentuk data) ---------- */
const MOCK = {
  pdb: [
    {tahun:2019, nilai:15833, pertumbuhan:5.02, status:'Tinggi'},
    {tahun:2020, nilai:15443, pertumbuhan:-2.07, status:'Rendah'},
    {tahun:2021, nilai:16971, pertumbuhan:3.70, status:'Sedang'},
    {tahun:2022, nilai:19588, pertumbuhan:5.31, status:'Tinggi'},
    {tahun:2023, nilai:20892, pertumbuhan:5.05, status:'Tinggi'},
    {tahun:2024, nilai:22139, pertumbuhan:5.03, status:'Tinggi'}
  ],
  inflasi: [
    {bulan:'Jan', yoy:2.57, mom:0.04},{bulan:'Feb', yoy:2.75, mom:0.37},
    {bulan:'Mar', yoy:3.05, mom:0.52},{bulan:'Apr', yoy:3.00, mom:0.25},
    {bulan:'Mei', yoy:2.84, mom:-0.03},{bulan:'Jun', yoy:2.51, mom:-0.08},
    {bulan:'Jul', yoy:2.13, mom:-0.18},{bulan:'Agu', yoy:2.12, mom:-0.03},
    {bulan:'Sep', yoy:1.84, mom:-0.12},{bulan:'Okt', yoy:1.71, mom:0.08},
    {bulan:'Nov', yoy:1.55, mom:0.30},{bulan:'Des', yoy:1.57, mom:0.44}
  ],
  trade: {
    bulanan:[
      {bulan:'Jul', ekspor:22210, impor:21740},{bulan:'Agu', ekspor:23560, impor:20670},
      {bulan:'Sep', ekspor:22080, impor:18820},{bulan:'Okt', ekspor:24410, impor:21940},
      {bulan:'Nov', ekspor:24010, impor:21250},{bulan:'Des', ekspor:23460, impor:21220}
    ],
    komoditas:[
      {nama:'Batu Bara', ekspor:2800, impor:60},
      {nama:'Minyak Sawit (CPO)', ekspor:2100, impor:25},
      {nama:'Besi & Baja', ekspor:2050, impor:1900},
      {nama:'Mesin & Peralatan', ekspor:900, impor:3200},
      {nama:'Kendaraan', ekspor:1200, impor:700},
      {nama:'Bahan Kimia', ekspor:700, impor:1500}
    ]
  }
};

const delay = (ms)=>new Promise(r=>setTimeout(r,ms));
const NAMA_BULAN = ['','Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const NAMA_BULAN_FULL = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
function statusFromGrowth(g){ return g>=5 ? 'Tinggi' : g>=3 ? 'Sedang' : 'Rendah'; }

/* ---------- World Bank helper (live, tanpa API key) ---------- */
async function wbFetch(indicator, from, to){
  const url = `${WB}/${indicator}?format=json&date=${from}:${to}&per_page=300`;
  const res = await fetch(url);
  const json = await res.json();
  return (json[1]||[])
    .filter(d=>d.value!==null)
    .map(d=>({tahun:+d.date, value:d.value}))
    .sort((a,b)=>a.tahun-b.tahun);
}

/* =============================================================
   PUBLIC GETTERS
   Tiap getter mengubah bentuk data Supabase -> bentuk yang
   dipakai halaman frontend (lihat komentar di tiap fungsi).
   ============================================================= */

/* PDB -> [{tahun, nilai, pertumbuhan, status}]
   Supabase tabel `pdb`: {tahun, pertumbuhan_yoy, nilai_usd (World Bank) / nilai_triliun (BPS)}
   - nilai      = nilai_usd (World Bank, Miliar USD) atau nilai_triliun (BPS) -- otomatis deteksi
   - pertumbuhan= rata-rata pertumbuhan_yoy di tahun itu
   - status     = dihitung otomatis dari pertumbuhan
   CATATAN: jika tabel `pdb` masih KOSONG, sementara dipakai data contoh
   agar halaman tidak error. Akan otomatis pakai data asli begitu terisi. */
async function getPDB(){
  if(DATA_MODE==='supabase'){
    try{
      const rows = await sb('pdb');
      if(rows && rows.length){
        const byYear = {};
        rows.forEach(r=>{
          const th = +r.tahun;
          if(!byYear[th]) byYear[th] = {nilai:0, growth:[]};
          byYear[th].nilai += (+(r.nilai_usd ?? r.nilai_triliun) || 0);
          if(r.pertumbuhan_yoy != null) byYear[th].growth.push(+r.pertumbuhan_yoy);
        });
        return Object.keys(byYear).map(th=>{
          const o = byYear[th];
          const g = o.growth.length ? +(o.growth.reduce((s,x)=>s+x,0)/o.growth.length).toFixed(2) : 0;
          return {tahun:+th, nilai:Math.round(o.nilai), pertumbuhan:g, status:statusFromGrowth(g)};
        }).sort((a,b)=>a.tahun-b.tahun);
      }
      console.warn('Supabase: tabel pdb masih KOSONG -> halaman PDB menampilkan keadaan kosong.');
      return []; // biarkan kosong (bukan data contoh) supaya keadaan kosong terlihat apa adanya
    }catch(e){ console.warn('Supabase pdb gagal, pakai mock', e); }
  }
  if(DATA_MODE==='backend') return fetch(`${BACKEND_BASE}/pdb`).then(r=>r.json());
  if(DATA_MODE==='worldbank'){
    try{
      const y1=new Date().getFullYear();
      const growth = await wbFetch('NY.GDP.MKTP.KD.ZG', y1-6, y1);
      const gdp = await wbFetch('NY.GDP.MKTP.CD', y1-6, y1);
      const gmap = Object.fromEntries(gdp.map(d=>[d.tahun, d.value]));
      return growth.map(d=>({tahun:d.tahun, nilai:Math.round((gmap[d.tahun]||0)/1e9), pertumbuhan:+d.value.toFixed(2), status:statusFromGrowth(d.value)}));
    }catch(e){ console.warn('WorldBank gagal, pakai mock', e); }
  }
  await delay(150); return structuredClone(MOCK.pdb);
}

/* INFLASI -> [{bulan, yoy, mom}]
   Supabase tabel `inflasi`: {tahun, bulan(1-12), nilai}
   - bulan = label "Jan '24" (gabungan nama bulan + tahun)
   - yoy   = nilai  (CATATAN: arti `nilai` belum dikonfirmasi teman,
             kemungkinan inflasi bulanan/MoM. Ganti pemetaan ini bila sudah pasti.)
   - mom   = null   (database belum punya kolom kedua) */
async function getInflasi(){
  if(DATA_MODE==='supabase'){
    try{
      const rows = await sb('inflasi');
      if(rows && rows.length){
        return rows
          .map(r=>({tahun:+r.tahun, b:+r.bulan, nilai:+r.nilai}))
          .sort((a,b)=> a.tahun-b.tahun || a.b-b.b)
          .map(r=>({ bulan:`${NAMA_BULAN_FULL[r.b]||r.b} ${r.tahun}`, bulanShort:(NAMA_BULAN[r.b]||String(r.b)), tahun:r.tahun, b:r.b, yoy:+r.nilai.toFixed(2), mom:null }));
      }
    }catch(e){ console.warn('Supabase inflasi gagal, pakai mock', e); }
  }
  if(DATA_MODE==='backend') return fetch(`${BACKEND_BASE}/inflasi`).then(r=>r.json());
  if(DATA_MODE==='worldbank'){
    try{
      const y1=new Date().getFullYear();
      const cpi = await wbFetch('FP.CPI.TOTL.ZG', y1-9, y1);
      return cpi.map(d=>({bulan:String(d.tahun), yoy:+d.value.toFixed(2), mom:null}));
    }catch(e){ console.warn('WorldBank gagal, pakai mock', e); }
  }
  await delay(150); return structuredClone(MOCK.inflasi);
}

/* TRADE -> {bulanan:[{bulan, ekspor, impor}], komoditas:[{nama, ekspor, impor}]}
   Supabase 2 tabel: `ekspor` & `impor` {tahun, nama_komoditas, nilai_usd}
   - bulanan   = TREN TOTAL PER TAHUN (jumlah nilai_usd per tahun) -> label = tahun
   - komoditas = TOP komoditas pada tahun terakhir (ekspor & impor digabung per nama) */
async function getTrade(){
  if(DATA_MODE==='supabase'){
    try{
      const [eks, imp] = await Promise.all([sb('ekspor'), sb('impor')]);
      if((eks && eks.length) || (imp && imp.length)){
        const sumYear = (arr)=>{ const m={}; (arr||[]).forEach(r=>{ const t=+r.tahun; m[t]=(m[t]||0)+(+r.nilai_usd||0); }); return m; };
        const eY = sumYear(eks), iY = sumYear(imp);
        const years = [...new Set([...Object.keys(eY), ...Object.keys(iY)].map(Number))].sort((a,b)=>a-b);
        const bulanan = years.map(t=>({ bulan:String(t), ekspor:Math.round(eY[t]||0), impor:Math.round(iY[t]||0) }));
        // Komoditas per tahun (untuk dropdown pilih tahun)
        const lastYear = years[years.length-1];
        const sumKom = (arr, yr)=>{ const m={}; (arr||[]).filter(r=>+r.tahun===yr).forEach(r=>{ const k=r.nama_komoditas||'-'; m[k]=(m[k]||0)+(+r.nilai_usd||0); }); return m; };
        const komoditasByYear = {};
        years.forEach(yr=>{
          const ke = sumKom(eks, yr), ki = sumKom(imp, yr);
          const names = [...new Set([...Object.keys(ke), ...Object.keys(ki)])];
          komoditasByYear[yr] = names
            .map(n=>({ nama:n, ekspor:Math.round(ke[n]||0), impor:Math.round(ki[n]||0) }))
            .sort((a,b)=>(b.ekspor+b.impor)-(a.ekspor+a.impor))
            .slice(0,8);
        });
        return { bulanan, komoditas: komoditasByYear[lastYear]||[], komoditasByYear, years };
      }
    }catch(e){ console.warn('Supabase trade gagal, pakai mock', e); }
  }
  if(DATA_MODE==='backend') return fetch(`${BACKEND_BASE}/trade`).then(r=>r.json());
  if(DATA_MODE==='worldbank'){
    try{
      const y1=new Date().getFullYear();
      const exp = await wbFetch('NE.EXP.GNFS.CD', y1-6, y1);
      const imp = await wbFetch('NE.IMP.GNFS.CD', y1-6, y1);
      const imap = Object.fromEntries(imp.map(d=>[d.tahun, d.value]));
      const bulanan = exp.map(d=>({bulan:String(d.tahun), ekspor:Math.round(d.value/1e6), impor:Math.round((imap[d.tahun]||0)/1e6)}));
      return {bulanan, komoditas:structuredClone(MOCK.trade.komoditas)};
    }catch(e){ console.warn('WorldBank gagal, pakai mock', e); }
  }
  await delay(150); return structuredClone(MOCK.trade);
}

/* ---------- Waktu terakhir data diperbarui (dari kolom created_at) ---------- */
async function getLastUpdated(){
  if(DATA_MODE!=='supabase') return null;
  try{
    const tables = ['inflasi','ekspor','impor','pdb'];
    const results = await Promise.all(tables.map(t=>
      sb(t, 'select=created_at&order=created_at.desc&limit=1').catch(()=>[])
    ));
    let latest = null;
    results.forEach(rows=>{
      const ts = rows && rows[0] && rows[0].created_at;
      if(ts){ const d = new Date(ts); if(!latest || d > latest) latest = d; }
    });
    return latest;
  }catch(e){ console.warn('getLastUpdated gagal', e); return null; }
}

/* ---------- CRUD PDB ----------
   Catatan: untuk sekarang CRUD bersifat LOKAL (di memori browser) supaya
   tombol Tambah/Edit/Hapus tetap berfungsi untuk demo. Nanti saat fitur
   login admin siap, ini bisa diarahkan menulis ke Supabase. */
let _pdbStore = null;
async function loadPdbStore(){ if(!_pdbStore) _pdbStore = await getPDB(); return _pdbStore; }
async function createPDB(row){
  if(DATA_MODE==='backend') return fetch(`${BACKEND_BASE}/pdb`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(row)}).then(r=>r.json());
  const s = await loadPdbStore(); s.push(row); s.sort((a,b)=>a.tahun-b.tahun); return row;
}
async function updatePDB(tahun,row){
  if(DATA_MODE==='backend') return fetch(`${BACKEND_BASE}/pdb/${tahun}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(row)}).then(r=>r.json());
  const s = await loadPdbStore(); const i=s.findIndex(d=>d.tahun===tahun); if(i>=0) s[i]={...s[i],...row}; return s[i];
}
async function deletePDB(tahun){
  if(DATA_MODE==='backend') return fetch(`${BACKEND_BASE}/pdb/${tahun}`,{method:'DELETE'});
  const s = await loadPdbStore(); const i=s.findIndex(d=>d.tahun===tahun); if(i>=0) s.splice(i,1);
}
