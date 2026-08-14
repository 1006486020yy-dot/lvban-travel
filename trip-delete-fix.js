/* 旅伴旅行管家 · 行程删除功能
   大行程 + 每日行程细节删除。
   注意：V3 行程详情本身已经渲染每日“删除”按钮，这里只在旧版详情没有删除按钮时补充，避免出现两个删除。
*/
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const toast=m=>window.toast?.(m)||alert(m);
  const trips=()=>Array.isArray(window.db?.trips)?window.db.trips:[];

  function persist(){
    const fns=['saveDB','saveData','persistDB','persistData','saveState','saveLocalData'];
    for(const n of fns){
      if(typeof window[n]==='function'){
        try{window[n]();return true;}catch(e){}
      }
    }
    try{
      for(let i=0;i<localStorage.length;i++){
        const key=localStorage.key(i);if(!key)continue;
        const raw=localStorage.getItem(key);if(!raw||raw.length>2000000)continue;
        try{
          const obj=JSON.parse(raw);
          if(obj&&Array.isArray(obj.trips)){obj.trips=trips();localStorage.setItem(key,JSON.stringify(obj));return true;}
          if(Array.isArray(obj)&&obj.some(x=>x&&Array.isArray(x.plans))){localStorage.setItem(key,JSON.stringify(trips()));return true;}
        }catch(e){}
      }
    }catch(e){}
    return false;
  }

  function deleteTrip(id){
    const t=trips().find(x=>String(x.id)===String(id));if(!t)return;
    if(!confirm(`确定删除行程“${t.name||'未命名行程'}”吗？\n删除后该行程及其中的每日安排都会被删除。`))return;
    window.db.trips=trips().filter(x=>String(x.id)!==String(id));
    if(String(window.activeTrip)===String(id))window.activeTrip=window.db.trips[0]?.id||null;
    persist();window.renderTrips?.();toast('行程已删除');
  }

  function deleteItem(index){
    const t=trips().find(x=>String(x.id)===String(window.activeTrip))||trips()[0];
    const p=t?.plans?.find(x=>String(x.id)===String(window.activePlan))||t?.plans?.[0];
    const d=p?.days?.[Number(window._lv2Day)];if(!d||!Array.isArray(d.items)||!d.items[index])return;
    const item=d.items[index];if(!confirm(`确定删除“${item.name||'这条安排'}”吗？`))return;
    d.items.splice(index,1);persist();window._lvbanTripCanvasV2?.();toast('每日行程已删除');
  }

  function getTripId(card,index){
    const direct=card.dataset.tripId||card.dataset.id;if(direct)return direct;
    const onclick=card.getAttribute('onclick')||card.querySelector('[onclick]')?.getAttribute('onclick')||'';
    const m=onclick.match(/(?:openTripCanvas|__lvbanHardOpenTrip)\(['"]([^'"]+)['"]\)/);if(m)return m[1];
    return trips()[index]?.id||null;
  }

  function addStyle(){
    if($('#lvban-delete-style'))return;
    const style=document.createElement('style');style.id='lvban-delete-style';
    style.textContent=`
      .lv-delete-trip{position:absolute;right:18px;top:18px;z-index:30;display:inline-flex;align-items:center;justify-content:center;padding:7px 12px;border:0;border-radius:999px;background:rgba(255,255,255,.82);color:#d9363e;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.08);backdrop-filter:blur(8px)}
      .lv-delete-trip:hover{background:#fff;color:#b4232c}.trip-card{position:relative}
      .lv-delete-item{margin-left:8px;padding:7px 12px;border:0;border-radius:999px;background:#fff0f0;color:#d9363e;font-size:13px;font-weight:600;cursor:pointer}
    `;document.head.appendChild(style);
  }

  function injectTripDelete(){
    $$('#tripCards .trip-card,#trips .trip-card').forEach((card,index)=>{
      if(card.querySelector('.lv-delete-trip'))return;const id=getTripId(card,index);if(!id)return;
      const b=document.createElement('button');b.type='button';b.className='lv-delete-trip';b.textContent='删除';b.title='删除行程';b.dataset.tripId=id;
      b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();deleteTrip(id)},true);card.appendChild(b);
    });
  }

  function injectItemDelete(){
    /* V3 自己已经有 data-delete 的删除按钮，绝不再添加第二个。 */
    $$('.lv2-card').forEach((card,idx)=>{
      const actions=card.querySelector('.lv2-actions');
      if(!actions||actions.querySelector('.lv-delete-item')||actions.querySelector('[data-delete]'))return;
      const b=document.createElement('button');b.type='button';b.className='lv-delete-item';b.textContent='删除';b.title='删除这条每日行程';
      b.dataset.deleteIndex=String(idx);b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();deleteItem(idx)},true);actions.appendChild(b);
    });
  }

  function inject(){addStyle();injectTripDelete();injectItemDelete()}
  function start(){inject();if(!window.__lvbanDeleteObserver){const mo=new MutationObserver(()=>inject());mo.observe(document.body,{subtree:true,childList:true});window.__lvbanDeleteObserver=mo}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('load',inject);window.__lvbanDeleteTrip=deleteTrip;window.__lvbanDeleteItem=deleteItem;
})();
