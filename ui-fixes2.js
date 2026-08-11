/* 最终交互修复：只保留“创建行程”悬浮按钮；补齐行程/日程删除 */
(function(){
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/'/g,"&#39;");
  function removeLegacyFab(){
    document.querySelectorAll('.float').forEach(el=>el.remove());
  }
  function deleteTrip(id){
    const trips=window.db?.trips||[];
    const t=trips.find(x=>x.id===id);
    if(!t)return;
    if(trips.length<=1){window.toast?.('至少保留一个行程');return;}
    if(!confirm('确定删除「'+(t.name||'这个行程')+'」吗？删除后不可恢复。'))return;
    window.db.trips=trips.filter(x=>x.id!==id);
    window.activeTrip=window.db.trips[0]?.id||null;
    window.activePlan=window.db.trips[0]?.plans?.[0]?.id||'A';
    window.activeDay=0;
    window.save?.();
    window.renderTrips?.();
    window.toast?.('行程已删除');
  }
  window.deleteTrip=deleteTrip;

  function deleteItem(i){
    const p=window.currentPlan?.();
    const d=p?.days?.[window.activeDay];
    if(!d?.items?.[i])return;
    if(!confirm('确定删除这条日程吗？'))return;
    d.items.splice(i,1);
    window.save?.();
    window.renderTripDetail?.();
    window.toast?.('日程已删除');
  }
  window.deleteItem=deleteItem;

  function addDeleteToCards(){
    document.querySelectorAll('#tripList .trip-card').forEach((card,index)=>{
      if(card.querySelector('.trip-delete-final'))return;
      const trips=window.db?.trips||[];
      if(!trips[index])return;
      card.style.position='relative';
      const b=document.createElement('button');
      b.type='button';b.className='mini danger trip-delete-final';b.textContent='删除';
      b.style='position:absolute;right:10px;top:50%;transform:translateY(-50%);z-index:20;padding:7px 9px;border-radius:10px;background:#fff0f1;color:#d94e5c;font-weight:700';
      b.onclick=e=>{e.preventDefault();e.stopPropagation();deleteTrip(trips[index].id)};
      card.appendChild(b);
    });
  }

  function patchTripDetail(){
    // 确保当前日程的操作区一定存在“删除”。
    document.querySelectorAll('#tripDetail .it-card').forEach((card,index)=>{
      if(card.querySelector('.trip-delete-final'))return;
      const actions=card.querySelector('.actions');
      if(!actions)return;
      const b=document.createElement('button');
      b.className='mini danger trip-delete-final';b.textContent='删除';
      b.onclick=e=>{e.preventDefault();e.stopPropagation();deleteItem(index)};
      actions.appendChild(b);
    });
  }

  function patch(){
    removeLegacyFab();
    addDeleteToCards();
    patchTripDetail();
  }
  const oldRenderTrips=window.renderTrips;
  if(oldRenderTrips&&!window.__finalRenderTripsPatch){
    window.renderTrips=function(){oldRenderTrips();setTimeout(patch,0)};
    window.__finalRenderTripsPatch=true;
  }
  const oldRenderDetail=window.renderTripDetail;
  if(oldRenderDetail&&!window.__finalRenderDetailPatch){
    window.renderTripDetail=function(){oldRenderDetail();setTimeout(patchTripDetail,0)};
    window.__finalRenderDetailPatch=true;
  }
  new MutationObserver(()=>patch()).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('load',()=>setTimeout(patch,100));
  setTimeout(patch,100);
})();
