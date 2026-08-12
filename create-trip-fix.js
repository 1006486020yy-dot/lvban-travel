/* 旅伴旅行管家 · 新建行程表单全国城市数据版 v4
   目的地：点击后打开独立选择框；支持搜索、多选城市。
   城市来源：window.LVBAN_DATA.cities（全国旅游数据库），不再使用硬编码城市名单。
   多城市创建成功后：弹出“每个城市玩几天”分配框，并把结果保存到当前行程。
*/
(function(){
  const cities=Array.isArray(window.LVBAN_DATA?.cities)&&window.LVBAN_DATA.cities.length?window.LVBAN_DATA.cities:['厦门','福州','泉州','平潭'];
  const $=(s,root=document)=>root.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function injectStyle(){
    if($('#lv-create-trip-style'))return;
    const s=document.createElement('style');s.id='lv-create-trip-style';s.textContent=`
      .lv-create-flow{padding:2px 0 4px}.lv-create-flow .form{display:flex;flex-direction:column;gap:8px}
      .lv-create-flow label{font-size:13px;color:var(--muted);font-weight:700;margin-top:3px}
      .lv-create-flow input[type=text],.lv-create-flow input[type=date]{box-sizing:border-box;width:100%;height:48px;padding:0 14px;border:1px solid var(--line);border-radius:14px;background:#fff;font-size:15px;outline:none}
      .lv-create-flow input:focus{border-color:var(--p);box-shadow:0 0 0 3px #6958f515}
      .lv-destination-field{position:relative;cursor:pointer}.lv-destination-field input{cursor:pointer;padding-right:80px!important}
      .lv-destination-action{position:absolute;right:10px;top:7px;height:34px;padding:0 10px;border:0;border-radius:10px;background:#efedff;color:var(--p);font-size:11px;font-weight:800;pointer-events:none}
      .lv-selected-city-summary{display:flex;flex-wrap:wrap;gap:6px;margin-top:2px}.lv-selected-city{display:inline-flex;align-items:center;gap:5px;padding:6px 9px;border-radius:999px;background:#efedff;color:#5d4de5;font-size:11px;font-weight:700}
      .lv-city-modal-mask,.lv-days-modal-mask{position:fixed;inset:0;background:rgba(25,20,50,.38);backdrop-filter:blur(5px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:18px}
      .lv-city-modal,.lv-days-modal{width:min(560px,100%);max-height:min(720px,90vh);overflow:auto;background:#fff;border-radius:24px;box-shadow:0 24px 70px rgba(30,20,80,.25);padding:20px}
      .lv-city-modal-head,.lv-days-modal-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.lv-city-modal-head h3,.lv-days-modal-head h3{margin:0;font-size:20px}
      .lv-modal-close{width:38px;height:38px;border:0;border-radius:12px;background:#f2f0fa;color:#555;font-size:20px}.lv-city-search{width:100%;height:46px;border:1px solid var(--line);border-radius:13px;padding:0 13px;font-size:14px;box-sizing:border-box;outline:none}
      .lv-city-modal-sub{font-size:11px;color:var(--muted);margin:8px 0 12px}.lv-city-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;max-height:360px;overflow:auto;padding:2px}
      .lv-city-pick{min-height:44px;border:1px solid var(--line);border-radius:12px;background:#fff;color:#444;font-size:13px;cursor:pointer}.lv-city-pick.on{border:2px solid var(--p);background:#f1efff;color:var(--p);font-weight:800}
      .lv-city-custom{display:none;margin-top:10px;padding:10px 12px;border-radius:12px;background:#faf9ff;color:#5d4de5;font-size:12px;cursor:pointer;border:1px dashed #c9c2ff}.lv-city-custom.show{display:block}
      .lv-city-modal-foot,.lv-days-modal-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:16px;padding-top:13px;border-top:1px solid var(--line)}
      .lv-selected-count{font-size:12px;color:var(--muted)}.lv-primary{height:44px;padding:0 18px;border:0;border-radius:13px;background:var(--p);color:#fff;font-size:13px;font-weight:800}.lv-primary:disabled{opacity:.45}
      .lv-duration-list{display:flex;flex-direction:column;gap:10px}.lv-duration-row{display:grid;grid-template-columns:1fr 100px;align-items:center;gap:12px;padding:12px;border:1px solid var(--line);border-radius:14px}.lv-duration-city{font-size:14px;font-weight:800}.lv-duration-city small{display:block;color:var(--muted);font-size:10px;margin-top:3px}.lv-duration-input{width:100%;height:42px;border:1px solid var(--line);border-radius:11px;text-align:center;font-size:14px;font-weight:800}.lv-days-status{font-size:12px;color:var(--muted)}.lv-days-status.ok{color:#2d9a6a;font-weight:800}.lv-days-status.bad{color:#d94e5c;font-weight:800}
      .lv-route-box{display:flex;align-items:center;gap:11px;padding:13px 14px;background:#fff;border:1px solid var(--line);border-radius:14px;cursor:pointer;margin-top:3px}.lv-route-box input{width:18px;height:18px;margin:0;accent-color:var(--p)}.lv-route-box b{font-size:13px;color:#30303b}.lv-route-box small{display:block;color:var(--muted);font-size:11px;margin-top:3px}
      .lv-create-mode{margin-top:3px}.lv-create-mode-title{font-size:13px;color:var(--muted);font-weight:700;margin-bottom:8px}.lv-choice-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.lv-choice{min-height:58px;border:1px solid var(--line);border-radius:14px;background:#fff;color:#555;padding:10px 12px;text-align:left;cursor:pointer}.lv-choice b{display:block;font-size:13px;color:#24242d}.lv-choice span{display:block;font-size:10px;color:var(--muted);margin-top:4px}.lv-choice.on{border:2px solid var(--p);background:#f1efff;color:var(--p);padding:9px 11px;box-shadow:0 5px 16px #6958f51a}.lv-choice.on b{color:var(--p)}
      .lv-create-submit{width:100%;height:50px;border:0;border-radius:15px;background:var(--p);color:#fff;font-size:15px;font-weight:800;margin-top:4px;cursor:pointer}
      @media(max-width:600px){.lv-choice-row{grid-template-columns:1fr}.lv-city-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.lv-duration-row{grid-template-columns:1fr 86px}}
    `;document.head.appendChild(s);
  }

  function cityPicker(selected,onDone){
    const mask=document.createElement('div');mask.className='lv-city-modal-mask';
    mask.innerHTML=`<div class="lv-city-modal" role="dialog" aria-modal="true">
      <div class="lv-city-modal-head"><h3>选择目的地</h3><button class="lv-modal-close" type="button">×</button></div>
      <input class="lv-city-search" id="lvCitySearch" type="text" placeholder="搜索城市，例如：厦门、东京" autocomplete="off">
      <div class="lv-city-modal-sub">支持多选城市。选择完成后会按你的行程总天数分配每个城市停留时间。</div>
      <div class="lv-city-grid" id="lvCityGrid"></div>
      <button type="button" class="lv-city-custom" id="lvCityCustom"></button>
      <div class="lv-city-modal-foot"><span class="lv-selected-count" id="lvSelectedCount">已选择 0 个城市</span><button class="lv-primary" id="lvCityConfirm" type="button" disabled>确认选择</button></div>
    </div>`;
    document.body.appendChild(mask);
    const grid=$('#lvCityGrid',mask),search=$('#lvCitySearch',mask),count=$('#lvSelectedCount',mask),confirmBtn=$('#lvCityConfirm',mask),custom=$('#lvCityCustom',mask);
    const picked=new Set(selected);
    const render=()=>{
      const q=search.value.trim().toLowerCase();
      const list=q?cities.filter(c=>c.toLowerCase().includes(q)):cities;
      grid.innerHTML=list.length?list.map(c=>`<button type="button" class="lv-city-pick ${picked.has(c)?'on':''}" data-city="${esc(c)}">${esc(c)}</button>`).join(''):'<div style="grid-column:1/-1;padding:16px;color:var(--muted);font-size:12px">没有匹配的城市</div>';
      if(q&&!cities.some(c=>c.toLowerCase()===q)){custom.textContent=`＋ 使用“${search.value.trim()}”作为自定义目的地`;custom.classList.add('show')}else custom.classList.remove('show');
      count.textContent=`已选择 ${picked.size} 个城市`;confirmBtn.disabled=picked.size===0;
    };
    render();search.oninput=render;
    grid.onclick=e=>{const b=e.target.closest('[data-city]');if(!b)return;const c=b.dataset.city;picked.has(c)?picked.delete(c):picked.add(c);render()};
    custom.onclick=()=>{const c=search.value.trim();if(!c)return;picked.add(c);render()};
    $('.lv-modal-close',mask).onclick=()=>mask.remove();mask.onclick=e=>{if(e.target===mask)mask.remove()};confirmBtn.onclick=()=>{onDone([...picked]);mask.remove()};setTimeout(()=>search.focus(),0);
  }

  function durationPicker(trip,citiesSelected){
    const start=new Date(String(trip.start||'').slice(0,10)+'T00:00:00');const end=new Date(String(trip.end||trip.start||'').slice(0,10)+'T00:00:00');
    const total=Math.max(1,Math.round((end-start)/86400000)+1),base=Math.floor(total/citiesSelected.length),rem=total%citiesSelected.length,values=citiesSelected.map((c,i)=>base+(i<rem?1:0));
    const mask=document.createElement('div');mask.className='lv-days-modal-mask';
    mask.innerHTML=`<div class="lv-days-modal" role="dialog" aria-modal="true"><div class="lv-days-modal-head"><h3>安排每个城市玩几天</h3><button class="lv-modal-close" type="button">×</button></div><div style="font-size:12px;color:var(--muted);margin-bottom:13px">你的行程共 <b style="color:var(--p)">${total} 天</b>，请分配到下面的城市。后续可以在行程里继续调整。</div><div class="lv-duration-list">${citiesSelected.map((c,i)=>`<div class="lv-duration-row"><div class="lv-duration-city">${esc(c)}<small>第 ${i+1} 个目的地</small></div><input class="lv-duration-input" data-city="${esc(c)}" type="number" min="1" max="${total}" value="${values[i]}"></div>`).join('')}</div><div class="lv-days-modal-foot"><span id="lvDaysStatus" class="lv-days-status"></span><button id="lvDaysConfirm" class="lv-primary" type="button">保存分配</button></div></div>`;
    document.body.appendChild(mask);const status=$('#lvDaysStatus',mask),btn=$('#lvDaysConfirm',mask),inputs=[...mask.querySelectorAll('.lv-duration-input')];
    const check=()=>{const sum=inputs.reduce((n,x)=>n+Math.max(0,Number(x.value)||0),0),ok=sum===total;status.textContent=ok?`已分配 ${sum}/${total} 天`:`当前 ${sum}/${total} 天，还需 ${total-sum>0?total-sum+' 天':'减少 '+(sum-total)+' 天'}`;status.className='lv-days-status '+(ok?'ok':'bad');btn.disabled=!ok;return ok};
    inputs.forEach(x=>x.oninput=check);check();$('.lv-modal-close',mask).onclick=()=>mask.remove();mask.onclick=e=>{if(e.target===mask)mask.remove()};btn.onclick=()=>{if(!check())return;trip.cityDurations=inputs.map(x=>({city:x.dataset.city,days:Number(x.value)}));trip.city=trip.cityDurations.map(x=>x.city).join(' · ');window.save?.();mask.remove();window.renderTrips?.();window.renderHome?.();window.toast?.('已保存各城市停留天数')};
  }

  function openNewTrip(){
    const m=$('#modal');if(!m)return;injectStyle();$('#modalTitle').textContent='新建行程';
    $('#modalBody').innerHTML=`<div class="lv-create-flow"><div class="form"><label>行程名称</label><input id="ntName" type="text" placeholder="例如：国庆厦门慢旅行" autocomplete="off"><label>目的地</label><div class="lv-destination-field"><input id="ntCity" type="text" placeholder="点击选择城市，可多选" autocomplete="off" readonly><button type="button" class="lv-destination-action">选择城市</button></div><div id="lvSelectedCities" class="lv-selected-city-summary"></div><div style="font-size:11px;color:var(--muted);margin-top:1px">点击上方输入框打开选择框，支持搜索和多选城市</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div><label>开始日期</label><input id="ntStart" type="date"></div><div><label>结束日期</label><input id="ntEnd" type="date"></div></div><label class="lv-route-box" for="ntAlternate"><input id="ntAlternate" type="checkbox"><span><b>是否有备选路线</b><small>只有勾选后，才会出现方案 A / 方案 B</small></span></label><div class="lv-create-mode"><div class="lv-create-mode-title">你想怎么创建？</div><div class="lv-choice-row"><button type="button" class="lv-choice on" data-mode="manual"><b>我自己安排</b><span>自己添加日期和详细行程</span></button><button type="button" class="lv-choice" data-mode="ai"><b>让 AI 帮我规划</b><span>创建后进入 AI 规划</span></button></div></div><button type="button" class="lv-create-submit" id="lvCreateSubmit">创建行程</button></div></div>`;
    m.classList.add('show');window._createMode='manual';window._selectedCities=[];const input=$('#ntCity'),summary=$('#lvSelectedCities');
    const renderSelected=()=>{summary.innerHTML=window._selectedCities.map(c=>`<span class="lv-selected-city">${esc(c)}</span>`).join('');input.value=window._selectedCities.join(' · ')};
    const openPicker=()=>cityPicker(window._selectedCities,list=>{window._selectedCities=list;renderSelected()});input.onclick=openPicker;input.onfocus=openPicker;$('.lv-destination-field').onclick=openPicker;
    document.querySelectorAll('.lv-choice').forEach(b=>b.onclick=()=>{window._createMode=b.dataset.mode;document.querySelectorAll('.lv-choice').forEach(x=>x.classList.toggle('on',x===b))});
    const originalCreate=window.createTripFromForm;
    $('#lvCreateSubmit').onclick=()=>{const name=$('#ntName')?.value.trim(),start=$('#ntStart')?.value,end=$('#ntEnd')?.value;if(!name)return window.toast?.('请先填写行程名称')||alert('请先填写行程名称');if(!start||!end)return window.toast?.('请选择开始和结束日期')||alert('请选择开始和结束日期');if(end<start)return window.toast?.('结束日期不能早于开始日期')||alert('结束日期不能早于开始日期');if(!window._selectedCities.length)return window.toast?.('请选择至少一个目的地')||alert('请选择至少一个目的地');input.value=window._selectedCities.join(' · ');const before=(window.db?.()?.trips||[]).map(t=>t.id);if(typeof originalCreate==='function')originalCreate();else window.createTripFromForm?.();if(window._selectedCities.length>1){const list=window.db?.()?.trips||[];const created=list.find(t=>!before.includes(t.id))||list[0];if(created){created.city=window._selectedCities.join(' · ');window.save?.();durationPicker(created,window._selectedCities)}}};
  }
  function boot(){window.openNewTrip=openNewTrip}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
