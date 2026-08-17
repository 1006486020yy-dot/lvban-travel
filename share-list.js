/* 旅伴旅行管家｜10月1日跨城同日修补加载器
   index.html 已经加载本文件，因此这里负责加载最新的行程修补逻辑。
   不改 UI / 分享 / 其它日期。
*/
(function(){
  'use strict';
  const src='itinerary-oct1-city-split-fix.js?v=20260817-2';
  function load(){
    if(document.querySelector('script[data-lvban-oct1-fix]')) return;
    const s=document.createElement('script');
    s.src=src;
    s.async=false;
    s.dataset.lvbanOct1Fix='1';
    document.head.appendChild(s);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',load,{once:true});
  else load();
})();
