/* Chart helpers (Chart.js) */
const C_GREEN = '#457359';
const C_PINK  = '#D37897';
const gridColor = 'rgba(120,140,130,.12)';

function _ctx(id){ const el=document.getElementById(id); if(!el) return null; const ex=Chart.getChart(el); if(ex) ex.destroy(); return el; }

function makeGradient(canvas, color){
  const ctx = canvas.getContext('2d');
  const g = ctx.createLinearGradient(0,0,0,300);
  g.addColorStop(0, color+'55');
  g.addColorStop(1, color+'05');
  return g;
}

function areaChart(id, labels, data, label, color){
  const el=_ctx(id); if(!el) return;
  color = color||C_PINK;
  new Chart(el,{type:'line',data:{labels,datasets:[{label,data,borderColor:color,backgroundColor:makeGradient(el,color),fill:true,tension:.4,borderWidth:3,pointBackgroundColor:'#fff',pointBorderColor:color,pointBorderWidth:2,pointRadius:4,pointHoverRadius:6}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{grid:{color:gridColor},ticks:{color:'#6c7d74'}},x:{grid:{display:false},ticks:{color:'#6c7d74'}}}}});
}

function lineChart(id, labels, data, label, color){
  const el=_ctx(id); if(!el) return;
  color = color||C_GREEN;
  new Chart(el,{type:'line',data:{labels,datasets:[{label,data,borderColor:color,backgroundColor:color,tension:.35,borderWidth:3,pointRadius:4,pointHoverRadius:6,pointBackgroundColor:'#fff',pointBorderColor:color,pointBorderWidth:2}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{grid:{color:gridColor},ticks:{color:'#6c7d74'}},x:{grid:{display:false},ticks:{color:'#6c7d74'}}}}});
}

function dualBar(id, labels, a, b, la, lb){
  const el=_ctx(id); if(!el) return;
  new Chart(el,{type:'bar',data:{labels,datasets:[
    {label:la,data:a,backgroundColor:C_GREEN,borderRadius:7,maxBarThickness:26},
    {label:lb,data:b,backgroundColor:C_PINK,borderRadius:7,maxBarThickness:26}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',align:'end',labels:{usePointStyle:true,boxWidth:8}}},scales:{y:{grid:{color:gridColor},ticks:{color:'#6c7d74'}},x:{grid:{display:false},ticks:{color:'#6c7d74'}}}}});
}

function barChart(id, labels, data, label, color){
  const el=_ctx(id); if(!el) return;
  new Chart(el,{type:'bar',data:{labels,datasets:[{label,data,backgroundColor:data.map(v=>v<0?C_PINK:C_GREEN),borderRadius:7,maxBarThickness:40}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{grid:{color:gridColor},ticks:{color:'#6c7d74'}},x:{grid:{display:false},ticks:{color:'#6c7d74'}}}}});
}
