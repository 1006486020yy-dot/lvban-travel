/* 旅伴旅行管家 · 2026-08-12 最终交互修复
 * 只修两个明确问题：
 * 1. 弹窗关闭按钮在任何情况下都能关闭；
 * 2. 新建行程的“目的地”改为真正可点击的搜索/多选城市选择器。
 * 不改原版首页/目录/详情布局。
 */
(function(){
  'use strict';
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let picked=[];
  let mode='manual';

  function close(){
    const p=$('#lvCityPickerOverlay'); if(p)p.remove();
    $('#modal')?.classList.remove('show');
    window.lvForceCloseModal=close;
  }
  window.lvForceCloseModal=close;

  document.addEventListener('click',function(e){
    const closeBtn=e.target.closest?.('#modal .title .btn');
    if(closeBtn){e.preventDefault();e.stopImmediatePropagation();close();return;}
    const overlay=e.target.closest?.('#lvCityPickerOverlay');
    if(overlay && e.target===overlay){e.preventDefault();overlay.remove();}
  },true);

  function allCities(){
    const list=Array.isArray(window.LVBAN_CITY_LIST)?window.LVBAN_CITY_LIST.map(x=>x.city):[];
    const fallback=['北京市','上海市','广州市','深圳市','杭州市','成都市','重庆市','西安市','福州市','厦门市','泉州市','平潭综合实验区','南京市','苏州市','武汉市','长沙市','青岛市','大连市','三亚市','桂林市'];
    return [...new Set((list.length?list:fallback).filter(Boolean))];
  }
  function showPicker(){
    if($('#lvCityPickerOverlay'))return;
    const ov=document.createElement('div');ov.id='lvCityPickerOverlay';
    ov.innerHTML=`<div class="lv-city-sheet"><div class="lv-city-head"><b>选择目的地</b><button type="button" id="lvCityCancel">取消</button></div><div class="lv-city-picked" id="lvCityPicked"></div><input id="lvCitySearch" class="lv-city-search" placeholder="搜索城市，例如：厦门、福州、成都" autocomplete="off"><div class="lv-city-hint">支持多选，选择完成后点击“确认城市”</div><div class="lv-city-list" id="lvCityList"></div><button type="button" class="lv-city-confirm" id="lvCityConfirm">确认城市</button></div>`;
    document.body.appendChild(ov);
    const list=allCities();
    const render=()=>{const q=($('#lvCitySearch')?.value||'').trim();const arr=list.filter(c=>!q||c.includes(q)).slice(0,120);$('#lvCityList').innerHTML=arr.map(c=>`<button type="button" class="lv-city-option ${picked.includes(c)?'on':''}" data-city="${esc(c)}"><span>${esc(c)}</span><small>${picked.includes(c)?'✓ 已选择':'选择'}</small></button>`).join('')||'<div class="lv-city-empty">没有找到匹配城市</div>';$('#lvCityPicked').innerHTML=picked.length?picked.map(c=>`<span>${esc(c)} <button type="button" data-remove="${esc(c)}">×</button></span>`).join(''):'<span class="lv-city-none">暂未选择城市</span>';};
    $('#lvCitySearch').addEventListener('input',render);
    $('#lvCityList').addEventListener('click',e=>{const b=e.target.closest('[data-city]');if(!b)return;const c=b.dataset.city;picked=picked.includes(c)?picked.filter(x=>x!==c):picked.concat(c);render();});
    $('#lvCityPicked').addEventListener('click',e=>{const b=e.target.closest('[data-remove]');if(!b)return;picked=picked.filter(x=>x!==b.dataset.remove);render();});
    $('#lvCityCancel').onclick=()=>ov.remove();
    $('#lvCityConfirm').onclick=()=>{if(!picked.length){window.toast?.('请至少选择一个城市');return;}updateDestination();ov.remove();};
    render();requestAnimationFrame(()=>$('#lvCitySearch')?.focus());
  }
  function updateDestination(){const field=$('#ntDestination');if(field){field.textContent=picked.join(' · ');field.classList.add('has');}}
  function chooseMode2(m){mode=m;$('#manualMode')?.classList.toggle('on',m==='manual');$('#aiMode')?.classList.toggle('on',m==='ai');}
  window.chooseMode=chooseMode2;

  function showModal(title,body){const m=$('#modal');if(!m)return;$('#modalTitle').textContent=title;$('#modalBody').innerHTML=body;m.classList.add('show');}
  function newTrip(){
    picked=[];mode='manual';
    showModal('新建行程',`<div class="form lv-newtrip-form"><label>行程名称</label><input id="ntName" placeholder="例如：国庆厦门慢旅行"><label>目的地</label><button type="button" id="ntDestination" class="lv-destination-field">点击选择城市，可多选 <span>选择城市 ›</span></button><div class="hint">点击整块区域打开选择框，支持搜索和多选城市。</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div><label>开始日期</label><input id="ntStart" type="date"></div><div><label>结束日期</label><input id="ntEnd" type="date"></div></div><label class="check"><input id="ntAlternate" type="checkbox"> 是否有备选路线<br><small>只有勾选后，才会生成方案 A / 方案 B</small></label><label>你想怎么创建？</label><div class="createModes"><button type="button" class="mode on" id="manualMode">我自己安排<small>自己添加日期和详细行程</small></button><button type="button" class="mode" id="aiMode">让 AI 帮我规划<small>创建后进入 AI 规划</small></button></div><button type="button" class="btn primary wide" id="lvCreateTripBtn">创建行程</button></div>`);
    $('#ntDestination').onclick=showPicker;$('#manualMode').onclick=()=>chooseMode2('manual');$('#aiMode').onclick=()=>chooseMode2('ai');$('#lvCreateTripBtn').onclick=createTrip;
  }
  window.newTrip=newTrip;

  function uid(){return 'lv-'+Date.now()+Math.random().toString(36).slice(2,7)}
  function createTrip(){
    const name=$('#ntName')?.value.trim(),start=$('#ntStart')?.value,end=$('#ntEnd')?.value,alternate=!!$('#ntAlternate')?.checked;
    if(!name||!start||!end){window.toast?.('请填写行程名称和日期');return;}if(end<start){window.toast?.('结束日期不能早于开始日期');return;}if(!picked.length){window.toast?.('请选择至少一个目的地');showPicker();return;}
    const days=[];let d=new Date(start+'T00:00:00'),last=new Date(end+'T00:00:00');while(d<=last){const city=picked[Math.min(days.length,picked.length-1)];days.push({id:uid(),label:'DAY '+(days.length+1),date:d.toISOString().slice(0,10),title:picked.length>1?city+' · 待安排':'待安排',city,items:[]});d.setDate(d.getDate()+1);}
    const clone=()=>JSON.parse(JSON.stringify(days)).map(x=>({...x,id:uid(),items:[]}));const t={id:uid(),name,city:picked.join(' · '),cities:[...picked],start,end,people:1,hasAlternateRoutes:alternate,plans:[{id:'A',name:'方案 A',days:clone()}]};if(alternate)t.plans.push({id:'B',name:'方案 B',days:clone()});
    window.db=window.db||{trips:[]};window.db.trips=window.db.trips||[];window.db.trips.push(t);window.activeTrip=t.id;window.activePlan='A';window.activeDay=0;if(typeof window.save==='function')window.save();else if(window.LvbanStore?.patch)window.LvbanStore.patch(s=>s.trips=window.db.trips);
    close();window.renderTrips?.();window.toast?.(alternate?'创建成功：已生成 A / B':'创建成功');if(mode==='ai')setTimeout(()=>window.go?.('ai'),120);picked=[];
  }
  window.createTrip=createTrip;

  const style=document.createElement('style');style.id='lv-final-interaction-style';style.textContent=`#lvCityPickerOverlay{position:fixed;inset:0;z-index:20000;background:rgba(23,23,42,.58);display:flex;align-items:flex-end;justify-content:center;padding:0}.lv-city-sheet{width:min(720px,100%);max-height:88vh;overflow:hidden;background:#f7f8fc;border-radius:28px 28px 0 0;padding:20px;box-shadow:0 -12px 50px rgba(0,0,0,.18);display:flex;flex-direction:column;gap:10px}.lv-city-head{display:flex;justify-content:space-between;align-items:center;font-size:20px}.lv-city-head button{background:#efedff;color:#5d4de5;border-radius:12px;padding:9px 13px;font-weight:800}.lv-city-picked{display:flex;gap:7px;flex-wrap:wrap;min-height:32px}.lv-city-picked>span{background:#efedff;color:#5d4de5;padding:7px 10px;border-radius:11px;font-size:12px}.lv-city-picked button{background:none;color:#5d4de5;padding:0 0 0 5px}.lv-city-none{background:transparent!important;color:#999!important;padding-left:0!important}.lv-city-search{width:100%;padding:13px 14px;border:1px solid #e5e2f5;border-radius:14px;background:#fff;outline:0}.lv-city-hint{font-size:11px;color:#888}.lv-city-list{overflow:auto;display:grid;gap:7px;min-height:120px}.lv-city-option{padding:12px 13px;border-radius:13px;background:#fff;text-align:left;display:flex;justify-content:space-between;border:1px solid transparent}.lv-city-option.on{background:#efedff;border-color:#d9d3ff;color:#5d4de5}.lv-city-option small{color:#999}.lv-city-empty{padding:20px;text-align:center;color:#999}.lv-city-confirm{width:100%;padding:14px;border-radius:15px;background:#6958f5;color:#fff;font-weight:900}.lv-destination-field{width:100%;padding:13px 14px;border:1px solid #e9e7f2;border-radius:14px;background:#fff;text-align:left;color:#777;display:flex;justify-content:space-between;align-items:center}.lv-destination-field span{color:#5d4de5;font-weight:800}.lv-destination-field.has{color:#333}.lv-newtrip-form .mode{text-align:left}.lv-newtrip-form .mode small{display:block;color:#999;font-size:10px;margin-top:3px}.lv-newtrip-form .mode.on small{color:#777}`;document.head.appendChild(style);
})();
