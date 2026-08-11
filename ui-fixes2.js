/* 最终交互修复：行程/日期/日程删除 + 单路线不显示 A/B */
(function(){
  const $=s=>document.querySelector(s);
  function toast(m){window.toast?.(m)}

  function removeLegacyFab(){document.querySelectorAll('.float').forEach(el=>el.remove());}

  function deleteTrip(id){
    const trips=window.db?.trips||[];
    const t=trips.find(x=>x.id===id); if(!t)return;
    if(!confirm('确定删除「'+(t.name||'这个行程')+'」吗？删除后不可恢复。'))return;
    window.db.trips=trips.filter(x=>x.id!==id);
    window.activeTrip=window.db.trips[0]?.id||null;
    window.activePlan=window.db.trips[0]?.plans?.[0]?.id||'A';
    window.activeDay=0;
    window.save?.();
    window.renderTrips?.();
    toast('行程已删除');
  }
  window.deleteTrip=deleteTrip;

  function deleteItem(i){
    const p=window.currentPlan?.();
    const d=p?.days?.[window._tripUI?.day??window.activeDay??0];
    if(!d?.items?.[i])return;
    const item=d.items[i];
    if(!confirm('确定删除「'+(item.name||'这条日程')+'」吗？'))return;
    d.items.splice(i,1);
    window.save?.();
    window.renderTripDetail?.();
    toast('日程已删除');
  }
  window.deleteItem=deleteItem;

  function deleteDay(i){
    const p=window.currentPlan?.();
    if(!p?.days?.[i])return;
    if(p.days.length<=1){toast('至少保留一天行程');return;}
    const d=p.days[i];
    if(!confirm('确定删除 '+(d.date||'这一天')+' 的全部安排吗？'))return;
    p.days.splice(i,1);
    window.activeDay=Math.max(0,Math.min(window.activeDay||0,p.days.length-1));
    if(window._tripUI)window._tripUI.day=Math.max(0,Math.min(window._tripUI.day||0,p.days.length-1));
    window.save?.();
    window.renderTripDetail?.();
    toast('日期已删除');
  }
  window.deleteDay=deleteDay;

  function patchTripCards(){
    document.querySelectorAll('#tripCards .trip-card').forEach((card,index)=>{
      if(card.querySelector('.trip-delete-final'))return;
      const t=window.db?.trips?.[index];if(!t)return;
      const b=document.createElement('button');b.type='button';b.className='trip-delete-final';b.textContent='删除';
      b.style='position:absolute;right:10px;top:10px;z-index:20;padding:7px 9px;border-radius:10px;background:#fff0f1;color:#d94e5c;font-weight:700';
      b.onclick=e=>{e.preventDefault();e.stopPropagation();deleteTrip(t.id)};
      card.appendChild(b);
    });
  }

  function patchCanvas(){
    removeLegacyFab();
    const t=window.currentTrip?.();
    const plans=t?.plans||[];
    // 新建行程默认只有一个方案：此时完全不显示 A/B 切换。
    if(plans.length<=1){document.querySelectorAll('.canvas-plan').forEach(b=>b.remove());document.querySelectorAll('.plan-switch').forEach(x=>x.remove());}

    // 每一天都提供明确的删除入口。
    document.querySelectorAll('#canvasDays .day-fold').forEach((section,index)=>{
      if(section.querySelector('.delete-day-btn'))return;
      const body=section.querySelector('.day-body');if(!body)return;
      const b=document.createElement('button');b.type='button';b.className='delete-day-btn';b.textContent='删除这一天';
      b.onclick=e=>{e.preventDefault();e.stopPropagation();deleteDay(index)};
      body.appendChild(b);
    });

    // 每条日程都提供删除入口；不用依赖旧 DOM 的 index。
    document.querySelectorAll('#canvasDays .event-card').forEach(card=>{
      if(card.querySelector('.delete-event-btn'))return;
      const menu=card.querySelector('.event-menu');
      const itemName=card.querySelector('h3')?.textContent||'这条日程';
      const p=window.currentPlan?.(); const day=p?.days?.[window._tripUI?.day||0];
      const idx=(day?.items||[]).findIndex(x=>x.name===itemName);
      if(idx<0)return;
      const b=document.createElement('button');b.type='button';b.className='delete-event-btn';b.textContent='删除';
      b.onclick=e=>{e.preventDefault();e.stopPropagation();deleteItem(idx)};
      (card.querySelector('.event-actions')||card).appendChild(b);
    });
  }

  function patch(){removeLegacyFab();patchTripCards();patchCanvas();}

  const oldRenderTrips=window.renderTrips;
  if(oldRenderTrips&&!window.__finalRenderTripsPatch){
    window.renderTrips=function(){oldRenderTrips();setTimeout(patch,0)};
    window.__finalRenderTripsPatch=true;
  }
  const oldRenderDetail=window.renderTripDetail;
  if(oldRenderDetail&&!window.__finalRenderDetailPatch){
    window.renderTripDetail=function(){oldRenderDetail();setTimeout(patchCanvas,0)};
    window.__finalRenderDetailPatch=true;
  }

  if(!document.getElementById('trip-delete-final-style')){
    const st=document.createElement('style');st.id='trip-delete-final-style';st.textContent=`
      .trip-delete-final{box-shadow:0 4px 12px rgba(80,70,120,.08)}
      .delete-day-btn{width:100%;margin-top:10px;padding:10px 12px;border-radius:12px;border:1px solid #f1dfe2;background:#fff5f6;color:#d94e5c;font-weight:700}
      .delete-event-btn{padding:7px 11px;border-radius:10px;border:1px solid #f1dfe2;background:#fff5f6;color:#d94e5c;font-weight:700}
      @media(max-width:760px){.trip-delete-final{font-size:11px}.delete-day-btn{font-size:12px}}
    `;document.head.appendChild(st);
  }

  new MutationObserver(()=>patch()).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('load',()=>setTimeout(patch,150));
  setTimeout(patch,150);
})();