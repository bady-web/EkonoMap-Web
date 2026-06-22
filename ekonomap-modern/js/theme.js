/* theme.js - EkonoMap Theme Switcher */
(function(){
  var KEY='ekonomap-theme';
  function applyTheme(name){
    if(name==='forest') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', name);
    localStorage.setItem(KEY,name);
    document.querySelectorAll('.theme-swatch').forEach(function(s){ s.classList.toggle('active', s.dataset.theme===name); });
    try{ window.dispatchEvent(new Event('themechange')); }catch(e){}
  }
  window.setTheme=applyTheme;
  window.toggleThemePicker=function(){ var p=document.getElementById('themePicker'); if(p) p.classList.toggle('open'); };
  document.addEventListener('click', function(e){ var fab=document.getElementById('fabTheme'); if(fab&&!fab.contains(e.target)){ var p=document.getElementById('themePicker'); if(p) p.classList.remove('open'); } });
  var saved=localStorage.getItem(KEY)||'forest';
  applyTheme(saved);
})();
