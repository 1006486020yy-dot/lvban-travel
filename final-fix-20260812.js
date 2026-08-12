/* 旅伴旅行管家 · 2026-08-12 目的地选择器稳定修复 v5
 * 核心修复：新建行程 -> 目的地 -> 选择城市不再创建第二层 overlay。
 * 城市选择直接切换当前 modal 的内容状态，确认/取消后恢复新建行程表单。
 * 这样不会再出现“点目的地没反应，点关闭后城市选择器才出现”的前后层级错误。
 * 不改首页、景点、美食、交通、酒店、AI 以及原有行程详情布局。
 */
(function(){
  'use strict';
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const toast=m=>window.toast?.(m);
  let picked=[];
  let mode='manual';
  let formDraft={name:'',start:'',end:'',alternate:false};
  let pickerOpen=false;

  function cityList(){
    const src=window.LVBAN_CITIES;
    let list=[];
    if(src&&typeof src==='object'&&!Array.isArray(src)){
      Object.values(src).forEach(v=>{if(Array.isArray(v))list.push(...v)});
    }
    if(!list.length&&Array.isArray(window.LVBAN_CITY_LIST)){
      list=window.LVBAN_CITY_LIST.map(x=>typeof x==='string'?x:x?.city).filter(Boolean);
    }
    if(!list.length)list=['北京市','上海市','广州市','深圳市','杭州市','成都市','重庆市','西安市','福州市','厦门市','泉州市','平潭综合实验区','南京市','苏州市','武汉市','长沙市','青岛市','大连市','三亚市','桂林市'];
    return [...new Set(list.filter(Boolean))];
  }

  function modalShow(title,body){
    const modal=$('#modal');
    if(!modal)return;
    $('#modalTitle').textContent=title;
    $('#modalBody').innerHTML=body;
    modal.classList.add('show');
  }

  function snapshotForm(){
    formDraft={
      name:$('#ntName')?.value||formDraft.name||'',
      start:$('#ntStart')?.value||formDraft.start||'',
      end:$('#ntEnd')?.value||formDraft.end||'',
      alternate:!!$('#ntAlternate')?.checked
    };
  }

  function destinationText(){return picked.length?picked.join(' · '):'点击选择城市，可多选'}

  function renderNewTripForm(){
    modalShow('新建行程',`<div class="form lv-newtrip-form">
      <label>行程名称</label>
      <input id="ntName" placeholder="例如：国庆厦门慢旅行" value="${esc(formDraft.name)}">
      <label>目的地</label>
      <button type="button" id="ntDestination" class="lv-destination-field ${picked.length?'has':''}"><span>${esc(destinationText())}</span><span class="lv-destination-action">${picked.length?'重新选择 ›':'选择城市 ›'}</span></button>
      <div class="hint">点击整块区域打开选择框，支持搜索和多选城市。</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div><label>开始日期</label><input id="ntStart" type="date" value="${esc(formDraft.start)}"></div>
        <div><label>结束日期</label><input id="ntEnd" type="date" value="${esc(formDraft.end)}"></div>
      </div>
      <label class="check"><input id="ntAlternate" type="checkbox" ${formDraft.alternate?'checked':''}> 是否有备选路线<br><small>只有勾选后，才会生成方案 A / 方案 B</small></label>
      <label>你想怎么创建？</label>
      <div class="createModes"><button type="button" class="mode ${mode==='manual'?'on':''}" id="manualMode">我自己安排<small>自己添加日期和详细行程</small></button><button type="button" class="mode ${mode==='ai'?'on':''}" id="aiMode">让 AI 帮我规划<small>创建后进入 AI 规划</small></button></div>
      <button type="button" class="btn primary wide" id="lvCreateTripBtn">创建行程</button>
    </div>`);
    $('#ntDestination').onclick=e=>{e.preventDefault();e.stopPropagation();snapshotForm();showCityPicker();};
    $('#manualMode').onclick=()=>{snapshotForm();mode='manual';renderNewTripForm()};
    $('#aiMode').onclick=()=>{snapshotForm();mode='ai';renderNewTripForm()};
    $('#lvCreateTripBtn').onclick=createTrip;
  }

  function showCityPicker(){
    if(pickerOpen)return;
    snapshotForm();
    pickerOpen=true;
    const list=cityList();
    modalShow('选择目的地',`<div class="lv-city-picker">
      <div class="lv-city-selected" id="lvCitySelected"></div>
      <input id="lvCitySearch" class="lv-city-search" placeholder="搜索城市，例如：厦门、福州、成都" autocomplete="off">
      <div class="lv-city-hint">支持搜索和多选城市，点击城市即可选择 / 取消。</div>
      <div class="lv-city-list" id="lvCityList"></div>
      <div class="actions"><button type="button" class="btn" id="lvCityCancel">取消</button><button type="button" class="btn primary" id="lvCityConfirm">确认城市</button></div>
    </div>`);

    const render=()=>{
      const q=($('#lvCitySearch')?.value||'').trim();
      const arr=list.filter(c=>!q||c.includes(q)).slice(0,160);
      const listEl=$('#lvCityList');
      const selectedEl=$('#lvCitySelected');
      if(listEl)listEl.innerHTML=arr.map(c=>`<button type="button" class="lv-city-option ${picked.includes(c)?'on':''}" data-city="${esc(c)}"><span>${esc(c)}</span><small>${picked.includes(c)?'✓ 已选择':'选择'}</small></button>`).join('')||'<div class="lv-city-empty">没有找到匹配城市</div>';
      if(selectedEl)selectedEl.innerHTML=picked.length?picked.map(c=>`<span>${esc(c)} <button type="button" data-remove="${esc(c)}">×</button></span>`).join(''):'<span class="lv-city-none">暂未选择城市</span>';
    };

    $('#lvCitySearch').oninput=render;
    $('#lvCityList').onclick=e=>{
      const b=e.target.closest('[data-city]');
      if(!b)return;
      e.preventDefault();e.stopPropagation();
      const c=b.dataset.city;
      picked=picked.includes(c)?picked.filter(x=>x!==c):picked.concat(c);
      render();
    };
    $('#lvCitySelected').onclick=e=>{
      const b=e.target.closest('[data-remove]');
      if(!b)return;
      e.preventDefault();e.stopPropagation();
      picked=picked.filter(x=>x!==b.dataset.remove);
      render();
    };
    $('#lvCityCancel').onclick=e=>{
      e.preventDefault();e.stopPropagation();
      pickerOpen=false;
      renderNewTripForm();
    };
    $('#lvCityConfirm').onclick=e=>{
      e.preventDefault();e.stopPropagation();
      if(!picked.length){toast('请至少选择一个目的地');return;}
      pickerOpen=false;
      renderNewTripForm();
    };
    requestAnimationFrame(()=>$('#lvCitySearch')?.focus());
    render();
  }

  function chooseMode(m){mode=m;renderNewTripForm()}
  window.chooseMode=chooseMode;
  window.lvOpenCityPicker=showCityPicker;

  function newTrip(){
    pickerOpen=false;
    picked=[];
    mode='manual';
    formDraft={name:'',start:'',end:'',alternate:false};
    renderNewTripForm();
  }
  window.newTrip=newTrip;

  function uid(){return 'lv-'+Date.now()+Math.random().toString(36).slice(2,7)}

  function createTrip(){
    snapshotForm();
    const name=formDraft.name.trim(),start=formDraft.start,end=formDraft.end,alternate=formDraft.alternate;
    if(!name||!start||!end){toast('请填写行程名称和日期');return}
    if(end<start){toast('结束日期不能早于开始日期');return}
    if(!picked.length){toast('请选择至少一个目的地');showCityPicker();return}
    const days=[];
    let d=new Date(start+'T00:00:00');
    const last=new Date(end+'T00:00:00');
    while(d<=last){
      const c=picked[Math.min(days.length,picked.length-1)];
      days.push({id:uid(),label:'DAY '+(days.length+1),date:d.toISOString().slice(0,10),title:picked.length>1?c+' · 待安排':'待安排',city:c,items:[]});
      d.setDate(d.getDate()+1);
    }
    const clone=()=>JSON.parse(JSON.stringify(days)).map(x=>({...x,id:uid(),items:[]}));
    const t={id:uid(),name,city:picked.join(' · '),cities:[...picked],start,end,people:1,hasAlternateRoutes:alternate,plans:[{id:'A',name:'方案 A',days:clone()}]};
    if(alternate)t.plans.push({id:'B',name:'方案 B',days:clone()});
    window.db=window.db||{trips:[]};
    window.db.trips=window.db.trips||[];
    window.db.trips.push(t);
    window.activeTrip=t.id;window.activePlan='A';window.activeDay=0;
    if(typeof window.save==='function')window.save();
    else if(window.LvbanStore?.patch)window.LvbanStore.patch(s=>s.trips=window.db.trips);
    pickerOpen=false;picked=[];formDraft={name:'',start:'',end:'',alternate:false};
    window.closeModal?.();
    window.renderTrips?.();
    toast(alternate?'创建成功：已生成 A / B':'创建成功');
    if(mode==='ai')setTimeout(()=>window.go?.('ai'),120);
  }
  window.createTrip=createTrip;

  const style=document.getElementById('lv-final-interaction-style')||document.createElement('style');
  style.id='lv-final-interaction-style';
  style.textContent=`
    #modal{z-index:10000}
    .lv-newtrip-form .hint{font-size:11px;color:#8a8798;margin-top:-3px}
    .lv-destination-field{width:100%;padding:13px 14px;border:1px solid #e9e7f2;border-radius:14px;background:#fff;text-align:left;color:#777;display:flex;justify-content:space-between;align-items:center;cursor:pointer;position:relative;z-index:1;pointer-events:auto}
    .lv-destination-field span:last-child{color:#5d4de5;font-weight:800;white-space:nowrap;margin-left:10px}
    .lv-destination-field.has{color:#222}
    .lv-newtrip-form .mode{text-align:left}
    .lv-newtrip-form .mode small{display:block;color:#999;font-size:10px;margin-top:3px}
    .lv-city-picker{display:flex;flex-direction:column;gap:10px}
    .lv-city-selected{display:flex;gap:7px;flex-wrap:wrap;min-height:30px}
    .lv-city-selected>span{background:#efedff;color:#5d4de5;padding:7px 10px;border-radius:11px;font-size:12px}
    .lv-city-selected button{border:0;background:none;color:#5d4de5;padding:0 0 0 5px;cursor:pointer}
    .lv-city-none{background:transparent!important;color:#999!important;padding-left:0!important}
    .lv-city-search{width:100%;padding:13px 14px;border:1px solid #e5e2f5;border-radius:14px;background:#fff;outline:0}
    .lv-city-hint{font-size:11px;color:#888}
    .lv-city-list{max-height:48vh;overflow:auto;display:grid;gap:7px}
    .lv-city-option{padding:12px 13px;border-radius:13px;background:#fff;text-align:left;display:flex;justify-content:space-between;border:1px solid transparent;cursor:pointer}
    .lv-city-option.on{background:#efedff;border-color:#d9d3ff;color:#5d4de5}
    .lv-city-option small{color:#999}
    .lv-city-empty{padding:20px;text-align:center;color:#999}
  `;
  if(!style.parentNode)document.head.appendChild(style);
})();
