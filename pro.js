/* 旅伴旅行管家 · 行程稳定交互层 v2 */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dateOf = v => {
    if (!v) return null;
    const d = new Date(String(v).slice(0,10) + 'T00:00:00');
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
  const daysBetween = (a,b) => Math.ceil((a-b)/86400000);
  const readTrips = () => { try { const x=JSON.parse(localStorage.getItem('lvban-trips')||'[]'); return Array.isArray(x)?x:[]; } catch { return []; } };
  const writeTrips = x => localStorage.setItem('lvban-trips', JSON.stringify(x));
  const hiddenDefault = () => localStorage.getItem('lvban-hidden-default-trip') === '1';

  function style(){
    if($('#lv-stable-style')) return;
    const s=document.createElement('style'); s.id='lv-stable-style';
    s.textContent=`
      .lv-more-wrap{position:absolute;right:12px;top:12px;z-index:30}
      .lv-more{width:38px;height:34px!important;padding:0!important;border-radius:12px!important;font-size:21px!important;line-height:30px;background:#f3f1ff!important;color:#6254e8!important}
      .lv-menu{position:absolute;right:0;top:40px;min-width:150px;padding:6px;background:#fff;border:1px solid #eeeafa;border-radius:14px;box-shadow:0 12px 30px #302b5a25;display:none;z-index:100}
      .lv-menu.show{display:block}.lv-menu button{display:block;width:100%;text-align:left;padding:10px 11px;border-radius:10px;background:transparent;color:#333;font-size:13px}.lv-menu .lv-danger{color:#d94e5c}
      .lv-day-tools{display:flex;align-items:center;gap:8px;margin-left:auto}.lv-day-delete{white-space:nowrap}
      .lv-day-x{display:inline-flex;align-items:center;justify-content:center;margin-left:7px;width:21px;height:21px;border-radius:7px;background:#fff0f1;color:#d94e5c;font-weight:900;cursor:pointer;vertical-align:middle}
      .lv-event-delete{white-space:nowrap}.lv-countdown{margin-top:16px;padding:15px 16px;border-radius:20px;background:#ffffff20;border:1px solid #ffffff40;color:#fff}.lv-countdown strong{display:block;font-size:34px;font-weight:900;letter-spacing:-1px}.lv-countdown small{display:block;font-size:12px;margin-top:4px;opacity:.92}
      .lv-new-trip{width:auto!important;min-width:142px!important;padding:0 18px!important;border-radius:20px!important;font-size:15px!important;font-weight:800;white-space:nowrap}
      .lv-empty{padding:35px 16px;text-align:center;color:#77788b}
    `;
    document.head.appendChild(s);
  }

  function allCountdownTrips(){
    const list=[];
    if(!hiddenDefault()) list.push({name:'十一福建游',start:'2026-09-28',end:'2026-10-04',kind:'default'});
    readTrips().forEach((t,i)=>{
      if(!t || !t.start || !dateOf(t.start)) return;
      list.push({name:t.name||'我的旅行',start:t.start,end:t.end||t.start,kind:'custom',index:i});
    });
    return list.filter(x=>dateOf(x.start)).sort((a,b)=>dateOf(a.start)-dateOf(b.start));
  }

  function pickCountdownTrip(){
    const list=allCountdownTrips(), now=today();
    if(!list.length) return null;
    const current=list.find(x=>{const s=dateOf(x.start),e=dateOf(x.end);return s<=now&&e&&now<=e;});
    if(current) return current;
    const next=list.find(x=>dateOf(x.start)>=now);
    return next || list[list.length-1];
  }

  function countdown(){
    const hero=$('#home .hero'); if(!hero) return;
    let box=$('#lv-countdown',hero);
    if(!box){box=document.createElement('div');box.id='lv-countdown';box.className='lv-countdown';hero.appendChild(box);}
    const t=pickCountdownTrip();
    if(!t){box.innerHTML='<strong>暂无旅行</strong><small>进入“我的行程”创建旅行后，这里会自动关联最近一次出发。</small>';return;}
    const now=today(), start=dateOf(t.start), end=dateOf(t.end);
    if(start<=now&&end&&now<=end){box.innerHTML='<strong>旅行进行中</strong><small>当前行程：'+esc(t.name)+' · '+esc(t.start)+' 至 '+esc(t.end)+'</small>';return;}
    const n=daysBetween(start,now);
    box.innerHTML='<strong>'+Math.max(0,n)+' 天</strong><small>距离最近一次出发 · '+esc(t.name)+' · '+esc(t.start)+'</small>';
  }

  function removeInspiration(){
    $$('#trips .tabs .tab').forEach(x=>{if((x.textContent||'').trim()==='发现灵感')x.remove();});
  }

  function ensureOnlyOneCreateButton(){
    // 唯一“创建行程”入口：右下角悬浮按钮；“添加日程”不属于创建行程，不处理。
    $$('.float').forEach((b,i)=>{ if(i>0) b.remove(); });
    const b=$('.float');
    if(b){ b.classList.add('lv-new-trip'); b.textContent='＋ 新建行程'; b.setAttribute('aria-label','新建行程'); }
    $$('#trips button').forEach(b=>{
      const t=(b.textContent||'').replace(/\s/g,'');
      if(t.includes('新建行程') && !b.classList.contains('float')) b.remove();
    });
  }

  function addMore(card,index,isDefault){
    if(card.querySelector('.lv-more-wrap')) return;
    card.style.position='relative';
    const wrap=document.createElement('div');wrap.className='lv-more-wrap';
    const more=document.createElement('button');more.type='button';more.className='btn lv-more';more.textContent='⋯';
    const menu=document.createElement('div');menu.className='lv-menu';
    const copy=document.createElement('button');copy.textContent='复制行程信息';
    copy.onclick=e=>{e.stopPropagation();const t=isDefault?{name:'十一福建游',start:'2026-09-28',end:'2026-10-04'}:readTrips()[index];if(t){navigator.clipboard?.writeText([t.name,t.start,t.end].filter(Boolean).join(' · '));if(typeof toast==='function')toast('已复制行程信息')}menu.classList.remove('show')};
    const fav=document.createElement('button');fav.textContent='收藏';
    fav.onclick=e=>{e.stopPropagation();localStorage.setItem('lvban-fav-'+(isDefault?'default':index),'1');menu.classList.remove('show');if(typeof toast==='function')toast('已收藏')};
    const del=document.createElement('button');del.className='lv-danger';del.textContent='删除行程';
    del.onclick=e=>{e.stopPropagation();menu.classList.remove('show');if(isDefault)deleteDefault();else deleteCustom(index)};
    menu.append(copy,fav,del);wrap.append(more,menu);card.appendChild(wrap);
    more.onclick=e=>{e.stopPropagation();$$('.lv-menu.show').forEach(m=>{if(m!==menu)m.classList.remove('show')});menu.classList.toggle('show')};
  }

  function deleteDefault(){
    if(!confirm('确定删除“十一福建游”整个行程？删除后首页倒计时也会自动切换到下一条行程。'))return;
    localStorage.setItem('lvban-hidden-default-trip','1');
    if(typeof renderTrips==='function')renderTrips();
    countdown();
    if(typeof toast==='function')toast('行程已删除');
  }

  function deleteCustom(i){
    const list=readTrips(); if(!list[i])return;
    if(!confirm('确定删除“'+(list[i].name||'这个行程')+'”整个行程？'))return;
    list.splice(i,1);writeTrips(list);
    if(typeof renderTrips==='function')renderTrips();
    countdown();
    if(typeof toast==='function')toast('行程已删除');
  }

  function decorateDefaultDetail(){
    const detail=$('#tripDetail');if(!detail)return;
    const arr=window.schedules?.[window.state?.plan];
    if(!arr)return;
    const bar=$('.detailbar',detail);if(!bar)return;
    let delDay=$('.lv-day-delete',bar);
    if(!delDay){delDay=document.createElement('button');delDay.type='button';delDay.className='btn danger lv-day-delete';delDay.textContent='删除当天';bar.appendChild(delDay);}
    delDay.onclick=e=>{e.stopPropagation();deleteDefaultDay()};
    $$('.days .day',detail).forEach((b,i)=>{
      if(b.querySelector('.lv-day-x'))return;
      const x=document.createElement('span');x.className='lv-day-x';x.textContent='×';x.title='删除当天';
      x.onclick=e=>{e.stopPropagation();window.state.day=i;deleteDefaultDay()};b.appendChild(x);
    });
    $$('.timeline .event',detail).forEach((event,i)=>{
      const actions=$('.actions:last-child',event)||(()=>{const a=document.createElement('div');a.className='actions';event.appendChild(a);return a})();
      [...actions.querySelectorAll('button')].filter(b=>(b.textContent||'').trim()==='删除').forEach(b=>b.remove());
      const b=document.createElement('button');b.className='btn danger lv-event-delete';b.textContent='删除';b.onclick=e=>{e.stopPropagation();deleteDefaultEvent(i)};actions.appendChild(b);
    });
  }

  function deleteDefaultDay(){
    const arr=window.schedules?.[window.state?.plan], day=Number(window.state?.day||0);if(!arr)return;
    if(arr.length<=1){alert('至少保留一天行程。如果不需要这个旅行，请删除整个行程。');return;}
    if(!confirm('确定删除“'+(arr[day]?.title||arr[day]?.date||'当天')+'”整天行程？'))return;
    arr.splice(day,1);window.state.day=Math.max(0,Math.min(day,arr.length-1));renderTrips();
  }

  function deleteDefaultEvent(i){
    const arr=window.schedules?.[window.state?.plan], day=Number(window.state?.day||0);if(!arr?.[day])return;
    if(!confirm('确定删除这条详细日程？'))return;
    arr[day].items.splice(i,1);renderTrips();
  }

  function makeDays(start,end){
    const s=dateOf(start),e=dateOf(end);if(!s||!e||e<s)return [];
    const out=[];for(let d=new Date(s);d<=e;d.setDate(d.getDate()+1)){
      const iso=d.toISOString().slice(0,10);out.push({date:iso,title:'待安排',items:[]});
    }return out;
  }

  function newTripFixed(){
    modal('新建行程',`<div class="form"><label>行程名称</label><input id="tName" placeholder="例如：十一福建游"><label>开始日期</label><input id="tStart" type="date"><label>结束日期</label><input id="tEnd" type="date"><label>城市 / 地区</label><input id="tCity" placeholder="例如：福州 / 平潭 / 泉州 / 厦门"><label style="display:flex;align-items:center;gap:8px;padding:8px 0"><input id="tBackup" type="checkbox" style="width:auto"> 是否有备选路线</label><div class="muted">未勾选：只创建一条路线。勾选后才会出现方案 A / 方案 B。</div><button class="btn primary" onclick="saveTripFixed()">创建行程</button></div>`);
  }

  function saveTripFixed(){
    const name=$('#tName')?.value.trim(),start=$('#tStart')?.value,end=$('#tEnd')?.value,city=$('#tCity')?.value.trim(),hasBackup=!!$('#tBackup')?.checked;
    if(!name||!start||!end)return toast('请先填写行程名称和日期');
    if(dateOf(end)<dateOf(start))return toast('结束日期不能早于开始日期');
    const days=makeDays(start,end);
    const t={id:'trip_'+Date.now(),name,start,end,city,hasBackup,plan:'A',schedulesA:days,schedulesB:hasBackup?JSON.parse(JSON.stringify(days)):null};
    const list=readTrips();list.push(t);writeTrips(list);closeModal();go('trips');countdown();toast('行程已创建');
  }

  function openCustomFixed(i){
    window.__lvCustomIndex=i;window.__lvCustomPlan='A';window.__lvCustomDay=0;renderCustom();
  }

  function getCustom(){const list=readTrips(),i=Number(window.__lvCustomIndex);return list[i]||null;}
  function customSchedules(t){
    if(!t)return [];
    if(window.__lvCustomPlan==='B' && t.hasBackup)return t.schedulesB||(t.schedulesB=t.schedulesA.map(x=>({...x,items:JSON.parse(JSON.stringify(x.items||[]))})));
    return t.schedulesA||t.schedules||[];
  }
  function persistCustom(t){const list=readTrips();list[Number(window.__lvCustomIndex)]=t;writeTrips(list)}

  function renderCustom(){
    const detail=$('#tripDetail'),list=$('#tripList');if(!detail)return;
    const t=getCustom();if(!t){renderTrips();return;}
    if(list)list.innerHTML='';
    const arr=customSchedules(t);if(!arr.length){detail.innerHTML='<div class="panel"><h2>'+esc(t.name)+'</h2><p class="muted">暂无日期</p></div>';return;}
    const day=Math.max(0,Math.min(Number(window.__lvCustomDay||0),arr.length-1));window.__lvCustomDay=day;const d=arr[day];
    detail.innerHTML=`<div class="panel" style="margin-top:14px"><div class="detailbar"><div><h2 style="margin:0">${esc(t.name)}</h2><div class="muted">${esc(t.city||'')} · ${esc(t.start)} → ${esc(t.end)}</div></div><div class="lv-day-tools"><button class="btn primary" onclick="addCustomEvent()">＋ 添加日程</button><button class="btn danger" onclick="deleteCustomDay()">删除当天</button></div></div>${t.hasBackup?`<div class="plans"><button class="plan ${window.__lvCustomPlan==='A'?'on':''}" onclick="window.__lvCustomPlan='A';window.__lvCustomDay=0;renderCustom()"><b>方案 A</b><small>主路线</small></button><button class="plan ${window.__lvCustomPlan==='B'?'on':''}" onclick="window.__lvCustomPlan='B';window.__lvCustomDay=0;renderCustom()"><b>方案 B</b><small>备选路线</small></button></div>`:''}<div class="days">${arr.map((x,i)=>`<button class="day ${i===day?'on':''}" onclick="window.__lvCustomDay=${i};renderCustom()"><b>${esc(x.date)}</b><small>DAY ${i+1}</small><span class="lv-day-x" onclick="event.stopPropagation();window.__lvCustomDay=${i};deleteCustomDay()">×</span></button>`).join('')}</div><div class="card"><h2 style="margin:0">${esc(d.title||'待安排')}</h2><div class="muted">当天详细行程</div></div><div class="timeline">${(d.items||[]).map((x,i)=>`<div class="event card"><div class="event-time">${esc(x[0]||'—')}</div><h3>${esc(x[1]||'未命名')}</h3><div class="addr">📍 ${esc(x[2]||'')}</div><div class="muted" style="margin-top:5px">${esc(x[3]||'')}</div><div class="actions"><button class="btn" onclick="editCustomEvent(${i})">编辑</button><button class="btn danger" onclick="deleteCustomEvent(${i})">删除</button></div></div>`).join('')||'<div class="lv-empty">今天还没有安排，点击“＋ 添加日程”开始添加。</div>'}</div></div>`;
  }

  function deleteCustomDay(){
    const t=getCustom(),arr=customSchedules(t),day=Number(window.__lvCustomDay||0);if(!t||!arr[day])return;
    if(arr.length<=1){alert('至少保留一天行程。如果不需要这个旅行，请在行程卡片的 ⋯ 菜单中删除整个行程。');return;}
    if(!confirm('确定删除“'+(arr[day].date||'当天')+'”整天行程？'))return;
    arr.splice(day,1);window.__lvCustomDay=Math.max(0,Math.min(day,arr.length-1));persistCustom(t);renderCustom();countdown();
  }

  function deleteCustomEvent(i){
    const t=getCustom(),arr=customSchedules(t),day=Number(window.__lvCustomDay||0);if(!t||!arr[day])return;
    if(!confirm('确定删除这条详细日程？'))return;
    arr[day].items.splice(i,1);persistCustom(t);renderCustom();
  }

  function addCustomEvent(){
    modal('添加日程',`<div class="form"><label>时间</label><input id="cxTime" type="time" value="09:00"><label>名称</label><input id="cxName"><label>地址</label><input id="cxAddr"><label>备注</label><textarea id="cxNote"></textarea><button class="btn primary" onclick="saveCustomEvent()">加入当天</button></div>`);
  }
  function saveCustomEvent(){
    const t=getCustom(),arr=customSchedules(t),day=Number(window.__lvCustomDay||0);if(!t||!arr[day])return;
    arr[day].items.push([$('#cxTime').value,$('#cxName').value,$('#cxAddr').value,$('#cxNote').value]);arr[day].items.sort((a,b)=>String(a[0]).localeCompare(String(b[0])));persistCustom(t);closeModal();renderCustom();
  }
  function editCustomEvent(i){
    const t=getCustom(),arr=customSchedules(t),day=Number(window.__lvCustomDay||0),x=arr[day]?.items?.[i];if(!x)return;
    modal('编辑日程',`<div class="form"><label>时间</label><input id="cxTime" type="time" value="${esc(x[0])}"><label>名称</label><input id="cxName" value="${esc(x[1])}"><label>地址</label><input id="cxAddr" value="${esc(x[2])}"><label>备注</label><textarea id="cxNote">${esc(x[3])}</textarea><button class="btn primary" onclick="saveEditCustomEvent(${i})">保存</button></div>`);
  }
  function saveEditCustomEvent(i){const t=getCustom(),arr=customSchedules(t),day=Number(window.__lvCustomDay||0);arr[day].items[i]=[$('#cxTime').value,$('#cxName').value,$('#cxAddr').value,$('#cxNote').value];persistCustom(t);closeModal();renderCustom()}

  function renderTripsFixed(){
    const list=$('#tripList'),detail=$('#tripDetail');if(!list||!detail)return;
    removeInspiration();ensureOnlyOneCreateButton();
    const cards=[];
    if(!hiddenDefault())cards.push(`<div class="card tripcard" style="position:relative"><span class="badge">旅行计划</span><h2>十一福建游</h2><div class="muted">福州 · 平潭 · 泉州 · 厦门</div><div class="muted" style="margin-top:12px">2026-09-28 → 2026-10-04 · ${window.state?.plan==='B'?'备选路线':'主路线'}</div><div class="actions"><button class="btn primary" onclick="openDefault()">打开行程</button></div></div>`);
    readTrips().forEach((t,i)=>cards.push(`<div class="card tripcard" style="position:relative"><span class="badge">我的行程</span><h2>${esc(t.name)}</h2><div class="muted">${esc(t.start)} → ${esc(t.end)}</div><div class="muted">${esc(t.city||'')}</div><div class="actions"><button class="btn primary" onclick="openCustomFixed(${i})">打开</button><button class="btn" onclick="editCustomFixed(${i})">编辑</button></div></div>`));
    list.innerHTML=cards.length?`<div class="tripgrid">${cards.join('')}</div>`:'<div class="lv-empty">还没有行程，点击右下角“＋ 新建行程”创建。</div>';
    // 每张卡片都必须有 ⋯，删除放进菜单，避免误触。
    $$('#tripList .tripcard').forEach((card,i)=>addMore(card,i,i===0&&!hiddenDefault()));
    if(window.__lvCustomIndex!==undefined && getCustom())renderCustom();else{detail.innerHTML=detail.innerHTML||'';decorateDefaultDetail();}
    countdown();
  }

  function editCustomFixed(i){
    const list=readTrips(),t=list[i];if(!t)return;
    modal('编辑行程',`<div class="form"><label>行程名称</label><input id="etName" value="${esc(t.name)}"><label>开始日期</label><input id="etStart" type="date" value="${esc(t.start)}"><label>结束日期</label><input id="etEnd" type="date" value="${esc(t.end)}"><label>城市 / 地区</label><input id="etCity" value="${esc(t.city||'')}"><button class="btn primary" onclick="saveEditCustom(${i})">保存</button><button class="btn danger" onclick="deleteCustom(${i})">删除这个行程</button></div>`);
  }
  function saveEditCustom(i){const list=readTrips(),t=list[i];if(!t)return;t.name=$('#etName').value.trim();t.start=$('#etStart').value;t.end=$('#etEnd').value;t.city=$('#etCity').value.trim();writeTrips(list);closeModal();renderTripsFixed();countdown()}

  function patchFunctions(){
    if(typeof window.newTrip==='function'&&!window.__lvNewTripPatched){window.newTrip=newTripFixed;window.__lvNewTripPatched=true;}
    window.saveTripFixed=saveTripFixed;
    window.openCustom=openCustomFixed;
    window.deleteCustom=deleteCustom;
    window.deleteCustomDay=deleteCustomDay;
    window.deleteCustomEvent=deleteCustomEvent;
    window.addCustomEvent=addCustomEvent;
    window.saveCustomEvent=saveCustomEvent;
    window.editCustomEvent=editCustomEvent;
    window.saveEditCustomEvent=saveEditCustomEvent;
    window.editCustomFixed=editCustomFixed;
    window.saveEditCustom=saveEditCustom;
    window.renderTrips=renderTripsFixed;
  }

  function run(){
    style();patchFunctions();removeInspiration();ensureOnlyOneCreateButton();
    if(typeof renderTrips==='function')renderTrips();
    countdown();
  }

  document.addEventListener('DOMContentLoaded',()=>{run();setTimeout(run,200);setTimeout(run,800)});
  window.addEventListener('storage',()=>{countdown();if(typeof renderTrips==='function')renderTrips()});
  document.addEventListener('click',e=>{if(!e.target.closest('.lv-more-wrap'))$$('.lv-menu.show').forEach(m=>m.classList.remove('show'));});
})();
