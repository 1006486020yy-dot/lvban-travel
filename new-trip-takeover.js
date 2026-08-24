/* 旅伴旅行管家 · 新建行程运行时接管 */
(function(){
  'use strict';
  let done=false;
  function take(){
    if(window.__lvbanNewTripV2 && typeof window.newTrip==='function'){done=true;return true}
    return false
  }
  function loadV2(){
    if(window.__lvbanNewTripV2)return take();
    const src='/new-trip-form-v2.js?v=20260824-1';
    const s=document.createElement('script');s.src=src;s.onload=()=>take();s.onerror=()=>{};document.head.appendChild(s);
  }
  function boot(){loadV2();setTimeout(take,50);setTimeout(take,300);setTimeout(take,1000);setTimeout(take,2500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.addEventListener('load',boot);
  const timer=setInterval(()=>{if(take()||done)clearInterval(timer)},100);
  setTimeout(()=>clearInterval(timer),15000);
})();
