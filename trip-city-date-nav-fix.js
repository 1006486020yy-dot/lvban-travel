/* 旅伴旅行管家 · 行程城市 / 日期双层导航修复 v2026-08-12 */
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function style(){
    if($('#lv-city-date-nav-style'))return;
    const s=document.createElement('style');
    s.id='lv-city-date-nav-style';
    s.textContent=`
      .lv-city-date-nav{margin:4px 0 18px}
      .lv-city-nav,.lv-date-nav{display:flex;gap:9px;overflow-x:auto;overflow-y:hidden;padding:3px 2px 8px;scrollbar-width:none}
      .lv-city-nav::-webkit-scrollbar,.lv-date-nav::-webkit-scrollbar{display:none}
      .lv-city-nav{margin-bottom:2px}
      .lv-city-tab,.lv-date-tab{flex:0 0 auto;border:0;cursor:pointer;white-space:nowrap;background:#fff;color:#666;border-radius:14px;box-shadow:0 4px 14px rgba(55,45,120,.06);font-weight:800}
      .lv-city-tab{padding:10px 16px;font-size:13px}
      .lv-date-tab{padding:9px 13px;font-size:11px}
      .lv-city-tab.on,.lv-date-tab.on{background:#efedff;color:var(--p);box-shadow:0 5px 15px rgba(105,88,245,.12)}
      .lv-date-nav{border-top:1px solid rgba(90,80,150,.08);padding-top:9px}
      .lv-city-date-nav.single .lv-date-nav{border-top:0;padding-top:3px}
      .lv-day.lv-day-hidden{display:none!important}
      .lv-day.lv-day-active{display:block!important}
      @media(max-width:760px){
        .lv-city-tab{padding:9px 14px}
        .lv-date-tab{padding:8px 11px}
      }
    `;
    document.head.appendChild(s);
  }

  function getTrip(){
    const db=window.db;
    const list=Array.isArray(db?.trips)?db.trips:[];
    return list.find(t=>t.id===window.activeTrip)||list[0]||null;
  }

  function getPlan(trip){
    if(!trip)return null;
    return (trip.plans||[]).find(p=>p.id===window.activePlan)||(trip.plans||[])[0]||null;
  }

  function splitCities(trip){
    if(Array.isArray(trip?.cityDurations)&&trip.cityDurations.length){
      return trip.cityDurations.map(x=>({city:String(x.city||'未命名城市'),days:Math.max(0,Number(x.days)||0)})).filter(x=>x.city);
    }
    const raw=String(trip?.city||'').trim();
    const cities=raw.split(/\s*[·•、,，/]+\s*/).map(x=>x.trim()).filter(Boolean);
    return (cities.length?cities:['未设置目的地']).map(city=>({city,days:0}));
  }

  function buildGroups(trip,days){
    const configured=splitCities(trip);
    const groups=[];
    let cursor=0;
    configured.forEach((cfg,index)=>{
      let count=cfg.days;
      if(index===configured.length-1 && count<=0)count=days.length-cursor;
      const assigned=[];
      for(let i=cursor;i<Math.min(days.length,cursor+Math.max(0,count));i++)assigned.push(i);
      cursor+=assigned.length;
      groups.push({city:cfg.city,indices:assigned});
    });
    if(cursor<days.length){
      const fallback=groups.length?groups[groups.length-1]:{city:'未设置目的地',indices:[]};
      for(let i=cursor;i<days.length;i++)fallback.indices.push(i);
      if(!groups.length)groups.push(fallback);
    }
    /* 如果旧数据没有城市天数，但确实存在多个城市，则尽量平均分配，避免全部日期挤到第一个城市。 */
    if(groups.length>1 && groups.every(g=>g.indices.length===0) && days.length){
      groups.forEach(g=>g.indices=[]);
      days.forEach((_,i)=>groups[i%groups.length].indices.push(i));
    }
    return groups;
  }

  function enhance(){
    style();
    const detail=$('.lv-detail');
    if(!detail)return;
    const days=$$('.lv-day',detail);
    if(!days.length)return;
    if(detail.dataset.lvCityDateReady==='1')return;

    const trip=getTrip();
    const groups=buildGroups(trip,days);
    const multi=groups.length>1;

    /* 删除原来的“全部 / 景点 / 美食 / 交通 / 酒店”筛选栏；这里改成城市 + 日期导航。 */
    $$('.lv-filters',detail).forEach(x=>x.remove());

    const nav=document.createElement('div');
    nav.className='lv-city-date-nav '+(multi?'multi':'single');
    nav.innerHTML=`
      ${multi?`<div class="lv-city-nav" role="tablist" aria-label="城市选择">${groups.map((g,i)=>`<button type="button" class="lv-city-tab ${i===0?'on':''}" data-city-index="${i}">${esc(g.city)}</button>`).join('')}</div>`:''}
      <div class="lv-date-nav" role="tablist" aria-label="日期选择"></div>
    `;

    const anchor=$('.lv-day',detail);
    anchor.parentNode.insertBefore(nav,anchor);

    const cityTabs=$$('.lv-city-tab',nav);
    const dateNav=$('.lv-date-nav',nav);
    let activeGroup=0;
    let activeDay=groups[0]?.indices[0] ?? 0;

    function dayLabel(day,index){
      const d=$('.lv-day-head .date',day)?.textContent?.trim()||'';
      const n=$('.lv-day-head .name',day)?.textContent?.trim()||('DAY '+(index+1));
      const m=n.match(/(?:DAY|第)\s*(\d+)/i);
      return {date:d,day:m?('DAY '+m[1]):n};
    }

    function showDay(index){
      activeDay=index;
      days.forEach((day,i)=>{
        day.classList.toggle('lv-day-hidden',i!==index);
        day.classList.toggle('lv-day-active',i===index);
      });
      $$('.lv-date-tab',dateNav).forEach(b=>b.classList.toggle('on',Number(b.dataset.dayIndex)===index));
      /* 切换日期时只显示当天，不让用户继续向下翻其它日期。 */
      const active=days[index];
      if(active)window.requestAnimationFrame(()=>active.scrollIntoView({behavior:'smooth',block:'start'}));
    }

    function renderDates(groupIndex,initialIndex){
      activeGroup=groupIndex;
      const indices=groups[groupIndex]?.indices||[];
      dateNav.innerHTML=indices.map((idx,pos)=>{
        const x=dayLabel(days[idx],idx);
        return `<button type="button" class="lv-date-tab ${idx===initialIndex?'on':''}" data-day-index="${idx}"><span>${esc(x.date)}</span></button>`;
      }).join('');
      $$('.lv-date-tab',dateNav).forEach(b=>b.onclick=()=>showDay(Number(b.dataset.dayIndex)));
      showDay(indices.includes(initialIndex)?initialIndex:(indices[0]??0));
    }

    cityTabs.forEach((b,i)=>b.onclick=()=>{
      cityTabs.forEach(x=>x.classList.remove('on'));b.classList.add('on');
      const first=groups[i]?.indices?.[0]??0;
      renderDates(i,first);
    });

    renderDates(0,activeDay);
    detail.dataset.lvCityDateReady='1';
  }

  let scheduled=false;
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;enhance()});
  }

  function boot(){
    style();
    const observer=new MutationObserver(()=>schedule());
    observer.observe(document.body,{childList:true,subtree:true});
    schedule();
    setTimeout(schedule,300);
    setTimeout(schedule,1000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
