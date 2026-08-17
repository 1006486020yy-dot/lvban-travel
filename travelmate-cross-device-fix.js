/* 旅伴旅行管家 · 跨设备分享 + 新建行程时间字段修复
 * 不改现有主 UI，只修正当前数据层与分享层。
 * 1) 新建行程产生的数组型日程统一转换为 layout-final 使用的对象型日程，时间恢复显示。
 * 2) 分享直接读取当前 db.trip / plan，生成自包含 URL；另一台设备无需 localStorage 也能打开。
 */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  const getDB=()=>window.db&&typeof window.db==='object'?window.db:null;
  const uid=()=>window.uid?.()||('lv-share-'+Date.now()+'-'+Math.random().toString(36).slice(2));

  function normalizeItems(){
    const d=getDB(); if(!d||!Array.isArray(d.trips)) return false;
    let changed=false;
    d.trips.forEach(t=>(t.plans||[]).forEach(p=>(p.days||[]).forEach(day=>{
      if(!Array.isArray(day.items)) day.items=[];
      day.items=day.items.map(item=>{
        if(!Array.isArray(item)){
          if(item && item.time===undefined && item[0]!==undefined){changed=true;}
          return item;
        }
        changed=true;
        return {id:item.id||uid(),time:String(item[0]||''),type:item[4]||'日程',name:String(item[1]||''),address:String(item[2]||''),note:String(item[3]||''),city:String(item[5]||'')};
      });
      day.items.sort((a,b)=>String(a?.time||'99:99').localeCompare(String(b?.time||'99:99')));
    })));
    if(changed) window.save?.();
    return changed;
  }

  const b64=u=>{let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode(...u.subarray(i,i+0x8000));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
  const unb64=s=>{s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const x=atob(s),u=new Uint8Array(x.length);for(let i=0;i<x.length;i++)u[i]=x.charCodeAt(i);return u};
  async function encode(o){
    const raw=new TextEncoder().encode(JSON.stringify(o));
    if('CompressionStream' in window){
      try{const cs=new CompressionStream('gzip'),w=cs.writable.getWriter();w.write(raw);w.close();return 'g.'+b64(new Uint8Array(await new Response(cs.readable).arrayBuffer()))}catch(e){}
    }
    return 'r.'+b64(raw);
  }
  async function decode(token){
    const p=token.split('.'),type=p.shift(),u=unb64(p.join('.'));
    if(type==='g'&&'DecompressionStream' in window){const ds=new DecompressionStream('gzip'),w=ds.writable.getWriter();w.write(u);w.close();return JSON.parse(new TextDecoder().decode(await new Response(ds.readable).arrayBuffer()))}
    return JSON.parse(new TextDecoder().decode(u));
  }

  function current(){
    const d=getDB();if(!d||!Array.isArray(d.trips)||!d.trips.length)return null;
    const t=d.trips.find(x=>x.id===window.activeTrip)||d.trips[0];
    const p=(t?.plans||[]).find(x=>x.id===window.activePlan)||(t?.plans||[])[0];
    return t&&p?{t,p}:null;
  }
  function snapshot(){
    const c=current();if(!c)return null;
    const t=JSON.parse(JSON.stringify(c.t));
    const p=t.plans.find(x=>x.id===c.p.id)||t.plans[0];
    return {v:3,name:t.name||'共享行程',city:t.city||'',start:t.start||'',end:t.end||'',people:t.people||t.travelers||1,plan:JSON.parse(JSON.stringify(p))};
  }

  function style(){
    if($('#lv-cross-device-style'))return;
    const s=document.createElement('style');s.id='lv-cross-device-style';s.textContent=`
      .lv-cross-share{flex:0 0 auto!important;padding:10px 14px!important;border-radius:13px!important;background:#6958f5!important;color:#fff!important;font-weight:800!important;box-shadow:0 6px 16px rgba(105,88,245,.18)!important}
      .lv-cross-mask{position:fixed;inset:0;z-index:100000;background:rgba(23,23,42,.5);display:flex;align-items:flex-end}
      .lv-cross-sheet{width:100%;max-height:88vh;overflow:auto;background:#f7f8fc;border-radius:28px 28px 0 0;padding:20px;box-sizing:border-box}
      .lv-cross-url{width:100%;padding:12px;border:1px solid #e8e6f4;border-radius:14px;background:#fff;font-size:12px;box-sizing:border-box}
      .lv-cross-actions{display:flex;gap:8px;margin-top:12px}.lv-cross-actions button{flex:1;padding:12px;border:0;border-radius:13px;background:#efedff;color:#5d4de5;font-weight:800}.lv-cross-actions .primary{background:#6958f5;color:#fff}
      .lv-cross-readonly{display:inline-block;margin-top:8px;padding:6px 9px;border-radius:10px;background:rgba(255,255,255,.18);font-size:11px}
    `;document.head.appendChild(s);
  }

  async function share(){
    const snap=snapshot();
    if(!snap){alert('当前没有可分享的行程');return}
    const token=await encode(snap);
    const url=location.origin+location.pathname+'#tripshare='+token;
    const mask=document.createElement('div');mask.className='lv-cross-mask';
    mask.innerHTML=`<div class="lv-cross-sheet"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><h2 style="margin:0">分享行程</h2><button class="btn" data-close>关闭</button></div><p class="muted" style="line-height:1.7">这个链接包含当前行程本身。朋友在另一台手机、电脑打开后，会直接看到这条行程，不依赖你的浏览器本地数据。</p><input class="lv-cross-url" readonly value="${esc(url)}"><div class="lv-cross-actions"><button data-system>系统分享</button><button class="primary" data-copy>复制链接</button></div></div>`;
    document.body.appendChild(mask);
    $('[data-close]',mask).onclick=()=>mask.remove();
    $('[data-copy]',mask).onclick=async()=>{try{await navigator.clipboard.writeText(url)}catch(e){const i=$('.lv-cross-url',mask);i.select();document.execCommand('copy')} $('[data-copy]',mask).textContent='已复制'};
    $('[data-system]',mask).onclick=async()=>{if(navigator.share)await navigator.share({title:snap.name,text:'旅伴旅行管家 · 共享行程',url});else $('[data-copy]',mask).click()};
  }

  function inject(){
    style();normalizeItems();
    if(location.hash.startsWith('#tripshare='))return;
    const box=$('#tripDetail');if(!box)return;
    const head=box.querySelector('.lvcd-head,.trip-head,.detailbar,.scheme-head');if(!head)return;
    if(head.querySelector('.lv-cross-share'))return;
    const btn=document.createElement('button');btn.type='button';btn.className='lv-cross-share';btn.textContent='↗ 分享';btn.onclick=e=>{e.stopPropagation();share()};
    head.appendChild(btn);
  }

  function cities(t){
    if(Array.isArray(t.cityDurations)&&t.cityDurations.length)return t.cityDurations.map(x=>x.city).filter(Boolean);
    return [...new Set(String(t.city||'').split(/[·,、/|]+/).map(x=>x.trim()).filter(Boolean))];
  }
  function dayCity(t,p,i){
    const d=p.days?.[i];if(d?.city)return d.city;
    const ds=Array.isArray(t.cityDurations)?t.cityDurations:[];let n=0;for(const x of ds){n+=Number(x.days)||0;if(i<n)return x.city}
    const text=(d?.items||[]).map(x=>(x.city||'')+' '+(x.address||'')).join(' ');
    return cities(t).find(c=>text.includes(c))||cities(t)[0]||'';
  }
  function renderShared(s){
    const box=$('#tripDetail');if(!box)return;
    const t={name:s.name,city:s.city,start:s.start,end:s.end,people:s.people,cityDurations:s.cityDurations};
    const p=s.plan||{};const ds=p.days||[];let city=cities(t)[0]||'';let day=0;
    const draw=()=>{
      const cityIndexes=ds.map((d,i)=>i).filter(i=>dayCity(t,p,i)===city);if(!cityIndexes.length)cityIndexes.push(...ds.map((d,i)=>i));
      if(!cityIndexes.includes(day))day=cityIndexes[0]??0;
      const d=ds[day]||{date:'',title:'当天行程',items:[]};
      box.innerHTML=`<div class="lvcd"><div class="lvcd-head"><button class="lvcd-back" data-back>‹</button><div class="lvcd-title"><h2>${esc(t.name||'共享行程')}</h2><p>${esc(t.city||'')} · ${esc(t.start||'')} → ${esc(t.end||'')}</p></div><span class="lv-cross-readonly">只读分享</span></div>${cities(t).length?`<div class="lvcd-label">选择城市</div><div class="lvcd-row">${cities(t).map(c=>`<button class="lvcd-city ${c===city?'on':''}" data-city="${esc(c)}">${esc(c)}</button>`).join('')}</div>`:''}<div class="lvcd-label">${esc(city||'行程日期')}</div><div class="lvcd-row">${cityIndexes.map(i=>`<button class="lvcd-date ${i===day?'on':''}" data-day="${i}"><b>${esc(ds[i].label||('DAY '+(i+1)))}</b><small>${esc(ds[i].date||'')}</small></button>`).join('')}</div><section class="lvcd-day"><div class="lvcd-day-head"><div class="date">${esc(d.date||'')}</div><h3>${esc(d.title||d.label||('DAY '+(day+1)))}</h3><p>${esc(dayCity(t,p,day)||city)} · ${(d.items||[]).length} 项安排</p></div>${(d.items||[]).length?(d.items||[]).map(x=>{const it=Array.isArray(x)?{time:x[0],name:x[1],address:x[2],note:x[3],type:x[4]}:x;return `<article class="lvcd-event"><div class="lvcd-time">${esc(it.time||'未定')}</div><div class="lvcd-card"><span class="lvcd-type">${esc(it.type||'日程')}</span><h3>${esc(it.name||'未命名日程')}</h3>${it.address?`<div class="lvcd-address">📍 ${esc(it.address)}</div>`:''}${it.note?`<div class="lvcd-note">${esc(it.note)}</div>`:''}</div></article>`}).join(''):'<div class="lvcd-empty">今天还没有详细行程</div>'}</section></div>`;
      $('[data-back]',box).onclick=()=>{location.hash='';window.renderTrips?.()};
      $$('.lvcd-city',box).forEach(b=>b.onclick=()=>{city=b.dataset.city;day=0;draw()});
      $$('.lvcd-date',box).forEach(b=>b.onclick=()=>{day=Number(b.dataset.day);draw()});
    };
    document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));$('#trips')?.classList.add('active');$('#tripList')&&( $('#tripList').innerHTML='');draw();
  }

  async function loadShared(){
    const h=location.hash||'';const m=h.match(/^#(?:tripshare|share)=(.+)$/);if(!m)return;
    try{const s=await decode(m[1]);if(!s?.plan?.days)throw new Error('invalid');renderShared(s)}catch(e){console.error(e);alert('这个分享链接无效或已损坏')}
  }

  style();
  setTimeout(inject,100);setTimeout(inject,500);setTimeout(inject,1200);setInterval(inject,700);
  const mo=new MutationObserver(()=>setTimeout(inject,20));mo.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('load',()=>setTimeout(loadShared,250));window.addEventListener('hashchange',loadShared);
  setTimeout(loadShared,300);
})();
