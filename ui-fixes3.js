/* 旅伴旅行管家 · 行程最终修复 v4
   1. 彻底移除“发现灵感”
   2. 无备选路线的行程只显示方案 A
   3. 无备选路线的数据强制清理 B，避免旧数据/旧 UI 继续显示
*/
(function(){
  const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));

  function normalizePlans(){
    const trips=window.db?.trips;
    if(!Array.isArray(trips))return;
    let changed=false;
    trips.forEach(t=>{
      // 新建行程明确未勾选“有备选路线”时，只允许存在方案 A。
      if(t.hasAlternateRoutes===false && Array.isArray(t.plans)){
        const a=t.plans.find(p=>p?.id==='A')||t.plans[0];
        const next=a?[a]:[];
        if(t.plans.length!==next.length || t.plans.some((p,i)=>p!==next[i])){
          t.plans=next;
          changed=true;
        }
      }
    });
    if(changed)window.save?.();
  }

  function removeDiscover(){
    // 新架构中的发现灵感
    $$('.trip-tab[data-tab="discover"]').forEach(x=>x.remove());
    // 旧架构中的发现灵感
    $$('#trips .tabs .tab').forEach(x=>{
      if((x.textContent||'').replace(/\s/g,'')==='发现灵感')x.remove();
    });
    // 如果只剩“我的行程”，不要再让它看起来像有第二个标签
    $$('.trip-tabs').forEach(box=>{
      const mine=box.querySelector('[data-tab="mine"]');
      if(mine){
        mine.style.cursor='default';
        mine.onclick=null;
      }
      box.style.gap='0';
    });
  }

  function hideBForSingleRoute(){
    const t=window.currentTrip?.();
    const hasAlternate=t?.hasAlternateRoutes===true;
    $$('.canvas-plan[data-plan="B"]').forEach(b=>b.style.display=hasAlternate?'':'none');
    if(!hasAlternate && window.activePlan==='B'){
      window.activePlan='A';
      window.renderTripDetail?.();
    }
  }

  function run(){
    normalizePlans();
    removeDiscover();
    hideBForSingleRoute();
  }

  window.addEventListener('load',()=>setTimeout(run,100));
  document.addEventListener('DOMContentLoaded',()=>setTimeout(run,100));
  setTimeout(run,300);
  setTimeout(run,800);
  setTimeout(run,1500);
  setInterval(run,1200);

  // 行程页面重绘后再次执行，防止旧 UI 函数把发现灵感或方案 B 重新插回来。
  const observer=new MutationObserver(()=>{
    if($('#trips'))run();
  });
  observer.observe(document.body,{childList:true,subtree:true});
})();
