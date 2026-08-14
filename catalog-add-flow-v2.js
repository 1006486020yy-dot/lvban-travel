/* 旅伴｜目录加入行程 V2
   规则：
   1. 只显示实际包含当前城市的大行程；
   2. 只显示该大行程中包含当前城市的方案；
   3. 日期严格沿用该方案的 DAY 顺序，并优先定位到该城市最后一个已有行程日；
   4. 不改“我的行程 V3”页面本身，只负责从目录选择目标日后进入现有“添加行程节点”。
*/
(function(){
  'use strict';
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
  const text=v=>String(v??'').trim();
  const arr=v=>Array.isArray(v)?v:[];
  const idOf=o=>String(o?.id??o?.tripId??o?.planId??'');
  const cityOfDay=d=>text(d?.city||d?.cities?.[0]||d?.locationCity||d?.destination||'');
  const dayOrder=(d,i)=>{
    const n=Number(d?.order??d?.index??d?.dayIndex??d?.day??i);
    return Number.isFinite(n)?n:i;
  };
  const dayLabel=(d,i)=>text(d?.title||d?.label||d?.name||`DAY ${i+1}`)||`DAY ${i+1}`;
  const dayDate=d=>text(d?.date||d?.dayDate||d?.startDate||'');
  const dayItems=d=>arr(d?.items||d?.events||d?.stops||d?.nodes);

  function allTripCities(t){
    const out=[];
    const push=v=>{if(Array.isArray(v))v.forEach(push);else if(typeof v==='string'){v.split(/[→,，、/|\s]+/).map(text).filter(Boolean).forEach(x=>out.push(x))}};
    ['city','cities','route','routeCities','destinations','destination'].forEach(k=>push(t?.[k]));
    arr(t?.plans).forEach(p=>{
      ['city','cities','route','routeCities','destinations','destination'].forEach(k=>push(p?.[k]));
      arr(p?.days).forEach(d=>push(cityOfDay(d)));
    });
    return [...new Set(out)];
  }
  function tripHasCity(t,city){
    if(!city)return true;
    const target=text(city);
    return allTripCities(t).some(c=>c===target||c.includes(target)||target.includes(c));
  }
  function plansForCity(t,city){
    return arr(t?.plans).filter(p=>{
      const direct=allTripCities({...t,plans:[p]});
      return !city||direct.some(c=>c===text(city)||c.includes(text(city))||text(city).includes(c));
    });
  }
  function daysForCity(p,city){
    const days=arr(p?.days).map((d,i)=>({d,i}));
    const cityDays=city?days.filter(x=>{const c=cityOfDay(x.d);return c===text(city)||c.includes(text(city))||text(city).includes(c)}):days;
    return (cityDays.length?cityDays:days).sort((a,b)=>dayOrder(a.d,a.i)-dayOrder(b.d,b.i));
  }
  function injectStyle(){
    if(document.getElementById('lvbanAddFlowV2Style'))return;
    const s=document.createElement('style');s.id='lvbanAddFlowV2Style';s.textContent=`
      .lv-add-v2-mask{position:fixed;inset:0;z-index:310;background:rgba(23,23,42,.42);display:flex;align-items:flex-end}
      .lv-add-v2-sheet{width:100%;max-height:88vh;overflow:auto;background:#f8f8fc;border-radius:28px 28px 0 0;padding:20px;box-sizing:border-box;box-shadow:0 -16px 50px rgba(40,35,90,.14)}
      .lv-add-v2-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}.lv-add-v2-head b{font-size:20px}
      .lv-add-v2-close{border:1px solid #e5e2ef;background:#fff;border-radius:13px;padding:9px 13px}
      .lv-add-v2-item{background:#fff;border-radius:17px;padding:13px 15px;margin-bottom:12px}.lv-add-v2-item b{font-size:16px}.lv-add-v2-item small{display:block;color:#888;margin-top:5px}
      .lv-add-v2-label{font-size:12px;color:#777;margin:12px 0 7px;font-weight:700}
      .lv-add-v2-select{width:100%;padding:14px 13px;border:1px solid #e4e1ef;border-radius:15px;background:#fff;font-size:14px;outline:0}
      .lv-add-v2-select:focus{border-color:#6958f5;box-shadow:0 0 0 3px rgba(105,88,245,.10)}
      .lv-add-v2-hint{margin-top:7px;font-size:11px;color:#9291a2}.lv-add-v2-confirm{width:100%;margin-top:17px;padding:14px;border:0;border-radius:16px;background:#6958f5;color:#fff;font-weight:900;font-size:15px}
      .lv-add-v2-empty{padding:22px 4px;color:#777;text-align:center;line-height:1.7}.lv-add-v2-empty b{display:block;color:#333;margin-bottom:5px}
    `;document.head.appendChild(s);
  }
  function addFromCatalogV2(item){
    const trips=arr(window.db?.trips);
    const city=text(item?.city);
    if(!trips.length){alert('目前还没有可加入的行程，请先创建大行程');return;}
    const candidates=trips.filter(t=>tripHasCity(t,city));
    injectStyle();
    const mask=document.createElement('div');mask.className='lv-add-v2-mask';
    mask.innerHTML=`<div class="lv-add-v2-sheet"><div class="lv-add-v2-head"><b>加入行程</b><button class="lv-add-v2-close">关闭</button></div><div class="lv-add-v2-item"><b>${esc(item?.name||'未命名')}</b><small>${esc(city||'未识别城市')} · ${esc(item?.address||'')}</small></div><div id="lvAddV2Body"></div></div>`;
    document.body.appendChild(mask);
    const body=mask.querySelector('#lvAddV2Body');
    const close=()=>mask.remove();mask.querySelector('.lv-add-v2-close').onclick=close;
    if(!candidates.length){body.innerHTML=`<div class="lv-add-v2-empty"><b>没有匹配的大行程</b>当前没有包含“${esc(city)}”的行程，请先在“我的行程”中加入该城市。</div>`;return;}
    body.innerHTML=`<div class="lv-add-v2-label">选择大行程</div><select id="lvAddV2Trip" class="lv-add-v2-select"></select><div class="lv-add-v2-label">选择方案</div><select id="lvAddV2Plan" class="lv-add-v2-select"></select><div class="lv-add-v2-label">选择哪一天</div><select id="lvAddV2Day" class="lv-add-v2-select"></select><div id="lvAddV2Hint" class="lv-add-v2-hint"></div><button class="lv-add-v2-confirm">加入当天行程</button>`;
    const tripSel=mask.querySelector('#lvAddV2Trip'),planSel=mask.querySelector('#lvAddV2Plan'),daySel=mask.querySelector('#lvAddV2Day'),hint=mask.querySelector('#lvAddV2Hint');
    tripSel.innerHTML=candidates.map((t,i)=>`<option value="${esc(idOf(t))}">${esc(t.name||`行程 ${i+1}`)}</option>`).join('');

    function refreshPlans(preferredPlanId){
      const t=candidates.find(x=>idOf(x)===String(tripSel.value))||candidates[0];
      const plans=plansForCity(t,city);
      planSel.innerHTML=plans.map((p,i)=>`<option value="${esc(idOf(p))}">${esc(p.name||`方案 ${i+1}`)}</option>`).join('');
      if(preferredPlanId&&plans.some(p=>idOf(p)===preferredPlanId))planSel.value=preferredPlanId;
      refreshDays();
    }
    function refreshDays(preferredDayIndex){
      const t=candidates.find(x=>idOf(x)===String(tripSel.value))||candidates[0];
      const plans=plansForCity(t,city);const p=plans.find(x=>idOf(x)===String(planSel.value))||plans[0];
      if(!p){daySel.innerHTML='';hint.textContent='该行程没有包含当前城市的方案。';return;}
      const list=daysForCity(p,city);
      daySel.innerHTML=list.map((x,n)=>{const d=x.d,count=dayItems(d).length;return `<option value="${x.i}">${esc(dayLabel(d,x.i))} · ${esc(dayDate(d)||'日期待定')}${count?` · ${count}项`:''}</option>`}).join('');
      let target=list[list.length-1];
      if(preferredDayIndex!=null&&list.some(x=>x.i===preferredDayIndex))target=list.find(x=>x.i===preferredDayIndex);
      else {
        // 默认接着当前城市最后一个已有行程日：如果最后一天有节点，就定位到它；否则定位到最后一个城市日。
        const withItems=[...list].filter(x=>dayItems(x.d).length);
        if(withItems.length)target=withItems[withItems.length-1];
      }
      if(target)daySel.value=String(target.i);
      const selected=list.find(x=>String(x.i)===String(daySel.value));
      if(selected){const count=dayItems(selected.d).length;hint.textContent=count?`将作为“第 ${count+1} 站”添加到 ${dayLabel(selected.d,selected.i)}。`: `该日暂无行程，将作为“第一站”添加。`;}
    }
    tripSel.onchange=()=>refreshPlans();
    planSel.onchange=()=>refreshDays();
    daySel.onchange=()=>refreshDays(Number(daySel.value));
    mask.querySelector('.lv-add-v2-confirm').onclick=()=>{
      const t=candidates.find(x=>idOf(x)===String(tripSel.value));
      const plans=plansForCity(t,city);const p=plans.find(x=>idOf(x)===String(planSel.value))||plans[0];
      const i=Number(daySel.value);const d=p?.days?.[i];
      if(!t||!p||!d)return alert('请选择有效的大行程、方案和日期');
      window.activeTrip=t.id;window.activePlan=p.id;window._lv2Day=i;window._lv2City=cityOfDay(d)||city;window._lvbanCatalogPending=item;close();
      if(typeof window.__lvbanOpenCreateDay==='function')window.__lvbanOpenCreateDay();else alert('每日行程入口暂未加载，请稍后再试');
    };
    refreshPlans();
  }
  window.addFromCatalog=addFromCatalogV2;
})();
