/* 旅伴旅行管家 · 行程卡片最终点击兜底
   V3 强制入口：卡片点击后统一进入 trip-layout-v2，避免旧版 renderer 后续覆盖。
*/
(function(){
  'use strict';
  function getTrips(){return Array.isArray(window.db?.trips)?window.db.trips:[];}
  function selectedId(card){
    const direct=card?.dataset?.tripId||card?.dataset?.id;if(direct)return direct;
    const attr=card?.getAttribute?.('onclick')||card?.querySelector?.('[onclick]')?.getAttribute?.('onclick')||'';
    const m=attr.match(/openTripCanvas\(['"]([^'"]+)['"]\)/);if(m)return m[1];
    const cards=[...document.querySelectorAll('#tripCards .trip-card, #trips .trip-card')];
    const index=cards.indexOf(card);return index>=0?getTrips()[index]?.id:null;
  }
  function forceV3(){
    if(typeof window._lvbanTripCanvasV2==='function')window._lvbanTripCanvasV2();
    else if(typeof window._lvbanTripCanvas==='function')window._lvbanTripCanvas();
  }
  function open(id){
    const list=getTrips();if(!list.length)return;
    const t=list.find(x=>x.id===id)||list[0];
    window.activeTrip=t.id;window.activePlan=t.plans?.[0]?.id||'A';window.activeDay=0;
    window.activeTripCity=null;window._lv2City=null;window._lv2Day=0;
    forceV3();
    queueMicrotask(forceV3);setTimeout(forceV3,0);setTimeout(forceV3,80);setTimeout(forceV3,250);
  }
  window.__lvbanHardOpenTrip=open;
  document.addEventListener('click',function(ev){
    if(ev.target?.closest?.('.lv-delete-trip'))return;
    const card=ev.target?.closest?.('#tripCards .trip-card, #trips .trip-card');if(!card)return;
    if(ev.target.closest('.trip-delete,.lv-more-btn,.lv-more-menu,.trip-fab'))return;
    const id=selectedId(card);if(!id)return;
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();open(id);
  },true);
})();
