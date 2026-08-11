/* 旅伴旅行管家 · 当前界面修复层 */
(function(){
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function dateOf(v){if(!v)return null;const d=new Date(String(v).slice(0,10)+'T00:00:00');return isNaN(d)?null:d}

  // 首页倒计时唯一数据源：当前旅伴行程库 window.db.trips。
  // 不再读取旧版 lvban-trips，也不再写死“十一福建游”。
  function tripSources(){
    return (Array.isArray(window.db?.trips)?window.db.trips:[])
      .map(t=>({trip:t,start:t.start,end:t.end}))
      .filter(x=>dateOf(x.start))
      .sort((a,b)=>dateOf(a.start)-dateOf(b.start));
  }

  function pickTrip(){
    const list=tripSources(); if(!list.length)return null;
    const now=new Date();now.setHours(0,0,0,0);
    // 优先关联正在进行中的行程。
    const current=list.find(x=>{const s=dateOf(x.start),e=dateOf(x.end);return e&&s<=now&&now<=e;});
    if(current)return current;
    // 没有进行中的行程时，关联开始日期距离今天最近的未来行程。
    const future=list.find(x=>dateOf(x.start)>=now);
    if(future)return future;
    // 所有行程都已结束时，关联最近结束/开始的那一个，避免回到旧的写死行程。
    return list[list.length-1];
  }

  function countdown(){
    const hero=$('#home .hero');if(!hero)return;
    let box=$('#lv-countdown',hero);
    if(!box){box=document.createElement('div');box.id='lv-countdown';box.style='margin-top:16px;padding:15px 16px;border-radius:20px;background:#ffffff20;border:1px solid #ffffff40;color:#fff';hero.appendChild(box)}
    const target=pickTrip();
    if(!target){box.innerHTML='<div style="font-size:13px;font-weight:700">还没有未来行程</div><div style="font-size:12px;margin-top:4px;opacity:.9">进入“我的行程”，点击 ＋ 创建行程</div>';return;}
    const now=new Date();now.setHours(0,0,0,0);const start=dateOf(target.start),end=dateOf(target.end);
    if(start<=now&&end&&now<=end){box.innerHTML='<div style="font-size:30px;font-weight:900">旅行进行中</div><div style="font-size:12px;margin-top:3px;opacity:.9">当前关联：'+esc(target.trip.name||'我的旅行')+' · '+target.trip.start+' 至 '+target.trip.end+'</div>';return;}
    const days=Math.max(0,Math.ceil((start-now)/86400000));
    box.innerHTML='<div style="font-size:34px;font-weight:900;letter-spacing:-1px">'+days+' 天</div><div style="font-size:12px;margin-top:3px;opacity:.9">距离下一次出发 · '+esc(target.trip.name||'我的旅行')+' · '+target.trip.start+'</div>';
  }

  function cleanTrips(){
    const page=$('#trips');if(!page)return;
    $$('.tabs',page).forEach(t=>$$('button',t).forEach(b=>{if(b.textContent.trim().includes('发现灵感'))b.remove()}));
    $$('#tripDetail button').forEach(b=>{if((b.textContent||'').replace(/\s/g,'').includes('添加日程'))b.remove()});
    const floats=$$('.float');floats.forEach(b=>{if(b.id!=='globalNewTrip')b.remove()});
    const main=$('#globalNewTrip');if(main){main.textContent='＋';main.title='新建行程';main.setAttribute('aria-label','新建行程');main.style.display=$('#trips.page.active')?'block':'none'}
  }

  function run(){cleanTrips();countdown()}
  document.addEventListener('DOMContentLoaded',()=>{run();setInterval(run,700)});
  window.addEventListener('storage',countdown);
  const timer=setInterval(()=>{if(typeof window.go==='function'&&!window.__lvGoHook){const old=window.go;window.go=function(id){const r=old.apply(this,arguments);setTimeout(run,30);return r};window.__lvGoHook=true;clearInterval(timer)}},100);
})();