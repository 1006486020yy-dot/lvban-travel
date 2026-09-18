/* 旅伴 AI · Layout Correction V5
 * 快速问永远独立于输入框；移除 AI 页面额外悬浮返回首页小图标。
 */
(function(){
  'use strict';
  if(window.__lvbanAiLayoutCorrectionV5)return;
  window.__lvbanAiLayoutCorrectionV5=true;
  const STYLE_ID='lvban-ai-layout-correction-v5-style';
  const ROOT_ID='lvban-ai-quick-prompts-v1';
  const FAB_ID='lvban-ai-nav-fab-v2';
  const css=`
    #${FAB_ID},body.lvban-ai-mode #${FAB_ID}{display:none!important;visibility:hidden!important;pointer-events:none!important}
    body.lvban-ai-mode #${ROOT_ID}{position:fixed!important;left:50%!important;right:auto!important;top:auto!important;bottom:calc(var(--lvban-ai-composer-space,118px) + 12px)!important;transform:translateX(-50%)!important;width:min(760px,calc(100% - 32px))!important;display:flex!important;flex-direction:row!important;justify-content:flex-end!important;align-items:center!important;gap:8px!important;padding:0!important;margin:0!important;z-index:124!important;pointer-events:none!important;box-sizing:border-box!important}
    body.lvban-ai-mode #${ROOT_ID}.lv-ai-quick-hidden{display:none!important;opacity:0!important;visibility:hidden!important}
    body.lvban-ai-mode #${ROOT_ID} button{pointer-events:auto!important;flex:0 0 auto!important;height:40px!important;min-height:40px!important;padding:0 14px!important;border-radius:20px!important;border:1px solid #d7e5f6!important;background:rgba(255,255,255,.97)!important;color:#3971b7!important;font-size:13px!important;line-height:40px!important;white-space:nowrap!important;box-shadow:0 6px 18px rgba(40,83,135,.08)!important;backdrop-filter:blur(18px)!important;box-sizing:border-box!important}
    @media(max-width:760px){body.lvban-ai-mode #${ROOT_ID}{width:calc(100% - 24px)!important;justify-content:flex-start!important;overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:none!important;padding:0 2px!important}body.lvban-ai-mode #${ROOT_ID}::-webkit-scrollbar{display:none!important}body.lvban-ai-mode #${ROOT_ID} button{height:36px!important;min-height:36px!important;line-height:36px!important;padding:0 12px!important;font-size:12px!important;border-radius:18px!important}}
  `;
  function inject(){if(document.getElementById(STYLE_ID))return;const s=document.createElement('style');s.id=STYLE_ID;s.textContent=css;document.head.appendChild(s)}
  function active(){return !!document.getElementById('ai')?.classList.contains('active')}
  function composer(){return document.querySelector('.lv-ai-composer-portal-v6 .composer')||document.querySelector('#ai .composer')||document.querySelector('.composer')}
  function position(){if(!active())return;const root=document.getElementById(ROOT_ID),c=composer();if(!root||!c)return;const r=c.getBoundingClientRect(),vh=window.visualViewport?window.visualViewport.height:window.innerHeight;root.style.setProperty('--lvban-ai-composer-space',Math.max(76,Math.round(vh-r.top+12))+'px')}
  function hide(el){el.style.setProperty('display','none','important');el.setAttribute('data-lvban-ai-hide-home','1')}
  function isBlueHouseCandidate(el){
    if(el.closest('.bottom'))return false;
    const r=el.getBoundingClientRect();if(r.width<=0||r.height<=0||r.width>90||r.height>90)return false;
    const cs=getComputedStyle(el),bg=cs.backgroundColor||'',hasSvg=!!el.querySelector('svg');
    const label=[el.getAttribute('aria-label'),el.getAttribute('title'),el.textContent].filter(Boolean).join(' ').replace(/\s+/g,'').trim();
    const blue=/rgb\(\s*(?:0|1|2|3\d|4\d|5\d)\s*,\s*(?:80|9\d|1\d\d|2\d\d)\s*,\s*(?:180|19\d|2\d\d|3\d\d)\s*\)/i.test(bg)||/#(?:1677ff|2196f3|1478ff)/i.test(bg);
    const fixed=cs.position==='fixed'||cs.position==='absolute';
    const homeText=/(返回首页|回到首页|返回主页|回到主页|home|首页|主页)/i.test(label);
    return fixed&&hasSvg&&(homeText||blue);
  }
  function removeFloatingHome(){
    if(!active())return;
    document.querySelectorAll('#ai button,#ai a,#ai [role="button"],body>button,body>a,body>[role="button"]').forEach(el=>{if(isBlueHouseCandidate(el))hide(el)});
    document.querySelectorAll('[data-lvban-ai-hide-home]').forEach(el=>el.style.setProperty('display','none','important'));
  }
  function sync(){position();removeFloatingHome()}
  function boot(){inject();setTimeout(sync,80);setTimeout(sync,300);setTimeout(sync,800)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.addEventListener('resize',sync,{passive:true});
  if(window.visualViewport){visualViewport.addEventListener('resize',sync,{passive:true});visualViewport.addEventListener('scroll',sync,{passive:true})}
  new MutationObserver(()=>{if(active())sync()}).observe(document.body,{childList:true,subtree:true});
  setInterval(()=>{if(active())sync()},700);
})();
