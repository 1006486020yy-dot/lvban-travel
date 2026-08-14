/* 旅伴旅行管家 · 行程详情 V3
   固定结构：行程名称 → 当前行程城市 → 城市对应日期 → 当天行程详情
   每日节点使用“第一站 / 第二站 / 第三站”而不是时间。
*/
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  const trips=()=>Array.isArray(window.db?.trips)?window.db.trips:[];
  const current=()=>trips().find(t=>t.id===window.activeTrip)||trips()[0];
  const plan=()=>{const t=current();return t?.plans?.find(p=>p.id===window.activePlan)||t?.plans?.[0]};
  const toast=m=>window.toast?.(m)||alert(m);
  const copy=s=>{if(!s)return toast('暂无地址');navigator.clipboard?.writeText(s).then(()=>toast('地址已复制')).catch(()=>toast('复制失败'))};
  const nav=(name,address)=>{if(!address)return toast('暂无地址');window.open('https://uri.amap.com/search?keyword='+encodeURIComponent((name||'')+' '+address),'_blank')};
  const alternateEnabled=t=>t?.hasAlternateRoutes===true||t?.hasAlternateRoute===true||t?.alternateRoute===true||t?.useAlternateRoutes===true||t?.hasBackupRoute===true;

  function cityList(t,p){
    const out=[];
    const add=v=>{v=String(v||'').trim();if(!v)return;if(['全部城市','全部','景点','美食','交通','酒店','住宿'].includes(v))return;if(!out.includes(v))out.push(v)};
    if(Array.isArray(t?.cityDurations)&&t.cityDurations.length)t.cityDurations.forEach(x=>add(x?.city));
    if(!out.length)(p?.days||[]).forEach(d=>add(d?.city));
    if(!out.length)(p?.days||[]).forEach(d=>(d?.items||[]).forEach(x=>add(x?.city)));
    if(!out.length)String(t?.city||'').split(/[·,、/|→＞>]+/).forEach(add);
    return out;
  }
  function dayCity(t,p,i){
    const d=p?.days?.[i];
    if(d?.city)return String(d.city).trim();
    const ds=Array.isArray(t?.cityDurations)?t.cityDurations:[];let n=0;
    for(const x of ds){n+=Number(x?.days)||0;if(i<n)return String(x?.city||'').trim()}
    const cs=[...new Set((d?.items||[]).map(x=>String(x?.city||'').trim()).filter(Boolean))];
    return cs.length===1?cs[0]:'';
  }
  function daysForCity(t,p,city){const r=[];(p?.days||[]).forEach((d,i)=>{if(dayCity(t,p,i)===city)r.push(i)});return r}

  function style(){
    if($('#lv-trip-v3-style'))return;
    const s=document.createElement('style');s.id='lv-trip-v3-style';
    s.textContent=`
      .lv2{padding:5px 2px 105px}.lv2-head{display:flex;align-items:center;gap:10px;padding:7px 0 14px}
      .lv2-back,.lv2-more{width:42px;height:42px;border-radius:14px;background:#fff;font-size:27px}.lv2-more{font-size:22px}
      .lv2-title{flex:1}.lv2-title h2{margin:0;font-size:22px}.lv2-title p{margin:4px 0 0;color:var(--muted);font-size:11px}
      .lv2-row{display:flex;gap:8px;overflow:auto;padding:3px 0 12px;scrollbar-width:none}.lv2-row::-webkit-scrollbar{display:none}
      .lv2-city,.lv2-date{flex:0 0 auto;border:1px solid var(--line);background:#fff;color:#555;border-radius:14px;cursor:pointer;font-weight:800}
      .lv2-city{padding:11px 18px}.lv2-city.on,.lv2-date.on{background:var(--p);color:#fff;border-color:var(--p)}
      .lv2-date{min-width:84px;padding:9px 11px;text-align:center}.lv2-date b,.lv2-date small{display:block}.lv2-date b{font-size:12px}.lv2-date small{font-size:10px;margin-top:3px;opacity:.85}
      .lv2-detail-label{font-size:15px;font-weight:900;margin:6px 0 9px}.lv2-day{background:#ffffffd9;border:1px solid #fff;border-radius:20px;overflow:hidden}
      .lv2-day-meta{padding:15px 16px 7px}.lv2-day-meta .date{color:var(--p);font-size:13px;font-weight:900}.lv2-day-meta h3{margin:5px 0;font-size:18px}.lv2-day-meta p{margin:0;color:var(--muted);font-size:11px}
      .lv2-event{display:grid;grid-template-columns:58px 1fr;gap:9px;padding:8px 12px 8px 10px}.lv2-stop{color:var(--p);font-size:12px;font-weight:900;padding-top:10px;text-align:right;line-height:1.3}
      .lv2-card{background:#f7f7fb;border-radius:17px;padding:13px}.lv2-type{display:inline-block;background:#efedff;color:var(--p);padding:5px 8px;border-radius:9px;font-size:10px;font-weight:800}.lv2-card h3{margin:8px 0 5px;font-size:16px}
      .lv2-address,.lv2-note{font-size:11px;color:var(--muted);line-height:1.55}.lv2-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.lv2-actions button{padding:8px 10px;border-radius:11px;background:#fff;color:#5d4de5;font-size:11px;border:1px solid #e8e6f4}
      .lv2-empty{text-align:center;padding:35px 15px;color:var(--muted)}.lv2-plans{display:flex;gap:8px;margin-bottom:10px}.lv2-plan{flex:1;padding:11px;border-radius:14px;background:#fff;color:#777;font-weight:800}.lv2-plan.on{background:var(--p);color:#fff}
      .lv2-add-day{margin:12px 16px 16px;width:calc(100% - 32px);padding:12px;border:0;border-radius:14px;background:#efedff;color:#5d4de5;font-weight:800;cursor:pointer}
    `;document.head.appendChild(s);
  }

  function render(){
    style();const page=$('#trips'),t=current(),p=plan();if(!page||!t||!p)return;
    const cities=cityList(t,p);let city=window._lv2City;if(!cities.includes(city))city=cities[0]||'';window._lv2City=city;
    const indices=daysForCity(t,p,city);let dayIndex=Number(window._lv2Day);if(!indices.includes(dayIndex))dayIndex=indices[0]??0;window._lv2Day=dayIndex;
    const d=p.days?.[dayIndex],items=Array.isArray(d?.items)?d.items:[];
    const showPlans=alternateEnabled(t)&&Array.isArray(t.plans)&&t.plans.length>1;
    page.innerHTML=`<div class="lv2">
      <div class="lv2-head"><button class="lv2-back" id="lv2Back">‹</button><div class="lv2-title"><h2>${esc(t.name||'我的行程')}</h2><p>${esc(t.start||'')} ${t.end?'→ '+esc(t.end):''}</p></div><button class="lv2-more" id="lv2More">⋯</button></div>
      ${showPlans?`<div class="lv2-plans">${t.plans.map(x=>`<button class="lv2-plan ${x.id===p.id?'on':''}" data-plan="${esc(x.id)}">${esc(x.name||('方案 '+x.id))}</button>`).join('')}</div>`:''}
      <div class="lv2-row" aria-label="行程城市">${cities.map(c=>`<button class="lv2-city ${c===city?'on':''}" data-city="${esc(c)}">${esc(c)}</button>`).join('')}</div>
      <div class="lv2-row" aria-label="城市日期">${indices.map(i=>{const x=p.days[i];return `<button class="lv2-date ${i===dayIndex?'on':''}" data-day="${i}"><b>${esc(x?.title||x?.label||('DAY '+(i+1)))}</b><small>${esc(x?.date||'')}</small></button>`}).join('')}</div>
      <div class="lv2-detail-label">当天行程详情</div>
      <section class="lv2-day"><div class="lv2-day-meta"><div class="date">${esc(d?.date||'')}</div><h3>${esc(d?.title||d?.label||('DAY '+(dayIndex+1)))}</h3><p>${esc(city)} · ${items.length} 项安排</p></div>
      ${items.length?items.map((x,k)=>{const addr=x?.address||'';const stop=x?.stopLabel||`第 ${Number(x?.stop||k+1)} 站`;return `<article class="lv2-event"><div class="lv2-stop">${esc(stop)}</div><div class="lv2-card"><span class="lv2-type">${esc(x?.type||'行程')}</span><h3>${esc(x?.name||'未命名')}</h3>${addr?`<div class="lv2-address">📍 ${esc(addr)}</div>`:''}${x?.note?`<div class="lv2-note">${esc(x.note)}</div>`:''}<div class="lv2-actions">${addr?`<button data-copy="${encodeURIComponent(addr)}">复制地址</button><button data-nav-name="${encodeURIComponent(x?.name||'')}" data-nav-address="${encodeURIComponent(addr)}">导航</button>`:''}<button data-edit="${k}">编辑</button><button data-delete="${k}">删除</button></div></div></article>`}).join(''):`<div class="lv2-empty">当天还没有安排</div>`}
      <button class="lv2-add-day" id="lv2AddDay">＋ 添加行程节点</button></section></div>`;

    $('#lv2Back').onclick=()=>{window._lv2City=null;window._lv2Day=0;window.renderTrips?.()};
    $('#lv2More').onclick=()=>window.openPlanEditor?.();
    $('#lv2AddDay').onclick=()=>{if(typeof window.__lvbanOpenCreateDay==='function')window.__lvbanOpenCreateDay();else if(typeof window.openCreateDayForm==='function')window.openCreateDayForm();};
    $$('.lv2-plan').forEach(b=>b.onclick=()=>{window.activePlan=b.dataset.plan;window._lv2Day=0;render()});
    $$('.lv2-city').forEach(b=>b.onclick=()=>{window._lv2City=b.dataset.city;window._lv2Day=0;render()});
    $$('.lv2-date').forEach(b=>b.onclick=()=>{window._lv2Day=Number(b.dataset.day);render()});
    $$('[data-copy]').forEach(b=>b.onclick=()=>copy(decodeURIComponent(b.dataset.copy)));
    $$('[data-nav-address]').forEach(b=>b.onclick=()=>nav(decodeURIComponent(b.dataset.navName),decodeURIComponent(b.dataset.navAddress)));
    $$('[data-edit]').forEach(b=>b.onclick=()=>{window.activeDay=dayIndex;window.openItemEditor?.(Number(b.dataset.edit))});
    $$('[data-delete]').forEach(b=>b.onclick=()=>window.__lvbanDeleteItem?.(Number(b.dataset.delete)));
  }

  window._lvbanTripCanvasV2=render;window._lvbanTripCanvas=render;window.lvTripLayoutV2={render};window.renderTripDetail=render;
})();
