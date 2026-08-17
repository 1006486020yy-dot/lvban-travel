/* 旅伴旅行管家｜城市-日期视图最终修补
   不改 UI，只确保现有“大行程 → 城市 → 日期 → 行程节点”结构拿到正确的城市日期映射。
   特别处理：2026-09-29 福州+平潭；2026-10-01 平潭+厦门。
   兼容已经存在的本地行程数据，不要求重新创建行程。
*/
(function(){
  'use strict';
  const TARGET='旅伴旅行管家｜十一福建游';
  const DATE_CITIES={
    '2026-09-28':['福州'],
    '2026-09-29':['福州','平潭'],
    '2026-09-30':['平潭'],
    '2026-10-01':['平潭','厦门'],
    '2026-10-02':['厦门'],
    '2026-10-03':['厦门'],
    '2026-10-04':['厦门']
  };
  const fuzhou=/三坊七巷|老福洲|福州站|高铁｜福州 → 平潭/;
  const pingtan=/龙王头|平潭站|猴研岛|岐沙澳|田美澳|坛南湾|月海湾|仙人井|北港|镜沙|长江澳|北部湾|风车森林|平潭城区|维也纳酒店（福州平潭|丽怡酒店（平潭/;
  const getDB=()=>{
    try{return typeof window.db==='function'?window.db():window.db}catch(e){return null}
  };
  const cityForItem=(date,name,original)=>{
    const n=String(name||'');
    if(date==='2026-09-29')return fuzhou.test(n)?'福州':'平潭';
    if(date==='2026-10-01')return pingtan.test(n)?'平潭':'厦门';
    return original||DATE_CITIES[date]?.[0]||'';
  };
  function normalize(){
    const db=getDB();
    if(!db||!Array.isArray(db.trips))return false;
    const trip=db.trips.find(t=>String(t?.name||'')===TARGET||String(t?.name||'').includes('十一福建游'));
    if(!trip)return false;
    const plans=Array.isArray(trip.plans)?trip.plans:[];
    let changed=false;
    plans.forEach(p=>{
      (p.days||[]).forEach(d=>{
        const date=String(d?.date||'').slice(0,10);
        const cities=DATE_CITIES[date];
        if(!cities)return;
        const old=Array.isArray(d.cities)?d.cities:[];
        if(JSON.stringify(old)!==JSON.stringify(cities)){d.cities=cities.slice();changed=true;}
        if(!d.city||cities.length===1){
          if(d.city!==cities[0]){d.city=cities[0];changed=true;}
        }else if(date==='2026-09-29'||date==='2026-10-01'){
          if(d.city!==cities.join(' → ')){d.city=cities.join(' → ');changed=true;}
        }
        (d.items||[]).forEach(item=>{
          const c=cityForItem(date,item?.name,item?.city);
          if(c&&item.city!==c){item.city=c;changed=true;}
        });
      });
    });
    if(changed&&typeof window.save==='function')window.save();
    return true;
  }
  function patchRender(){
    const fn=window._lvbanTripCanvasV2||window.renderTripDetail;
    if(typeof fn!=='function')return false;
    if(fn.__lvbanCityDateFixed)return true;
    const wrapped=function(){normalize();return fn.apply(this,arguments)};
    wrapped.__lvbanCityDateFixed=true;
    window._lvbanTripCanvasV2=wrapped;
    window._lvbanTripCanvas=wrapped;
    window.renderTripDetail=wrapped;
    return true;
  }
  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    normalize();
    patchRender();
    if(tries>=120)clearInterval(timer);
  },200);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{normalize();patchRender()},{once:true});
  else setTimeout(()=>{normalize();patchRender()},100);
})();
