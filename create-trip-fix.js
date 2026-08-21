/* 旅伴旅行管家 · 新建大行程统一入口
   只负责：新建大行程 → 多城市 → 每个城市天数 → 创建后立即进入该行程详情。
   数据结构与 unified-trip-router.js 保持一致：trip.plans[].days[]。
*/
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  const uid=()=>window.uid?window.uid():('trip_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8));
  const db=()=>window.db||(window.db={trips:[]});
  const cityOptions=()=>((window.LVBAN_DATA?.cities||['福州','平潭','泉州','厦门']).filter(Boolean));
  const save=()=>{if(typeof window.save==='function')window.save();else localStorage.setItem('lvban_pro_store_v1',JSON.stringify({...JSON.parse(localStorage.getItem('lvban_pro_store_v1')||'{}'),trips:db().trips}))};
  const close=()=>{if(typeof window.closeModal==='function')window.closeModal();else document.querySelector('.lv-create-trip-mask')?.remove()};
  const dateObj=v=>{const d=new Date(String(v||'')+'T00:00:00');return Number.isNaN(d.getTime())?null:d};
  const fmt=d=>d.toISOString().slice(0,10);
  const daysBetween=(a,b)=>{const x=dateObj(a),y=dateObj(b);return x&&y&&y>=x?Math.round((y-x)/86400000)+1:0};

  function style(){
    if($('#lv-create-trip-style'))return;
    const s=document.createElement('style');s.id='lv-create-trip-style';s.textContent=`
      .lv-ct-city-list{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
      .lv-ct-city{padding:10px 8px;border:1px solid #e7e4f2;border-radius:13px;background:#fff;color:#555;font-weight:700}
      .lv-ct-city.on{background:#6958f5;color:#fff;border-color:#6958f5}
      .lv-ct-days{display:grid;gap:8px;margin-top:8px}
      .lv-ct-day-row{display:grid;grid-template-columns:1fr 92px;align-items:center;gap:10px;padding:10px 12px;background:#fff;border:1px solid #e8e6f4;border-radius:13px}
      .lv-ct-day-row input{margin:0!important}
      .lv-ct-hint{font-size:11px;color:#77788b;line-height:1.55;margin-top:7px}
      @media(max-width:600px){.lv-ct-city-list{grid-template-columns:repeat(2,1fr)}}
    `;document.head.appendChild(s);
  }

  function openNewTrip(){
    style();
    const cities=cityOptions();
    const html=`<div class="form">
      <label>行程名称</label><input id="lvCtName" placeholder="例如：十一福建游">
      <label>开始日期</label><input id="lvCtStart" type="date">
      <label>结束日期</label><input id="lvCtEnd" type="date">
      <div class="muted" id="lvCtTotal">请选择日期</div>
      <label>选择城市（可多选）</label>
      <div class="lv-ct-city-list" id="lvCtCities">${cities.map(c=>`<button type="button" class="lv-ct-city" data-city="${esc(c)}">${esc(c)}</button>`).join('')}</div>
      <div class="lv-ct-hint">选择多个城市后，为每个城市填写游玩天数。城市按填写顺序依次进入行程。</div>
      <div class="lv-ct-days" id="lvCtDays"></div>
      <label style="display:flex;align-items:center;gap:8px;padding:8px 0"><input id="lvCtBackup" type="checkbox" style="width:auto"> 有备选路线</label>
      <div class="muted">不勾选时只创建主路线；勾选后才创建方案 A / 方案 B。</div>
      <button class="btn primary" id="lvCtCreate">创建行程</button>
    </div>`;
    if(typeof window.modal==='function')window.modal('新建行程',html);else{
      const mask=document.createElement('div');mask.className='modal show lv-create-trip-mask';mask.innerHTML=`<div class="sheet"><div class="title"><b>新建行程</b><button class="btn" id="lvCtClose">关闭</button></div><div id="lvCtBody">${html}</div></div>`;document.body.appendChild(mask);$('#lvCtClose',mask).onclick=()=>mask.remove();
    }
    bind();
  }

  function bind(){
    const start=$('#lvCtStart'),end=$('#lvCtEnd'),cityBox=$('#lvCtCities'),daysBox=$('#lvCtDays');
    if(!start||!end||!cityBox||!daysBox)return;
    const refreshTotal=()=>{
      const n=daysBetween(start.value,end.value);$('#lvCtTotal').textContent=n?`本次行程共 ${n} 天`:'请选择日期';renderCityDays();
    };
    const selected=()=>Array.from(cityBox.querySelectorAll('.lv-ct-city.on')).map(x=>x.dataset.city);
    const renderCityDays=()=>{
      const cs=selected(),total=daysBetween(start.value,end.value);daysBox.innerHTML=cs.map((c,i)=>`<div class="lv-ct-day-row"><span><b>${esc(c)}</b><small class="muted" style="display:block;margin-top:3px">第 ${i+1} 个城市</small></span><input class="lv-ct-city-days" data-city="${esc(c)}" type="number" min="1" max="${Math.max(1,total)}" value="1" placeholder="天数"></div>`).join('');
      if(cs.length&&total){const inputs=Array.from(daysBox.querySelectorAll('.lv-ct-city-days'));inputs[inputs.length-1].value=Math.max(1,total-inputs.slice(0,-1).reduce((s,x)=>s+Number(x.value||0),0));}
    };
    cityBox.querySelectorAll('.lv-ct-city').forEach(b=>b.onclick=()=>{b.classList.toggle('on');renderCityDays()});
    start.onchange=refreshTotal;end.onchange=refreshTotal;
    daysBox.addEventListener('input',()=>{const total=daysBetween(start.value,end.value);const used=Array.from(daysBox.querySelectorAll('.lv-ct-city-days')).reduce((s,x)=>s+Number(x.value||0),0);const hint=$('.lv-ct-hint');if(hint)hint.textContent=total?`已分配 ${used} / ${total} 天${used===total?'，可以创建。':'，请让城市天数合计等于行程总天数。'}`:''});
    const create=$('#lvCtCreate');if(create&&!create.dataset.bound){create.dataset.bound='1';create.onclick=createTrip;}
    refreshTotal();
  }

  function createTrip(){
    const name=$('#lvCtName')?.value.trim(),start=$('#lvCtStart')?.value,end=$('#lvCtEnd')?.value,backup=!!$('#lvCtBackup')?.checked;
    const cities=Array.from(document.querySelectorAll('#lvCtCities .lv-ct-city.on')).map(x=>x.dataset.city);
    const inputs=Array.from(document.querySelectorAll('#lvCtDays .lv-ct-city-days'));
    if(!name||!start||!end)return window.toast?.('请先填写行程名称和日期')||alert('请先填写行程名称和日期');
    const total=daysBetween(start,end);if(!total)return window.toast?.('日期范围无效')||alert('日期范围无效');
    if(!cities.length)return window.toast?.('请至少选择一个城市')||alert('请至少选择一个城市');
    const allocations=inputs.map((x,i)=>({city:x.dataset.city,days:Math.max(1,Number(x.value||0))}));
    const sum=allocations.reduce((s,x)=>s+x.days,0);if(sum!==total)return window.toast?.(`城市天数合计 ${sum} 天，但行程共 ${total} 天，请调整。`)||alert(`城市天数合计 ${sum} 天，但行程共 ${total} 天，请调整。`);
    const makeDays=()=>{const out=[];let cur=dateObj(start);allocations.forEach(a=>{for(let i=0;i<a.days;i++){const date=fmt(cur);out.push({id:uid(),label:`DAY ${out.length+1}`,date,title:'待安排',city:a.city,items:[]});cur.setDate(cur.getDate()+1)}});return out};
    const days=makeDays();
    const t={id:uid(),name,start,end,city:cities.join(' · '),people:1,hasBackup:backup,plans:[{id:'A',name:'方案 A',days}]};
    if(backup)t.plans.push({id:'B',name:'方案 B',days:JSON.parse(JSON.stringify(days))});
    db().trips.push(t);window.activeTrip=t.id;window.activePlan='A';window.activeDay=0;window._utCity=cities[0];window._utDay=0;
    save();close();
    if(typeof window.renderTrips==='function')window.renderTrips();
    if(typeof window.openTripCanvas==='function')window.openTripCanvas(t.id);else if(typeof window.__lvbanOpenTripDetail==='function')window.__lvbanOpenTripDetail(t.id);
    window.toast?.('行程已创建');
  }

  window.openNewTrip=openNewTrip;
  window.lvSaveTrip=createTrip;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,300));
  else setTimeout(bind,300);
})();
