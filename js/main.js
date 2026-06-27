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
function fmtTanggal(d){ return d ? new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Jakarta'}).format(d)+' WIB' : '-'; }
const tagClass = (s)=> s==='Tinggi'?'tinggi':s==='Sedang'?'sedang':'rendah';
function showLastUpdated(){ getLastUpdated().then(d=>{ const e=document.getElementById('lastUpdate'); if(e) e.textContent = d ? ('Data terakhir diperbarui: '+fmtTanggal(d)) : ''; }); }
function refreshIcons(){ if(window.lucide){ try{ lucide.createIcons(); }catch(e){} } }

/* KPI card renderer dengan simbol naik/turun (▲/▼) opsional.
   up === true  -> ▲ hijau (trend-up)
   up === false -> ▼ pink  (trend-down)
   up === null  -> tanpa simbol (netral) */
function kpiCard(k){
  const hasArrow = (k.up===true || k.up===false);
  const cls = hasArrow ? (k.up?'sub trend-up':'sub trend-down') : 'sub';
  const sym = hasArrow ? (k.up?'▲ ':'▼ ') : '';
  const extra = hasArrow ? '' : " style='color:var(--muted)'";
  return `<div class='kpi'><div class='label'>${k.label}</div><div class='value'>${k.val}</div><div class='${cls}'${extra}>${sym}${k.sub}</div></div>`;
}
function fillYearSelect(sel, years, current){
  if(!sel) return;
  if(!years || !years.length){ sel.style.display='none'; return; }
  sel.style.display='';
  sel.innerHTML = years.slice().reverse().map(y=>`<option value='${y}' ${y===current?'selected':''}>${y}</option>`).join('');
}
function arrowMini(up){ return up===null?'':(up?"<span class='trend-up'>▲</span>":"<span class='trend-down'>▼</span>"); }

/* ====== Landing ====== */
async function initLanding(){
  const nav = document.querySelector('.nav');
  if(nav){ window.addEventListener('scroll', ()=> nav.classList.toggle('scrolled', window.scrollY>30)); }
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if(toggle && links) toggle.addEventListener('click', ()=> links.classList.toggle('open'));
  const obs = new IntersectionObserver((es)=>es.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('in'); }),{threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
  try{
    const [pdb, inf, trade] = await Promise.all([getPDB(), getInflasi(), getTrade()]);
    const last = pdb[pdb.length-1];
    const infTh = inflasiTahunan(inf);
    const infLast = infTh.latest;                 // inflasi TAHUNAN (tahun lengkap terakhir)
    const lt = trade.bulanan[trade.bulanan.length-1];
    const neraca = lt ? (lt.ekspor - lt.impor) : 0;
    const set=(id,v)=>{const e=document.getElementById(id); if(e) e.textContent=v;};
    // --- Hero ringkasan ---
    set('stPdb', last? (last.pertumbuhan>=0?'▲ ':'▼ ')+last.pertumbuhan+'%' : '-');
    set('stInf', infLast? infLast.rate+'%' : '-');
    set('stEks', lt? '$'+(lt.ekspor/1000).toFixed(1)+'B' : '-');
    // --- Preview card + float tag ---
    set('pvInf', infLast? infLast.rate+'%' : '-');
    set('pvEks', lt? fmt(lt.ekspor) : '-');
    set('pvNer', lt? (neraca>=0?'+':'')+fmt(neraca) : '-');
    if(last) set('ftPdb', 'PDB +'+last.pertumbuhan+'%');
    // --- Strip ---
    set('stPdb2', last? last.pertumbuhan+'%' : '-');
    set('stInf2', infLast? infLast.rate+'%' : '-');
    set('stEks2', lt? '$'+(lt.ekspor/1000).toFixed(1)+'B' : '-');
    set('stNer2', lt? (neraca>=0?'+':'')+'$'+(neraca/1000).toFixed(1)+'B' : '-');
    if(last) set('lblPdb2', 'Pertumbuhan PDB '+last.tahun);
    if(infLast) set('lblInf2', 'Inflasi Tahunan '+infLast.tahun);
  }catch(e){ console.warn(e); }
}

/* ====== Dashboard ====== */
async function initDashboard(){
  const [pdb, inf, trade] = await Promise.all([getPDB(), getInflasi(), getTrade()]);
  const last = pdb[pdb.length-1], prev = pdb[pdb.length-2];
  const li = inf[inf.length-1], liPrev = inf[inf.length-2];
  const lt = trade.bulanan[trade.bulanan.length-1];
  const neraca = lt.ekspor - lt.impor;
  const infUp = (li && liPrev) ? (li.yoy >= liPrev.yoy) : null;
  const kpis = [
    (last ? {label:'PDB '+last.tahun+' (Miliar USD)', val:fmt(last.nilai), sub:last.pertumbuhan+'% YoY', up:last.pertumbuhan>=0}
          : {label:'PDB (Miliar USD)', val:'-', sub:'Belum ada data', up:null}),
    {label:'Inflasi ('+(li.bulanShort||li.bulan)+')', val:li.yoy+'%', sub: (infUp===null?'Bulanan (MoM)':('vs bln lalu '+(infUp?'naik':'turun'))), up:infUp},
    {label:'Ekspor ('+lt.bulan+', $Juta)', val:fmt(lt.ekspor), sub:'Nilai ekspor terkini', up:null},
    {label:'Neraca Dagang ($Juta)', val:(neraca>=0?'+':'')+fmt(neraca), sub:neraca>=0?'Surplus':'Defisit', up:neraca>=0}
  ];
  document.getElementById('kpiGrid').innerHTML = kpis.map(kpiCard).join('');
  const drawGrowth = ()=> areaChart('chartGrowth', pdb.map(d=>d.tahun), pdb.map(d=>d.pertumbuhan), 'Pertumbuhan PDB (%)', C_PINK);
  drawGrowth(); window.__redraw = drawGrowth;
  const sum = [
    ['Pertumbuhan PDB'+(last?' '+last.tahun:''), last? last.pertumbuhan+'%' : 'Belum ada data'],
    ['Inflasi terkini ('+(li.bulanShort||li.bulan)+')', li.yoy+'%'],
    ['Neraca dagang', (neraca>=0?'Surplus +':'Defisit ')+fmt(neraca)+' $Juta'],
    ['Sumber data', 'BPS / API']
  ];
  document.getElementById('summaryList').innerHTML = sum.map(s=>
    `<li style='display:flex;justify-content:space-between;border-bottom:1px solid var(--line);padding:9px 0'><span style='color:var(--muted)'>${s[0]}</span><b>${s[1]}</b></li>`).join('');
  const box=document.getElementById('insightBox');
  if(box) box.innerHTML = (last && prev)
    ? `Ekonomi tumbuh <b>${last.pertumbuhan}%</b> di ${last.tahun} (dari ${prev.pertumbuhan}% di ${prev.tahun}), dengan inflasi terkini di <b>${li.yoy}%</b>.`
    : `Data PDB belum tersedia. Inflasi terkini tercatat <b>${li.yoy}%</b> (${li.bulan}).`;
  showLastUpdated();
}

/* ====== PDB + CRUD ====== */
let editingTahun = null;
let pdbData = [];
let pdbYearSel = null;
async function initPdb(){
  await renderPdb();
  showLastUpdated();
  const modal=document.getElementById('pdbModal');
  document.getElementById('btnAddPdb').addEventListener('click', ()=>openPdbModal());
  document.getElementById('pdbCancel').addEventListener('click', ()=>modal.classList.remove('open'));
  document.getElementById('pdbSave').addEventListener('click', savePdb);
}
async function renderPdb(){
  pdbData = await loadPdbStore();
  const data = pdbData;
  const yearSel = document.getElementById('pdbYear');
  if(!data.length){
    if(yearSel) yearSel.style.display='none';
    document.getElementById('kpiPdb').innerHTML=[
      {label:'PDB (Miliar USD)',val:'-',sub:'Belum ada data',up:null},
      {label:'Rata-rata Pertumbuhan',val:'-',sub:'Belum ada data',up:null},
      {label:'Pertumbuhan Tertinggi',val:'-',sub:'Belum ada data',up:null},
      {label:'Jumlah Data',val:0,sub:'baris tercatat',up:null}
    ].map(kpiCard).join('');
    barChart('chartPdb', [], [], 'Pertumbuhan (%)');
    document.getElementById('pdbTableBody').innerHTML = `<tr><td colspan='5' style='text-align:center;color:var(--muted);padding:24px'>Belum ada data PDB. Data akan muncul otomatis saat database terisi, atau klik <b>+ Tambah Data</b> untuk menambah manual.</td></tr>`;
    return;
  }
  const years = data.map(d=>d.tahun);
  if(pdbYearSel===null || !years.includes(pdbYearSel)) pdbYearSel = years[years.length-1];
  if(yearSel){ fillYearSelect(yearSel, years, pdbYearSel); yearSel.onchange = ()=>{ pdbYearSel = +yearSel.value; renderPdbKpi(); }; }
  renderPdbKpi();
  const drawPdb = ()=> barChart('chartPdb', data.map(d=>d.tahun), data.map(d=>d.pertumbuhan), 'Pertumbuhan (%)');
  drawPdb(); window.__redraw = drawPdb;
  document.getElementById('pdbTableBody').innerHTML = data.map(d=>
    `<tr><td><b>${d.tahun}</b></td><td>${fmt(d.nilai)}</td><td>${d.pertumbuhan}% ${arrowMini(d.pertumbuhan>=0)}</td><td><span class='tag ${tagClass(d.status)}'>${d.status}</span></td>
     <td><div class='row-actions'><button class='icon-btn' title='Edit' onclick='openPdbModal(${d.tahun})'><i data-lucide=\"pencil\"></i></button><button class='icon-btn del' title='Hapus' onclick='removePdb(${d.tahun})'><i data-lucide=\"trash-2\"></i></button></div></td></tr>`).join('');
  refreshIcons();
}
function renderPdbKpi(){
  const data = pdbData;
  const idx = Math.max(0, data.findIndex(d=>d.tahun===pdbYearSel));
  const sel = data[idx] || data[data.length-1];
  const prev = idx>0 ? data[idx-1] : null;
  const avg=(data.reduce((s,d)=>s+d.pertumbuhan,0)/data.length).toFixed(2);
  const max=data.reduce((a,b)=>b.pertumbuhan>a.pertumbuhan?b:a);
  const kpis=[
    {label:'PDB '+sel.tahun+' (Miliar USD)', val:fmt(sel.nilai), sub:sel.pertumbuhan+'% YoY'+(prev?(' vs '+prev.tahun):''), up:sel.pertumbuhan>=0},
    {label:'Rata-rata Pertumbuhan', val:avg+'%', sub:data.length+' tahun data', up:null},
    {label:'Pertumbuhan Tertinggi', val:max.pertumbuhan+'%', sub:'Tahun '+max.tahun, up:true},
    {label:'Status '+sel.tahun, val:sel.status, sub:'klasifikasi pertumbuhan', up:sel.pertumbuhan>=3}
  ];
  document.getElementById('kpiPdb').innerHTML = kpis.map(kpiCard).join('');
}
function openPdbModal(tahun){
  const modal=document.getElementById('pdbModal');
  editingTahun = tahun||null;
  document.getElementById('pdbModalTitle').textContent = tahun? 'Edit Data PDB' : 'Tambah Data PDB';
  const data = pdbData||[];
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
let infData = [];
let infYearSel = null;
async function initInflasi(){
  infData = await getInflasi();
  showLastUpdated();
  const yearSel = document.getElementById('inflasiYear');
  const years = [...new Set(infData.map(d=>d.tahun).filter(Boolean))].sort((a,b)=>a-b);
  if(years.length){
    infYearSel = years[years.length-1];
    if(yearSel){ fillYearSelect(yearSel, years, infYearSel); yearSel.onchange = ()=>{ infYearSel=+yearSel.value; renderInflasi(); }; }
  } else if(yearSel){ yearSel.style.display='none'; }
  renderInflasi();
}
function renderInflasi(){
  const all = infData;
  const rows = infYearSel ? all.filter(d=>d.tahun===infYearSel) : all;
  const li = rows[rows.length-1];
  const avg=(rows.reduce((s,d)=>s+d.yoy,0)/rows.length).toFixed(2);
  const max=rows.reduce((a,b)=>b.yoy>a.yoy?b:a), min=rows.reduce((a,b)=>b.yoy<a.yoy?b:a);
  const liIdx = all.indexOf(li); const liPrev = liIdx>0 ? all[liIdx-1] : null;
  const liUp = liPrev ? (li.yoy>=liPrev.yoy) : null;
  const kpis=[
    {label:'Inflasi Terkini ('+(li.bulanShort||li.bulan)+')', val:li.yoy+'%', sub:(liUp===null?'Bulanan (MoM)':('vs bln lalu '+(liUp?'naik':'turun'))), up:liUp},
    {label:'Rata-rata'+(infYearSel?(' '+infYearSel):''), val:avg+'%', sub:rows.length+' bulan', up:null},
    {label:'Tertinggi', val:max.yoy+'%', sub:(max.bulanShort||max.bulan), up:null},
    {label:'Terendah', val:min.yoy+'%', sub:(min.bulanShort||min.bulan), up:null}
  ];
  document.getElementById('kpiInflasi').innerHTML = kpis.map(kpiCard).join('');
  const labels = rows.map(d=> d.bulanShort || d.bulan);
  const vals = rows.map(d=>d.yoy);
  const draw = ()=> areaChart('chartInflasi', labels, vals, 'Inflasi Bulanan (MoM, %)', C_GREEN);
  draw(); window.__redraw = draw;
  document.getElementById('inflasiTableBody').innerHTML = rows.map(d=>{
    const i=all.indexOf(d); const p = i>0 ? all[i-1] : null;
    const up = p ? (d.yoy>=p.yoy) : null;
    return `<tr><td><b>${d.bulanShort||d.bulan}</b></td><td>${d.yoy}% ${arrowMini(up)}</td></tr>`;
  }).join('');
}

/* ====== Ekspor-Impor ====== */
let tradeData = null;
let tradeYearSel = null;
async function initTrade(){
  tradeData = await getTrade();
  showLastUpdated();
  const yearSel = document.getElementById('tradeYear');
  const years = (tradeData.years && tradeData.years.length) ? tradeData.years.slice() : tradeData.bulanan.map(d=>+d.bulan).filter(n=>!isNaN(n));
  if(years.length){
    tradeYearSel = years[years.length-1];
    if(yearSel){ fillYearSelect(yearSel, years, tradeYearSel); yearSel.onchange=()=>{ tradeYearSel=+yearSel.value; renderTrade(); }; }
  } else if(yearSel){ yearSel.style.display='none'; }
  renderTrade();
}
function renderTrade(){
  const t = tradeData;
  const years = t.bulanan.map(d=>+d.bulan);
  let selIdx = years.indexOf(tradeYearSel);
  if(selIdx<0) selIdx = t.bulanan.length-1;
  const sel = t.bulanan[selIdx];
  const prev = selIdx>0 ? t.bulanan[selIdx-1] : null;
  const neraca = sel.ekspor - sel.impor;
  const eksUp = prev ? (sel.ekspor>=prev.ekspor) : null;
  const impUp = prev ? (sel.impor>=prev.impor) : null;
  const totEks=t.bulanan.reduce((s,d)=>s+d.ekspor,0);
  const kpis=[
    {label:'Ekspor '+sel.bulan+' ($Juta)', val:fmt(sel.ekspor), sub:(eksUp===null?'Total tahunan':('vs '+prev.bulan+' '+(eksUp?'naik':'turun'))), up:eksUp},
    {label:'Impor '+sel.bulan+' ($Juta)', val:fmt(sel.impor), sub:(impUp===null?'Total tahunan':('vs '+prev.bulan+' '+(impUp?'naik':'turun'))), up:impUp},
    {label:'Neraca Dagang '+sel.bulan, val:(neraca>=0?'+':'')+fmt(neraca), sub:neraca>=0?'Surplus':'Defisit', up:neraca>=0},
    {label:'Total Ekspor (semua tahun)', val:fmt(totEks), sub:t.bulanan.length+' tahun data', up:null}
  ];
  document.getElementById('kpiTrade').innerHTML = kpis.map(kpiCard).join('');
  const draw = ()=> dualBar('chartTrade', t.bulanan.map(d=>d.bulan), t.bulanan.map(d=>d.ekspor), t.bulanan.map(d=>d.impor), 'Ekspor', 'Impor');
  draw(); window.__redraw = draw;
  const kom = (t.komoditasByYear && t.komoditasByYear[tradeYearSel]) ? t.komoditasByYear[tradeYearSel] : t.komoditas;
  document.getElementById('komoditasTableBody').innerHTML = kom.map(k=>{
    const n=k.ekspor-k.impor;
    return `<tr><td><b>${k.nama}</b></td><td>${fmt(k.ekspor)}</td><td>${fmt(k.impor)}</td><td class='${n>=0?'trend-up':'trend-down'}'>${n>=0?'▲ +':'▼ '}${fmt(n)}</td></tr>`;
  }).join('');
}

/* ====== Router ====== */
document.addEventListener('DOMContentLoaded', ()=>{
  setupSidebar();
  const p = document.body.dataset.page;
  const routes = {landing:window.initLanding, dashboard:window.initDashboard, pdb:window.initPdb, inflasi:window.initInflasi, trade:window.initTrade, kalkulator:window.initKalkulator};
  (routes[p]||function(){})();
  window.addEventListener('themechange', ()=>{ if(typeof window.__redraw==='function') window.__redraw(); });
});
