/* 旅伴旅行管家｜十一福建游 · 10月1日跨城市同日拆分
   不改 UI。只把 2026-10-01 拆成两个同为 DAY 4 的城市日期：
   平潭 DAY 4（上午） + 厦门 DAY 4（下午）。
*/
(function(){
  'use strict';
  const TRIP_NAME='旅伴旅行管家｜十一福建游';
  const db=()=>Array.isArray(window.db?.trips)?window.db:typeof window.db==='function'?window.db():window.db;
  const save=()=>{try{window.dispatchEvent(new CustomEvent('lvban-db-change'));}catch(e){}try{window.save?.();}catch(e){}};
  const normalize=()=>{
    const D=db();
    const trips=Array.isArray(D?.trips)?D.trips:[];
    const trip=trips.find(t=>String(t.name||t.tripName||'').trim()===TRIP_NAME);
    const plan=trip?.plans?.[0];
    if(!plan||!Array.isArray(plan.days))return false;

    const sameDate=plan.days.filter(d=>String(d.date)==='2026-10-01');
    if(!sameDate.length)return false;
    const allItems=sameDate.flatMap(d=>Array.isArray(d.items)?d.items:[]);

    const isPingtan=x=>{
      const s=String(x?.name||'');
      return /龙王头海滨浴场|平潭 → 厦门|平潭.*厦门|平潭站/.test(s)||String(x?.city||'')==='平潭';
    };
    const pItems=allItems.filter(isPingtan);
    const xItems=allItems.filter(x=>!isPingtan(x));
    if(!pItems.length||!xItems.length)return false;

    // 已经是正确结构时不重复写入。
    const correct=sameDate.length===2 &&
      sameDate.some(d=>String(d.city)==='平潭'&&Array.isArray(d.items)&&d.items.some(x=>String(x.name||'').includes('龙王头海滨浴场'))) &&
      sameDate.some(d=>String(d.city)==='厦门'&&Array.isArray(d.items)&&d.items.some(x=>String(x.name||'').includes('胡里山炮台')));
    if(correct)return true;

    const base={day:4,date:'2026-10-01'};
    const make=(city,cityLabel,title,items)=>({
      ...base,
      city,
      cityLabel,
      title,
      items:items.map((x,i)=>({...x,stop:i+1,stopLabel:`第 ${i+1} 站`,city}))
    });

    const kept=plan.days.filter(d=>String(d.date)!=='2026-10-01');
    const pDay=make('平潭','平潭','平潭上午',pItems);
    const xDay=make('厦门','厦门','厦门下午',xItems);

    // 按实际旅行顺序插回原 DAY 4 位置：DAY 4 平潭上午、DAY 4 厦门下午。
    const insertAt=Math.min(3,kept.length);
    kept.splice(insertAt,0,pDay,xDay);
    plan.days=kept;

    save();
    try{window.activeTrip=trip.id;window.activePlan=plan.id||window.activePlan;}catch(e){}
    try{window._lv2City=null;window._lv2Day=0;}catch(e){}
    return true;
  };

  function boot(){
    if(normalize()){
      setTimeout(()=>window._lvbanTripCanvasV2?.(),80);
      return true;
    }
    return false;
  }
  let tries=0;
  const timer=setInterval(()=>{tries++;if(boot()||tries>30)clearInterval(timer)},300);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.addEventListener('load',()=>setTimeout(boot,200));
})();
