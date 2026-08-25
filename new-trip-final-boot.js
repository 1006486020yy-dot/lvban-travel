/* 旅伴旅行管家 · 新建行程最终入口
   只负责把页面所有“新建行程”入口统一指向当前 V2。
*/
(function(){
  'use strict';
  function bind(){
    const fn=window.__lvbanNewTripV2 && typeof window.newTrip==='function' ? window.newTrip : null;
    if(!fn) return false;
    window.newTrip=fn;
    window.openNewTrip=fn;
    document.querySelectorAll('[onclick="newTrip()"],[onclick="openNewTrip()"],.trip-list-actions button').forEach(el=>{
      el.onclick=function(ev){
        if(ev) ev.preventDefault();
        fn();
      };
    });
    return true;
  }
  function boot(){
    bind();
    let n=0;
    const timer=setInterval(()=>{if(bind()||++n>100)clearInterval(timer)},100);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.addEventListener('load',boot);
})();
