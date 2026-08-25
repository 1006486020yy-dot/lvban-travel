/* 旅伴旅行管家 · 稳定行程路由加载器 */
(function(){
  'use strict';
  if(window.__lvbanTripRouterLoaded)return;
  window.__lvbanTripRouterLoaded=true;
  const s=document.createElement('script');
  s.src='trip-detail-final.js?v=20260825-final';
  s.onload=()=>window.__lvbanTripRouterReady=true;
  s.onerror=()=>console.error('trip-detail-final.js load failed');
  document.head.appendChild(s);
})();