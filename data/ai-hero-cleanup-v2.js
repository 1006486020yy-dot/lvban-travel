/* 旅伴 AI · 强制移除冗余欢迎 Hero V2 */
(function(){
  'use strict';
  if(window.__lvbanAiHeroCleanupV2)return;
  window.__lvbanAiHeroCleanupV2=true;
  const STYLE_ID='lvban-ai-hero-cleanup-v2-style';
  function inject(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      /* ai-ui-mockup-match-v2 创建的欢迎区整体隐藏，避免脚本重新生成后再次出现 */
      #lvban-ai-welcome-v2{display:none!important;width:0!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important}
      #lvban-ai-welcome-v2 *{display:none!important}
    `;
    document.head.appendChild(s);
  }
  function clean(){
    inject();
    const ai=document.getElementById('ai');
    if(!ai||!ai.classList.contains('active'))return;
    const box=document.getElementById('lvban-ai-welcome-v2');
    if(box)box.remove();
  }
  function bindGo(){
    if(window.__lvbanAiHeroCleanupGoV2)return;
    const original=window.go;
    if(typeof original!=='function')return;
    window.go=function(id){
      const result=original.apply(this,arguments);
      setTimeout(clean,0);setTimeout(clean,80);setTimeout(clean,300);
      return result;
    };
    window.__lvbanAiHeroCleanupGoV2=true;
  }
  function boot(){inject();bindGo();clean();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  new MutationObserver(()=>{inject();clean()}).observe(document.body,{childList:true,subtree:true});
})();
