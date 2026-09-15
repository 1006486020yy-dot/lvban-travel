/* 旅伴 AI · ChatGPT 风格对话 Composer */
(function(){
  'use strict';
  const css=`
    #ai .panel.chat{min-height:0!important;height:auto!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;overflow:visible!important}
    #ai .messages{min-height:0!important;height:auto!important;overflow:visible!important;display:flex!important;flex-direction:column!important;gap:16px!important;padding:4px 6px 150px!important}
    #ai .messages .msg{flex:0 0 auto!important;width:max-content!important;max-width:min(78%,680px)!important;padding:12px 16px!important;border-radius:18px!important;line-height:1.65!important;box-shadow:0 2px 10px rgba(40,35,80,.045)!important}
    #ai .messages .msg.ai{align-self:flex-start!important;background:#fff!important;border:1px solid #eeeef3!important;color:#29283a!important}
    #ai .messages .msg.user{align-self:flex-end!important;background:#6958f5!important;border:0!important;color:#fff!important}
    .lv-ai-composer-portal{position:fixed!important;z-index:100!important;display:flex!important;align-items:center!important;gap:8px!important;width:min(680px,calc(100vw - 32px))!important;min-height:58px!important;margin:0!important;padding:7px 8px 7px 17px!important;background:rgba(255,255,255,.96)!important;border:1px solid #dedee5!important;border-radius:28px!important;box-shadow:0 8px 28px rgba(30,30,50,.12)!important;backdrop-filter:blur(24px)!important;-webkit-backdrop-filter:blur(24px)!important;transform:none!important}
    .lv-ai-composer-portal textarea{flex:1!important;width:auto!important;min-width:0!important;height:42px!important;min-height:42px!important;max-height:140px!important;margin:0!important;padding:10px 2px!important;border:0!important;outline:0!important;resize:none!important;background:transparent!important;color:#252433!important;font-size:14px!important;line-height:1.5!important}
    .lv-ai-composer-portal textarea::placeholder{color:#8f8f99!important}
    .lv-ai-composer-portal .btn{flex:0 0 42px!important;width:42px!important;height:42px!important;padding:0!important;border-radius:50%!important;background:#6958f5!important;color:#fff!important;display:grid!important;place-items:center!important;font-size:0!important;box-shadow:none!important}
    .lv-ai-composer-portal .btn::after{content:'↑';font-size:20px!important;font-weight:700!important;line-height:1!important}
    .lv-ai-composer-portal.is-hidden{display:none!important}
    .lv-ai-recs{margin:2px 0 4px;display:grid;gap:9px;max-width:100%}
    .lv-ai-recs-title{font-size:12px;font-weight:800;color:#77788b;padding-left:3px}
    .lv-ai-rec{background:#fff;border:1px solid #e8e4f7;border-radius:17px;padding:12px;box-shadow:0 4px 14px rgba(64,58,138,.05)}
    .lv-ai-rec-head{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
    .lv-ai-rec-name{font-size:14px;font-weight:850;color:#29283a}
    .lv-ai-rec-city{font-size:11px;color:#6958f5;font-weight:700;margin-top:3px}
    .lv-ai-rec-address{font-size:11px;color:#8a8897;line-height:1.45;margin-top:5px}
    .lv-ai-rec-btn{margin-top:9px;width:100%;padding:9px 11px;border:0;border-radius:12px;background:#6958f5;color:#fff;font-size:12px;font-weight:800}
    .lv-ai-mask{position:fixed;inset:0;z-index:120;background:rgba(20,20,35,.42);display:flex;align-items:flex-end}
    .lv-ai-sheet{width:100%;max-height:78vh;overflow:auto;background:#f7f8fc;border-radius:26px 26px 0 0;padding:16px}
    .lv-ai-sheet-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
    .lv-ai-sheet h3{margin:0;font-size:18px}.lv-ai-select{width:100%;padding:12px;border:1px solid #dedbea;border-radius:14px;background:#fff;margin:5px 0 10px}.lv-ai-label{font-size:11px;color:#77788b;font-weight:700;margin-top:4px}.lv-ai-confirm{width:100%;padding:13px;border:0;border-radius:15px;background:#6958f5;color:#fff;font-weight:800;margin-top:5px}.lv-ai-cancel{border:0;background:#efedff;color:#6958f5;border-radius:12px;padding:8px 11px;font-weight:700}
    @media(max-width:760px){
      #ai .messages{padding:4px 6px 120px!important}
      #ai .messages .msg{max-width:88%!important}
      .lv-ai-composer-portal{width:calc(100vw - 24px)!important;min-height:56px!important;padding:6px 7px 6px 15px!important;border-radius:24px!important}
      .lv-ai-composer-portal textarea{height:40px!important;min-height:40px!important;font-size:14px!important}
      .lv-ai-composer-portal .btn{flex-basis:40px!important;width:40px!important;height:40px!important}
    }
  `;
  function style(){if(document.getElementById('lvban-ai-gpt-style'))return;const s=document.createElement('style');s.id='lvban-ai-gpt-style';s.textContent=css;document.head.appendChild(s)}
  let portal=null;
  function sync(){
    const original=document.querySelector('#ai .composer');const nav=document.querySelector('.bottom');const ai=document.getElementById('ai');
    if(!original||!nav||!ai)return;
    if(!portal){portal=original;portal.classList.add('lv-ai-composer-portal');document.body.appendChild(portal)}
    const active=ai.classList.contains('active');portal.classList.toggle('is-hidden',!active);if(!active)return;
    const nr=nav.getBoundingClientRect();
    const vv=window.visualViewport;const vh=vv&&vv.height?vv.height:window.innerHeight;
    let navTop=nr.top;
    if(navTop>vh-8)navTop=vh;
    const h=portal.getBoundingClientRect().height||58;
    const top=Math.max(8,Math.round(navTop-h-8));
    const left=Math.max(12,Math.round((window.innerWidth-portal.getBoundingClientRect().width)/2));
    portal.style.top=top+'px';portal.style.left=left+'px';portal.style.bottom='auto';
    const box=document.querySelector('#ai .messages');if(box)box.style.paddingBottom=Math.max(120,Math.round(window.innerHeight-top+20))+'px';
  }
  function observe(){
    const ai=document.getElementById('ai');if(!ai)return;
    new MutationObserver(sync).observe(ai,{attributes:true,attributeFilter:['class']});
    window.addEventListener('resize',sync,{passive:true});window.addEventListener('orientationchange',()=>setTimeout(sync,100),{passive:true});
    if(window.visualViewport)window.visualViewport.addEventListener('resize',sync,{passive:true});
    setTimeout(sync,50);setTimeout(sync,300);setTimeout(sync,900);
  }
  function addRecommendationCards(input){
    const box=document.querySelector('#ai .messages'),D=window.LVBAN_DATA||{};if(!box||!Array.isArray(D.spots)||!D.spots.length)return;
    const text=String(input||'').trim();if(!text)return;const cities=['福州','平潭','厦门','泉州'];const city=cities.find(c=>text.includes(c));const pool=D.spots.filter(x=>!city||x.city===city);const key=text.match(/景点|景区|海边|沙滩|逛|玩|去哪|推荐|旅游|打卡/);if(!pool.length||(!key&&!city))return;
    const picks=pool.slice(0,4),old=box.querySelector('.lv-ai-recs');if(old)old.remove();const wrap=document.createElement('div');wrap.className='lv-ai-recs';wrap.innerHTML='<div class="lv-ai-recs-title">旅伴为你找到这些可直接加入行程的推荐</div>';
    picks.forEach(x=>{const c=document.createElement('div');c.className='lv-ai-rec';c.innerHTML='<div class="lv-ai-rec-head"><div><div class="lv-ai-rec-name"></div><div class="lv-ai-rec-city"></div></div></div><div class="lv-ai-rec-address"></div><button class="lv-ai-rec-btn">＋ 加入已创建行程</button>';c.querySelector('.lv-ai-rec-name').textContent=x.name||'';c.querySelector('.lv-ai-rec-city').textContent=x.city||'';c.querySelector('.lv-ai-rec-address').textContent=x.address||'暂无地址';c.querySelector('button').onclick=()=>openAddSheet(x);wrap.appendChild(c)});box.appendChild(wrap);requestAnimationFrame(()=>{sync();window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'})});
  }
  function openAddSheet(item){
    const trips=Array.isArray(window.db?.trips)?window.db.trips:[];if(!trips.length){alert('目前还没有已创建的行程，请先创建一个行程');return}const mask=document.createElement('div');mask.className='lv-ai-mask';mask.innerHTML='<div class="lv-ai-sheet"><div class="lv-ai-sheet-head"><h3>加入行程</h3><button class="lv-ai-cancel">关闭</button></div><div class="lv-ai-rec" style="margin-bottom:10px"><div class="lv-ai-rec-name"></div><div class="lv-ai-rec-city"></div><div class="lv-ai-rec-address"></div></div><div class="lv-ai-label">选择大行程</div><select class="lv-ai-select lv-ai-trip"></select><div class="lv-ai-label">选择方案</div><select class="lv-ai-select lv-ai-plan"></select><div class="lv-ai-label">选择哪一天</div><select class="lv-ai-select lv-ai-day"></select><button class="lv-ai-confirm">加入当天行程</button></div>';document.body.appendChild(mask);mask.querySelector('.lv-ai-rec-name').textContent=item.name||'';mask.querySelector('.lv-ai-rec-city').textContent=item.city||'';mask.querySelector('.lv-ai-rec-address').textContent=item.address||'暂无地址';const ts=mask.querySelector('.lv-ai-trip'),ps=mask.querySelector('.lv-ai-plan'),ds=mask.querySelector('.lv-ai-day');ts.innerHTML=trips.map((t,i)=>'<option value="'+String(t.id).replace(/"/g,'&quot;')+'">'+(t.name||('行程 '+(i+1)))+'</option>').join('');function refresh(){const t=trips.find(t=>String(t.id)===String(ts.value))||trips[0],plans=Array.isArray(t.plans)?t.plans:[];ps.innerHTML=plans.map((p,i)=>'<option value="'+String(p.id).replace(/"/g,'&quot;')+'">'+(p.name||('方案 '+(i+1)))+'</option>').join('');refreshDays()}function refreshDays(){const t=trips.find(t=>String(t.id)===String(ts.value))||trips[0],p=(t.plans||[]).find(p=>String(p.id)===String(ps.value))||t.plans?.[0];ds.innerHTML=(p?.days||[]).map((d,i)=>'<option value="'+i+'">'+(d.label||d.title||('DAY '+(i+1)))+' · '+(d.date||'')+'</option>').join('')}ts.onchange=refresh;ps.onchange=refreshDays;refresh();mask.querySelector('.lv-ai-cancel').onclick=()=>mask.remove();mask.querySelector('.lv-ai-confirm').onclick=()=>{const t=trips.find(t=>String(t.id)===String(ts.value))||trips[0],p=(t.plans||[]).find(p=>String(p.id)===String(ps.value))||t.plans?.[0],idx=Number(ds.value),d=p?.days?.[idx];if(!t||!p||!d)return alert('请选择有效的行程、方案和日期');d.items=Array.isArray(d.items)?d.items:[];if(d.items.some(i=>String(i.name)===String(item.name))){mask.remove();alert('这一天已经有「'+item.name+'」了');return}d.items.push({id:(window.uid?window.uid():('ai-'+Date.now())),time:'09:00',type:'景点',name:item.name,address:item.address||'',city:item.city||'',budget:Number(item.price)||0});d.items.sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));try{window.save?.()}catch(e){}try{window.activeTrip=t.id;window.activePlan=p.id;window.activeDay=idx}catch(e){}mask.remove();window.renderTrips?.();window.go?.('trips')};
  }
  function wrap(){if(window.__lvbanAiGptWrapped||typeof window.askAI!=='function')return false;const base=window.askAI;window.askAI=function(){const input=document.getElementById('aiInput');const text=input?input.value.trim():'';const r=base.apply(this,arguments);setTimeout(()=>addRecommendationCards(text),900);return r};window.__lvbanAiGptWrapped=true;return true}
  function apply(){style();observe();wrap();setTimeout(wrap,400);setTimeout(wrap,1200)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();window.addEventListener('load',apply,{once:true});
})();