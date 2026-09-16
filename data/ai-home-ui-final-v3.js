/* 旅伴 AI · Home UI Final V3.1
 * 固定四卡彻底移除；快速问独立于输入框，只在新聊天/未输入时显示。
 */
(function(){
  'use strict';
  if(window.__lvbanAiHomeUiFinalV31)return;
  window.__lvbanAiHomeUiFinalV31=true;
  const STYLE_ID='lvban-ai-home-ui-final-v31-style';
  const ROOT_ID='lvban-ai-quick-prompts-v1';
  const css=`
    body.lvban-ai-mode #ai .lv-ai-fixed-home-actions,
    body.lvban-ai-mode #ai .lv-ai-old-home-actions,
    body.lvban-ai-mode #ai .card.tile,
    body.lvban-ai-mode #ai .tile{display:none!important}
    body.lvban-ai-mode .bottom{display:grid!important;position:fixed!important;left:50%!important;bottom:8px!important;transform:translateX(-50%)!important;z-index:118!important;width:min(620px,calc(100% - 24px))!important;grid-template-columns:repeat(5,1fr)!important;gap:3px!important;padding:6px!important;background:rgba(255,255,255,.94)!important;border:1px solid #e2ebf6!important;border-radius:22px!important;box-shadow:0 12px 36px rgba(35,72,119,.14)!important;backdrop-filter:blur(24px)!important}
    body.lvban-ai-mode .bottom button{min-height:46px!important;border:0!important;border-radius:16px!important;background:transparent!important;color:#7d8ca2!important;font-size:11px!important;font-weight:700!important}
    body.lvban-ai-mode .bottom button.on,body.lvban-ai-mode .bottom button:last-child{color:#1677ff!important;background:#edf5ff!important}
    body.lvban-ai-mode .bottom button:first-child{color:#1677ff!important}
    /* 快速问是独立区域，不属于 composer */
    body.lvban-ai-mode #${ROOT_ID}{position:fixed!important;left:50%!important;bottom:105px!important;transform:translateX(-50%)!important;width:min(760px,calc(100% - 32px))!important;display:flex!important;justify-content:flex-end!important;gap:8px!important;z-index:125!important;pointer-events:none!important;box-sizing:border-box!important}
    body.lvban-ai-mode #${ROOT_ID}.lv-ai-quick-hidden{opacity:0!important;visibility:hidden!important;transform:translate(-50%,8px)!important;pointer-events:none!important}
    body.lvban-ai-mode #${ROOT_ID} button{pointer-events:auto!important;border:1px solid #d4e3f5!important;background:#fff!important;color:#3971b7!important;border-radius:18px!important;padding:8px 14px!important;font-size:12px!important;line-height:18px!important;white-space:nowrap!important;box-shadow:0 6px 18px rgba(40,83,135,.08)!important;backdrop-filter:blur(18px)!important;cursor:pointer!important}
    @media(max-width:760px){
      body.lvban-ai-mode .bottom{bottom:6px!important;width:calc(100% - 16px)!important;border-radius:20px!important}
      body.lvban-ai-mode .bottom button{min-height:44px!important}
      body.lvban-ai-mode #${ROOT_ID}{bottom:106px!important;width:calc(100% - 24px)!important;justify-content:flex-start!important;overflow-x:auto!important;padding:0 2px 2px!important;scrollbar-width:none!important}
      body.lvban-ai-mode #${ROOT_ID}::-webkit-scrollbar{display:none}
      body.lvban-ai-mode #${ROOT_ID} button{font-size:12px!important;padding:7px 11px!important;border-radius:16px!important}
    }
  `;
  function inject(){if(document.getElementById(STYLE_ID))return;const s=document.createElement('style');s.id=STYLE_ID;s.textContent=css;document.head.appendChild(s)}
  function hideLegacyCards(){
    const ai=document.getElementById('ai');if(!ai)return;
    const terms=['行程规划','景点推荐','美食推荐','旅行问答'];
    const candidates=[...ai.querySelectorAll('*')].filter(el=>{
      const buttons=[...el.querySelectorAll('button')];
      if(buttons.length<4)return false;
      const texts=buttons.map(b=>String(b.textContent||'').replace(/\\s+/g,''));
      return terms.every(term=>texts.some(t=>t.includes(term)));
    });
    if(candidates.length){candidates.sort((a,b)=>a.querySelectorAll('button').length-b.querySelectorAll('button').length);candidates[0].classList.add('lv-ai-fixed-home-actions')}
    const oldButtons=[...ai.querySelectorAll('button')].filter(b=>terms.some(term=>String(b.textContent||'').replace(/\\s+/g,'').includes(term)));
    if(oldButtons.length>=4){
      oldButtons.forEach(b=>b.classList.add('lv-ai-old-home-actions'));
      let a=oldButtons[0].parentElement;
      for(let i=0;i<6&&a&&a!==ai;i++,a=a.parentElement){
        const n=[...a.querySelectorAll('button')].filter(b=>terms.some(term=>String(b.textContent||'').replace(/\\s+/g,'').includes(term))).length;
        if(n>=4){a.classList.add('lv-ai-fixed-home-actions');break}
      }
    }
  }
  function bindNav(){
    const nav=document.querySelector('.bottom');if(!nav)return;
    [...nav.querySelectorAll('button')].forEach((b,i)=>{if(b.__lvbanAiHomeNav)return;b.__lvbanAiHomeNav=true;b.addEventListener('click',()=>{if(i===0&&typeof window.go==='function')setTimeout(()=>window.go('home'),0)},{capture:true})})
  }
  function sync(){if(!document.getElementById('ai')?.classList.contains('active'))return;hideLegacyCards();bindNav()}
  function bindGo(){if(window.__lvbanAiHomeGoWrappedV31)return;const original=window.go;if(typeof original!=='function')return;window.go=function(id){const r=original.apply(this,arguments);setTimeout(sync,80);return r};window.__lvbanAiHomeGoWrappedV31=true}
  function boot(){inject();bindGo();setTimeout(sync,120)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  new MutationObserver(()=>sync()).observe(document.body,{childList:true,subtree:true});
  setInterval(()=>{bindGo();sync()},900);
})();
