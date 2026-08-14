/* 旅伴旅行管家 · 行程架构重做
   目标：列表页 → 全屏行程画布；不展示“一级/二级类目”文字；日期可点击；唯一悬浮创建入口。
*/
(function(){
  const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const toast=m=>{if(window.toast)return window.toast(m);alert(m)};
  const copy=t=>{if(!t)return toast('暂无可复制内容');navigator.clipboard?.writeText(t).then(()=>toast('已复制')).catch(()=>toast(t));};
  const nav=a=>{if(!a)return toast('暂无地址');location.href='https://www.amap.com/search?query='+encodeURIComponent(a)};
  window._tripUI={city:'全部',type:'全部',openDays:{}};

  function trip(){return window.currentTrip?.()||window.db?.trips?.[0]}
  function plan(){return window.currentPlan?.()||trip()?.plans?.[0]}
  function day(){return plan()?.days?.[window._tripUI.day??0]||plan()?.days?.[0]}

  function renderList(){
    const page=$('#trips'); if(!page)return;
    page.innerHTML=`
      <div class="trip-list-page">
        <div class="trip-tabs"><button class="trip-tab active" data-tab="mine">我的行程</button><button class="trip-tab" data-tab="discover">发现灵感</button></div>
        <div id="tripCards" class="trip-cards"></div>
        <div class="trip-empty" id="tripEmpty" hidden><div class="empty-icon">🧳</div><h3>还没有行程</h3><p>创建一个行程，把日期、景点、美食和交通放在一起。</p><button class="trip-create-inline" onclick="window.openNewTrip()">创建我的第一个行程</button></div>
        <button class="trip-fab" onclick="window.openNewTrip()" aria-label="创建行程"><span>＋</span><b>创建行程</b></button>
      </div>`;
    renderCards();
    $$('.trip-tab').forEach(b=>b.onclick=()=>{$$('.trip-tab').forEach(x=>x.classList.toggle('active',x===b)); if(b.dataset.tab==='discover')renderDiscover();else renderCards();});
  }

  function renderCards(){
    const box=$('#tripCards');if(!box)return;
    const trips=window.db?.trips||[];
    $('#tripEmpty').hidden=trips.length>0;
    box.innerHTML=trips.map((t,i)=>{
      const p=t.plans?.[0], days=p?.days||[];
      const count=days.reduce((n,d)=>n+(d.items?.length||0),0);
      const cover= t.city||'福建';
      return `<button class="trip-card" onclick="window.openTripCanvas('${esc(t.id)}')">
        <div class="trip-card-cover"><span>${esc(cover)}</span><i>${days.length||0}天</i></div>
        <div class="trip-card-body"><h3>${esc(t.name||'未命名行程')}</h3><p>${esc(t.start||'')} ${t.end?'— '+esc(t.end):''}</p><div class="trip-card-meta"><span>${esc(t.plans?.map(x=>x.name).join(' / ')||'方案 A')}</span><span>${count} 个安排</span></div></div>
      </button>`;
    }).join('');
  }
  function renderDiscover(){
    const box=$('#tripCards');if(!box)return;
    box.innerHTML=`<div class="discover-card"><div class="discover-hero">🌊 福建海岸线</div><h3>海岛＋古城＋厦门</h3><p>把平潭的海、泉州的古城和厦门的慢生活串起来。</p><button class="trip-create-inline" onclick="window.openNewTrip()">用这个思路创建</button></div><div class="discover-card"><div class="discover-hero">🏝️ 厦门慢旅行</div><h3>鼓浪屿＋集美＋城市漫游</h3><p>少搬行李，多留时间给海边和城市。</p><button class="trip-create-inline" onclick="window.openNewTrip()">用这个思路创建</button></div>`;
  }

  window.openTripCanvas=function(id){
    window.activeTrip=id; const t=trip(); window.activePlan=t?.plans?.[0]?.id||'A'; window._tripUI.day=0; window._tripUI.city='全部';window._tripUI.type='全部';
    renderCanvas();
  };

  function renderCanvas(){
    const page=$('#trips');if(!page)return;const t=trip();if(!t)return renderList();
    page.innerHTML=`<div class="trip-canvas">
      <div class="canvas-top"><button class="back-btn" onclick="window.renderTrips()">‹</button><div><h2>${esc(t.name)}</h2><p>${esc(t.city||'')}</p></div><button class="canvas-more" onclick="window.openPlanEditor()">⋯</button></div>
      <div class="plan-switch"><button class="canvas-plan active" data-plan="A">方案 A</button><button class="canvas-plan" data-plan="B">方案 B</button></div>
      <div class="filter-scroll"><button class="filter active" data-filter="city:全部">全部城市</button><button class="filter" data-filter="city:福州">福州</button><button class="filter" data-filter="city:平潭">平潭</button><button class="filter" data-filter="city:泉州">泉州</button><button class="filter" data-filter="city:厦门">厦门</button><button class="filter" data-filter="type:景点">景点</button><button class="filter" data-filter="type:美食">美食</button><button class="filter" data-filter="type:交通">交通</button><button class="filter" data-filter="type:酒店">酒店</button></div>
      <div id="canvasDays" class="canvas-days"></div>
    </div>`;
    renderCanvasDays();
    $$('.canvas-plan').forEach(b=>b.onclick=()=>{window.activePlan=b.dataset.plan;window._tripUI.day=0;$$('.canvas-plan').forEach(x=>x.classList.toggle('active',x===b));renderCanvasDays();});
    $$('.filter').forEach(b=>b.onclick=()=>{const [k,v]=b.dataset.filter.split(':');window._tripUI.city=k==='city'?v:window._tripUI.city;window._tripUI.type=k==='type'?v:'全部';$$('.filter').forEach(x=>x.classList.toggle('active',x===b));renderCanvasDays();});
  }

  function renderCanvasDays(){
    const box=$('#canvasDays');if(!box)return;const p=plan();if(!p)return;
    box.innerHTML=(p.days||[]).map((d,i)=>{
      const isOpen=window._tripUI.openDays[d.id]!==false && (window._tripUI.openDays[d.id]===true || i===window._tripUI.day);
      const items=(d.items||[]).filter(x=>(window._tripUI.city==='全部'||x.city===window._tripUI.city)&&(window._tripUI.type==='全部'||x.type===window._tripUI.type));
      return `<section class="day-fold ${isOpen?'open':''}">
        <button class="day-head" onclick="window.toggleTripDay(${i})"><span><b>${esc(d.date||'')}</b><strong>${esc(d.title||'DAY '+(i+1))}</strong></span><em>${items.length}项 ${isOpen?'⌃':'⌄'}</em></button>
        <div class="day-body">${items.length?items.map((x,idx)=>eventHtml(x,idx)).join(''):`<div class="day-empty">这一天还没有符合筛选条件的安排</div>`}<button class="add-day-btn" onclick="window._tripUI.day=${i};window.openDayEditor()">＋ 添加日程</button></div>
      </section>`;
    }).join('');
  }
  function eventHtml(x,idx){return `<article class="timeline-item"><div class="time-col">${esc(x.time||'')}</div><div class="event-card"><div class="event-top"><span class="event-type">${esc(x.type||'行程')}</span><button class="event-menu" onclick="window.editCurrentEvent('${esc(x.id||'')}')">⋯</button></div><h3>${esc(x.name||'未命名')}</h3>${x.address?`<p class="event-address">📍 ${esc(x.address)}</p>`:''}${x.note?`<p class="event-note">${esc(x.note)}</p>`:''}<div class="event-actions">${x.address?`<button onclick="window.copyTripText('${encodeURIComponent(x.address)}')">复制地址</button><button onclick="window.navTripText('${encodeURIComponent(x.address)}')">导航</button>`:''}<button onclick="window.editCurrentEvent('${esc(x.id||'')}')">编辑</button></div></div></article>`}
  window.toggleTripDay=i=>{const d=plan()?.days?.[i];if(!d)return;window._tripUI.day=i;window._tripUI.openDays[d.id]=window._tripUI.openDays[d.id]===false;renderCanvasDays();};
  window.copyTripText=s=>copy(decodeURIComponent(s)); window.navTripText=s=>nav(decodeURIComponent(s));
  window.editCurrentEvent=id=>{const d=plan()?.days?.[window._tripUI.day];const idx=(d?.items||[]).findIndex(x=>x.id===id);if(idx>=0)window.openItemEditor(idx);};

  // Expose the actual canvas renderer before another script replaces openTripCanvas.
  // itinerary-layout-final.js uses this entry when it is called from the new card list.
  window._lvbanTripCanvas=renderCanvas;

  const oldOpenNew=window.openNewTrip;
  window.openNewTrip=function(){
    oldOpenNew?.();
    setTimeout(()=>{
      const m=$('#modal'),s=m?.querySelector('.sheet');if(!m||!s)return;
      m.classList.add('trip-fullscreen');
      const close=m.querySelector('.title button'); if(close)close.textContent='取消';
    },0);
  };
  const oldOpenDay=window.openDayEditor;
  window.openDayEditor=function(){oldOpenDay?.();setTimeout(()=>{$('#modal')?.classList.add('trip-fullscreen')},0)};
  const oldItem=window.openItemEditor;
  window.openItemEditor=function(i){oldItem?.(i);setTimeout(()=>{$('#modal')?.classList.add('trip-fullscreen')},0)};
  const oldClose=window.closeModal;
  window.closeModal=function(){const m=$('#modal');m?.classList.remove('trip-fullscreen');oldClose?.();};

  const cleanLegacy=()=>{$$('.crumb,.trip-level').forEach(x=>x.remove());$$('.trip-head').forEach(x=>x.classList.remove('trip-head'));};
  window.renderTrips=renderList;
  window.renderTripDetail=renderCanvas;
  window.selectTrip=id=>window.openTripCanvas(id);
  window.switchPlan=id=>{window.activePlan=id;renderCanvas()};

  if(!$('#trip-architecture-style')){
    const st=document.createElement('style');st.id='trip-architecture-style';st.textContent=`#trips{padding:0!important}.trip-list-page{min-height:calc(100vh - 150px);padding:14px 2px 90px}.trip-tabs{display:flex;gap:24px;border-bottom:1px solid var(--line);padding:4px 4px 0;margin-bottom:16px}.trip-tab{background:none;padding:10px 2px 13px;font-size:18px;font-weight:800;color:#9898a8;position:relative}.trip-tab.active{color:var(--text)}.trip-tab.active:after{content:'';position:absolute;left:0;right:0;bottom:-1px;height:3px;border-radius:3px;background:var(--p)}.trip-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.trip-card{padding:0;overflow:hidden;text-align:left;background:#fff;border:1px solid #eeeafa;border-radius:24px;box-shadow:0 12px 30px #403a8a10}.trip-card-cover{height:120px;padding:14px;display:flex;justify-content:space-between;align-items:flex-end;background:linear-gradient(135deg,#7261f7,#45b991);color:#fff}.trip-card-cover span{font-size:14px;font-weight:800}.trip-card-cover i{font-style:normal;font-size:12px;background:#ffffff35;padding:5px 8px;border-radius:10px}.trip-card-body{padding:14px}.trip-card-body h3{margin:0 0 6px;font-size:17px}.trip-card-body p{margin:0;color:var(--muted);font-size:12px}.trip-card-meta{display:flex;justify-content:space-between;margin-top:12px;font-size:11px;color:#7164d9}.trip-fab{position:fixed;z-index:45;right:22px;bottom:88px;width:58px;height:58px;border-radius:50%;background:var(--p);color:#fff;box-shadow:0 14px 30px #6958f555;display:flex;align-items:center;justify-content:center;flex-direction:column}.trip-fab span{font-size:24px;line-height:20px}.trip-fab b{font-size:8px;margin-top:2px}.trip-empty{text-align:center;padding:70px 20px}.empty-icon{font-size:44px}.trip-create-inline{padding:11px 15px;border-radius:14px;background:var(--p);color:#fff;font-weight:800}.discover-card{background:#fff;border-radius:24px;padding:14px;box-shadow:0 10px 28px #403a8a10}.discover-card+.discover-card{margin-top:12px}.discover-hero{height:110px;border-radius:18px;background:linear-gradient(135deg,#75bde8,#7a68f7);display:flex;align-items:center;justify-content:center;font-size:30px}.discover-card h3{margin:13px 0 5px}.discover-card p{color:var(--muted);font-size:12px;line-height:1.6}.trip-canvas{min-height:calc(100vh - 90px);padding:8px 2px 100px}.canvas-top{display:flex;align-items:center;gap:10px;padding:10px 2px 14px}.canvas-top h2{margin:0;font-size:22px}.canvas-top p{margin:4px 0 0;color:var(--muted);font-size:11px}.back-btn,.canvas-more{width:40px;height:40px;border-radius:14px;background:#fff;font-size:25px}.canvas-top>div{flex:1}.canvas-more{font-size:22px}.plan-switch{display:flex;gap:8px;margin-bottom:10px}.canvas-plan{flex:1;padding:12px;border-radius:15px;background:#fff;color:#777;font-weight:800}.canvas-plan.active{background:var(--p);color:#fff}.filter-scroll{display:flex;gap:7px;overflow:auto;padding:3px 0 12px}.filter{flex:0 0 auto;padding:8px 11px;border-radius:13px;background:#fff;color:#777;font-size:11px}.filter.active{background:#efedff;color:var(--p);font-weight:800}.day-fold{background:#ffffffc9;border:1px solid #fff;border-radius:20px;margin:10px 0;overflow:hidden}.day-head{width:100%;display:flex;justify-content:space-between;align-items:center;background:none;text-align:left;padding:14px 15px}.day-head span{display:flex;align-items:center;gap:10px}.day-head b{font-size:13px;color:var(--p)}.day-head strong{font-size:15px}.day-head em{font-style:normal;font-size:11px;color:var(--muted)}.day-body{display:none;padding:0 12px 13px}.day-fold.open .day-body{display:block}.timeline-item{display:grid;grid-template-columns:52px 1fr;gap:8px;padding:9px 0}.time-col{font-size:11px;font-weight:800;color:var(--p);padding-top:11px;text-align:right}.event-card{background:#f7f7fb;border-radius:17px;padding:13px}.event-top{display:flex;justify-content:space-between;align-items:center}.event-type{font-size:10px;padding:5px 8px;border-radius:9px;background:#efedff;color:var(--p);font-weight:800}.event-menu{background:#fff;border-radius:10px;padding:4px 8px}.event-card h3{margin:8px 0 5px;font-size:16px}.event-address,.event-note{font-size:11px;color:var(--muted);line-height:1.55}.event-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.event-actions button,.add-day-btn{padding:8px 10px;border-radius:11px;background:#fff;color:#5d4de5;font-size:11px}.add-day-btn{width:100%;margin-top:9px;border:1px dashed #cbc7ef;background:#faf9ff}.day-empty{text-align:center;padding:28px 10px;color:var(--muted);font-size:12px}@media(max-width:760px){.trip-cards{grid-template-columns:1fr}.trip-card-cover{height:112px}}`;
    document.head.appendChild(st);
  }
})();
