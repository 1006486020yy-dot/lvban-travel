/* 旅伴旅行管家 · 新建行程 V2 · ACTIVE RUNTIME */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  const daysBetween=(a,b)=>{if(!a||!b)return 0;const x=new Date(a+'T00:00:00'),y=new Date(b+'T00:00:00');return y>=x?Math.floor((y-x)/86400000)+1:0};
  const fmt=d=>{if(!d)return '';const [y,m,day]=d.split('-');return `${y}年${Number(m)}月${Number(day)}日`};
  const recommended=['北京','上海','杭州','成都','重庆','南京','西安','广州','深圳','三亚','福州','厦门'];
  const fallback=['北京','上海','杭州','成都','重庆','南京','西安','广州','深圳','三亚','福州','平潭','泉州','厦门','青岛','大连','苏州','长沙','武汉','桂林','昆明','大理','丽江','珠海','汕头','香港','澳门'];
  const allCities=()=>[...new Set(fallback.concat(window.LVBAN_DATA?.cities||[]).filter(Boolean))];
  const state=()=>window.__lvNewTripState||(window.__lvNewTripState={start:'',end:'',cities:[],cityDays:{},picker:false});
  const toastMsg=t=>window.toast?window.toast(t):alert(t);
  const uid=()=>`trip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;

  function css(){
    if($('#lv-new-trip-v2-style'))return;
    const s=document.createElement('style');s.id='lv-new-trip-v2-style';
    s.textContent=`
      #modal.lvntv2-modal{z-index:100000!important;pointer-events:auto!important}
      .lvntv2-modal .sheet{position:relative;z-index:100001;pointer-events:auto!important;max-height:92vh;overflow:auto}
      .lvntv2{display:grid;gap:12px;pointer-events:auto}
      .lvntv2 label{font-size:12px;color:#77788b}
      .lvntv2 input{width:100%;padding:12px;border:1px solid #e8e6f4;border-radius:14px;background:#fff;outline:0;box-sizing:border-box}
      .lvntv2-date{display:grid;grid-template-columns:1fr 1fr;gap:8px}.lvntv2-datebox{padding:10px;border:1px solid #e8e6f4;border-radius:16px;background:#fff}.lvntv2-datebox b{display:block;font-size:11px;color:#77788b;margin-bottom:5px}.lvntv2-datebox input{border:0;padding:2px 0;background:transparent}
      .lvntv2-hint{font-size:11px;color:#77788b;line-height:1.5}
      .lvntv2-city-summary{border:1px solid #e8e6f4;border-radius:17px;background:#fff;padding:12px;cursor:pointer}
      .lvntv2-city-summary-head{display:flex;align-items:center;justify-content:space-between}.lvntv2-city-summary-head b{font-size:14px}.lvntv2-city-summary-head span{font-size:11px;color:#77788b}
      .lvntv2-city-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.lvntv2-city-chip{display:inline-flex;align-items:center;gap:5px;padding:7px 10px;border-radius:12px;background:#f0eeff;color:#5d4de5;font-size:12px}.lvntv2-city-chip button{border:0;background:transparent;color:inherit;padding:0 1px;font-weight:900;cursor:pointer}
      .lvntv2-city-placeholder{padding:9px 0 2px;color:#9a99aa;font-size:12px}
      .lvntv2-city-panel{display:none;position:relative;margin-top:8px;padding:13px;border:1px solid #e8e6f4;border-radius:18px;background:#fff;box-shadow:0 12px 30px rgba(50,45,90,.08)}.lvntv2-city-panel.open{display:block}
      .lvntv2-search{position:relative}.lvntv2-search input{padding-left:38px;border-radius:13px;background:#f7f6fb}.lvntv2-search-icon{position:absolute;left:13px;top:12px;color:#888;font-size:14px;z-index:2}
      .lvntv2-panel-title{font-size:11px;color:#77788b;margin:13px 0 7px}.lvntv2-city-grid{display:flex;flex-wrap:wrap;gap:7px}.lvntv2-city-btn{padding:8px 11px;border:1px solid #e8e6f4;border-radius:12px;background:#fff;color:#444;font-size:12px;cursor:pointer}.lvntv2-city-btn.on{background:#6958f5;color:#fff;border-color:#6958f5}.lvntv2-custom{display:none;margin-top:9px;padding:10px;border-radius:13px;background:#f7f6fb;color:#5d4de5;font-size:12px;cursor:pointer}.lvntv2-custom.show{display:block}
      .lvntv2-selected-count{font-size:11px;color:#77788b;margin-top:12px}.lvntv2-done{width:100%;margin-top:10px;padding:11px;border:0;border-radius:13px;background:#6958f5;color:#fff;font-weight:800;cursor:pointer}
      .lvntv2-days-wrap{display:grid;gap:8px}.lvntv2-day-card{display:grid;grid-template-columns:1fr auto auto auto;align-items:center;gap:8px;padding:11px 12px;border:1px solid #e8e6f4;border-radius:16px;background:#fff}.lvntv2-day-city{font-weight:800}.lvntv2-day-sub{display:block;margin-top:3px;font-size:10px;color:#999}.lvntv2-step{width:32px;height:32px;border:0;border-radius:10px;background:#efedff;color:#5d4de5;font-weight:900;font-size:17px;cursor:pointer}.lvntv2-count{min-width:48px;text-align:center;font-weight:800;font-size:12px}.lvntv2-total{display:flex;justify-content:space-between;padding:10px 12px;border-radius:14px;background:#f0eeff;color:#5d4de5;font-size:12px;font-weight:800}.lvntv2-error{font-size:11px;color:#d64d5b;line-height:1.5}.lvntv2-hidden{display:none!important}.lvntv2-create{display:block!important;width:100%!important;position:relative!important;z-index:100002!important;pointer-events:auto!important;cursor:pointer!important;margin-top:4px}
    `;
    document.head.appendChild(s);
  }

  function distribute(cities,total){
    const out={}; if(!cities.length)return out;
    let left=total;
    cities.forEach((c,i)=>{const remain=cities.length-i;out[c]=i===cities.length-1?left:Math.max(1,Math.floor(left/remain));left-=out[c]});
    return out;
  }

  function updateDaysForCities(cities){
    const s=state(),total=daysBetween(s.start,s.end);let cityDays={...s.cityDays};
    Object.keys(cityDays).forEach(x=>{if(!cities.includes(x))delete cityDays[x]});
    if(total>0&&cities.length&&total>=cities.length) cityDays=distribute(cities,total);
    else cities.forEach(x=>{if(!cityDays[x])cityDays[x]=1});
    window.__lvNewTripState={...s,cities,cityDays};
  }

  function renderCities(){
    const s=state(),chips=$('#lvntv2Selected'),grid=$('#lvntv2CityGrid'),rec=$('#lvntv2Recommended'),search=$('#lvntv2CitySearch'),custom=$('#lvntv2Custom'),count=$('#lvntv2SelectedCount');
    if(chips) chips.innerHTML=s.cities.length?s.cities.map(c=>`<span class="lvntv2-city-chip">${esc(c)}<button type="button" data-remove-city="${esc(c)}">×</button></span>`).join(''):'<span class="lvntv2-city-placeholder">点击这里添加目的地，可选择多个城市</span>';
    chips?.querySelectorAll('[data-remove-city]').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();toggleCity(b.dataset.removeCity)});
    const q=(search?.value||'').trim().toLowerCase();
    const list=allCities().filter(c=>!q||c.toLowerCase().includes(q));
    const paint=(root,arr)=>{if(!root)return;root.innerHTML=arr.map(c=>`<button type="button" class="lvntv2-city-btn ${s.cities.includes(c)?'on':''}" data-city="${esc(c)}">${esc(c)}</button>`).join('');root.querySelectorAll('[data-city]').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();toggleCity(b.dataset.city)})};
    paint(rec,q?[]:recommended);paint(grid,list);
    if(custom){custom.classList.toggle('show',!!q&&!list.some(c=>c.toLowerCase()===q));custom.innerHTML=q?`＋ 使用“${esc(search.value.trim())}”作为自定义城市`:'';}
    if(count)count.textContent=`已选择 ${s.cities.length} 个城市`;
  }

  function addTypedCity(){
    const input=$('#lvntv2CitySearch');if(!input)return false;const c=input.value.trim();if(!c)return false;
    const s=state();if(s.cities.some(x=>x.toLowerCase()===c.toLowerCase())){input.value='';renderCities();return false}
    updateDaysForCities(s.cities.concat(c));input.value='';renderCities();renderDays();return true;
  }

  function toggleCity(c){
    const s=state();const cities=s.cities.includes(c)?s.cities.filter(x=>x!==c):s.cities.concat(c);
    updateDaysForCities(cities);renderCities();renderDays();
  }

  function renderDays(){
    const s=state(),wrap=$('#lvntv2DaysWrap'),box=$('#lvntv2Days');if(!wrap||!box)return;
    if(!s.cities.length){wrap.classList.add('lvntv2-hidden');return}wrap.classList.remove('lvntv2-hidden');
    const total=daysBetween(s.start,s.end);if(!total){box.innerHTML='<div class="lvntv2-hint">选择出行日期后，这里会自动分配各城市天数。</div>';return}
    if(total<s.cities.length){box.innerHTML=`<div class="lvntv2-error">当前行程共 ${total} 天，但选择了 ${s.cities.length} 个城市。至少需要给每个城市安排 1 天。</div>`;return}
    let sum=0;
    box.innerHTML=s.cities.map(c=>{const v=Number(s.cityDays[c]||1);sum+=v;return `<div class="lvntv2-day-card"><div><span class="lvntv2-day-city">${esc(c)}</span><span class="lvntv2-day-sub">停留天数</span></div><button type="button" class="lvntv2-step" data-city="${esc(c)}" data-op="minus">−</button><span class="lvntv2-count">${v} 天</span><button type="button" class="lvntv2-step" data-city="${esc(c)}" data-op="plus">＋</button></div>`}).join('')+`<div class="lvntv2-total"><span>行程总天数</span><span>${sum} / ${total} 天</span></div>`+(sum===total?'<div class="lvntv2-hint">城市天数已分配完成。</div>':`<div class="lvntv2-error">还差 ${total-sum} 天，请调整城市停留天数。</div>`);
    box.querySelectorAll('[data-op]').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();const s=state(),city=b.dataset.city,cur=Number(s.cityDays[city]||1),other=s.cities.filter(x=>x!==city).reduce((n,x)=>n+Number(s.cityDays[x]||1),0),vals={...s.cityDays};if(b.dataset.op==='minus'&&cur>1)vals[city]=cur-1;if(b.dataset.op==='plus'&&other+cur<total)vals[city]=cur+1;window.__lvNewTripState={...s,cityDays:vals};renderDays()});
  }

  function open(){
    css();window.__lvNewTripState={start:'',end:'',cities:[],cityDays:{},picker:false};
    const html=`<div class="lvntv2">
      <div class="trip-level">一级类目：我的行程</div>
      <label>行程名称</label><input id="lvntv2Name" placeholder="例如：十一福建游">
      <label>出行日期</label><div class="lvntv2-date"><div class="lvntv2-datebox"><b>开始日期</b><input id="lvntv2Start" type="date"></div><div class="lvntv2-datebox"><b>结束日期</b><input id="lvntv2End" type="date"></div></div>
      <div id="lvntv2DateHint" class="lvntv2-hint">先选择开始和结束日期。</div>
      <label>选择城市</label>
      <div id="lvntv2CitySummary" class="lvntv2-city-summary"><div class="lvntv2-city-summary-head"><b>目的地</b><span>点击添加 / 多选</span></div><div id="lvntv2Selected" class="lvntv2-city-chips"></div></div>
      <div id="lvntv2CityPanel" class="lvntv2-city-panel">
        <div class="lvntv2-search"><span class="lvntv2-search-icon">⌕</span><input id="lvntv2CitySearch" placeholder="搜索或输入城市名称"></div>
        <div id="lvntv2Custom" class="lvntv2-custom"></div>
        <div class="lvntv2-panel-title">推荐城市</div><div id="lvntv2Recommended" class="lvntv2-city-grid"></div>
        <div class="lvntv2-panel-title">更多城市</div><div id="lvntv2CityGrid" class="lvntv2-city-grid"></div>
        <div id="lvntv2SelectedCount" class="lvntv2-selected-count">已选择 0 个城市</div>
        <button type="button" id="lvntv2Done" class="lvntv2-done">完成选择</button>
      </div>
      <div id="lvntv2DaysWrap" class="lvntv2-hidden"><label>城市停留天数</label><div id="lvntv2Days" class="lvntv2-days-wrap"></div></div>
      <button type="button" class="btn primary lvntv2-create" id="lvntv2Create">创建行程</button>
    </div>`;
    if(typeof window.modal!=='function'){toastMsg('新建行程窗口加载失败');return}
    window.modal('新建行程',html);$('#modal')?.classList.add('lvntv2-modal');
    const st=$('#lvntv2Start'),en=$('#lvntv2End'),summary=$('#lvntv2CitySummary'),panel=$('#lvntv2CityPanel'),search=$('#lvntv2CitySearch'),done=$('#lvntv2Done'),createBtn=$('#lvntv2Create');
    st.onchange=()=>{const s=state();s.start=st.value;if(!s.end||s.end<s.start)s.end='';en.min=st.value;en.value=s.end;window.__lvNewTripState=s;$('#lvntv2DateHint').textContent='已选择开始日期，请选择结束日期。';renderDays()};
    en.onchange=()=>{const s=state();s.end=en.value;window.__lvNewTripState=s;$('#lvntv2DateHint').textContent=en.value?`行程日期：${fmt(s.start)} → ${fmt(s.end)}`:'请选择结束日期';updateDaysForCities(s.cities);renderDays()};
    summary.onclick=e=>{if(e.target.closest('button'))return;const openNow=!panel.classList.contains('open');panel.classList.toggle('open',openNow);window.__lvNewTripState={...state(),picker:openNow};if(openNow){renderCities();setTimeout(()=>search.focus(),50)}};
    search.oninput=()=>{panel.classList.add('open');renderCities()};
    search.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();addTypedCity()}};
    $('#lvntv2Custom').onclick=e=>{e.preventDefault();e.stopPropagation();addTypedCity()};
    done.onclick=e=>{e.preventDefault();panel.classList.remove('open');window.__lvNewTripState={...state(),picker:false};renderCities();renderDays()};
    const runCreate=e=>{e.preventDefault();e.stopPropagation();create()};createBtn.onclick=runCreate;createBtn.addEventListener('click',runCreate,true);
    renderCities();renderDays();
  }

  function create(){
    if($('#lvntv2CitySearch')?.value.trim())addTypedCity();
    const s=state(),name=$('#lvntv2Name')?.value.trim(),total=daysBetween(s.start,s.end),sum=s.cities.reduce((n,c)=>n+Number(s.cityDays[c]||0),0);
    if(!name)return toastMsg('请先填写行程名称');if(!s.start||!s.end)return toastMsg('请选择开始和结束日期');if(!s.cities.length)return toastMsg('请选择至少一个城市');if(total!==sum)return toastMsg(`城市天数合计 ${sum} 天，但行程共 ${total} 天，请调整。`);
    const ranges=[];let cur=new Date(s.start+'T00:00:00');const days=[];
    s.cities.forEach(c=>{const n=Number(s.cityDays[c]);const st=cur.toISOString().slice(0,10);for(let i=0;i<n;i++){const d=cur.toISOString().slice(0,10);days.push({id:uid(),label:`DAY ${days.length+1}`,date:d,title:'待安排',city:c,items:[]});cur.setDate(cur.getDate()+1)}ranges.push({city:c,days:n,start:st,end:new Date(cur.getTime()-86400000).toISOString().slice(0,10)})});
    const t={id:uid(),name,start:s.start,end:s.end,city:s.cities.join(' · '),cities:s.cities.slice(),cityDays:{...s.cityDays},cityRanges:ranges,people:1,plans:[{id:'A',name:'方案 A',days}]};
    const db=window.db||(window.db={trips:[]});db.trips=Array.isArray(db.trips)?db.trips:[];db.trips.push(t);window.activeTrip=t.id;window.activePlan='A';window.activeDay=0;window._utCity=s.cities[0];window._utDay=0;
    if(typeof window.save==='function')window.save();
    try{localStorage.setItem('lvban-trips',JSON.stringify((JSON.parse(localStorage.getItem('lvban-trips')||'[]')).concat([{id:t.id,name:t.name,start:t.start,end:t.end,city:t.city,cities:t.cities,cityDays:t.cityDays,cityRanges:t.cityRanges}])))}catch(e){}
    if(typeof window.closeModal==='function')window.closeModal();if(typeof window.go==='function')window.go('trips');if(typeof window.renderTrips==='function')window.renderTrips();
    const detail=window.__lvbanOpenTripDetail||window.openTripCanvas;if(typeof detail==='function')detail(t.id);else{window.activeTrip=t.id;window.__lvbanRenderTripDetail?.()}
    toastMsg('行程已创建');
  }
  window.newTrip=open;window.openNewTrip=open;window.__lvbanNewTripV2=true;
})();
