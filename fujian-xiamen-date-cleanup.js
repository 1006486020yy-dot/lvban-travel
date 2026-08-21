/* 旅伴｜十一福建游｜厦门重复日期清理
   仅处理固定行程「旅伴旅行管家｜十一福建游」：
   删除厦门 2026-09-30 与 2026-10-01 的城市日程，避免与平潭重复。
   不修改其他行程，不改 2026-10-02 之后的厦门日程，不改 UI。
*/
(function(){
  'use strict';
  const TRIP_NAME='旅伴旅行管家｜十一福建游';
  const TARGET_DATES=new Set(['2026-09-30','2026-10-01']);
  function getDB(){return typeof window.db==='function'?window.db():window.db;}
  function save(){try{window.save?.();}catch(e){}}
  function clean(){
    const db=getDB();
    if(!db||!Array.isArray(db.trips)) return false;
    const trip=db.trips.find(t=>String(t?.name||t?.title||'').trim()===TRIP_NAME);
    if(!trip) return false;
    let changed=false;
    (Array.isArray(trip.plans)?trip.plans:[]).forEach(plan=>{
      if(!Array.isArray(plan.days)) return;
      const before=plan.days.length;
      plan.days=plan.days.filter(day=>{
        const date=String(day?.date||day?.dayDate||day?.startDate||'').trim();
        const city=String(day?.city||day?.cityLabel||day?.locationCity||'').trim();
        return !(city.includes('厦门') && TARGET_DATES.has(date));
      });
      if(plan.days.length!==before) changed=true;
    });
    if(changed) save();
    return changed;
  }
  let tries=0;
  function boot(){
    if(clean()||tries++>30) return;
    setTimeout(boot,120);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  window.addEventListener('lvban:data-ready',boot);
})();
