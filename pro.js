/* 旅伴旅行管家 · 当前界面修复层 */
(function(){
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function dateOf(v){if(!v)return null;const d=new Date(v+'T00:00:00');return isNaN(d)?null:d}
  function tripSources(){
    const out=[];
    if(localStorage.getItem('lvban-default-deleted')!=='1')out.push({name:'十一福建游',start:'2026-09-28',end:'2026-10-04'});
    try{(JSON.parse(localStorage.getItem('lvban-trips')||'[]')||[]).forEach(t=>{if(t.start)out.push({name:t.name||'未命名行程',start:t.start,end:t.end})})}catch(e){}
    return out.filter(x=>dateOf(x.start)).sort((a,b)=>dateOf(a.start)-dateOf(b.start));
  }
  function countdown(){
    const hero=$('#home .hero');if(!hero)return;
    let box=$('#lv-countdown',hero);
    if(!box){box=document.createElement('div');box.id='lv-countdown';box.style='margin-top:16px;padding:15px 16px;border-radius:20px;background:#ffffff20;border:1px solid #ffffff40;color:#fff';hero.appendChild(box)}
    const list=tripSources();
    if(!list.length){box.innerHTML='<div style="font-size:13px;font-weight:700">还没有未来行程</div><div style="font-size:12px;margin-top:4px;opacity:.9">进入“我的行程”，点击唯一的 ＋ 创建行程</div>';return}
    const now=new Date();now.setHours(0,0,0,0);const target=list.find(x=>dateOf(x.start)>=now)||list[0];const start=dateOf(target.start),end=dateOf(target.end);
    if(start<=now&&end&&now<=end){box.innerHTML='<div style="font-size:30px;font-weight:900">旅行进行中</div><div style="font-size:12px;margin-top:3px;opacity:.9">当前关联：'+esc(target.name)+' · '+target.start+' 至 '+target.end+'</div>';return}
    const days=Math.max(0,Math.ceil((start-now)/86400000));box.innerHTML='<div style="font-size:34px;font-weight:900;letter-spacing:-1px">'+days+' 天</div><div style="font-size:12px;margin-top:3px;opacity:.9">距离下一次出发 · '+esc(target.name)+' · '+target.start+'</div>';
  }
  function cleanTrips(){
    const page=$('#trips');if(!page)return;
    $$('.tabs',page).forEach(t=>$$('button',t).forEach(b=>{if(b.textContent.trim().includes('发现灵感'))b.remove()}));
    $$('#tripDetail button').forEach(b=>{if((b.textContent||'').replace(/\s/g,'').includes('添加日程'))b.remove()});
    const floats=$$('.float');floats.forEach(b=>{if(b.id!=='globalNewTrip')b.remove()});
    const main=$('#globalNewTrip');if(main){main.textContent='＋';main.title='新建行程';main.setAttribute('aria-label','新建行程');main.style.display=$('#trips.page.active')?'block':'none'}
  }
  function hookCreate(){
    if(typeof window.saveTrip==='function'&&!window.__lvCountdownHook){const old=window.saveTrip;window.saveTrip=function(){const r=old.apply(this,arguments);setTimeout(countdown,80);return r};window.__lvCountdownHook=true;}
  }
  function run(){cleanTrips();countdown();hookCreate()}
  document.addEventListener('DOMContentLoaded',()=>{run();setInterval(run,700)});
  window.addEventListener('storage',countdown);
  const timer=setInterval(()=>{if(typeof window.go==='function'&&!window.__lvGoHook){const old=window.go;window.go=function(id){const r=old.apply(this,arguments);setTimeout(run,30);return r};window.__lvGoHook=true;clearInterval(timer)}},100);
})();
