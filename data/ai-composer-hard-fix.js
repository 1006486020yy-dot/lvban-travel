/* 旅伴 AI · 可拖动悬浮输入组件，仅处理 composer 位置与拖动 */
(function(){
  'use strict';
  if(window.__lvbanAiComposerDraggable)return;
  window.__lvbanAiComposerDraggable=true;

  const STYLE_ID='lvban-ai-composer-draggable-style';
  const POS_KEY='lvban-ai-composer-position-v1';

  function inject(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      #ai .composer.lv-ai-draggable{
        position:fixed!important;
        z-index:110!important;
        margin:0!important;
        transform:none!important;
        top:auto!important;
        right:auto!important;
        bottom:auto!important;
        touch-action:none!important;
        user-select:none!important;
      }
      #ai .composer.lv-ai-draggable .lv-ai-drag-handle{
        position:absolute!important;
        top:3px!important;
        left:50%!important;
        width:54px!important;
        height:7px!important;
        transform:translateX(-50%)!important;
        border-radius:99px!important;
        background:#d8d5e3!important;
        cursor:grab!important;
        z-index:3!important;
        touch-action:none!important;
      }
      #ai .composer.lv-ai-draggable .lv-ai-drag-handle:active{cursor:grabbing!important;background:#bcb8cc!important}
      #ai .composer.lv-ai-draggable.dragging{box-shadow:0 18px 42px rgba(64,58,138,.22)!important}
      #ai .composer.lv-ai-draggable textarea,
      #ai .composer.lv-ai-draggable button{user-select:text!important;touch-action:auto!important}
      @media(max-width:760px){
        #ai .composer.lv-ai-draggable{width:calc(100% - 24px)!important;max-width:680px!important;left:auto!important;right:auto!important}
      }
    `;
    document.head.appendChild(s);
  }

  function getNavGap(){
    const nav=document.querySelector('.bottom');
    if(!nav)return 76;
    const r=nav.getBoundingClientRect();
    return Math.max(8,Math.round(window.innerHeight-r.top));
  }

  function readSaved(){
    try{
      const raw=localStorage.getItem(POS_KEY);
      if(!raw)return null;
      const p=JSON.parse(raw);
      if(Number.isFinite(p.left)&&Number.isFinite(p.top))return p;
    }catch(e){}
    return null;
  }

  function savePosition(el){
    try{
      const r=el.getBoundingClientRect();
      localStorage.setItem(POS_KEY,JSON.stringify({left:Math.round(r.left),top:Math.round(r.top)}));
    }catch(e){}
  }

  function clampPosition(el,left,top){
    const w=el.offsetWidth||320;
    const h=el.offsetHeight||56;
    const margin=8;
    return {
      left:Math.max(margin,Math.min(left,window.innerWidth-w-margin)),
      top:Math.max(margin,Math.min(top,window.innerHeight-h-margin))
    };
  }

  function setPosition(el,left,top,persist){
    const p=clampPosition(el,left,top);
    el.style.setProperty('left',p.left+'px','important');
    el.style.setProperty('top',p.top+'px','important');
    el.style.setProperty('right','auto','important');
    el.style.setProperty('bottom','auto','important');
    el.style.setProperty('transform','none','important');
    if(persist)savePosition(el);
  }

  function initialPosition(el){
    const saved=readSaved();
    if(saved){
      setPosition(el,saved.left,saved.top,false);
      return;
    }
    const w=el.offsetWidth||Math.min(680,window.innerWidth-24);
    const h=el.offsetHeight||60;
    const gap=getNavGap();
    const left=(window.innerWidth-w)/2;
    const top=window.innerHeight-gap-h-10;
    setPosition(el,left,top,false);
  }

  function makeDraggable(el){
    if(el.dataset.lvbanDraggable==='1')return;
    el.dataset.lvbanDraggable='1';
    el.classList.add('lv-ai-draggable');

    const handle=document.createElement('div');
    handle.className='lv-ai-drag-handle';
    handle.setAttribute('aria-label','拖动 AI 输入框');
    handle.title='拖动 AI 输入框';
    el.insertBefore(handle,el.firstChild);

    requestAnimationFrame(()=>initialPosition(el));

    let dragging=false;
    let pointerId=null;
    let startX=0,startY=0,startLeft=0,startTop=0;

    function down(e){
      if(e.button!==undefined&&e.button!==0)return;
      const r=el.getBoundingClientRect();
      dragging=true;
      pointerId=e.pointerId;
      startX=e.clientX;
      startY=e.clientY;
      startLeft=r.left;
      startTop=r.top;
      el.classList.add('dragging');
      try{handle.setPointerCapture(pointerId)}catch(err){}
      e.preventDefault();
      e.stopPropagation();
    }
    function move(e){
      if(!dragging||e.pointerId!==pointerId)return;
      setPosition(el,startLeft+(e.clientX-startX),startTop+(e.clientY-startY),false);
      e.preventDefault();
    }
    function up(e){
      if(!dragging||e.pointerId!==pointerId)return;
      dragging=false;
      el.classList.remove('dragging');
      savePosition(el);
      try{handle.releasePointerCapture(pointerId)}catch(err){}
      pointerId=null;
      e.preventDefault();
    }

    handle.addEventListener('pointerdown',down,{passive:false});
    handle.addEventListener('pointermove',move,{passive:false});
    handle.addEventListener('pointerup',up,{passive:false});
    handle.addEventListener('pointercancel',up,{passive:false});

    window.addEventListener('resize',()=>{
      const r=el.getBoundingClientRect();
      setPosition(el,r.left,r.top,false);
    },{passive:true});
  }

  function run(){
    inject();
    const composer=document.querySelector('#ai .composer');
    if(!composer)return;
    makeDraggable(composer);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',run,{once:true});
  }else run();

  const observer=new MutationObserver(()=>{
    const composer=document.querySelector('#ai .composer');
    if(composer&&!composer.dataset.lvbanDraggable)run();
  });
  observer.observe(document.body,{childList:true,subtree:true});
})();
