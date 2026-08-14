/* 旅伴旅行管家 · 行程删除功能
   1) 大行程列表：每张行程卡右上角增加“删除”入口
   2) 每日行程详情：每条安排增加“删除”按钮
   3) 删除后同步当前 db，并尽可能调用项目已有持久化方法；若没有，则更新包含 trips 的本地存储记录。
*/
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const toast=m=>window.toast?.(m)||alert(m);
  const trips=()=>Array.isArray(window.db?.trips)?window.db.trips:[];

  function persist(){
    const fns=['saveDB','saveData','persistDB','persistData','saveState','saveLocalData'];
    for(const n of fns){ if(typeof window[n]==='function'){ try{window[n]();return true;}catch(e){} } }
    try{
      for(let i=0;i<localStorage.length;i++){
        const key=localStorage.key(i); if(!key)continue;
        const raw=localStorage.getItem(key); if(!raw||raw.length>2000000)continue;
        try{
          const obj=JSON.parse(raw);
          if(obj&&Array.isArray(obj.trips)){ obj.trips=trips(); localStorage.setItem(key,JSON.stringify(obj)); return true; }
          if(Array.isArray(obj)&&obj.some(x=>x&&Array.isArray(x.plans))){ localStorage.setItem(key,JSON.stringify(trips())); return true; }
        }catch(e){}
      }
    }catch(e){}
    return false;
  }

  function deleteTrip(id){
    const t=trips().find(x=>x.id===id); if(!t)return;
    if(!confirm(`确定删除行程“${t.name||'未命名行程'}”吗？\n删除后该行程及其中的每日安排都会被删除。`))return;
    window.db.trips=trips().filter(x=>x.id!==id);
    if(window.activeTrip===id) window.activeTrip=window.db.trips[0]?.id||null;
    persist();
    window.renderTrips?.();
    toast('行程已删除');
  }

  function deleteItem(index){
    const t=trips().find(x=>x.id===window.activeTrip)||trips()[0];
    const p=t?.plans?.find(x=>x.id===window.activePlan)||t?.plans?.[0];
    const d=p?.days?.[Number(window._lv2Day)];
    if(!d||!d.items?.[index])return;
    const item=d.items[index];
    if(!confirm(`确定删除“${item.name||'这条安排'}”吗？`))return;
    d.items.splice(index,1);
    persist();
    window._lvbanTripCanvasV2?.();
    toast('每日行程已删除');
  }

  function injectTripDelete(){
    $$('#tripCards .trip-card').forEach(card=>{
      if(card.querySelector('.lv-delete-trip'))return;
      const onclick=card.getAttribute('onclick')||'';
      const m=onclick.match(/openTripCanvas\(['"]([^'"]+)['"]\)/);
      const id=m?.[1]; if(!id)return;
      const b=document.createElement('span');
      b.className='lv-delete-trip'; b.textContent='删除'; b.title='删除行程'; b.dataset.tripId=id;
      b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();deleteTrip(id);});
      card.appendChild(b);
    });
  }

  function injectItemDelete(){
    $$('.lv2-card').forEach((card,idx)=>{
      if(card.querySelector('.lv-delete-item'))return;
      const actions=card.querySelector('.lv2-actions'); if(!actions)return;
      const b=document.createElement('button'); b.className='lv-delete-item'; b.textContent='删除'; b.dataset.deleteIndex=String(idx);
      b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();deleteItem(Number(b.dataset.deleteIndex));});
      actions.appendChild(b);
    });
  }

  function inject(){injectTripDelete();injectItemDelete();}
  const mo=new MutationObserver(()=>inject());
  window.addEventListener('load',()=>{inject();mo.observe(document.body,{subtree:true,childList:true});});
  setTimeout(()=>{inject();mo.observe(document.body,{subtree:true,childList:true});},500);
  window.__lvbanDeleteTrip=deleteTrip;
  window.__lvbanDeleteItem=deleteItem;
})();
