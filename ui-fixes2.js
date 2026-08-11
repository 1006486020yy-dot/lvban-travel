/* 旅伴旅行管家 UI 最终修复：行程卡片三点菜单 + 删除/复制/收藏 + 移除发现灵感 + 工具箱入口 */
(function(){
  const toast=m=>window.toast?.(m);
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  function removeLegacyFab(){ document.querySelectorAll('.float').forEach(el=>el.remove()); }

  function deleteTrip(id){
    const trips=window.db?.trips||[];
    const t=trips.find(x=>x.id===id); if(!t)return;
    if(!confirm('确定删除「'+(t.name||'这个行程')+'」吗？删除后不可恢复。'))return;
    window.db.trips=trips.filter(x=>x.id!==id);
    window.activeTrip=window.db.trips[0]?.id||null;
    window.activePlan=window.db.trips[0]?.plans?.[0]?.id||null;
    window.activeDay=0;
    window.save?.();
    window.renderTrips?.();
    toast('行程已删除');
  }
  window.deleteTrip=deleteTrip;

  function copyTrip(t){
    if(!t)return;
    const clone=JSON.parse(JSON.stringify(t));
    clone.id=(window.uid?.()||('trip_'+Date.now()));
    clone.name=(t.name||'行程')+'（副本）';
    (clone.plans||[]).forEach(p=>{p.id=(p.id==='A'||p.id==='B')?p.id:('P_'+Date.now());});
    window.db.trips.push(clone);
    window.save?.();
    window.renderTrips?.();
    toast('已复制行程');
  }

  function openTripMenu(id,anchor){
    document.querySelectorAll('.trip-more-menu').forEach(x=>x.remove());
    const t=(window.db?.trips||[]).find(x=>x.id===id); if(!t)return;
    const menu=document.createElement('div');
    menu.className='trip-more-menu';
    menu.innerHTML='<button data-act="copy">复制行程</button><button data-act="fav">收藏行程</button><button data-act="delete" class="danger">删除行程</button>';
    menu.onclick=e=>{
      const b=e.target.closest('button');if(!b)return;
      e.preventDefault();e.stopPropagation();
      if(b.dataset.act==='copy')copyTrip(t);
      if(b.dataset.act==='fav'){t.favorite=!t.favorite;window.save?.();toast(t.favorite?'已收藏行程':'已取消收藏');}
      if(b.dataset.act==='delete')deleteTrip(id);
      menu.remove();
    };
    document.body.appendChild(menu);
    const r=anchor.getBoundingClientRect();
    const mw=150;
    menu.style.left=Math.min(window.innerWidth-mw-10,Math.max(10,r.right-mw))+'px';
    menu.style.top=(r.bottom+6)+'px';
    setTimeout(()=>document.addEventListener('click',()=>menu.remove(),{once:true}),0);
  }
  window.openTripMenu=openTripMenu;

  function patchTripCards(){
    document.querySelectorAll('#tripList .trip-card').forEach((card,index)=>{
      if(card.querySelector('.trip-more'))return;
      const trips=window.db?.trips||[]; const t=trips[index];
      if(!t)return;
      card.style.position='relative';
      card.style.paddingRight='52px';
      const more=document.createElement('button');
      more.type='button';more.className='trip-more';more.setAttribute('aria-label','更多操作');more.textContent='⋯';
      more.onclick=e=>{e.preventDefault();e.stopPropagation();openTripMenu(t.id,more)};
      card.appendChild(more);
    });
  }

  function removeDiscoverTab(){
    const trips=document.getElementById('trips'); if(!trips)return;
    trips.querySelectorAll('.tabs .tab').forEach(btn=>{
      if((btn.textContent||'').trim()==='发现灵感')btn.remove();
    });
  }

  function addToolboxEntry(){
    const home=document.getElementById('home'); if(!home)return;
    const grid=home.querySelector('.grid'); if(!grid)return;
    if(grid.querySelector('.toolbox-entry'))return;
    const b=document.createElement('button');
    b.className='card tile toolbox-entry';
    b.innerHTML='<div class="ico">🧰</div><b>工具箱</b><span class="muted">旅行计算、时间、预算等实用工具</span>';
    b.onclick=()=>openToolbox();
    grid.appendChild(b);
  }

  function openToolbox(){
    const items=[
      ['💰','旅行预算计算器','按人数、天数快速估算总预算'],
      ['💱','汇率换算','旅行时快速换算外币'],
      ['🕐','时差 / 当地时间','查看目的地当前时间与时差'],
      ['🧳','行李清单','按旅行天数生成/勾选行李清单'],
      ['📋','旅行清单','门票、证件、预约事项集中管理'],
      ['🌦️','天气查询','查看行程城市天气与出行提示'],
      ['🚇','交通换乘','整理机场、高铁、地铁换乘信息'],
      ['📍','距离 / 路程计算','计算景点之间的距离和预计时间'],
      ['💵','人均费用','多人出行自动计算AA费用'],
      ['⏱️','旅行倒计时','距离出发日期还有多少天']
    ];
    const modal=document.getElementById('modal'),body=document.getElementById('modalBody'),title=document.getElementById('modalTitle');
    if(!modal||!body)return;
    if(title)title.textContent='工具箱';
    body.innerHTML='<div class="toolbox-grid">'+items.map(x=>`<button class="toolbox-item" onclick="toast('已选择：${esc(x[1])}，功能开发中')"><span>${x[0]}</span><div><b>${esc(x[1])}</b><small>${esc(x[2])}</small></div></button>`).join('')+'</div>';
    modal.classList.add('show');
  }
  window.openToolbox=openToolbox;

  function patch(){
    removeLegacyFab();
    removeDiscoverTab();
    addToolboxEntry();
    patchTripCards();
  }

  if(!document.getElementById('trip-menu-toolbox-style')){
    const st=document.createElement('style');st.id='trip-menu-toolbox-style';st.textContent=`
      .trip-more{position:absolute;right:12px;top:12px;width:34px;height:34px;border-radius:12px;background:rgba(255,255,255,.72);color:#5f6074;font-size:22px;line-height:1;display:grid;place-items:center;z-index:8;box-shadow:0 5px 14px rgba(60,50,100,.08)}
      .trip-more:active{transform:scale(.94)}
      .trip-more-menu{position:fixed;z-index:9999;width:150px;padding:6px;border-radius:15px;background:rgba(255,255,255,.97);box-shadow:0 18px 40px rgba(30,25,60,.18);border:1px solid #eeeaf8;backdrop-filter:blur(20px)}
      .trip-more-menu button{display:block;width:100%;padding:11px 12px;border-radius:10px;background:transparent;text-align:left;color:#222;font-size:13px}
      .trip-more-menu button:hover{background:#f5f3ff}
      .trip-more-menu button.danger{color:#d94e5c}
      .toolbox-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .toolbox-item{display:flex;gap:10px;align-items:flex-start;text-align:left;padding:14px;border-radius:16px;background:#fff;border:1px solid #eceaf5;box-shadow:0 6px 18px rgba(60,50,100,.05)}
      .toolbox-item>span{font-size:23px}.toolbox-item b{display:block;font-size:13px}.toolbox-item small{display:block;color:#77788b;font-size:11px;line-height:1.45;margin-top:4px}
      @media(max-width:760px){.toolbox-grid{grid-template-columns:1fr}.trip-more-menu{width:145px}}
    `;document.head.appendChild(st);
  }

  const oldRenderTrips=window.renderTrips;
  if(oldRenderTrips&&!window.__tripMenuRenderPatch){
    window.renderTrips=function(){oldRenderTrips();setTimeout(patch,0)};
    window.__tripMenuRenderPatch=true;
  }
  const oldRenderHome=window.renderHome;
  if(oldRenderHome&&!window.__tripMenuHomePatch){
    window.renderHome=function(){oldRenderHome();setTimeout(addToolboxEntry,0)};
    window.__tripMenuHomePatch=true;
  }
  new MutationObserver(()=>patch()).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('load',()=>setTimeout(patch,180));
  setTimeout(patch,180);
})();