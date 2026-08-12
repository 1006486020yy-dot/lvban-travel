/* 旅伴旅行管家 · 首页交互兜底（轻量版） */
(function(){
  'use strict';
  const qsa=(s,r)=>Array.prototype.slice.call((r||document).querySelectorAll(s));
  function navigate(page){
    if(!page)return;
    try{if(typeof window.go==='function'){window.go(page);return}}catch(e){console.error('[lvban go]',e)}
    qsa('.page').forEach(el=>el.classList.toggle('active',el.id===page));
    qsa('.bottom button').forEach(el=>el.classList.toggle('on',el.getAttribute('data-page')===page));
  }
  function bind(){
    qsa('#home .tile[data-lv-page], #home .tile, .bottom button[data-page]').forEach(el=>{
      if(el.dataset.lvBound==='1')return;
      el.dataset.lvBound='1';el.style.pointerEvents='auto';
      el.addEventListener('click',function(e){
        e.preventDefault();e.stopPropagation();
        let page=el.getAttribute('data-lv-page')||el.getAttribute('data-page');
        if(!page){const m=(el.getAttribute('onclick')||'').match(/go\(['\"]([^'\"]+)['\"]\)/);page=m&&m[1]}
        navigate(page);
      },true);
    });
  }
  function visualFix(){
    if(document.getElementById('lv-home-interaction-fix'))return;
    const s=document.createElement('style');s.id='lv-home-interaction-fix';s.textContent=`
      #home .hero p{color:#fff!important;opacity:1!important}
      #home .tile,#home .tile *{pointer-events:auto}
      #home .tile{position:relative;z-index:2;cursor:pointer}
      .bottom,.bottom button{pointer-events:auto}.bottom{z-index:9990}.modal{z-index:10000}
    `;document.head.appendChild(s);
  }
  function start(){visualFix();bind()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
