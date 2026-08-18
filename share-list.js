/* 旅伴旅行管家｜行程层级与跨城修补加载器 */
(function(){
  'use strict';
  function load(src, marker){
    if(document.querySelector('script[data-'+marker+']')) return;
    const s=document.createElement('script');
    s.src=src;
    s.async=false;
    s.setAttribute('data-'+marker,'1');
    document.head.appendChild(s);
  }
  function boot(){
    load('itinerary-oct1-city-split-fix.js?v=20260817-2','lvban-oct1-fix');
    load('trip-flow-fix.js?v=20260818-1','lvban-trip-flow-fix');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
