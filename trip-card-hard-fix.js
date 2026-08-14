/* 旅伴旅行管家 · 行程卡片最终点击兜底
   目的：不再依赖多个 openTripCanvas 实现，直接在捕获阶段接管新版 .trip-card 点击。
   不改变现有卡片 UI，只负责把被点击的行程打开到现有行程画布。
*/
(function(){
  'use strict';

  function getTrips(){ return Array.isArray(window.db?.trips) ? window.db.trips : []; }

  function selectedId(card){
    const direct = card?.dataset?.tripId || card?.dataset?.id;
    if(direct) return direct;
    const attr = card?.getAttribute?.('onclick') || card?.querySelector?.('[onclick]')?.getAttribute?.('onclick') || '';
    const m = attr.match(/openTripCanvas\(['"]([^'"]+)['"]\)/);
    if(m) return m[1];
    const cards=[...document.querySelectorAll('#tripCards .trip-card, #trips .trip-card')];
    const index=cards.indexOf(card);
    return index>=0 ? getTrips()[index]?.id : null;
  }

  function open(id){
    const trips=getTrips();
    if(!trips.length) return;
    const t=trips.find(x=>x.id===id) || trips[0];
    window.activeTrip=t.id;
    window.activePlan=t.plans?.[0]?.id || 'A';
    window.activeDay=0;
    window.activeTripCity=null;
    window._tripUI=window._tripUI||{city:'全部',type:'全部',openDays:{}};
    window._tripUI.day=0;
    window._tripUI.city='全部';
    window._tripUI.type='全部';

    /* 优先使用当前项目已经存在的新版行程画布。 */
    if(typeof window._lvbanTripCanvas==='function'){
      window._lvbanTripCanvas();
      return;
    }
    /* 最后才使用现有公开入口。 */
    if(typeof window.openTripCanvas==='function'){
      window.openTripCanvas(t.id);
    }
  }

  window.__lvbanHardOpenTrip=open;

  document.addEventListener('click',function(ev){
    const card=ev.target?.closest?.('#tripCards .trip-card, #trips .trip-card');
    if(!card) return;
    /* 删除 / 更多菜单属于卡片内部其他操作，不抢事件。 */
    if(ev.target.closest('.trip-delete,.lv-more-btn,.lv-more-menu,.trip-fab')) return;
    const id=selectedId(card);
    if(!id) return;
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    open(id);
  },true);
})();
