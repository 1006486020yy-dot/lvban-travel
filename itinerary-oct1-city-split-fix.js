/* 旅伴旅行管家｜10月1日跨城同日修补
   不改 UI / 分享 / 其它日期。
   2026-10-01 必须保持同一个 DAY 4：平潭 DAY 4 上午 + 厦门 DAY 4 下午。
*/
(function(){
  'use strict';
  const TRIP_NAME='旅伴旅行管家｜十一福建游';
  const getTrips=()=>Array.isArray(window.db?.trips)?window.db.trips:[];
  const persist=()=>{try{window.dispatchEvent(new CustomEvent('lvban-db-change'));}catch(e){}try{window.save?.();}catch(e){}};

  function run(){
    const trip=getTrips().find(t=>String(t?.name||'').trim()===TRIP_NAME);
    const plan=trip?.plans?.[0];
    if(!trip||!plan||!Array.isArray(plan.days))return false;
    const oct1=plan.days.filter(d=>String(d?.date)==='2026-10-01');
    if(!oct1.length)return false;

    const all=[];
    oct1.forEach(d=>(Array.isArray(d.items)?d.items:[]).forEach(x=>all.push({...x})));
    const isPingtan=x=>{
      const n=String(x?.name||'');
      const c=String(x?.city||'');
      return c==='平潭'||/龙王头海滨浴场|高铁｜平潭 → 厦门|高铁.*平潭.*厦门|平潭站/.test(n);
    };
    const pItems=all.filter(isPingtan);
    const xItems=all.filter(x=>!isPingtan(x));
    if(!pItems.some(x=>String(x?.name||'').includes('龙王头海滨浴场')))return false;
    if(!xItems.some(x=>String(x?.name||'').includes('胡里山炮台')))return false;

    const already=oct1.length===2 &&
      oct1.some(d=>String(d.city)==='平潭'&&String(d.title)==='DAY 4 上午'&&d.items?.some(x=>String(x.name||'').includes('龙王头海滨浴场'))) &&
      oct1.some(d=>String(d.city)==='厦门'&&String(d.title)==='DAY 4 下午'&&d.items?.some(x=>String(x.name||'').includes('胡里山炮台')));
    if(already)return true;

    const makeDay=(city,title,items)=>({
      day:4,date:'2026-10-01',city,cityLabel:city,title,label:title,
      items:items.map((x,i)=>({...x,city,stop:i+1,stopLabel:`第 ${i+1} 站`}))
    });
    const pDay=makeDay('平潭','DAY 4 上午',pItems);
    const xDay=makeDay('厦门','DAY 4 下午',xItems);
    const firstOct1=plan.days.findIndex(d=>String(d?.date)==='2026-10-01');
    plan.days=plan.days.filter(d=>String(d?.date)!=='2026-10-01');
    plan.days.splice(Math.max(0,firstOct1),0,pDay,xDay);

    persist();
    window._lv2Day=0;
    setTimeout(()=>{window._lvbanTripCanvasV2?.();window.renderTripDetail?.();},80);
    return true;
  }

  let n=0;
  const timer=setInterval(()=>{n++;if(run()||n>40)clearInterval(timer)},300);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,100),{once:true});
  else setTimeout(run,100);
  window.addEventListener('lvban-data-ready',run);
})();
