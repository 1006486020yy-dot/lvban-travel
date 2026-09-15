/* 旅伴 AI · 独立固定输入框：仅处理 AI composer 的显示、尺寸与位置 */
(function(){
  'use strict';
  if(window.__lvbanAiComposerFixedV5)return;
  window.__lvbanAiComposerFixedV5=true;

  const STYLE_ID='lvban-ai-composer-fixed-style-v5';
  const PORTAL_ID='lvban-ai-composer-portal-v5';

  function inject(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;
    s.textContent=`
      .lv-ai-composer-portal-v5{
        position:fixed!important;z-index:120!important;
        left:50%!important;right:auto!important;top:auto!important;
        bottom:86px!important;transform:translateX(-50%)!important;
        width:min(680px,calc(100vw - 24px))!important;
        margin:0!important;padding:0!important;
        display:none!important;pointer-events:none!important;
      }
      .lv-ai-composer-portal-v5.lv-ai-visible{display:block!important}
      .lv-ai-composer-portal-v5 .composer{
        position:relative!important;display:flex!important;gap:8px!important;
        width:100%!important;margin:0!important;padding:7px!important;
        min-height:56px!important;background:#fff!important;
        border:1px solid rgba(232,230,244,.9)!important;
        border-radius:20px!important;
        box-shadow:0 16px 42px rgba(64,58,138,.16)!important;
        box-sizing:border-box!important;pointer-events:auto!important;
        transform:none!important;backdrop-filter:blur(20px)!important;
      }
      .lv-ai-composer-portal-v5 .composer textarea{
        flex:1 1 auto!important;min-width:0!important;width:auto!important;
        border:0!important;outline:0!important;resize:none!important;
        padding:9px!important;background:transparent!important;
        user-select:text!important;touch-action:auto!important;
      }
      .lv-ai-composer-portal-v5 .composer button{
        flex:0 0 auto!important;align-self:stretch!important;
        user-select:none!important;touch-action:auto!important;
      }
      @media(max-width:760px){
        .lv-ai-composer-portal-v5{
          width:calc(100vw - 24px)!important;max-width:680px!important;
          bottom:82px!important;
        }
      }
    `;
    document.head.appendChild(s);
  }

  function isAI(){
    const ai=document.getElementById('ai');
    return !!(ai&&ai.classList.contains('active'));
  }

  function sync(){
    const ai=document.getElementById('ai');
    if(!ai)return;
    let composer=ai.querySelector('.composer');
    let portal=document.getElementById(PORTAL_ID);
    if(!composer&&portal)composer=portal.querySelector('.composer');
    if(!composer)return;
    if(!portal){
      portal=document.createElement('div');portal.id=PORTAL_ID;portal.className='lv-ai-composer-portal-v5';
      document.body.appendChild(portal);
    }
    if(composer.parentElement!==portal)portal.appendChild(composer);
    portal.classList.toggle('lv-ai-visible',isAI());
  }

  function run(){inject();sync()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  new MutationObserver(run).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('click',()=>setTimeout(run,50),{passive:true});
})();
