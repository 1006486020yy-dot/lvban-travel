/* 旅伴旅行管家 · 行程最终收口
   旧补丁只负责兼容；最终行程交互统一交给 final-trip-fix.js。 */
(function(){
  function load(){
    if(window.__lvFinalTripLoader)return;
    window.__lvFinalTripLoader=true;
    var s=document.createElement('script');
    s.src='final-trip-fix.js?v=20260811-final4';
    document.head.appendChild(s);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else load();
})();
