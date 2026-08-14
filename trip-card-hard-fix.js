/* 旅伴旅行管家 · 行程卡片最终点击兜底 */
(function(){
  'use strict';
  function getTrips(){ return Array.isArray(window.db?.trips) ? window.db.trips : []; }
  function selectedId(card){
    const direct=card?.dataset?.tripId||card?.dataset?.id;if(direct)return direct;
    const attr=card?.getAttribute?.('onclick')||card?.querySelector?.('[onclick]')?.getAttribute?.('onclick')||'';
    const m=attr.match(/openTripCanvas\(['"]([^'"]+)['"]\)/);if(m)return m[1];
    const cards=[...document.querySelectorAll('#tripCards .trip-card, #trips .trip-card')];
    const index=cards.indexOf(card);return index>=0?getTrips()[index]?.id:null;
  }
  function open(id){
    const list=getTrips();if(!list.length)return;
    const t=list.find(x=>x.id===id)||list[0];
    window.activeTrip=t.id;window.activePlan=t.plans?.[0]?.id||'A';window.activeDay=0;window.activeTripCity=null;
    window._tripUI=window._tripUI||{city:'全部',type:'全部',openDays:{}};
    window._tripUI.day=0;window._tripUI.city='全部';window._tripUI.type='全部';
    if(typeof window._lvbanTripCanvas==='function'){window._lvbanTripCanvas();return;}
    if(typeof window.openTripCanvas==='function')window.openTripCanvas(t.id);
  }
  window.__lvbanHardOpenTrip=open;
  document.addEventListener('click',function(ev){
    // 删除按钮属于独立操作，不能被行程卡片打开逻辑拦截。
    if(ev.target?.closest?.('.lv-delete-trip'))return;
    const card=ev.target?.closest?.('#tripCards .trip-card, #trips .trip-card');if(!card)return;
    if(ev.target.closest('.trip-delete,.lv-more-btn,.lv-more-menu,.trip-fab'))return;
    const id=selectedId(card);if(!id)return;
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();open(id);
  },true);
})();
