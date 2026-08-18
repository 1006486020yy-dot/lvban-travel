/* 旅伴旅行管家｜城市入口清理修复
   只处理城市入口数据：路线（如“福州 → 平潭”）不是城市，不显示为城市按钮。
   不修改现有 UI 样式、不修改行程节点内容。
*/
(function(){
  'use strict';
  const isRoute=v=>/[→➜➡⟶]|\s*-\>\s*/.test(String(v||''));
  const clean=v=>String(v||'').trim();
  const valid=v=>{v=clean(v);return v&&!isRoute(v)&&!['全部城市','全部','景点','美食','交通','酒店','住宿'].includes(v)};

  function patch(){
    const old=window._lvbanTripCanvasV2||window.renderTripDetail;
    if(typeof old!=='function')return false;
    if(old.__routeFiltered)return true;
    const wrapped=function(){
      try{
        const db=window.db, trips=Array.isArray(db?.trips)?db.trips:[];
        trips.forEach(t=>(t.plans||[]).forEach(p=>(p.days||[]).forEach(d=>{
          if(Array.isArray(d.cities))d.cities=d.cities.filter(valid);
          if(isRoute(d.city)){
            const atomic=(d.items||[]).map(x=>clean(x.city)).find(valid);
            if(atomic)d.city=atomic;
            else delete d.city;
          }
        })));
        if(Array.isArray(db?.trips))window.save?.();
      }catch(e){console.warn('[旅伴] 城市入口清理失败',e)}
      return old.apply(this,arguments);
    };
    wrapped.__routeFiltered=true;
    window._lvbanTripCanvasV2=wrapped;
    window._lvbanTripCanvas=wrapped;
    window.renderTripDetail=wrapped;
    return true;
  }
  let tries=0;
  const timer=setInterval(()=>{tries++;if(patch()||tries>80)clearInterval(timer)},250);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patch,{once:true});else setTimeout(patch,100);
})();
