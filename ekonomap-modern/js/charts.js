/* Chart helpers (Chart.js) - theme-aware */
function cssVar(n,f){ try{ const v=getComputedStyle(document.documentElement).getPropertyValue(n).trim(); return v||f; }catch(e){ return f; } }
function TC(){ return { green:cssVar('--green','#457359'), pink:cssVar('--pink','#D37897'), grid:'rgba(120,140,130,.14)', tick:cssVar('--muted','#6c7d74') }; }
function pickColor(c){ const t=TC(); if(c==='green')return t.green; if(c==='pink')return t.pink; return c||t.pink; }
const C_GREEN='green';
const C_PINK='pink';

function _ctx(id){ const el=document.getElementById(id); if(!el) return null; const ex=Chart.getChart(el); if(ex) ex.destroy(); return el; }
function makeGradient(canvas, color){ const ctx=canvas.getContext('2d'); const g=ctx.createLinearGradient(0,0,0,300); g.addColorStop(0,color+'55'); g.addColorStop(1,color+'05'); return g; }
function _axes(){ const t=TC(); return {y:{grid:{color:t.grid},ticks:{color:t.tick}},x:{grid:{display:false},ticks:{color:t.tick}}}; }

function areaChart(id, labels, data, label, color){
  const el=_ctx(id); if(!el) return; color=pickColor(color);
  new Chart(el,{type:'line',data:{labels,datasets:[{label,data,borderColor:color,backgroundColor:makeGradient(el,color),fill:true,tension:.4,borderWidth:3,pointBackgroundColor:'#fff',pointBorderColor:color,pointBorderWidth:2,pointRadius:4,pointHoverRadius:6}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:_axes()}});
}
function lineChart(id, labels, data, label, color){
  const el=_ctx(id); if(!el) return; color=pickColor(color||'green');
  new Chart(el,{type:'line',data:{labels,datasets:[{label,data,borderColor:color,backgroundColor:color,tension:.35,borderWidth:3,pointRadius:4,pointHoverRadius:6,pointBackgroundColor:'#fff',pointBorderColor:color,pointBorderWidth:2}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:_axes()}});
}
function dualBar(id, labels, a, b, la, lb){
  const el=_ctx(id); if(!el) return; const t=TC();
  new Chart(el,{type:'bar',data:{labels,datasets:[
    {label:la,data:a,backgroundColor:t.green,borderRadius:7,maxBarThickness:26},
    {label:lb,data:b,backgroundColor:t.pink,borderRadius:7,maxBarThickness:26}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',align:'end',labels:{usePointStyle:true,boxWidth:8,color:t.tick}}},scales:_axes()}});
}
function barChart(id, labels, data, label, color){
  const el=_ctx(id); if(!el) return; const t=TC();
  new Chart(el,{type:'bar',data:{labels,datasets:[{label,data,backgroundColor:data.map(v=>v<0?t.pink:t.green),borderRadius:7,maxBarThickness:40}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:_axes()}});
}
