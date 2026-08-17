/* 旅伴旅行管家｜城市日期直接修补
   直接挂到 index.html，避免 data.js 动态加载顺序或缓存导致城市日期修补未执行。
   只处理数据归属，不改变现有 UI。
*/
(function(){
  'use strict';
  const TARGET='旅伴旅行管家｜十一福建游';
  const dateCities={
    '2026-09-28':['福州'],
    '2026-09-29':['福州','平潭'],
    '2026-09-30':['平潭'],
    '2026-10-01':['平潭','厦门'],
    '2026-10-02':['厦门'],
    '2026-10-03':['厦门'],
    '2026-10-04':['厦门']
  };
  const cityOf=(date,name,index)=>{
    const n=String(name||'');
    if(date==='2026-09-29'){
      if(/三坊七巷|老福洲|福州站|高铁｜福州/.test(n))return '福州';
      return '平潭';
    }
    if(date==='2026-10-01'){
      if(/龙王头|平潭站|平潭 → 厦门/.test(n))return '平潭';
      return '厦门';
    }
    return dateCities[date]?.[0]||'';
  };
  function run(){
    const db=typeof window.db==='function'?window.db():window.db;
    const trips=Array.isArray(db?.trips)?db.trips:[];
    const trip=trips.find(t=>String(t?.name||'')===TARGET || String(t?.name||'').includes('十一福建游'));
    const plan=trip?.plans?.find(p=>p.id===window.activePlan)||trip?.plans?.[0];
    if(!trip||!plan||!Array.isArray(plan.days))return false;
    let changed=false;
    plan.days.forEach(d=>{
      const date=String(d?.date||'').slice(0,10);
      const cities=dateCities[date];
      if(!cities)return;
      if(JSON.stringify(d.cities||[])!==JSON.stringify(cities)){d.cities=cities.slice();changed=true;}
      if(Array.isArray(d.items))d.items.forEach((item,index)=>{
        const c=cityOf(date,item?.name,index);
        if(c && item.city!==c){item.city=c;changed=true;}
      });
    });
    if(changed)window.save?.();
    window._lv2City=null;
    window._lv2Day=0;
    if(typeof window._lvbanTripCanvasV2==='function')setTimeout(()=>window._lvbanTripCanvasV2(),30);
    else if(typeof window.renderTripDetail==='function')setTimeout(()=>window.renderTripDetail(),30);
    return true;
  }
  let tries=0;
  const timer=setInterval(()=>{tries++;if(run()||tries>=80)clearInterval(timer)},250);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,200),{once:true});
  else setTimeout(run,200);
})();
