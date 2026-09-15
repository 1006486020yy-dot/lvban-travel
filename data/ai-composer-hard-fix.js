/* 旅伴 AI · 独立悬浮输入框：仅处理 AI composer 的位置、拖动与键盘适配 */
(function(){
  'use strict';
  if(window.__lvbanAiComposerPortalV4)return;
  window.__lvbanAiComposerPortalV4=true;

  const STYLE_ID='lvban-ai-composer-portal-style-v4';
  const POS_KEY='lvban-ai-composer-position-v4';
  const PORTAL_ID='lvban-ai-composer-portal-v4';

  function css(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;
    s.textContent=`
      .lv-ai-composer-portal-v4{
        position:fixed!important;z-index:120!important;left:0;top:0;
        width:min(680px,calc(100vw - 24px));margin:0!important;padding:0!important;
        transform:none!important;pointer-events:none!important;
      }
      .lv-ai-composer-portal-v4 .composer{
        position:relative!important;display:flex!important;gap:8px!important;
        width:100%!important;margin:0!important;padding:7px!important;
        background:#fff!important;border-radius:20px!important;
        border:1px solid rgba(232,230,244,.9)!important;
        box-shadow:0 16px 42px rgba(64,58,138,.16)!important;
        backdrop-filter:blur(20px)!important;
        pointer-events:auto!important;transform:none!important;
        box-sizing:border-box!important;min-height:56px!important;
      }
      .lv-ai-composer-portal-v4 .composer textarea{
        flex:1 1 auto!important;min-width:0!important;width:auto!important;
        border:0!important;outline:0!important;resize:none!important;
        padding:9px!important;background:transparent!important;
        user-select:text!important;touch-action:auto!important;
      }
      .lv-ai-composer-portal-v4 .composer button{
        flex:0 0 auto!important;align-self:stretch!important;
        user-select:none!important;touch-action:auto!important;
      }
      .lv-ai-composer-portal-v4 .lv-ai-drag-handle{
        position:absolute!important;top:3px!important;left:50%!important;
        width:72px!important;height:9px!important;transform:translateX(-50%)!important;
        border-radius:99px!important;background:#d8d5e3!important;
        cursor:grab!important;z-index:5!important;touch-action:none!important;
      }
      .lv-ai-composer-portal-v4.dragging .composer{box-shadow:0 20px 48px rgba(64,58,138,.24)!important}
      .lv-ai-composer-portal-v4.dragging .lv-ai-drag-handle{cursor:grabbing!important;background:#bcb8cc!important}
      @media(max-width:760px){
        .lv-ai-composer-portal-v4{width:calc(100vw - 24px)!important;max-width:680px!important}
      }
    `;
    document.head.appendChild(s);
  }

  function readPos(){try{const p=JSON.parse(localStorage.getItem(POS_KEY)||'null');if(p&&Number.isFinite(p.left)&&Number.isFinite(p.top))return p}catch(e){}return null}
  function writePos(el){try{const r=el.getBoundingClientRect();localStorage.setItem(POS_KEY,JSON.stringify({left:Math.round(r.left),top:Math.round(r.top)}))}catch(e){}}

  function navTop(){
    const nav=document.querySelector('.bottom');
    if(nav){const r=nav.getBoundingClientRect();if(r.height>0)return r.top}
    return window.innerHeight-86;
  }
  function clamp(el,left,top){
    const w=el.offsetWidth||320,h=el.offsetHeight||56,m=8;
    let maxTop=window.innerHeight-h-m;
    const nt=navTop();
    if(Number.isFinite(nt))maxTop=Math.min(maxTop,nt-h-14);
    if(maxTop<m)maxTop=m;
    return {
      left:Math.max(m,Math.min(Math.round(left),Math.max(m,window.innerWidth-w-m))),
      top:Math.max(m,Math.min(Math.round(top),maxTop))
    };
  }
  function place(el,left,top,save){
    const p=clamp(el,left,top);
    el.style.setProperty('left',p.left+'px','important');
    el.style.setProperty('top',p.top+'px','important');
    el.style.setProperty('right','auto','important');
    el.style.setProperty('bottom','auto','important');
    el.style.setProperty('transform','none','important');
    if(save)writePos(el);
  }
  function initial(el){
    const p=readPos();
    if(p){place(el,p.left,p.top,false);return}
    const h=el.offsetHeight||56;
    place(el,(window.innerWidth-(el.offsetWidth||320))/2,navTop()-h-14,false);
  }

  function portalize(){
    const ai=document.getElementById('ai');
    if(!ai)return null;
    let composer=ai.querySelector('.composer');
    let portal=document.getElementById(PORTAL_ID);
    if(!composer&&portal)composer=portal.querySelector('.composer');
    if(!composer)return portal;
    if(!portal){
      portal=document.createElement('div');portal.id=PORTAL_ID;portal.className='lv-ai-composer-portal-v4';
      document.body.appendChild(portal);
    }
    if(composer.parentElement!==portal)portal.appendChild(composer);
    let handle=portal.querySelector('.lv-ai-drag-handle');
    if(!handle){handle=document.createElement('div');handle.className='lv-ai-drag-handle';handle.title='拖动 AI 输入框';handle.setAttribute('aria-label','拖动 AI 输入框');portal.insertBefore(handle,composer)}
    if(!portal.dataset.positioned){
      requestAnimationFrame(()=>{if(portal.offsetWidth>20){initial(portal);portal.dataset.positioned='1'}});
      setTimeout(()=>{if(portal.offsetWidth>20&&!portal.dataset.positioned){initial(portal);portal.dataset.positioned='1'}},120);
    }
    bindDrag(portal,handle);
    return portal;
  }

  function bindDrag(portal,handle){
    if(portal.dataset.dragBound==='4')return;
    portal.dataset.dragBound='4';
    let active=false,id=null,sx=0,sy=0,sl=0,st=0;
    const down=e=>{
      if(e.pointerType==='mouse'&&e.button!==0)return;
      if(e.target.closest('textarea,button'))return;
      const r=portal.getBoundingClientRect();
      active=true;id=e.pointerId;sx=e.clientX;sy=e.clientY;sl=r.left;st=r.top;
      portal.classList.add('dragging');
      try{handle.setPointerCapture(id)}catch(_){try{portal.setPointerCapture(id)}catch(__){}}
      e.preventDefault();e.stopPropagation();
    };
    const move=e=>{
      if(!active||e.pointerId!==id)return;
      place(portal,sl+e.clientX-sx,st+e.clientY-sy,false);
      e.preventDefault();e.stopPropagation();
    };
    const up=e=>{
      if(!active||e.pointerId!==id)return;
      active=false;portal.classList.remove('dragging');writePos(portal);
      try{handle.releasePointerCapture(id)}catch(_){try{portal.releasePointerCapture(id)}catch(__){}}
      id=null;e.preventDefault();e.stopPropagation();
    };
    handle.addEventListener('pointerdown',down,{passive:false});
    handle.addEventListener('pointermove',move,{passive:false});
    handle.addEventListener('pointerup',up,{passive:false});
    handle.addEventListener('pointercancel',up,{passive:false});
  }

  function keepInViewport(){
    const p=document.getElementById(PORTAL_ID);if(!p||p.offsetWidth<20)return;
    const r=p.getBoundingClientRect();place(p,r.left,r.top,false);
  }

  function run(){css();portalize()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  new MutationObserver(run).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target.closest('[onclick*="go(\'ai\'"]')||e.target.closest('[data-page="ai"]'))setTimeout(run,80)},{passive:true});
  window.addEventListener('resize',keepInViewport,{passive:true});
  if(window.visualViewport)window.visualViewport.addEventListener('resize',()=>{const p=document.getElementById(PORTAL_ID);if(p&&!p.classList.contains('dragging')){const saved=readPos();if(saved)place(p,saved.left,saved.top,false);else keepInViewport()}},{passive:true});
})();
