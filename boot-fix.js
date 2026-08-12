/* 旅伴旅行管家 · 首页交互兜底
 * 目的：保证首页六大入口、底部导航在任何增强脚本加载顺序下都可点击。
 */
(function(){
  'use strict';
  function qs(s,r){return (r||document).querySelector(s)}
  function qsa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}

  function fallbackGo(page){
    qsa('.page').forEach(function(el){el.classList.toggle('active',el.id===page)});
    qsa('.bottom button').forEach(function(el){el.classList.toggle('on',el.getAttribute('data-page')===page)});
    try{
      if(page==='home'&&window.lvFinalTripFix?.updateCountdown) window.lvFinalTripFix.updateCountdown();
      if(page==='trips'&&window.renderTrips) window.renderTrips();
      if(page==='spots'&&window.renderCatalog) window.renderCatalog('spots');
      if(page==='food'&&window.renderCatalog) window.renderCatalog('food');
      if(page==='traffic'&&window.renderTraffic) window.renderTraffic();
      if(page==='hotels'&&window.renderHotels) window.renderHotels();
    }catch(e){console.error('[lvban boot]',e)}
  }

  function navigate(page){
    if(!page)return;
    if(typeof window.go==='function'){
      try{window.go(page);return}catch(e){console.error('[lvban go]',e)}
    }
    fallbackGo(page);
  }

  function bind(){
    qsa('#home .tile[data-lv-page], #home .tile').forEach(function(el){
      if(el.dataset.lvBound==='1')return;
      el.dataset.lvBound='1';
      el.style.pointerEvents='auto';
      el.style.position='relative';
      el.style.zIndex='2';
      el.addEventListener('click',function(e){
        e.preventDefault();e.stopPropagation();
        var page=el.getAttribute('data-lv-page');
        if(!page){var m=(el.getAttribute('onclick')||'').match(/go\(['\"]([^'\"]+)['\"]\)/);page=m&&m[1]}
        navigate(page);
      },true);
    });
    qsa('.bottom button[data-page]').forEach(function(el){
      if(el.dataset.lvBound==='1')return;
      el.dataset.lvBound='1';
      el.style.pointerEvents='auto';
      el.addEventListener('click',function(e){
        e.preventDefault();e.stopPropagation();navigate(el.getAttribute('data-page')); 
      },true);
    });
  }

  function visualFix(){
    var style=qs('#lv-home-interaction-fix');
    if(style)return;
    style=document.createElement('style');style.id='lv-home-interaction-fix';
    style.textContent=`
      #home .hero p{color:#fff!important;opacity:1!important}
      #home .tile,#home .tile *{pointer-events:auto}
      #home .tile{position:relative;z-index:2;cursor:pointer}
      .bottom,.bottom button{pointer-events:auto}
      .bottom{z-index:9990}
      .modal{z-index:10000}
    `;
    document.head.appendChild(style);
  }

  function start(){visualFix();bind();setInterval(bind,800)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
