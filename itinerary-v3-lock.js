/* 旅伴旅行管家 · 行程 V3 锁定层
   只做入口兼容，不渲染新的行程 UI。
*/
(function(){
  'use strict';
  function getRenderer(){return window._lvbanTripCanvasV2||window._lvbanTripCanvas;}
  function lock(){
    const r=getRenderer();
    if(typeof r!=='function')return false;
    window.renderTripDetail=r;
    window.lvCityDateLayout={render:r};
    window.openTripCanvas=function(id){
      const list=Array.isArray(window.db?.trips)?window.db.trips:[];
      const t=list.find(x=>String(x.id)===String(id))||list[0];
      if(!t)return;
      window.activeTrip=t.id;
      window.activePlan=t.plans?.[0]?.id||window.activePlan||'A';
      window._lv2City=null;window._lv2Day=0;window.activeTripCity=null;
      r();
    };
    window.switchPlan=function(id){window.activePlan=id;window._lv2Day=0;r()};
    return true;
  }
  const boot=()=>{if(!lock()){setTimeout(lock,100);setTimeout(lock,300);setTimeout(lock,800);setTimeout(lock,1500)}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.addEventListener('load',boot);window.addEventListener('lvban-data-ready',boot);
})();
