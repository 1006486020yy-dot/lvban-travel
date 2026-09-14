/* 旅伴｜目录冲突最终修复层 */
(function(){
  'use strict';
  function syncDb(){
    const D=window.LVBAN_DATA;
    const db=window.db;
    if(!D||!db)return;
    if(Array.isArray(D.spots)&&D.spots.length)db.spots=D.spots.map(x=>({...x}));
    if(Array.isArray(D.foods)&&D.foods.length)db.foods=D.foods.map(x=>({...x}));
    if(Array.isArray(D.hotels)&&D.hotels.length)db.hotels=D.hotels.map(x=>({...x}));
    try{window.save?.()}catch(e){}
  }

  function rerenderCatalog(type){
    if(!window.LVBAN_CATALOG)return;
    if(type==='spot' || type==='food'){
      const fn=type==='spot'?window.LVBAN_CATALOG.renderSpots:window.LVBAN_CATALOG.renderFoods;
      if(typeof fn==='function')fn();
      else window.LVBAN_CATALOG.renderAll?.();
    }else window.LVBAN_CATALOG.renderAll?.();
  }

  function repairGo(){
    if(window.__lvbanCatalogGoFixed)return;
    if(typeof window.go!=='function')return;
    const baseGo=window.go;
    window.go=function(id){
      baseGo(id);
      if(id==='spots'||id==='food')setTimeout(()=>{syncDb();rerenderCatalog(id==='spots'?'spot':'food')},0);
    };
    window.__lvbanCatalogGoFixed=true;
  }

  function guardSearch(){
    document.querySelectorAll('.catalog-search').forEach(input=>{
      if(input.dataset.finalSearchGuard==='1')return;
      const clone=input.cloneNode(true);
      clone.dataset.finalSearchGuard='1';
      input.replaceWith(clone);
      let composing=false,timer=0;
      clone.addEventListener('compositionstart',()=>{composing=true});
      clone.addEventListener('compositionend',()=>{composing=false;apply()});
      function apply(){
        clearTimeout(timer);
        const type=clone.id.indexOf('foodList')===0?'food':clone.id.indexOf('hotelList')===0?'hotel':'spot';
        timer=setTimeout(()=>window.LVBAN_CATALOG?.setQuery(type,clone.value),80);
      }
      clone.addEventListener('input',()=>{if(!composing)apply()});
    });
  }

  function run(){
    syncDb();
    repairGo();
    guardSearch();
    window.LVBAN_CATALOG?.renderAll?.();
  }

  window.addEventListener('lvban-data-ready',()=>setTimeout(run,0));
  window.addEventListener('load',()=>setTimeout(run,0));
  setTimeout(run,300);
  setTimeout(run,1200);
})();
