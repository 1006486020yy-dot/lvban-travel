/* 旅伴 AI · 输入框最终定位兜底，仅处理 composer 位置 */
(function(){
  'use strict';
  if(window.__lvbanAiComposerHardFix)return;
  window.__lvbanAiComposerHardFix=true;
  const STYLE_ID='lvban-ai-composer-hard-fix';
  function inject(){
    if(!document.getElementById(STYLE_ID)){
      const s=document.createElement('style');
      s.id=STYLE_ID;
      s.textContent='#ai .composer{position:fixed!important;top:auto!important;left:50%!important;right:auto!important;bottom:calc(var(--lvban-ai-bottom-nav-gap,76px) + 10px)!important;transform:translateX(-50%)!important;width:min(680px,calc(100% - 24px))!important;z-index:110!important;margin:0!important;}@media(max-width:760px){#ai .composer{left:12px!important;right:12px!important;width:auto!important;transform:none!important;bottom:calc(var(--lvban-ai-bottom-nav-gap,76px) + 8px)!important;}}';
      document.head.appendChild(s);
    }
  }
  function position(){
    const composer=document.querySelector('#ai .composer');
    if(!composer)return;
    const nav=document.querySelector('.bottom');
    const vv=window.visualViewport;
    const layoutH=window.innerHeight;
    let gap=76;
    if(vv&&layoutH-vv.height>120){
      gap=Math.max(0,Math.round(layoutH-vv.height));
    }else if(nav){
      const r=nav.getBoundingClientRect();
      gap=Math.max(0,Math.round(layoutH-r.top));
    }
    document.documentElement.style.setProperty('--lvban-ai-bottom-nav-gap',gap+'px');
  }
  function run(){inject();position();}
  function bind(){
    run();
    window.addEventListener('resize',run,{passive:true});
    window.addEventListener('orientationchange',()=>setTimeout(run,150),{passive:true});
    if(window.visualViewport){window.visualViewport.addEventListener('resize',run,{passive:true});window.visualViewport.addEventListener('scroll',run,{passive:true})}
    const nav=document.querySelector('.bottom');
    if(nav&&window.ResizeObserver)new ResizeObserver(run).observe(nav);
    const ai=document.getElementById('ai');
    if(ai&&window.MutationObserver)new MutationObserver(run).observe(ai,{attributes:true,attributeFilter:['class'],subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
