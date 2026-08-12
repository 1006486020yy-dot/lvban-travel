/* 旅伴旅行管家 · 目的地/弹窗最终兜底 v7
 * 独立于旧版本逻辑，解决：
 * 1. 新建行程 -> 目的地按钮点击无反应
 * 2. 关闭按钮无反应
 * 3. 点击目的地后城市选择器延迟到关闭时才出现
 * 4. 多层 modal / 旧事件监听造成的点击穿透与状态错乱
 */
(function(){
  'use strict';
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const citySource=()=>{
    const src=window.LVBAN_CITIES||{};
    let out=[];
    if(src&&typeof src==='object'&&!Array.isArray(src)) Object.keys(src).forEach(k=>Array.isArray(src[k])&&(out=out.concat(src[k])));
    if(!out.length&&Array.isArray(window.LVBAN_CITY_LIST)) out=window.LVBAN_CITY_LIST.map(x=>typeof x==='string'?x:x.city).filter(Boolean);
    if(!out.length) out=['北京市','上海市','广州市','深圳市','杭州市','成都市','重庆市','西安市','福州市','厦门市','泉州市','平潭综合实验区','南京市','苏州市','武汉市','长沙市','青岛市','大连市','三亚市','桂林市'];
    return [...new Set(out)];
  };
  let selected=[];
  let draft={name:'',start:'',end:'',alternate:false};
  let mode='manual';
  let picker=false;

  function close(){
    const modal=$('#modal');
    if(modal){modal.classList.remove('show');modal.setAttribute('aria-hidden','true');}
    picker=false;
  }
  window.closeModal=close;

  function open(title,html){
    const modal=$('#modal');
    if(!modal)return;
    const titleEl=$('#modalTitle'), body=$('#modalBody');
    if(titleEl)titleEl.textContent=title;
    if(body)body.innerHTML=html;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden','false');
  }
  function snapshot(){
    draft.name=$('#ntName')?.value||draft.name||'';
    draft.start=$('#ntStart')?.value||draft.start||'';
    draft.end=$('#ntEnd')?.value||draft.end||'';
    draft.alternate=!!$('#ntAlternate')?.checked;
  }
  function renderForm(){
    open('新建行程',`<div class="form lv-v7-form">
      <label>行程名称</label>
      <input id="ntName" placeholder="例如：国庆厦门慢旅行" value="${esc(draft.name)}">
      <label>目的地</label>
      <button type="button" id="lvV7Destination" class="lv-v7-destination"><span>${selected.length?esc(selected.join(' · ')):'点击选择城市，可多选'}</span><strong>${selected.length?'重新选择 ›':'选择城市 ›'}</strong></button>
      <div class="hint">点击目的地后会立即打开城市选择，不会再套第二层弹窗。</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div><label>开始日期</label><input id="ntStart" type="date" value="${esc(draft.start)}"></div>
        <div><label>结束日期</label><input id="ntEnd" type="date" value="${esc(draft.end)}"></div>
      </div>
      <label class="check"><input id="ntAlternate" type="checkbox" ${draft.alternate?'checked':''}> 是否有备选路线<br><small>只有勾选后，才会生成方案 A / 方案 B</small></label>
      <label>你想怎么创建？</label>
      <div class="createModes"><button type="button" class="mode ${mode==='manual'?'on':''}" id="lvV7Manual">我自己安排<small>自己添加日期和详细行程</small></button><button type="button" class="mode ${mode==='ai'?'on':''}" id="lvV7AI">让 AI 帮我规划<small>创建后进入 AI 规划</small></button></div>
      <button type="button" class="btn primary wide" id="lvV7Create">创建行程</button>
    </div>`);
    $('#lvV7Destination').onclick=e=>{e.preventDefault();e.stopPropagation();snapshot();renderPicker();};
    $('#lvV7Manual').onclick=e=>{e.preventDefault();snapshot();mode='manual';renderForm();};
    $('#lvV7AI').onclick=e=>{e.preventDefault();snapshot();mode='ai';renderForm();};
    $('#lvV7Create').onclick=e=>{e.preventDefault();create();};
  }
  function renderPicker(){
    snapshot();picker=true;
    open('选择目的地',`<div class="lv-v7-picker">
      <div id="lvV7Selected" class="lv-v7-selected"></div>
      <input id="lvV7Search" class="lv-v7-search" placeholder="搜索城市，例如：厦门、福州、成都" autocomplete="off">
      <div class="hint">支持搜索和多选城市，点击城市即可选择 / 取消。</div>
      <div id="lvV7List" class="lv-v7-list"></div>
      <div class="actions"><button type="button" class="btn" id="lvV7Cancel">取消</button><button type="button" class="btn primary" id="lvV7Confirm">确认城市</button></div>
    </div>`);
    const cities=citySource();
    const render=()=>{
      const q=($('#lvV7Search')?.value||'').trim();
      const arr=cities.filter(c=>!q||c.includes(q)).slice(0,160);
      const list=$('#lvV7List'), picked=$('#lvV7Selected');
      if(list)list.innerHTML=arr.map(c=>`<button type="button" class="lv-v7-city ${selected.includes(c)?'on':''}" data-city="${esc(c)}"><span>${esc(c)}</span><small>${selected.includes(c)?'✓ 已选择':'选择'}</small></button>`).join('')||'<div class="lv-v7-empty">没有找到匹配城市</div>';
      if(picked)picked.innerHTML=selected.length?selected.map(c=>`<span>${esc(c)} <button type="button" data-remove="${esc(c)}">×</button></span>`).join(''):'<span class="lv-v7-none">暂未选择城市</span>';
    };
    $('#lvV7Search').oninput=render;
    $('#lvV7List').onclick=e=>{const b=e.target.closest('[data-city]');if(!b)return;e.preventDefault();e.stopPropagation();const c=b.dataset.city;selected=selected.includes(c)?selected.filter(x=>x!==c):selected.concat(c);render();};
    $('#lvV7Selected').onclick=e=>{const b=e.target.closest('[data-remove]');if(!b)return;e.preventDefault();e.stopPropagation();selected=selected.filter(x=>x!==b.dataset.remove);render();};
    $('#lvV7Cancel').onclick=e=>{e.preventDefault();e.stopPropagation();picker=false;renderForm();};
    $('#lvV7Confirm').onclick=e=>{e.preventDefault();e.stopPropagation();if(!selected.length){window.toast?.('请至少选择一个目的地');return;}picker=false;renderForm();};
    requestAnimationFrame(()=>$('#lvV7Search')?.focus());
    render();
  }
  function uid(){return 'lv-'+Date.now()+Math.random().toString(36).slice(2,7)}
  function create(){
    snapshot();
    if(!draft.name||!draft.start||!draft.end){window.toast?.('请填写行程名称和日期');return;}
    if(draft.end<draft.start){window.toast?.('结束日期不能早于开始日期');return;}
    if(!selected.length){window.toast?.('请选择至少一个目的地');renderPicker();return;}
    window.db=window.db||{trips:[]};window.db.trips=window.db.trips||[];
    const days=[];let d=new Date(draft.start+'T00:00:00'),last=new Date(draft.end+'T00:00:00');
    while(d<=last){const c=selected[Math.min(days.length,selected.length-1)];days.push({id:uid(),label:'DAY '+(days.length+1),date:d.toISOString().slice(0,10),title:selected.length>1?c+' · 待安排':'待安排',city:c,items:[]});d.setDate(d.getDate()+1);}
    const clone=()=>JSON.parse(JSON.stringify(days)).map(x=>({...x,id:uid(),items:[]}));
    const t={id:uid(),name:draft.name,city:selected.join(' · '),cities:[...selected],start:draft.start,end:draft.end,people:1,hasAlternateRoutes:draft.alternate,plans:[{id:'A',name:'方案 A',days:clone()}]};
    if(draft.alternate)t.plans.push({id:'B',name:'方案 B',days:clone()});
    window.db.trips.push(t);window.activeTrip=t.id;window.activePlan='A';window.activeDay=0;
    if(typeof window.save==='function')window.save();else if(window.LvbanStore?.patch)window.LvbanStore.patch(s=>s.trips=window.db.trips);
    selected=[];draft={name:'',start:'',end:'',alternate:false};picker=false;close();window.renderTrips?.();window.toast?.('创建成功');if(mode==='ai')setTimeout(()=>window.go?.('ai'),120);
  }
  function newTrip(){selected=[];draft={name:'',start:'',end:'',alternate:false};mode='manual';picker=false;renderForm();}
  window.newTrip=newTrip;window.createTrip=create;

  /* 关键：用 capture 阶段接管两个容易被旧脚本/透明层吞掉的点击。
     这样即使旧版本还残留监听器，也不会出现点击目的地无反应或关闭失效。 */
  document.addEventListener('click',function(e){
    const dest=e.target.closest?.('#lvV7Destination');
    if(dest){e.preventDefault();e.stopImmediatePropagation();snapshot();renderPicker();return;}
    const closeBtn=e.target.closest?.('#modal .title button');
    if(closeBtn){e.preventDefault();e.stopImmediatePropagation();close();return;}
    if(e.target===$('#modal')&&!picker){close();}
  },true);

  const st=document.createElement('style');st.id='lv-v7-style';st.textContent=`
    #modal{z-index:100000!important;pointer-events:auto!important}
    #modal.show{display:flex!important;pointer-events:auto!important}
    #modal .sheet{position:relative;z-index:1;pointer-events:auto!important}
    #modal .title,#modal .title button{position:relative;z-index:2;pointer-events:auto!important}
    .lv-v7-destination{width:100%;display:flex;justify-content:space-between;align-items:center;padding:13px 14px;border:1px solid #e9e7f2;border-radius:14px;background:#fff;text-align:left;color:#777;cursor:pointer;position:relative;z-index:100001!important;pointer-events:auto!important}
    .lv-v7-destination strong{color:#5d4de5;white-space:nowrap;margin-left:10px}
    .lv-v7-picker{display:flex;flex-direction:column;gap:10px}
    .lv-v7-search{width:100%;padding:13px 14px;border:1px solid #e5e2f5;border-radius:14px;background:#fff;outline:0}
    .lv-v7-selected{display:flex;gap:7px;flex-wrap:wrap;min-height:30px}.lv-v7-selected>span{background:#efedff;color:#5d4de5;padding:7px 10px;border-radius:11px;font-size:12px}.lv-v7-selected button{border:0;background:none;color:#5d4de5;padding:0 0 0 5px;cursor:pointer}.lv-v7-none{background:none!important;color:#999!important;padding-left:0!important}
    .lv-v7-list{max-height:48vh;overflow:auto;display:grid;gap:7px}.lv-v7-city{padding:12px 13px;border-radius:13px;background:#fff;text-align:left;display:flex;justify-content:space-between;border:1px solid transparent;cursor:pointer}.lv-v7-city.on{background:#efedff;border-color:#d9d3ff;color:#5d4de5}.lv-v7-city small{color:#999}.lv-v7-empty{text-align:center;padding:20px;color:#999}
  `;document.head.appendChild(st);
})();
