/* 确保新建行程最终版不会被 index.html 旧 inline newTrip 覆盖 */
(function(){
  'use strict';
  let captured=null;
  function sync(){
    if(!captured && window.__lvbanNewTripV2 && typeof window.newTrip==='function') captured=window.newTrip;
    if(captured && window.newTrip!==captured) window.newTrip=captured;
  }
  sync();
  const timer=setInterval(sync,100);
  setTimeout(()=>clearInterval(timer),10000);
  window.addEventListener('load',sync);
})();
