/* 旅伴旅行管家 · 稳定修复入口 */
(function(){
  function load(){
    if(window.__lvFinalFixLoaded)return;
    window.__lvFinalFixLoaded=true;
    var s=document.createElement('script');
    s.src='pro-fix.js?v=20260811';
    s.onload=function(){ if(window.lvFinalFixRun) window.lvFinalFixRun(); };
    document.head.appendChild(s);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',load); else load();
})();
