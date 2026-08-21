/* 旅伴｜十一福建游｜城市日期归属修复
   固定行程规则：
   - 2026-09-30 只属于平潭
   - 2026-10-01 只属于平潭
   因此这两天不会再出现在“厦门”的城市日期中。
   同时修正旧本地数据中因“未提供”地址被误判为厦门的条目。
*/
(function(){
  'use strict';
  const TRIP_NAME='旅伴旅行管家｜十一福建游';
  const TARGET={
    '2026-09-30':{city:'平潭',cityLabel:'平潭'},
    '2026-10-01':{city:'平潭',cityLabel:'平潭 → 厦门'}
  };
  const VERSION='fujian-city-date-v3';
  const getDB=()=>typeof window.db==='function'?window.db():window.db;
  const save=()=>{try{window.save?.();}catch(e){}}
  function normalizeDay(day,rule){
    if(!day||!rule)return false;
    let changed=false;
    if(day.city!==rule.city){day.city=rule.city;changed=true}
    if(day.cityLabel!==rule.cityLabel){day.cityLabel=rule.cityLabel;changed=true}
    if(Array.isArray(day.items))day.items.forEach(item=>{
      if(item && item.city!==rule.city){item.city=rule.city;changed=true}
    });
    return changed;
  }
  function clean(){
    const db=getDB();
    if(!db||!Array.isArray(db.trips))return false;
    const trip=db.trips.find(t=>String(t?.name||t?.title||'').trim()===TRIP_NAME||String(t?.id||'')==='fujian-2026-national-day'||String(t?.id||'')==='trip-main');
    if(!trip)return false;
    let changed=false;
    (Array.isArray(trip.plans)?trip.plans:[]).forEach(plan=>{
      (Array.isArray(plan.days)?plan.days:[]).forEach(day=>{
        const date=String(day?.date||day?.dayDate||day?.startDate||'').slice(0,10);
        if(TARGET[date])changed=normalizeDay(day,TARGET[date])||changed;
      });
    });
    if(trip.sourceDataVersion!=='fujian-national-day-2026-v2'){
      trip.sourceDataVersion='fujian-national-day-2026-v2';
      changed=true;
    }
    if(changed)save();
    return changed;
  }
  let tries=0;
  function boot(){
    if(clean()||tries++>60)return;
    setTimeout(boot,150);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.addEventListener('lvban-data-ready',boot);
})();