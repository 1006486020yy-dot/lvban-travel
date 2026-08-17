/* 旅伴旅行管家｜10月1日跨城显示修补
   不改 UI / 分享 / 其它日期。
   10月1日实际是“上午平潭 + 下午厦门”，因此同一天在两个城市入口都要可见。
*/
(function(){
  'use strict';
  const TRIP_NAME='旅伴旅行管家｜十一福建游';
  const getTrips=()=>Array.isArray(window.db?.trips)?window.db.trips:[];
  const save=()=>window.save?.();
  const run=()=>{
    const trip=getTrips().find(t=>t.name===TRIP_NAME);
    const plan=trip?.plans?.find(p=>p.id===window.activePlan)||trip?.plans?.[0];
    if(!trip||!plan||!Array.isArray(plan.days))return false;
    const xiamenIndex=plan.days.findIndex(d=>String(d?.date)==='2026-10-01'&&String(d?.city)==='厦门');
    if(xiamenIndex<0)return false;
    const hasPingtan=plan.days.some(d=>String(d?.date)==='2026-10-01'&&String(d?.city)==='平潭'&&d.__oct1PingtanSplit===true);
    if(hasPingtan)return true;
    const src=plan.days[xiamenIndex];
    const items=Array.isArray(src.items)?src.items:[];
    const pingtanItems=items.filter((x,i)=>i<2 || String(x?.name||'').includes('平潭 → 厦门'));
    const pingtanDay={
      ...src,
      id:(window.uid?.()||('lv-oct1-pingtan-'+Date.now())),
      day:src.day,
      date:'2026-10-01',
      city:'平潭',
      cityLabel:'平潭',
      title:'平潭｜最后半日',
      label:'平潭｜最后半日',
      __oct1PingtanSplit:true,
      items:pingtanItems.map((x,i)=>({...x,city:'平潭',stop:i+1,stopLabel:`第 ${i+1} 站`}))
    };
    plan.days.splice(xiamenIndex,0,pingtanDay);
    save();
    window._lv2City='平潭';
    window._lv2Day=0;
    window._lvbanTripCanvasV2?.();
    window.renderTripDetail?.();
    return true;
  };
  let n=0;
  const timer=setInterval(()=>{n++;if(run()||n>30)clearInterval(timer)},300);
  window.addEventListener('lvban-data-ready',run);
})();
