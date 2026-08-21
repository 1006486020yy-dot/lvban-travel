/* 旅伴旅行管家 · 行程列表清理
   只清理历史遗留的旧版“十一福建游”重复种子，不碰用户正常新建行程。
   保留当前正式版本：旅伴旅行管家｜十一福建游（福州 / 平潭 / 厦门）。
*/
(function(){
  'use strict';
  const LEGACY_NAME='十一福建游';
  const CURRENT_NAME='旅伴旅行管家｜十一福建游';
  function getTrips(){return Array.isArray(window.db?.trips)?window.db.trips:null;}
  function persist(){
    for(const n of ['saveDB','saveData','persistDB','persistData','saveState','saveLocalData','save']){
      if(typeof window[n]==='function'){try{window[n]();return true}catch(e){}}
    }
    try{
      for(let i=0;i<localStorage.length;i++){
        const key=localStorage.key(i),raw=key&&localStorage.getItem(key);if(!raw||raw.length>2000000)continue;
        try{
          const obj=JSON.parse(raw);
          if(obj&&Array.isArray(obj.trips)){obj.trips=getTrips();localStorage.setItem(key,JSON.stringify(obj));return true}
          if(Array.isArray(obj)&&obj.some(x=>x&&Array.isArray(x.plans))){localStorage.setItem(key,JSON.stringify(getTrips()));return true}
        }catch(e){}
      }
    }catch(e){}
    return false;
  }
  function cleanup(){
    const list=getTrips();if(!list)return;
    const before=list.length;
    const next=list.filter(t=>{
      const name=String(t?.name||'').trim();
      if(name!==LEGACY_NAME)return true;
      const start=String(t?.start||t?.startDate||'');
      const end=String(t?.end||t?.endDate||'');
      const cities=Array.isArray(t?.cityDurations)?t.cityDurations.map(x=>String(x?.city||'')):[];
      const cityText=cities.join('·')+' '+String(t?.city||'');
      return !(start==='2026-09-28'&&end==='2026-10-04'&&cityText.includes('泉州'));
    });
    if(next.length===before)return;
    window.db.trips=next;
    if(String(window.activeTrip||'')&& !next.some(t=>String(t.id)===String(window.activeTrip))) window.activeTrip=next[0]?.id||null;
    persist();
    window.renderTrips?.();
  }
  function start(){cleanup();setTimeout(cleanup,300);setTimeout(cleanup,1200)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
