/* 旅伴旅行管家｜行程唯一数据归属层
   只维护一套真实数据：window.db
   结构：大行程 → 城市 → 日期 → 行程节点
   不再使用 schedules 推导城市，避免旧脚本互相覆盖。
*/
(function(){
  'use strict';
  const TARGET='十一福建游';
  const DATE_CITIES={
    '2026-09-28':['福州'],
    '2026-09-29':['福州','平潭'],
    '2026-09-30':['平潭'],
    '2026-10-01':['平潭','厦门'],
    '2026-10-02':['厦门'],
    '2026-10-03':['厦门'],
    '2026-10-04':['厦门']
  };
  const text=x=>String(x?.name||'').trim();
  function itemCity(date,item,index){
    const n=text(item);
    if(date==='2026-09-29'){
      if(/三坊七巷|老福洲|福州站|福州 → 平潭|福州.*平潭/.test(n))return '福州';
      return '平潭';
    }
    if(date==='2026-10-01'){
      if(/龙王头|平潭站|平潭.*厦门/.test(n))return '平潭';
      if(/希岸酒店|胡里山|白城沙滩|演武大桥|沙坡尾|厦门/.test(n))return '厦门';
      return index<2?'平潭':'厦门';
    }
    return DATE_CITIES[date]?.[0]||'';
  }
  function run(){
    const db=typeof window.db==='function'?window.db():window.db;
    const trips=Array.isArray(db?.trips)?db.trips:[];
    const trip=trips.find(t=>String(t?.name||'').includes(TARGET));
    const plan=trip?.plans?.find(p=>p.id===window.activePlan)||trip?.plans?.[0];
    if(!trip||!plan||!Array.isArray(plan.days)||typeof window._lvbanTripCanvasV2!=='function')return false;
    let changed=false;
    plan.days.forEach(d=>{
      const date=String(d?.date||'').slice(0,10),cities=DATE_CITIES[date];
      if(!cities)return;
      if(JSON.stringify(d.cities||[])!==JSON.stringify(cities)){d.cities=cities.slice();changed=true;}
      (d.items||[]).forEach((item,i)=>{
        const c=itemCity(date,item,i);
        if(c&&item.city!==c){item.city=c;changed=true;}
      });
    });
    if(changed&&typeof window.save==='function')window.save();
    if(window.activeTrip!==trip.id)window.activeTrip=trip.id;
    if(!window.activePlan)window.activePlan=plan.id;
    // 只让 V2 成为唯一渲染器；清掉旧的城市/日期选择状态。
    window._lv2City=null;
    window._lv2Day=0;
    window._lvbanTripCanvasV2();
    return true;
  }
  let tries=0;
  const timer=setInterval(()=>{tries++;if(run()||tries>120)clearInterval(timer)},250);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,300),{once:true});
  else setTimeout(run,300);
})();
