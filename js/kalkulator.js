/* Kalkulator simulasi dampak inflasi terhadap daya beli */
async function initKalkulator(){
  const inf = await getInflasi();
  // rata-rata inflasi tahunan (asumsi) dari data yang ada
  const avgInf = (inf.reduce((s,d)=>s+d.yoy,0)/inf.length)/100;
  document.getElementById('avgInfTxt').textContent = (avgInf*100).toFixed(2)+'%';

  const yNow = new Date().getFullYear();
  const selA=document.getElementById('tahunAwal'), selB=document.getElementById('tahunAkhir');
  for(let y=yNow-10;y<=yNow;y++){
    selA.insertAdjacentHTML('beforeend',`<option value='${y}'>${y}</option>`);
    selB.insertAdjacentHTML('beforeend',`<option value='${y}'>${y}</option>`);
  }
  selA.value=yNow-5; selB.value=yNow;

  document.getElementById('btnHitung').addEventListener('click', ()=>{
    const nilai=+document.getElementById('nilaiAwal').value;
    const a=+selA.value, b=+selB.value;
    const gN=document.getElementById('grpNilai'), gT=document.getElementById('grpTahun');
    let ok=true;
    gN.classList.toggle('invalid', !(nilai>0)); if(!(nilai>0)) ok=false;
    gT.classList.toggle('invalid', !(b>a)); if(!(b>a)) ok=false;
    if(!ok) return;
    const years=b-a;
    // nilai setara (daya beli) = nilai / (1+inflasi)^tahun
    const setara = nilai/Math.pow(1+avgInf, years);
    const turun = ((setara-nilai)/nilai*100);
    document.getElementById('hasilPlaceholder').style.display='none';
    document.getElementById('hasilBox').style.display='block';
    document.getElementById('nilaiAkhir').textContent='Rp '+new Intl.NumberFormat('id-ID').format(Math.round(setara));
    const pc=document.getElementById('persenChange');
    pc.textContent=turun.toFixed(1)+'%'; pc.className= turun<0?'trend-down':'trend-up';
    document.getElementById('durasiTxt').textContent=years;
    // grafik erosi nilai per tahun
    const labels=[], vals=[];
    for(let i=0;i<=years;i++){ labels.push(a+i); vals.push(Math.round(nilai/Math.pow(1+avgInf,i))); }
    areaChart('chartKalkulator', labels, vals, 'Daya beli (Rp)', C_PINK);
    window.__redraw=()=>areaChart('chartKalkulator', labels, vals, 'Daya beli (Rp)', C_PINK);
  });
}
