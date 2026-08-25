/* 旅伴旅行管家 · 最终交互入口
   统一新建行程 + 我的行程详情入口。
*/
(function(){
  'use strict';

  function openTrip(id){
    const trips=window.db&&Array.isArray(window.db.trips)?window.db.trips:[];
    const t=trips.find(x=>String(x.id)===String(id));
    if(!t)return false;
    window.activeTrip=t.id;
    window.activePlan=t.plans&&t.plans[0]?t.plans[0].id:null;
    window.activeDay=0;
    if(typeof window.save==='function')window.save();
    if(typeof window.go==='function')window.go('trips');
    if(typeof window.renderTrips==='function')window.renderTrips();
    if(typeof window.renderTripDetail==='function')window.renderTripDetail();
    const detail=document.getElementById('tripDetail');
    if(detail)detail.scrollIntoView({behavior:'smooth',block:'start'});
    return true;
  }

  window.openTripCanvas=openTrip;
  window.__lvbanOpenTripDetail=openTrip;

  function bind(){
    const fn=window.__lvbanNewTripV2&&typeof window.newTrip==='function'?window.newTrip:(typeof window.newTrip==='function'?window.newTrip:null);
    if(fn){
      window.newTrip=fn;
      window.openNewTrip=fn;
      document.querySelectorAll('[onclick="newTrip()"],[onclick="openNewTrip()"],.trip-list-actions button').forEach(el=>{
        el.onclick=function(ev){if(ev)ev.preventDefault();fn();};
      });
    }

    document.querySelectorAll('#tripList .trip-card').forEach((el,index)=>{
      if(index >= ((window.db&&window.db.trips)||[]).length)return;
      const t=window.db.trips[index];
      if(!t)return;
      el.onclick=function(ev){
        if(ev)ev.preventDefault();
        ev&&ev.stopPropagation();
        openTrip(t.id);
      };
      el.style.pointerEvents='auto';
      el.style.cursor='pointer';
    });
    return true;
  }

  function boot(){
    bind();
    let n=0;
    const timer=setInterval(()=>{bind();if(++n>120)clearInterval(timer)},100);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.addEventListener('load',boot);
})();
