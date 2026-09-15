/* 旅伴 AI · 移动端 ChatGPT 式输入框：仅处理 AI composer 的显示、尺寸、键盘与位置 */
(function(){
  'use strict';
  if(window.__lvbanAiComposerFixedV6)return;
  window.__lvbanAiComposerFixedV6=true;

  const STYLE_ID='lvban-ai-composer-fixed-style-v6';
  const PORTAL_ID='lvban-ai-composer-portal-v6';
  const OLD_PORTALS='.lv-ai-composer-portal-v5,.lv-ai-composer-portal-v4,.lv-ai-composer-portal-v3,.lv-ai-composer-portal';
  let raf=0;
  let keyboardOpen=false;

  function inject(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;
    s.textContent=`
      .lv-ai-composer-portal-v6{
        position:fixed!important;z-index:120!important;
        left:50%!important;right:auto!important;top:auto!important;
        bottom:86px!important;transform:translateX(-50%)!important;
        width:min(680px,calc(100vw - 24px))!important;
        margin:0!important;padding:0!important;
        display:none!important;pointer-events:none!important;
        box-sizing:border-box!important;
        transition:none!important;
      }
      .lv-ai-composer-portal-v6.lv-ai-visible{display:block!important}
      .lv-ai-composer-portal-v6 .composer{
        position:relative!important;display:flex!important;gap:8px!important;
        width:100%!important;margin:0!important;padding:7px!important;
        min-height:56px!important;max-height:140px!important;
        background:#fff!important;border:1px solid rgba(232,230,244,.9)!important;
        border-radius:20px!important;
        box-shadow:0 16px 42px rgba(64,58,138,.16)!important;
        box-sizing:border-box!important;pointer-events:auto!important;
        transform:none!important;backdrop-filter:blur(20px)!important;
      }
      .lv-ai-composer-portal-v6 .composer textarea{
        flex:1 1 auto!important;min-width:0!important;width:auto!important;
        min-height:40px!important;max-height:110px!important;
        border:0!important;outline:0!important;resize:none!important;
        padding:9px!important;background:transparent!important;
        user-select:text!important;-webkit-user-select:text!important;
        touch-action:auto!important;overflow-y:auto!important;
        -webkit-appearance:none!important;
      }
      .lv-ai-composer-portal-v6 .composer button{
        flex:0 0 auto!important;align-self:stretch!important;
        user-select:none!important;touch-action:manipulation!important;
      }
      @media(max-width:760px){
        .lv-ai-composer-portal-v6{
          width:calc(100vw - 24px)!important;max-width:680px!important;
          bottom:82px!important;
        }
        .lv-ai-composer-portal-v6.lv-ai-keyboard{
          bottom:calc(var(--lv-ai-keyboard-offset,0px) + 10px)!important;
        }
      }
      @supports(padding:max(0px)){
        .lv-ai-composer-portal-v6{padding-bottom:env(safe-area-inset-bottom)!important}
      }
    `;
    document.head.appendChild(s);
  }

  function aiActive(){
    const ai=document.getElementById('ai');
    return !!(ai&&ai.classList.contains('active'));
  }

  function findComposer(ai,portal){
    return ai?.querySelector('.composer') || portal?.querySelector('.composer') || document.querySelector('.composer');
  }

  function cleanupOldPortals(){
    document.querySelectorAll(OLD_PORTALS).forEach(old=>{
      if(old.id===PORTAL_ID)return;
      const composer=old.querySelector('.composer');
      if(composer && !document.getElementById(PORTAL_ID)){
        let portal=document.createElement('div');
        portal.id=PORTAL_ID;portal.className='lv-ai-composer-portal-v6';
        document.body.appendChild(portal);portal.appendChild(composer);
      }
      if(old.parentNode)old.parentNode.removeChild(old);
    });
  }

  function sync(){
    const ai=document.getElementById('ai');
    if(!ai)return;
    let portal=document.getElementById(PORTAL_ID);
    cleanupOldPortals();
    portal=document.getElementById(PORTAL_ID)||portal;
    let composer=findComposer(ai,portal);
    if(!composer)return;
    if(!portal){
      portal=document.createElement('div');
      portal.id=PORTAL_ID;portal.className='lv-ai-composer-portal-v6';
      document.body.appendChild(portal);
    }
    if(composer.parentElement!==portal)portal.appendChild(composer);
    portal.classList.toggle('lv-ai-visible',aiActive());
    portal.classList.toggle('lv-ai-keyboard',keyboardOpen&&aiActive());
  }

  function updateKeyboardPosition(){
    const portal=document.getElementById(PORTAL_ID);
    if(!portal)return;
    const vv=window.visualViewport;
    if(!vv){keyboardOpen=false;portal.style.setProperty('--lv-ai-keyboard-offset','0px');portal.classList.remove('lv-ai-keyboard');return;}
    const viewportBottom=vv.height+vv.offsetTop;
    const layoutHeight=document.documentElement.clientHeight||window.innerHeight;
    const keyboardGap=Math.max(0,layoutHeight-viewportBottom);
    keyboardOpen=keyboardGap>120;
    portal.style.setProperty('--lv-ai-keyboard-offset',Math.round(keyboardGap)+'px');
    portal.classList.toggle('lv-ai-keyboard',keyboardOpen&&aiActive());
  }

  function schedulePosition(){
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>{updateKeyboardPosition();sync()});
  }

  function focusHandler(){
    setTimeout(schedulePosition,60);
    setTimeout(schedulePosition,220);
    setTimeout(schedulePosition,500);
  }

  function run(){inject();sync();updateKeyboardPosition()}

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  if(window.visualViewport){
    visualViewport.addEventListener('resize',schedulePosition,{passive:true});
    visualViewport.addEventListener('scroll',schedulePosition,{passive:true});
  }
  window.addEventListener('resize',schedulePosition,{passive:true});
  document.addEventListener('focusin',e=>{if(e.target&&e.target.id==='aiInput')focusHandler()},{passive:true});
  document.addEventListener('focusout',e=>{if(e.target&&e.target.id==='aiInput')setTimeout(schedulePosition,120)},{passive:true});
  document.addEventListener('click',()=>setTimeout(schedulePosition,50),{passive:true});
  new MutationObserver(()=>schedulePosition()).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
})();
