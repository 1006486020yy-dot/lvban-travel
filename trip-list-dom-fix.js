/* 旅伴：大行程列表卡片最终修复。
   只负责列表层：城市标题永远从当前行程真实数据读取，不使用示例城市。
*/
(function(){
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  const getDB=()=>typeof window.db==='function'?window.db():window.db;
  const trips=()=>{const d=getDB();return Array.isArray(d?.trips)?d.trips:[]};
  const toast=m=>window.toast?.(m)||alert(m);
  function actualCities(t){
    const p=t?.plans?.find(x=>x.id===t.activePlan)||t?.plans?.[0];
    const days=(p?.days?.length?p.days:t?.days)||[];
    const out=[];
    days.forEach(d=>{const c=String(d?.city||d?.cityLabel||d?.location||'').trim();if(c&&!out.includes(c))out.push(c)});
    if(!out.length&&Array.isArray(t?.cities))t.cities.forEach(c=>{c=String(c||'').trim();if(c&&!out.includes(c))out.push(c)});
    return out;
  }
  function render(){
    const grid=document.getElementById('utGrid');
    if(!grid)return;
    const list=trips();
    grid.innerHTML=list.map(t=>{
      const p=t?.plans?.find(x=>x.id===t.activePlan)||t?.plans?.[0],days=(p?.days?.length?p.days:t?.days)||[];
      const count=days.reduce((n,d)=>n+(Array.isArray(d?.items)?d.items.length:0),0);
      const cityText=actualCities(t).join(' · ')||'待添加目的地';
      return `<div class="ut-card" data-trip-dom="${esc(t.id)}"><button type="button" class="ut-delete" data-delete-dom="${esc(t.id)}">删除</button><div class="ut-cover"><span class="days">${days.length||0}天</span><div class="city">${esc(cityText)}</div></div><div class="ut-body"><h3>${esc(t.name||'未命名行程')}</h3><p>${esc(t.start||'')} ${t.end?'— '+esc(t.end):''}</p><div class="ut-meta"><span>${esc(p?.name||'方案 A')}</span><span>${count} 个安排</span></div></div></div>`;
    }).join('');
    const empty=document.getElementById('utEmpty');if(empty)empty.style.display=list.length?'none':'block';
    grid.querySelectorAll('[data-trip-dom]').forEach(card=>card.onclick=e=>{if(e.target.closest('[data-delete-dom]'))return;const id=card.getAttribute('data-trip-dom');window.openTripCanvas?.(id)});
    grid.querySelectorAll('[data-delete-dom]').forEach(btn=>btn.onclick=e=>{e.preventDefault();e.stopPropagation();const id=btn.getAttribute('data-delete-dom'),t=trips().find(x=>String(x.id)===String(id));if(!t)return;if(!confirm('确定删除“'+(t.name||'未命名行程')+'”吗？'))return;const d=getDB();d.trips=trips().filter(x=>String(x.id)!==String(id));window.markTripDeleted?.(id);if(String(window.activeTrip)===String(id))window.activeTrip=d.trips[0]?.id||null;window.activePlan=d.trips[0]?.plans?.[0]?.id||'A';window.activeDay=0;window.save?.();render();toast('行程已删除')});
  }
  function boot(){setTimeout(render,20);setTimeout(render,180);setTimeout(render,600)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.addEventListener('lvban-data-ready',boot);
  window.addEventListener('lvban-db-change',boot);
})();