/* 旅伴旅行管家 · UI 交互修复 v3
   1. 行程页移除“发现灵感”
   2. 首页彻底移除工具箱入口及工具弹窗残留
   3. 旅行倒计时直接关联“我的行程”，自动取最近一次未来行程
   4. 每个总行程卡片右上角三点菜单：复制 / 收藏 / 删除
*/
(function(){
  const $=s=>document.querySelector(s);
  const $$=s=>Array.from(document.querySelectorAll(s));
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const toast=m=>window.toast?.(m);
  const save=()=>window.save?.();

  function removeLegacy(){
    // 移除旧“发现灵感”
    $$('#trips .tabs .tab').forEach(x=>{if((x.textContent||'').trim()==='发现灵感')x.remove();});
    // 移除旧工具箱入口、工具箱弹窗残留
    $$('.toolbox-entry,.toolbox-grid').forEach(x=>x.remove());
    if($('#modalTitle')?.textContent==='工具箱') window.closeModal?.();
  }

  function parseDate(v){
    if(!v)return null;
    const s=String(v).replace(/年|月/g,'-').replace(/日/g,'').replace(/\//g,'-').trim();
    const d=new Date(/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)?s+'T00:00:00':s);
    return Number.isNaN(d.getTime())?null:d;
  }

  function nearestTrip(){
    const today=new Date();today.setHours(0,0,0,0);
    return (window.db?.trips||[])
      .map(t=>({t,d:parseDate(t.start)}))
      .filter(x=>x.d && x.d>=today)
      .sort((a,b)=>a.d-b.d)[0]||null;
  }

  function countdownText(d){
    const today=new Date();today.setHours(0,0,0,0);
    const n=Math.ceil((d-today)/86400000);
    return n===0?'今天出发':`还有 ${n} 天`;
  }

  function addTripCountdown(){
    const tripsPage=$('#trips'), list=$('#tripList');
    if(!tripsPage||!list)return;
    tripsPage.querySelector('.trip-countdown')?.remove();
    const next=nearestTrip();
    if(!next)return;
    const box=document.createElement('div');
    box.className='trip-countdown panel';
    box.innerHTML=`<div class="trip-countdown-icon">✈️</div><div class="trip-countdown-main"><small>最近一次行程</small><b>${esc(next.t.name||'我的旅行')}</b><span>${esc(next.t.start||'')} · ${esc(next.t.city||'')}</span></div><strong class="trip-countdown-days">${countdownText(next.d)}</strong>`;
    list.parentNode.insertBefore(box,list);
  }

  function deleteTrip(id){
    const trips=window.db?.trips||[];
    const t=trips.find(x=>x.id===id);
    if(!t)return;
    if(!confirm('确定删除「'+(t.name||'这个行程')+'」吗？删除后不可恢复。'))return;
    window.db.trips=trips.filter(x=>x.id!==id);
    window.activeTrip=window.db.trips[0]?.id||null;
    window.activePlan=window.db.trips[0]?.plans?.[0]?.id||'A';
    window.activeDay=0;
    save();
    window.renderTrips?.();
    toast('行程已删除');
  }
  window.deleteTrip=deleteTrip;

  function copyTrip(t){
    if(!t)return;
    const clone=JSON.parse(JSON.stringify(t));
    clone.id=window.uid?.()||('trip_'+Date.now());
    clone.name=(t.name||'行程')+'（副本）';
    (clone.plans||[]).forEach(p=>{
      p.days=(p.days||[]).map(d=>({...d,id:window.uid?.()||('day_'+Date.now()+Math.random()),items:(d.items||[]).map(i=>({...i,id:window.uid?.()||('item_'+Date.now()+Math.random())}))}));
    });
    window.db.trips.push(clone);
    window.activeTrip=clone.id;
    window.activePlan=clone.plans?.[0]?.id||'A';
    window.activeDay=0;
    save();
    window.renderTrips?.();
    toast('已复制行程');
  }

  function openTripMenu(id,anchor){
    $$('.trip-more-menu').forEach(x=>x.remove());
    const t=(window.db?.trips||[]).find(x=>x.id===id);
    if(!t)return;
    const menu=document.createElement('div');
    menu.className='trip-more-menu';
    menu.innerHTML='<button data-act="copy">复制行程</button><button data-act="fav">收藏行程</button><button data-act="delete" class="danger">删除行程</button>';
    menu.onclick=e=>{
      const b=e.target.closest('button');if(!b)return;
      e.preventDefault();e.stopPropagation();
      if(b.dataset.act==='copy')copyTrip(t);
      if(b.dataset.act==='fav'){
        t.favorite=!t.favorite;save();toast(t.favorite?'已收藏行程':'已取消收藏');
      }
      if(b.dataset.act==='delete')deleteTrip(id);
      menu.remove();
    };
    document.body.appendChild(menu);
    const r=anchor.getBoundingClientRect(),mw=154;
    menu.style.left=Math.min(window.innerWidth-mw-10,Math.max(10,r.right-mw))+'px';
    menu.style.top=Math.min(window.innerHeight-150,r.bottom+6)+'px';
    setTimeout(()=>document.addEventListener('click',()=>menu.remove(),{once:true}),0);
  }
  window.openTripMenu=openTripMenu;

  function addMoreButton(card,t){
    card.querySelector('.trip-more')?.remove();
    card.style.position='relative';
    const more=document.createElement('button');
    more.type='button';more.className='trip-more';more.textContent='⋯';
    more.setAttribute('aria-label','行程更多操作');
    more.onclick=e=>{e.preventDefault();e.stopPropagation();openTripMenu(t.id,more);};
    card.appendChild(more);
  }

  function patchCards(){
    const cards=$$('#trips .trip-card'),trips=window.db?.trips||[];
    cards.forEach((card,i)=>{if(i<trips.length)addMoreButton(card,trips[i]);});
    addTripCountdown();
  }

  function installStyle(){
    if($('#trip-menu-countdown-style-v3'))return;
    const st=document.createElement('style');st.id='trip-menu-countdown-style-v3';st.textContent=`
      .trip-more{position:absolute!important;right:12px!important;top:12px!important;width:34px!important;height:34px!important;border-radius:12px!important;background:rgba(255,255,255,.84)!important;color:#5f6074!important;font-size:22px!important;line-height:1!important;display:grid!important;place-items:center!important;z-index:20!important;box-shadow:0 5px 14px rgba(60,50,100,.08)!important}
      .trip-more-menu{position:fixed;z-index:99999;width:154px;padding:6px;border-radius:15px;background:rgba(255,255,255,.98);box-shadow:0 18px 40px rgba(30,25,60,.18);border:1px solid #eeeaf8;backdrop-filter:blur(20px)}
      .trip-more-menu button{display:block;width:100%;padding:11px 12px;border-radius:10px;background:transparent;text-align:left;color:#222;font-size:13px}.trip-more-menu button:hover{background:#f5f3ff}.trip-more-menu .danger{color:#d94e5c}
      .trip-countdown{display:flex;align-items:center;gap:12px;margin:0 0 14px;padding:14px 16px!important;border-radius:20px!important}
      .trip-countdown-icon{width:42px;height:42px;border-radius:14px;background:#efedff;display:grid;place-items:center;font-size:21px;flex:0 0 auto}
      .trip-countdown-main{min-width:0;display:flex;flex-direction:column;gap:2px;flex:1}.trip-countdown-main small{color:var(--muted);font-size:11px}.trip-countdown-main b{font-size:15px}.trip-countdown-main span{color:var(--muted);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.trip-countdown-days{color:var(--p);font-size:16px;white-space:nowrap}
      @media(max-width:760px){.trip-more-menu{width:150px}.trip-countdown{padding:13px!important}.trip-countdown-days{font-size:14px}}
    `;document.head.appendChild(st);
  }

  const wrapRender=(name,after)=>{
    const fn=window[name];
    if(!fn||fn.__lvbanWrappedV3)return;
    const w=function(){const r=fn.apply(this,arguments);setTimeout(after,0);return r};
    w.__lvbanWrappedV3=true;window[name]=w;
  };

  installStyle();
  wrapRender('renderTrips',()=>{removeLegacy();patchCards();});
  wrapRender('renderHome',removeLegacy);
  removeLegacy();
  setTimeout(()=>{removeLegacy();patchCards();},100);
  setTimeout(()=>{removeLegacy();patchCards();},500);
  window.addEventListener('load',()=>setTimeout(()=>{removeLegacy();patchCards();},300));
})();