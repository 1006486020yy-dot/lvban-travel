/* 旅伴 AI · 对话框 UI 最终修复层 */
(function(){
  'use strict';
  const css=`
    #ai .panel.chat{min-height:0!important;height:auto!important;padding:0!important;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;display:flex!important;flex-direction:column!important;overflow:visible!important}
    #ai .messages{flex:1 1 auto!important;min-height:0!important;height:auto!important;overflow-y:auto!important;padding:4px 6px 18px!important;gap:14px!important}
    #ai .messages .msg{flex:0 0 auto!important;max-width:min(78%,680px)!important;width:max-content!important;min-height:0!important;padding:12px 16px!important;border-radius:18px!important;line-height:1.65!important;box-shadow:0 4px 14px rgba(64,58,138,.05)!important}
    #ai .messages .msg.ai{align-self:flex-start!important;background:#fff!important;border:1px solid #ece9f6!important;color:#29283a!important}
    #ai .messages .msg.user{align-self:flex-end!important;background:#6958f5!important;border:1px solid #6958f5!important;color:#fff!important}
    #ai .composer{flex:0 0 auto!important;width:100%!important;min-height:60px!important;margin:8px 0 0!important;padding:6px 7px 6px 16px!important;display:flex!important;align-items:center!important;gap:8px!important;background:#fff!important;border:1px solid #dedbea!important;border-radius:22px!important;box-shadow:0 8px 24px rgba(64,58,138,.09)!important}
    #ai .composer textarea{min-height:42px!important;max-height:120px!important;height:42px!important;line-height:1.5!important;padding:10px 2px!important;background:transparent!important;color:#252433!important}
    #ai .composer textarea::placeholder{color:#a2a0ad!important}
    #ai .composer .btn{flex:0 0 48px!important;width:48px!important;height:48px!important;padding:0!important;border-radius:16px!important;display:grid!important;place-items:center!important;font-size:14px!important;font-weight:800!important}
    @media(max-width:760px){
      #ai .panel.chat{min-height:0!important;height:auto!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;overflow:visible!important}
      #ai .messages{min-height:0!important;height:auto!important;overflow:visible!important;padding:4px 6px calc(var(--lv-ai-bottom-space,140px) + 64px)!important}
      #ai .messages .msg{max-width:88%!important}
      #ai .composer{position:fixed!important;left:12px!important;right:12px!important;bottom:var(--lv-ai-bottom-space,140px)!important;z-index:45!important;width:auto!important;min-height:56px!important;margin:0!important;border-radius:20px!important;padding:6px 7px 6px 14px!important;box-shadow:0 10px 30px rgba(64,58,138,.14)!important}
      #ai .composer textarea{height:42px!important;min-height:42px!important}
      #ai .composer .btn{flex-basis:44px!important;width:44px!important;height:44px!important;border-radius:14px!important}
    }
  `;
  function updateBottomSpace(){
    const nav=document.querySelector('.bottom');
    if(!nav)return;
    const rect=nav.getBoundingClientRect();
    const gap=4;
    const viewportH=window.visualViewport?window.visualViewport.height:window.innerHeight;
    const navTop=Math.min(rect.top,viewportH);
    const space=Math.max(60,Math.round(viewportH-navTop+gap));
    document.documentElement.style.setProperty('--lv-ai-bottom-space',space+'px');
  }
  function apply(){
    if(!document.getElementById('lvban-ai-chat-final-style')){
      const st=document.createElement('style');st.id='lvban-ai-chat-final-style';st.textContent=css;document.head.appendChild(st);
    }
    updateBottomSpace();
    window.addEventListener('resize',updateBottomSpace,{passive:true});
    window.addEventListener('orientationchange',()=>setTimeout(updateBottomSpace,80),{passive:true});
    if(window.visualViewport)window.visualViewport.addEventListener('resize',updateBottomSpace,{passive:true});
    const nav=document.querySelector('.bottom');
    if(window.ResizeObserver&&nav)new ResizeObserver(updateBottomSpace).observe(nav);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
  window.addEventListener('load',apply,{once:true});
})();
