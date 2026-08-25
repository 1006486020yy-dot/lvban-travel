/* 旅伴旅行管家 · 稳定行程路由加载器 */
(function(){
  'use strict';
  if(window.__lvbanTripRouterLoaded)return;
  window.__lvbanTripRouterLoaded=true;
  function load(src,done){
    const s=document.createElement('script');
    s.src=src;
    s.onload=()=>done&&done();
    s.onerror=()=>console.error(src+' load failed');
    document.head.appendChild(s);
  }
  load('trip-detail-final.js?v=20260825-final',()=>{
    load('trip-node-final.js?v=20260825-final',()=>{
      window.__lvbanTripRouterReady=true;
      window.__lvbanNodeEditorReady=true;
    });
  });
})();