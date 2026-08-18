/* 旅伴｜景点 / 美食 / 酒店统一加入行程逻辑
   基准规则：
   1. 先选择“大行程”；
   2. 大行程必须真正包含当前项目所在城市，不能因为大行程的全局 cities 字段而误判所有方案；
   3. 只显示该大行程中真正包含当前城市的日期；
   4. 默认日期不是简单取“当前城市最后一天”，而是取该城市在该大行程中的最后一个已有行程日；新增项目接在这一天的最后一个节点之后；
   5. 如果当前城市在大行程中还没有日期，不允许偷偷添加到别的城市日期；提示用户先建立该城市日期；
   6. 景点 / 美食 / 酒店共用同一套选择器和写入上下文。
*/
(function(){
  'use strict';
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
  const text=v=>String(v??'').trim();
  const arr=v=>Array.isArray(v)?v:[];
  const idOf=o=>String(o?.id??o?.tripId??o?.planId??'');
  const cityOfDay=d=>text(d?.city||d?.cities?.[0]||d?.locationCity||d?.destination||'');
  const dayOrder=(d,i)=>{const n=Number(d?.order??d?.index??d?.dayIndex??d?.day??i);return Number.isFinite(n)?n:i};
  const dayLabel=(d,i)=>text(d?.title||d?.label||d?.name||`DAY ${i+1}`)||`DAY ${i+1}`;
  const dayDate=d=>text(d?.date||d?.dayDate||d?.startDate||'');
  const dayItems=d=>arr(d?.items||d?.events||d?.stops||d?.nodes);
  function splitCities(v){
    const out=[];
    const push=x=>{
      if(Array.isArray(x)) return x.forEach(push);
      if(typeof x!=='string') return;
      x.split(/[→,，、/|]+/).map(text).filter(Boolean).forEach(s=>out.push(s));
    };
    push(v); return out;
  }
  function directCities(o){
    const out=[];
    ['city','cities','route','routeCities','destinations','destination'].forEach(k=>splitCities(o?.[k]).forEach(x=>out.push(x)));
    return [...new Set(out)];
  }
  function sameCity(a,b){
    const x=text(a),y=text(b); if(!x||!y)return false;
    return x===y || x.includes(y) || y.includes(x);
  }
  function dayHasCity(d,city){
    if(!city)return true;
    return directCities(d).some(c=>sameCity(c,city));
  }
  function planHasCity(p,city){
    if(!city)return true;
    if(directCities(p).some(c=>sameCity(c,city)))return true;
    return arr(p?.days).some(d=>dayHasCity(d,city));
  }
  function tripHasCity(t,city){
    if(!city)return true;
    if(directCities(t).some(c=>sameCity(c,city)))return true;
    return arr(t?.plans).some(p=>planHasCity(p,city)) || arr(t?.days).some(d=>dayHasCity(d,city));
  }
  function plansForCity(t,city){
    return arr(t?.plans).filter(p=>planHasCity(p,city));
  }
  function daysForCity(p,city){
    return arr(p?.days).map((d,i)=>({d,i}))
      .filter(x=>!city || dayHasCity(x.d,city))
      .sort((a,b)=>dayOrder(a.d,a.i)-dayOrder(b.d,b.i));
  }
  function injectStyle(){
    if(document.getElementById('lvbanUnifiedAddFlowStyle'))return;
    const s=document.createElement('style');s.id='lvbanUnifiedAddFlowStyle';s.textContent=`
      .lv-add-unified-mask{position:fixed;inset:0;z-index:320;background:rgba(23,23,42,.42);display:flex;align-items:flex-end}
      .lv-add-unified-sheet{width:100%;max-height:88vh;overflow:auto;background:#f8f8fc;border-radius:28px 28px 0 0;padding:20px;box-sizing:border-box;box-shadow:0 -16px 50px rgba(40,35,90,.14)}
      .lv-add-unified-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}.lv-add-unified-head b{font-size:20px}
      .lv-add-unified-close{border:1px solid #e5e2ef;background:#fff;border-radius:13px;padding:9px 13px}
      .lv-add-unified-item{background:#fff;border-radius:17px;padding:13px 15px;margin-bottom:12px}.lv-add-unified-item b{font-size:16px}.lv-add-unified-item small{display:block;color:#888;margin-top:5px}
      .lv-add-unified-label{font-size:12px;color:#777;margin:12px 0 7px;font-weight:700}
      .lv-add-unified-select{width:100%;padding:14px 13px;border:1px solid #e4e1ef;border-radius:15px;background:#fff;font-size:14px;outline:0}
      .lv-add-unified-select:focus{border-color:#6958f5;box-shadow:0 0 0 3px rgba(105,88,245,.10)}
      .lv-add-unified-hint{margin-top:7px;font-size:11px;color:#9291a2;line-height:1.5}
      .lv-add-unified-confirm{width:100%;margin-top:17px;padding:14px;border:0;border-radius:16px;background:#6958f5;color:#fff;font-weight:900;font-size:15px}
      .lv-add-unified-empty{padding:22px 4px;color:#777;text-align:center;line-height:1.7}.lv-add-unified-empty b{display:block;color:#333;margin-bottom:5px}
    `;document.head.appendChild(s)
  }
  function addFromCatalogUnified(item){
    const trips=arr(window.db?.trips),city=text(item?.city);
    if(!trips.length){alert('目前还没有可加入的行程，请先创建大行程');return}
    const candidates=trips.filter(t=>tripHasCity(t,city));
    injectStyle();
    const mask=document.createElement('div');mask.className='lv-add-unified-mask';
    mask.innerHTML=`<div class="lv-add-unified-sheet"><div class="lv-add-unified-head"><b>加入行程</b><button class="lv-add-unified-close">关闭</button></div><div class="lv-add-unified-item"><b>${esc(item?.name||'未命名')}</b><small>${esc(city||'未识别城市')} · ${esc(item?.address||'')}</small></div><div id="lvAddUnifiedBody"></div></div>`;
    document.body.appendChild(mask);
    const body=mask.querySelector('#lvAddUnifiedBody');mask.querySelector('.lv-add-unified-close').onclick=()=>mask.remove();
    if(!candidates.length){body.innerHTML=`<div class="lv-add-unified-empty"><b>没有匹配的大行程</b>当前没有包含“${esc(city)}”的行程，请先在“我的行程”中加入该城市。</div>`;return}
    body.innerHTML=`<div class="lv-add-unified-label">选择大行程</div><select id="lvAddUnifiedTrip" class="lv-add-unified-select"></select><div class="lv-add-unified-label">选择方案</div><select id="lvAddUnifiedPlan" class="lv-add-unified-select"></select><div class="lv-add-unified-label">选择哪一天</div><select id="lvAddUnifiedDay" class="lv-add-unified-select"></select><div id="lvAddUnifiedHint" class="lv-add-unified-hint"></div><button class="lv-add-unified-confirm">加入当天行程</button>`;
    const tripSel=mask.querySelector('#lvAddUnifiedTrip'),planSel=mask.querySelector('#lvAddUnifiedPlan'),daySel=mask.querySelector('#lvAddUnifiedDay'),hint=mask.querySelector('#lvAddUnifiedHint');
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
      const plans=plansForCity(t,city);
      const p=plans.find(x=>idOf(x)===String(planSel.value))||plans[0];
      if(!p){daySel.innerHTML='';hint.textContent='该大行程没有包含当前城市的方案。';return}
      const list=daysForCity(p,city);
      if(!list.length){
        daySel.innerHTML='';
        hint.textContent=`该方案目前没有“${city}”的日期，不能把项目加入其他城市的日期。请先在大行程中建立该城市的日期。`;
        return;
      }
      daySel.innerHTML=list.map(x=>{const d=x.d,count=dayItems(d).length;return `<option value="${x.i}">${esc(dayLabel(d,x.i))} · ${esc(dayDate(d)||'日期待定')}${count?` · ${count}项`:''}</option>`}).join('');
      let target=list[list.length-1];
      if(preferredDayIndex!=null&&list.some(x=>x.i===preferredDayIndex))target=list.find(x=>x.i===preferredDayIndex);
      daySel.value=String(target.i);
      const selected=list.find(x=>String(x.i)===String(daySel.value));
      if(selected){
        const count=dayItems(selected.d).length;
        hint.textContent=count?`将接在 ${dayLabel(selected.d,selected.i)} 当前 ${count} 个行程节点之后，作为第 ${count+1} 站。`:`${dayLabel(selected.d,selected.i)} 暂无节点，将作为第一站。`;
      }
    }
    tripSel.onchange=()=>refreshPlans();
    planSel.onchange=()=>refreshDays();
    daySel.onchange=()=>refreshDays(Number(daySel.value));
    mask.querySelector('.lv-add-unified-confirm').onclick=()=>{
      const t=candidates.find(x=>idOf(x)===String(tripSel.value));
      const plans=plansForCity(t,city);
      const p=plans.find(x=>idOf(x)===String(planSel.value))||plans[0];
      const i=Number(daySel.value),d=p?.days?.[i];
      if(!t||!p||!d||!dayHasCity(d,city)){alert(`请选择包含“${city}”的有效日期`);return}
      window.activeTrip=t.id;window.activePlan=p.id;window._lv2Day=i;window._lv2City=cityOfDay(d)||city;window._lvbanCatalogPending=item;
      mask.remove();
      if(typeof window.__lvbanOpenCreateDay==='function')window.__lvbanOpenCreateDay();else alert('每日行程入口暂未加载，请稍后再试');
    };
    refreshPlans();
  }
  function install(){window.addFromCatalog=addFromCatalogUnified;window.LVBAN_UNIFIED_ADD_FLOW=addFromCatalogUnified}
  install();[0,100,300,800,1500,2500].forEach(ms=>setTimeout(install,ms));
})();
