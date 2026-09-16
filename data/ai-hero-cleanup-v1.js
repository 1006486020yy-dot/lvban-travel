/* 旅伴 AI · 删除首页冗余欢迎文案 V1 */
(function(){
  'use strict';
  if(window.__lvbanAiHeroCleanupV1)return;
  window.__lvbanAiHeroCleanupV1=true;

  function isAI(){return !!document.getElementById('ai')?.classList.contains('active')}
  function clean(){
    if(!isAI())return;
    const ai=document.getElementById('ai');
    if(!ai)return;
    const exact=['你的专属旅行规划助手','问我任何旅行问题，我来为你规划','行程、景点、美食、酒店……','行程、景点、美食、酒店......'];
    [...ai.querySelectorAll('*')].forEach(el=>{
      if(el.children.length) return;
      const t=String(el.textContent||'').trim();
      if(exact.some(x=>t===x)){
        const parent=el.parentElement;
        if(parent && parent!==ai && [...parent.children].every(c=>exact.some(x=>String(c.textContent||'').trim()===x) || !String(c.textContent||'').trim())){
          parent.remove();
        }else el.remove();
      }
    });
  }
  function boot(){clean();setTimeout(clean,100);setTimeout(clean,500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  const original=window.go;
  if(typeof original==='function'&&!window.__lvbanAiHeroGoWrapped){
    window.go=function(id){const r=original.apply(this,arguments);setTimeout(()=>{if(id==='ai')clean()},80);return r};
    window.__lvbanAiHeroGoWrapped=true;
  }
  new MutationObserver(()=>{if(isAI())clean()}).observe(document.body,{childList:true,subtree:true});
})();
