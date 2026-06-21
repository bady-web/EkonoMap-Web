/* ====== Shared UI ====== */
function setupSidebar(){
  const app = document.querySelector('.app');
  const burger = document.getElementById('hamburger');
  const overlay = document.getElementById('overlay');
  if(!app || !burger) return;
  const isMobile = ()=>window.matchMedia('(max-width:720px)').matches;
  burger.addEventListener('click', ()=>{
    if(isMobile()) app.classList.toggle('mobile-open');
    else app.classList.toggle('collapsed');
  });
  if(overlay) overlay.addEventListener('click', ()=>app.classList.remove('mobile-open'));
}
const fmt = (n)=> new Intl.NumberFormat('id-ID').format(Math.round(n));
function fmtTanggal(d){ return d ? new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Jakarta'}).format(d)+' WIB' : '—'; }
const tagClass = (s)=> s==='Tinggi'?'tinggi':s==='Sedang'?'sedang':'rendah';

/* ====== Landing ====== */
async function initLanding(){
  const nav = document.querySelector('.nav');
  if(nav){ window.addEventListener('scroll', ()=> nav.classList.toggle('scrolled', window.scrollY>30)); }
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if(toggle && links) toggle.addEventListener('click', ()=> links.classList.toggle('open'));
  // reveal on scroll
  const obs = new IntersectionObserver((es)=>es.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('in'); }),{threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
  // teaser stats
  try{
    const [pdb, inf, trade] = await Promise.all([getPDB(), getInflasi(), getTrade()]);
    const last = pdb[pdb.length-1];
    const li = inf[inf.length-1];
    const lt = trade.bulanan[trade.bulanan.length-1];
    const set=(id,v)=>{const e=document.getElementById(id); if(e) e.textContent=v;};
    set('stPdb', last? last.pertumbuhan+'%' : '–');
    set('stInf', li? li.yoy+'%' : '–');
    set('stEks', lt? '$'+fmt(lt.ekspor/1000)+'B' : '–');
    set('stImp', lt? '$'+fmt(lt.impor/1000)+'B' : '–');
  }catch(e){ console.warn(e); }
}

/* ====== Dashboard ====== */
async function initDashboard(){
  const [pdb, inf, trade] = await Promise.all([getPDB(), getInflasi(), getTrade()]);
  const last = pdb[pdb.length-1], prev = pdb[pdb.length-2];
  const li = inf[inf.length-1];
  const lt = trade.bulanan[trade.bulanan.length-1];
  const neraca = lt.ekspor - lt.impor;
  const kpis = [
    (last ? {label:'PDB '+last.tahun+' (Miliar USD)', val:fmt(last.nilai), sub:(last.pertumbuhan>=0?'▲ ':'▼ ')+last.pertumbuhan+'% YoY', up:last.pertumbuhan>=0} : {label:'PDB (Miliar USD)', val:'—', sub:'Belum ada data', up:true}),
    {label:'Inflasi ('+li.bulan+')', val:li.yoy+'%', sub:'Inflasi bulanan (MoM)', up:false},
    {label:'Ekspor ('+lt.bulan+', $Juta)', val:fmt(lt.ekspor), sub:'Nilai ekspor terkini', up:true},
    {label:'Neraca Dagang ($Juta)', val:(neraca>=0?'+':'')+fmt(neraca), sub:neraca>=0?'Surplus':'Defisit', up:neraca>=0}
  ];
  document.getElementById('kpiGrid').innerHTML = kpis.map(k=>
    `<div class='kpi'><div class='label'>${k.label}</div><div class='value'>${k.val}</div><div class='sub ${k.up?'trend-up':'trend-down'}'>${k.sub}</div></div>`).join('');
  areaChart('chartGrowth', pdb.map(d=>d.tahun), pdb.map(d=>d.pertumbuhan), 'Pertumbuhan PDB (%)', C_PINK);
  const sum = [
    ['Pertumbuhan PDB'+(last?' '+last.tahun:''), last? last.pertumbuhan+'%' : 'Belum ada data'],
    ['Inflasi terkini ('+li.bulan+')', li.yoy+'%'],
    ['Neraca dagang', (neraca>=0?'Surplus +':'Defisit ')+fmt(neraca)+' $Juta'],
    ['Sumber data', 'BPS / API']
  ];
  document.getElementById('summaryList').innerHTML = sum.map(s=>
    `<li style='display:flex;justify-content:space-between;border-bottom:1px solid var(--line);padding:9px 0'><span style='color:var(--muted)'>${s[0]}</span><b>${s[1]}</b></li>`).join('');
  const box=document.getElementById('insightBox');
  if(box) box.innerHTML = (last && prev)
    ? `💡 Ekonomi tumbuh <b>${last.pertumbuhan}%</b> di ${last.tahun} (dari ${prev.pertumbuhan}% di ${prev.tahun}), dengan inflasi terkendali di <b>${li.yoy}%</b>.`
    : `💡 Data PDB belum tersedia. Inflasi terkini tercatat <b>${li.yoy}%</b> (${li.bulan}).`;
  getLastUpdated().then(d=>{ const e=document.getElementById('lastUpdate'); if(e) e.textContent = d ? ('Data terakhir diperbarui: '+fmtTanggal(d)) : ''; });
}

/* ====== PDB + CRUD ====== */
let editingTahun = null;
async function initPdb(){
  await renderPdb();
  const modal=document.getElementById('pdbModal');
  document.getElementById('btnAddPdb').addEventListener('click', ()=>openPdbModal());
  document.getElementById('pdbCancel').addEventListener('click', ()=>modal.classList.remove('open'));
  document.getElementById('pdbSave').addEventListener('click', savePdb);
}
async function renderPdb(){
  const data = await loadPdbStore();
  if(!data.length){
    document.getElementById('kpiPdb').innerHTML=[
      {l:'PDB (Miliar USD)',v:'—',s:'Belum ada data',up:true},
      {l:'Rata-rata Pertumbuhan',v:'—',s:'Belum ada data',up:true},
      {l:'Pertumbuhan Tertinggi',v:'—',s:'Belum ada data',up:true},
      {l:'Jumlah Data',v:0,s:'baris tercatat',up:true}
    ].map(k=>`<div class='kpi'><div class='label'>${k.l}</div><div class='value'>${k.v}</div><div class='sub ${k.up?'trend-up':'trend-down'}'>${k.s}</div></div>`).join('');
    barChart('chartPdb', [], [], 'Pertumbuhan (%)');
    document.getElementById('pdbTableBody').innerHTML = `<tr><td colspan='5' style='text-align:center;color:var(--muted);padding:24px'>Belum ada data PDB. Data akan muncul otomatis saat database terisi — atau klik <b>+ Tambah Data</b> untuk menambah manual.</td></tr>`;
    return;
  }
  const last=data[data.length-1];
  const avg=(data.reduce((s,d)=>s+d.pertumbuhan,0)/data.length).toFixed(2);
  const max=data.reduce((a,b)=>b.pertumbuhan>a.pertumbuhan?b:a);
  document.getElementById('kpiPdb').innerHTML=[
    {l:'PDB '+last.tahun+' (Miliar USD)',v:fmt(last.nilai),s:last.pertumbuhan+'% YoY',up:last.pertumbuhan>=0},
    {l:'Rata-rata Pertumbuhan',v:avg+'%',s:data.length+' tahun terakhir',up:avg>=0},
    {l:'Pertumbuhan Tertinggi',v:max.pertumbuhan+'%',s:'Tahun '+max.tahun,up:true},
    {l:'Jumlah Data',v:data.length,s:'baris tercatat',up:true}
  ].map(k=>`<div class='kpi'><div class='label'>${k.l}</div><div class='value'>${k.v}</div><div class='sub ${k.up?'trend-up':'trend-down'}'>${k.s}</div></div>`).join('');
  barChart('chartPdb', data.map(d=>d.tahun), data.map(d=>d.pertumbuhan), 'Pertumbuhan (%)');
  document.getElementById('pdbTableBody').innerHTML = data.map(d=>
    `<tr><td><b>${d.tahun}</b></td><td>${fmt(d.nilai)}</td><td>${d.pertumbuhan}%</td><td><span class='tag ${tagClass(d.status)}'>${d.status}</span></td>
     <td><div class='row-actions'><button class='icon-btn' onclick='openPdbModal(${d.tahun})'>✏️</button><button class='icon-btn del' onclick='removePdb(${d.tahun})'>🗑️</button></div></td></tr>`).join('');
}
function openPdbModal(tahun){
  const modal=document.getElementById('pdbModal');
  editingTahun = tahun||null;
  document.getElementById('pdbModalTitle').textContent = tahun? 'Edit Data PDB' : 'Tambah Data PDB';
  const data = _pdbStore||[];
  const row = tahun? data.find(d=>d.tahun===tahun) : {tahun:'',nilai:'',pertumbuhan:'',status:'Sedang'};
  document.getElementById('fTahun').value=row.tahun;
  document.getElementById('fTahun').disabled=!!tahun;
  document.getElementById('fNilai').value=row.nilai;
  document.getElementById('fGrowth').value=row.pertumbuhan;
  document.getElementById('fStatus').value=row.status;
  modal.classList.add('open');
}
async function savePdb(){
  const tahun=+document.getElementById('fTahun').value;
  const nilai=+document.getElementById('fNilai').value;
  const pertumbuhan=+document.getElementById('fGrowth').value;
  const status=document.getElementById('fStatus').value;
  if(!tahun || !nilai){ alert('Tahun dan Nilai PDB wajib diisi.'); return; }
  if(editingTahun) await updatePDB(editingTahun,{nilai,pertumbuhan,status});
  else await createPDB({tahun,nilai,pertumbuhan,status});
  document.getElementById('pdbModal').classList.remove('open');
  await renderPdb();
}
async function removePdb(tahun){ if(confirm('Hapus data tahun '+tahun+'?')){ await deletePDB(tahun); await renderPdb(); } }

/* ====== Inflasi ====== */
async function initInflasi(){
  const data = await getInflasi();
  const li=data[data.length-1];
  const avg=(data.reduce((s,d)=>s+d.yoy,0)/data.length).toFixed(2);
  const max=data.reduce((a,b)=>b.yoy>a.yoy?b:a), min=data.reduce((a,b)=>b.yoy<a.yoy?b:a);
  document.getElementById('kpiInflasi').innerHTML=[
    {l:'Inflasi Terkini ('+li.bulan+')',v:li.yoy+'%',s:'Bulanan (MoM)',up:false},
    {l:'Rata-rata',v:avg+'%',s:'sepanjang periode',up:false},
    {l:'Tertinggi',v:max.yoy+'%',s:max.bulan,up:false},
    {l:'Terendah',v:min.yoy+'%',s:min.bulan,up:true}
  ].map(k=>`<div class='kpi'><div class='label'>${k.l}</div><div class='value'>${k.v}</div><div class='sub ${k.up?'trend-up':'trend-down'}'>${k.s}</div></div>`).join('');
  areaChart('chartInflasi', data.map(d=>d.bulan), data.map(d=>d.yoy), 'Inflasi Bulanan (MoM, %)', C_GREEN);
  document.getElementById('inflasiTableBody').innerHTML=data.map(d=>
    `<tr><td><b>${d.bulan}</b></td><td>${d.yoy}%</td></tr>`).join('');
}

/* ====== Ekspor-Impor ====== */
async function initTrade(){
  const t = await getTrade();
  const lt=t.bulanan[t.bulanan.length-1];
  const totEks=t.bulanan.reduce((s,d)=>s+d.ekspor,0), totImp=t.bulanan.reduce((s,d)=>s+d.impor,0);
  const neraca=totEks-totImp;
  document.getElementById('kpiTrade').innerHTML=[
    {l:'Ekspor ('+lt.bulan+')',v:fmt(lt.ekspor),s:'$Juta',up:true},
    {l:'Impor ('+lt.bulan+')',v:fmt(lt.impor),s:'$Juta',up:false},
    {l:'Total Ekspor',v:fmt(totEks),s:'periode berjalan',up:true},
    {l:'Neraca Dagang',v:(neraca>=0?'+':'')+fmt(neraca),s:neraca>=0?'Surplus':'Defisit',up:neraca>=0}
  ].map(k=>`<div class='kpi'><div class='label'>${k.l}</div><div class='value'>${k.v}</div><div class='sub ${k.up?'trend-up':'trend-down'}'>${k.s}</div></div>`).join('');
  dualBar('chartTrade', t.bulanan.map(d=>d.bulan), t.bulanan.map(d=>d.ekspor), t.bulanan.map(d=>d.impor), 'Ekspor', 'Impor');
  document.getElementById('komoditasTableBody').innerHTML=t.komoditas.map(k=>{
    const n=k.ekspor-k.impor;
    return `<tr><td><b>${k.nama}</b></td><td>${fmt(k.ekspor)}</td><td>${fmt(k.impor)}</td><td class='${n>=0?'trend-up':'trend-down'}'>${(n>=0?'+':'')+fmt(n)}</td></tr>`;
  }).join('');
}

/* ====== Router ====== */
document.addEventListener('DOMContentLoaded', ()=>{
  setupSidebar();
  const p = document.body.dataset.page;
  const routes = {landing:window.initLanding, dashboard:window.initDashboard, pdb:window.initPdb, inflasi:window.initInflasi, trade:window.initTrade, kalkulator:window.initKalkulator};
  (routes[p]||function(){})();
});
