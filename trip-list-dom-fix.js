/* 旅伴：修复大行程列表卡片 DOM。只负责列表层，不接管详细行程。 */
(function(){
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  const toast=m=>window.toast?.(m)||alert(m);
  function trips(){return Array.isArray(window.db?.trips)?window.db.trips:[]}
  function render(){
    const grid=document.getElementById('utGrid');
    if(!grid)return;
    const list=trips();
    grid.innerHTML=list.map(t=>{
      const p=t.plans?.[0],days=p?.days||[],count=days.reduce((n,d)=>n+(d.items?.length||0),0);
      const actualCities=[...new Set(days.map(d=>d.city||d.location).filter(Boolean))];
      const cityText=actualCities.length?actualCities.join(' · '):(t.city||'');
      return `<div class="ut-card" data-trip-dom="${esc(t.id)}">
        <button type="button" class="ut-delete" data-delete-dom="${esc(t.id)}">删除</button>
        <div class="ut-cover"><span class="days">${days.length||0}天</span><div class="city">${esc(cityText)}</div></div>
        <div class="ut-body"><h3>${esc(t.name||'未命名行程')}</h3><p>${esc(t.start||'')} ${t.end?'— '+esc(t.end):''}</p><div class="ut-meta"><span>${esc(p?.name||'方案 A')}</span><span>${count} 个安排</span></div></div>
      </div>`;
    }).join('');
    if(!list.length){const e=document.getElementById('utEmpty');if(e)e.style.display='block';}
    grid.querySelectorAll('[data-trip-dom]').forEach(card=>card.onclick=e=>{
      if(e.target.closest('[data-delete-dom]'))return;
      const id=card.getAttribute('data-trip-dom');
      if(typeof window.openTripCanvas==='function')window.openTripCanvas(id);
    });
    grid.querySelectorAll('[data-delete-dom]').forEach(btn=>btn.onclick=e=>{
      e.preventDefault();e.stopPropagation();
      const id=btn.getAttribute('data-delete-dom'),t=trips().find(x=>String(x.id)===String(id));
      if(!t)return;
      if(!confirm('确定删除“'+(t.name||'未命名行程')+'”吗？'))return;
      window.db.trips=trips().filter(x=>String(x.id)!==String(id));
      window.markTripDeleted?.(id);
      if(String(window.activeTrip)===String(id))window.activeTrip=window.db.trips[0]?.id||null;
      window.activePlan=window.db.trips[0]?.plans?.[0]?.id||'A';
      window.activeDay=0;window.save?.();
      render();toast('行程已删除');
    });
  }
  function boot(){setTimeout(render,20);setTimeout(render,180);setTimeout(render,600)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.addEventListener('lvban-data-ready',boot);
  new MutationObserver(m=>{if(m.some(x=>[...x.addedNodes].some(n=>n.nodeType===1&&(n.id==='utGrid'||n.querySelector?.('#utGrid')))))boot()}).observe(document.body,{childList:true,subtree:true});
})();