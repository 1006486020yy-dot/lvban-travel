/* 旅伴旅行管家 · 行程最终收口 */
(function(){
  function load(){
    if(window.__lvFinalTripLoader)return;
    window.__lvFinalTripLoader=true;
    var s=document.createElement('script');
    s.src='final-trip-fix.js?v=20260811-final5';
    s.onload=function(){
      var c=document.createElement('script');
      c.src='create-trip-fix.js?v=20260811-v3';
      document.head.appendChild(c);
    };
    document.head.appendChild(s);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else load();
})();
