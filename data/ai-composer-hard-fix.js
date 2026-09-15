/* 旅伴 AI · 可拖动悬浮输入组件，仅处理 composer 位置与拖动 */
(function(){
  'use strict';
  if(window.__lvbanAiComposerDraggableV3)return;
  window.__lvbanAiComposerDraggableV3=true;

  const STYLE_ID='lvban-ai-composer-draggable-style-v3';
  const POS_KEY='lvban-ai-composer-position-v3';

  function inject(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style'); s.id=STYLE_ID;
    s.textContent=`
      #ai .composer.lv-ai-draggable{
        position:fixed!important; z-index:110!important; margin:0!important;
        transform:none!important; right:auto!important; bottom:auto!important;
        touch-action:none!important; user-select:none!important;
      }
      #ai .composer.lv-ai-draggable .lv-ai-drag-handle{
        position:absolute!important; top:3px!important; left:50%!important;
        width:72px!important; height:10px!important; transform:translateX(-50%)!important;
        border-radius:99px!important; background:#d8d5e3!important; cursor:grab!important;
        z-index:3!important; touch-action:none!important;
      }
      #ai .composer.lv-ai-draggable .lv-ai-drag-handle:active{cursor:grabbing!important;background:#bcb8cc!important}
      #ai .composer.lv-ai-draggable.dragging{box-shadow:0 18px 42px rgba(64,58,138,.22)!important;cursor:grabbing!important}
      #ai .composer.lv-ai-draggable textarea,#ai .composer.lv-ai-draggable button{user-select:text!important;touch-action:auto!important}
      @media(max-width:760px){#ai .composer.lv-ai-draggable{width:calc(100% - 24px)!important;max-width:680px!important}}
    `;
    document.head.appendChild(s);
  }

  function saved(){
    try{const p=JSON.parse(localStorage.getItem(POS_KEY)||'null');
      if(p&&Number.isFinite(p.left)&&Number.isFinite(p.top))return p;
    }catch(e){} return null;
  }
  function save(el){
    try{const r=el.getBoundingClientRect();localStorage.setItem(POS_KEY,JSON.stringify({left:Math.round(r.left),top:Math.round(r.top)}));}catch(e){}
  }

  function clamp(el,left,top){
    const w=el.offsetWidth||320,h=el.offsetHeight||60,m=8;
    const nav=document.querySelector('.bottom');
    let maxTop=window.innerHeight-h-m;
    if(nav){
      const nr=nav.getBoundingClientRect();
      if(nr.height>0) maxTop=Math.min(maxTop,Math.round(nr.top-h-14));
    }
    if(maxTop<m)maxTop=m;
    return {left:Math.max(m,Math.min(Math.round(left),Math.max(m,window.innerWidth-w-m))),top:Math.max(m,Math.min(Math.round(top),maxTop))};
  }
  function setPos(el,left,top,persist){
    const p=clamp(el,left,top);
    el.style.setProperty('left',p.left+'px','important');
    el.style.setProperty('top',p.top+'px','important');
    el.style.setProperty('right','auto','important');
    el.style.setProperty('bottom','auto','important');
    el.style.setProperty('transform','none','important');
    if(persist)save(el);
  }

  function initial(el){
    const r=el.getBoundingClientRect();
    if(r.width<20 || r.height<20)return false;
    const p=saved();
    if(p){setPos(el,p.left,p.top,false);return true;}
    const nav=document.querySelector('.bottom');
    const nr=nav&&nav.getBoundingClientRect();
    const h=r.height||56;
    const navTop=nr&&nr.height>0?nr.top:window.innerHeight-76;
    setPos(el,(window.innerWidth-r.width)/2,navTop-h-14,false);
    return true;
  }

  function drag(el){
    if(el.dataset.lvbanDraggable==='3')return;
    el.dataset.lvbanDraggable='3';el.classList.add('lv-ai-draggable');
    let handle=el.querySelector('.lv-ai-drag-handle');
    if(!handle){handle=document.createElement('div');handle.className='lv-ai-drag-handle';handle.title='拖动 AI 输入框';handle.setAttribute('aria-label','拖动 AI 输入框');el.insertBefore(handle,el.firstChild)}

    const position=()=>{
      if(el.offsetWidth<20 || el.offsetHeight<20)return;
      if(!el.dataset.lvbanPositioned){
        if(initial(el))el.dataset.lvbanPositioned='1';
      }else{
        const r=el.getBoundingClientRect();setPos(el,r.left,r.top,false);
      }
    };
    requestAnimationFrame(position);
    setTimeout(position,80);setTimeout(position,300);setTimeout(position,800);

    let active=false,id=null,sx=0,sy=0,sl=0,st=0;
    const down=e=>{
      if(e.pointerType==='mouse'&&e.button!==0)return;
      if(e.target.closest('textarea,button'))return;
      const r=el.getBoundingClientRect();
      if(r.width<20||r.height<20)return;
      active=true;id=e.pointerId;sx=e.clientX;sy=e.clientY;sl=r.left;st=r.top;
      el.classList.add('dragging');
      try{el.setPointerCapture(id)}catch(_){try{handle.setPointerCapture(id)}catch(__){}}
      e.preventDefault();e.stopPropagation();
    };
    const move=e=>{
      if(!active||e.pointerId!==id)return;
      setPos(el,sl+e.clientX-sx,st+e.clientY-sy,false);
      e.preventDefault();e.stopPropagation();
    };
    const up=e=>{
      if(!active||e.pointerId!==id)return;
      active=false;el.classList.remove('dragging');save(el);
      try{el.releasePointerCapture(id)}catch(_){try{handle.releasePointerCapture(id)}catch(__){}}
      id=null;e.preventDefault();e.stopPropagation();
    };
    el.addEventListener('pointerdown',down,{passive:false});
    el.addEventListener('pointermove',move,{passive:false});
    el.addEventListener('pointerup',up,{passive:false});
    el.addEventListener('pointercancel',up,{passive:false});

    window.addEventListener('resize',()=>{if(el.offsetWidth>20){const r=el.getBoundingClientRect();setPos(el,r.left,r.top,false)}},{passive:true});
    if(window.visualViewport)window.visualViewport.addEventListener('resize',()=>{if(el.offsetWidth>20&&!active){const p=saved();if(p)setPos(el,p.left,p.top,false)}},{passive:true});
  }

  function run(){
    inject();
    const el=document.querySelector('#ai .composer');
    if(el)drag(el);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  new MutationObserver(run).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target.closest('[onclick*="go(\'ai\'"]')||e.target.closest('[data-page="ai"]'))setTimeout(run,50)},{passive:true});
})();
