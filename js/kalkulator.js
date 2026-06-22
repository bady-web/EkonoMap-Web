/* Kalkulator simulasi dampak inflasi terhadap daya beli.
   Menggunakan RUMUS inflasi aktual per tahun (bukan rata-rata):
   - Inflasi tahunan tiap tahun = gabungan (compound) inflasi bulanan (MoM):
       inflasi_tahun = ∏(1 + MoM_bulan/100) - 1
   - Daya beli setara = nilai / ∏(1 + inflasi_tahun) untuk tiap tahun dalam rentang.
   Jika suatu tahun tidak ada datanya, dipakai rata-rata sebagai cadangan. */
async function initKalkulator(){
  const inf = await getInflasi();

  // Hitung inflasi tahunan aktual dari data bulanan (compound MoM)
  const byYear = {};
  inf.forEach(d=>{ if(d.tahun){ (byYear[d.tahun] = byYear[d.tahun] || []).push(d.yoy); } });
  const yearlyInfl = {};
  Object.keys(byYear).forEach(y=>{
    const prod = byYear[y].reduce((p,m)=>p*(1+m/100), 1);
    yearlyInfl[+y] = prod - 1;
  });
  const availYears = Object.keys(yearlyInfl).map(Number).sort((a,b)=>a-b);

  // Rata-rata (untuk cadangan tahun tanpa data + info di footer)
  const avgInf = availYears.length
    ? availYears.reduce((s,y)=>s+yearlyInfl[y],0)/availYears.length
    : (inf.length ? (inf.reduce((s,d)=>s+d.yoy,0)/inf.length)/100 : 0.03);
  const avgEl = document.getElementById('avgInfTxt');
  if(avgEl) avgEl.textContent = (avgInf*100).toFixed(2)+'%';

  function inflFor(y){ return (yearlyInfl[y]!=null) ? yearlyInfl[y] : avgInf; }

  // Isi dropdown tahun dari rentang data yang tersedia
  const yNow = new Date().getFullYear();
  const yMin = availYears.length ? availYears[0] : yNow-10;
  const yMax = availYears.length ? availYears[availYears.length-1] : yNow;
  const selA=document.getElementById('tahunAwal'), selB=document.getElementById('tahunAkhir');
  selA.innerHTML=''; selB.innerHTML='';
  for(let y=yMin;y<=yMax;y++){
    selA.insertAdjacentHTML('beforeend',`<option value='${y}'>${y}</option>`);
    selB.insertAdjacentHTML('beforeend',`<option value='${y}'>${y}</option>`);
  }
  selA.value = String(Math.max(yMin, yMax-5));
  selB.value = String(yMax);

  document.getElementById('btnHitung').addEventListener('click', ()=>{
    const nilai=+document.getElementById('nilaiAwal').value;
    const a=+selA.value, b=+selB.value;
    const gN=document.getElementById('grpNilai'), gT=document.getElementById('grpTahun');
    let ok=true;
    gN.classList.toggle('invalid', !(nilai>0)); if(!(nilai>0)) ok=false;
    gT.classList.toggle('invalid', !(b>a)); if(!(b>a)) ok=false;
    if(!ok) return;

    // Compound memakai inflasi aktual tiap tahun
    const labels=[a], vals=[Math.round(nilai)];
    let factor=1;
    for(let y=a+1;y<=b;y++){ factor *= (1 + inflFor(y)); labels.push(y); vals.push(Math.round(nilai/factor)); }
    const setara = nilai/factor;
    const turun = ((setara-nilai)/nilai*100);
    const years = b-a;

    document.getElementById('hasilPlaceholder').style.display='none';
    document.getElementById('hasilBox').style.display='block';
    document.getElementById('nilaiAkhir').textContent='Rp '+new Intl.NumberFormat('id-ID').format(Math.round(setara));
    const pc=document.getElementById('persenChange');
    pc.textContent=turun.toFixed(1)+'%'; pc.className= turun<0?'trend-down':'trend-up';
    document.getElementById('durasiTxt').textContent=years;

    const draw = ()=> areaChart('chartKalkulator', labels, vals, 'Daya beli (Rp)', C_PINK);
    draw(); window.__redraw = draw;
  });
}
