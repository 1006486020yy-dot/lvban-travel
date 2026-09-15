/* 旅伴 AI · 可拖动悬浮输入组件，仅处理 composer 位置与拖动 */
(function(){
  'use strict';
  if(window.__lvbanAiComposerDraggableV2)return;
  window.__lvbanAiComposerDraggableV2=true;

  const STYLE_ID='lvban-ai-composer-draggable-style-v2';
  const POS_KEY='lvban-ai-composer-position-v2';

  function inject(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style'); s.id=STYLE_ID;
    s.textContent=`
      #ai .composer.lv-ai-draggable{
        position:fixed!important; z-index:110!important; margin:0!important;
        transform:none!important; top:auto!important; right:auto!important; bottom:auto!important;
        touch-action:none!important; user-select:none!important;
      }
      #ai .composer.lv-ai-draggable .lv-ai-drag-handle{
        position:absolute!important; top:3px!important; left:50%!important;
        width:54px!important; height:7px!important; transform:translateX(-50%)!important;
        border-radius:99px!important; background:#d8d5e3!important; cursor:grab!important;
        z-index:3!important; touch-action:none!important;
      }
      #ai .composer.lv-ai-draggable .lv-ai-drag-handle:active{cursor:grabbing!important;background:#bcb8cc!important}
      #ai .composer.lv-ai-draggable.dragging{box-shadow:0 18px 42px rgba(64,58,138,.22)!important}
      #ai .composer.lv-ai-draggable textarea,#ai .composer.lv-ai-draggable button{user-select:text!important;touch-action:auto!important}
      @media(max-width:760px){#ai .composer.lv-ai-draggable{width:calc(100% - 24px)!important;max-width:680px!important}}
    `;
    document.head.appendChild(s);
  }

  function navSafeBottom(el){
    const nav=document.querySelector('.bottom');
    if(!nav)return 12;
    const r=nav.getBoundingClientRect();
    const h=el.offsetHeight||60;
    return Math.max(12,Math.round(window.innerHeight-r.top+h+12));
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
      maxTop=Math.min(maxTop,Math.round(nr.top-h-14));
    }
    if(maxTop<m)maxTop=m;
    return {left:Math.max(m,Math.min(left,window.innerWidth-w-m)),top:Math.max(m,Math.min(top,maxTop))};
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
    const p=saved();
    if(p){setPos(el,p.left,p.top,false);return;}
    const w=el.offsetWidth||Math.min(680,window.innerWidth-24),h=el.offsetHeight||60;
    const nav=document.querySelector('.bottom');
    const navTop=nav?nav.getBoundingClientRect().top:window.innerHeight-76;
    setPos(el,(window.innerWidth-w)/2,navTop-h-14,false);
  }

  function drag(el){
    if(el.dataset.lvbanDraggable==='2')return;
    el.dataset.lvbanDraggable='2';el.classList.add('lv-ai-draggable');
    const handle=document.createElement('div');handle.className='lv-ai-drag-handle';handle.title='拖动 AI 输入框';handle.setAttribute('aria-label','拖动 AI 输入框');el.insertBefore(handle,el.firstChild);
    requestAnimationFrame(()=>initial(el));

    let active=false,id=null,sx=0,sy=0,sl=0,st=0;
    const down=e=>{
      if(e.button!==undefined&&e.button!==0)return;
      const r=el.getBoundingClientRect();active=true;id=e.pointerId;sx=e.clientX;sy=e.clientY;sl=r.left;st=r.top;
      el.classList.add('dragging');try{handle.setPointerCapture(id)}catch(_){ }e.preventDefault();e.stopPropagation();
    };
    const move=e=>{if(!active||e.pointerId!==id)return;setPos(el,sl+e.clientX-sx,st+e.clientY-sy,false);e.preventDefault()};
    const up=e=>{if(!active||e.pointerId!==id)return;active=false;el.classList.remove('dragging');save(el);try{handle.releasePointerCapture(id)}catch(_){ }id=null;e.preventDefault()};
    handle.addEventListener('pointerdown',down,{passive:false});handle.addEventListener('pointermove',move,{passive:false});handle.addEventListener('pointerup',up,{passive:false});handle.addEventListener('pointercancel',up,{passive:false});
    window.addEventListener('resize',()=>{const r=el.getBoundingClientRect();setPos(el,r.left,r.top,false)},{passive:true});
  }

  function run(){inject();const el=document.querySelector('#ai .composer');if(el)drag(el)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  new MutationObserver(run).observe(document.body,{childList:true,subtree:true});
})();
