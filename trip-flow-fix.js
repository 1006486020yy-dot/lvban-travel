/* 旅伴旅行管家｜我的行程正确层级
   总列表 → 大行程详情 → 城市 → 城市日期 → 当天节点
   新建行程支持城市多选；不改变现有视觉体系。
*/
(function(){
  'use strict';
  const oldRenderTrips = window.renderTrips;
  const oldNewTrip = window.newTrip;
  const oldSaveTrip = window.saveTrip;
  const routeState = { tripId:null, city:null, date:null, plan:null };

  function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function cityOfDay(d){
    const t=(d.title||'');
    if(t.includes('福州')) return '福州';
    if(t.includes('平潭')) return '平潭';
    if(t.includes('泉州')) return '泉州';
    if(t.includes('厦门')||t.includes('鼓浪屿')||t.includes('集美')) return '厦门';
    const text=(d.items||[]).map(x=>x[1]+' '+x[2]).join(' ');
    if(text.includes('福州')) return '福州';
    if(text.includes('平潭')) return '平潭';
    if(text.includes('泉州')||text.includes('石狮')) return '泉州';
    return '厦门';
  }
  function cityList(arr){return [...new Set(arr.map(cityOfDay))];}
  function daysForCity(arr,city){return arr.filter(d=>cityOfDay(d)===city);}
  function currentArr(){return schedules[routeState.plan||state.plan]||schedules.A;}
  function openDefault(){
    routeState.tripId='default';
    routeState.plan=null;
    routeState.city=null;
    routeState.date=null;
    renderTripList();
  }
  function openCustom(i){
    const t=customTrips[i];
    routeState.tripId='custom:'+i;
    routeState.city=null;
    routeState.date=null;
    routeState.plan=null;
    renderCustomDetail(t,i);
  }
  function renderTripList(){
    const el=document.getElementById('tripList');
    const detail=document.getElementById('tripDetail');
    detail.innerHTML='';
    el.innerHTML=`<div class="title"><div><div class="crumb">一级：我的行程</div><h2>我的行程</h2></div><button class="btn primary" onclick="newTrip()">＋ 新建行程</button></div>
      <div class="card" style="margin-top:10px;cursor:pointer" onclick="tripFlowOpenDefault()"><div class="crumb">大行程</div><h2 style="margin:6px 0">十一福建游</h2><div class="muted">2026-09-28 ～ 2026-10-04 · 福州 · 平潭 · 泉州 · 厦门 · 2人</div><div class="actions"><button class="btn primary" onclick="event.stopPropagation();tripFlowOpenDefault()">进入行程</button></div></div>`+
      customTrips.map((t,i)=>`<div class="card" style="margin-top:12px;cursor:pointer" onclick="tripFlowOpenCustom(${i})"><div class="crumb">大行程</div><h2 style="margin:6px 0">${esc(t.name)}</h2><div class="muted">${esc(t.start)} ～ ${esc(t.end)} · ${esc((t.cities||[]).join(' · '))} · ${esc(t.travelers||1)}人</div><div class="actions"><button class="btn primary" onclick="event.stopPropagation();tripFlowOpenCustom(${i})">进入行程</button><button class="btn danger" onclick="event.stopPropagation();tripFlowDelete(${i})">删除</button></div></div>`).join('')+
      `<div class="empty">点击某个大行程进入城市、日期和当天行程详情</div>`;
  }
  function detailHeader(title,sub,back){
    return `<div class="title"><button class="btn" onclick="${back}">← 返回</button><div style="flex:1;text-align:center"><h2 style="margin:0">${esc(title)}</h2><div class="muted">${esc(sub)}</div></div><div style="width:66px"></div></div>`;
  }
  function actionButtons(){
    return `<div class="actions" style="margin-bottom:12px"><button class="btn primary" onclick="tripFlowShare()">分享</button><button class="btn" onclick="tripFlowCollab()">好友协作</button><button class="btn" onclick="tripFlowVote()">投票</button></div>`;
  }
  function renderDefaultDetail(){
    const detail=document.getElementById('tripDetail'),list=document.getElementById('tripList');
    list.innerHTML='';
    let arr=schedules[routeState.plan||'A'];
    if(!routeState.city) routeState.city=cityList(arr)[0];
    const cities=cityList(arr);
    if(!routeState.date){const ds=daysForCity(arr,routeState.city);routeState.date=ds[0]?.date||null;}
    const cityDays=daysForCity(arr,routeState.city);
    const d=cityDays.find(x=>x.date===routeState.date)||cityDays[0];
    if(d) routeState.date=d.date;
    const hasAlternative=true;
    detail.innerHTML=detailHeader('十一福建游','福州 · 平潭 · 泉州 · 厦门',`tripFlowBackToList()`)+actionButtons()+
      `<div class="card"><div class="title" style="margin-top:0"><div><div class="crumb">大行程</div><b>十一福建游</b></div><span class="trip-level">${routeState.plan==='B'?'方案 B':'方案 A'}</span></div>`+
      (hasAlternative?`<div class="plans"><button class="plan ${routeState.plan!=='B'?'on':''}" onclick="tripFlowPlan('A')"><b>方案 A</b><small>福州 + 平潭 + 泉州 + 厦门</small></button><button class="plan ${routeState.plan==='B'?'on':''}" onclick="tripFlowPlan('B')"><b>方案 B</b><small>福州 + 平潭 + 厦门</small></button></div>`:'')+`</div>`+
      `<div class="crumb" style="margin-top:14px">选择城市</div><div class="chips">${cities.map(c=>`<button class="chip ${c===routeState.city?'on':''}" onclick="tripFlowCity('${eAttr(c)}')">${esc(c)}</button>`).join('')}</div>`+
      `<div class="crumb" style="margin-top:8px">${esc(routeState.city)} 的日期</div><div class="days">${cityDays.map(x=>`<button class="day ${x.date===routeState.date?'on':''}" onclick="tripFlowDate('${eAttr(x.date)}')"><b>${esc(x.date)}</b><small>DAY ${arr.indexOf(x)+1}</small></button>`).join('')}</div>`+
      (d?`<div class="card" style="margin-top:8px"><div class="crumb">当天行程详情</div><h2 style="margin:0">${esc(d.date)}</h2><div class="muted" style="margin-top:5px">${esc(d.title)}</div></div><div class="timeline">${(d.items||[]).map((x,i)=>`<div class="event card"><div class="event-time">${esc(x[0])}</div><h3>${esc(x[1])}</h3><div class="addr">📍 ${esc(x[2])}</div><div class="muted" style="margin-top:5px">${esc(x[3])}</div><div class="actions"><button class="btn" onclick="copy('${eAttr(x[2])}')">复制地址</button><button class="btn" onclick="nav('${eAttr(x[1])}','${eAttr(x[2])}')">导航</button><button class="btn" onclick="editEvent(${i})">编辑</button><button class="btn danger" onclick="deleteEvent(${i})">删除</button></div></div>`).join('')}</div>`:`<div class="empty">这个城市暂时没有行程日期</div>`);
  }
  function renderCustomDetail(t,i){
    const list=document.getElementById('tripList'),detail=document.getElementById('tripDetail');list.innerHTML='';
    const cities=t.cities||[];
    const city=routeState.city||cities[0]||'';routeState.city=city;
    const dates=[];let cur=new Date(t.start+'T00:00:00'),end=new Date(t.end+'T00:00:00');
    while(!isNaN(cur)&&cur<=end){dates.push(cur.toISOString().slice(0,10));cur.setDate(cur.getDate()+1);}
    const date=routeState.date||dates[0];routeState.date=date;
    detail.innerHTML=detailHeader(t.name,`${cities.join(' · ')} · ${t.travelers||1}人`,`tripFlowBackToList()`)+actionButtons()+
      `<div class="card"><div class="crumb">大行程</div><h2 style="margin:0">${esc(t.name)}</h2><div class="muted">${esc(t.start)} ～ ${esc(t.end)}</div></div>`+
      `<div class="crumb" style="margin-top:14px">选择城市（可多选创建，查看时单选）</div><div class="chips">${cities.map(c=>`<button class="chip ${c===city?'on':''}" onclick="tripFlowCustomCity(${i},'${eAttr(c)}')">${esc(c)}</button>`).join('')}</div>`+
      `<div class="crumb" style="margin-top:8px">${esc(city)} 的日期</div><div class="days">${dates.map((x,n)=>`<button class="day ${x===date?'on':''}" onclick="tripFlowCustomDate(${i},'${eAttr(x)}')"><b>${esc(x.slice(5).replace('-','/'))}</b><small>DAY ${n+1}</small></button>`).join('')}</div>`+
      `<div class="card" style="margin-top:8px"><div class="crumb">当天行程详情</div><h3 style="margin:0">${esc(date)}</h3><div class="muted" style="margin-top:5px">${esc(city)}</div></div><div class="empty">这是新建行程的空白日期，可以通过景点、美食、酒店的“加入行程”继续添加节点。</div>`;
  }
  function eAttr(s){return String(s??'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");}
  window.tripFlowOpenDefault=openDefault;
  window.tripFlowOpenCustom=openCustom;
  window.tripFlowBackToList=function(){routeState.tripId=null;routeState.city=null;routeState.date=null;routeState.plan=null;renderTripList();};
  window.tripFlowPlan=function(p){routeState.plan=p;routeState.city=null;routeState.date=null;renderDefaultDetail();};
  window.tripFlowCity=function(c){routeState.city=c;routeState.date=null;renderDefaultDetail();};
  window.tripFlowDate=function(d){routeState.date=d;renderDefaultDetail();};
  window.tripFlowCustomCity=function(i,c){routeState.city=c;routeState.date=null;renderCustomDetail(customTrips[i],i);};
  window.tripFlowCustomDate=function(i,d){routeState.date=d;renderCustomDetail(customTrips[i],i);};
  window.tripFlowDelete=function(i){if(confirm('删除这个大行程？')){customTrips.splice(i,1);localStorage.setItem('lvban-trips',JSON.stringify(customTrips));renderTripList();}};
  window.tripFlowShare=function(){ if(typeof shareCurrentTrip==='function') return shareCurrentTrip(); if(typeof openShareModal==='function') return openShareModal(); toast('分享功能已接入，当前分享入口已保留'); };
  window.tripFlowCollab=function(){ if(typeof openCollab==='function') return openCollab(); toast('好友协作入口已保留'); };
  window.tripFlowVote=function(){ if(typeof openVote==='function') return openVote(); toast('投票入口已保留'); };
  window.renderTrips=function(){ if(routeState.tripId==='default') return renderDefaultDetail(); if(routeState.tripId&&routeState.tripId.indexOf('custom:')===0) return renderCustomDetail(customTrips[Number(routeState.tripId.split(':')[1])],Number(routeState.tripId.split(':')[1])); return renderTripList(); };
  window.newTrip=function(){
    const cities=['福州','平潭','泉州','厦门','北京','上海','杭州','成都','重庆'];
    modal('新建行程',`<div class="form"><div class="trip-level">一级：我的行程</div><label>行程名称</label><input id="tName" placeholder="例如：十一福建游"><label>开始日期</label><input id="tStart" type="date"><label>结束日期</label><input id="tEnd" type="date"><label>出行人数</label><input id="tTravelers" type="number" min="1" value="2"><label>选择城市（可多选）</label><div class="chips" id="newTripCities">${cities.map(c=>`<button type="button" class="chip" data-city="${eAttr(c)}" onclick="this.classList.toggle('on')">${esc(c)}</button>`).join('')}</div><button class="btn primary" onclick="tripFlowSaveNewTrip()">创建行程</button></div>`);
  };
  window.tripFlowSaveNewTrip=function(){
    const selected=[...document.querySelectorAll('#newTripCities .chip.on')].map(x=>x.dataset.city);
    const t={name:document.getElementById('tName').value.trim(),start:document.getElementById('tStart').value,end:document.getElementById('tEnd').value,travelers:Number(document.getElementById('tTravelers').value||1),cities:selected};
    if(!t.name||!t.start||!t.end)return toast('请先填写行程名称和日期');
    if(!selected.length)return toast('请至少选择一个城市');
    if(t.end<t.start)return toast('结束日期不能早于开始日期');
    customTrips.push(t);localStorage.setItem('lvban-trips',JSON.stringify(customTrips));closeModal();renderTripList();toast('新建行程成功');
  };
  window.openCustom=window.tripFlowOpenCustom;
  window.renderTrips=window.renderTrips;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>window.renderTrips(),{once:true});
  else window.renderTrips();
})();
