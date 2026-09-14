/* 旅伴 AI · 手机端输入框 + 推荐加入行程交互 */
(function(){
  'use strict';
  const css=`
    #ai .panel.chat{min-height:0!important;height:auto!important;padding:0!important;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;display:flex!important;flex-direction:column!important;overflow:visible!important}
    #ai .messages{min-height:0!important;height:auto!important;overflow:visible!important;padding:4px 6px 18px!important;gap:14px!important}
    #ai .messages .msg{flex:0 0 auto!important;max-width:min(78%,680px)!important;width:max-content!important;min-height:0!important;padding:12px 16px!important;border-radius:18px!important;line-height:1.65!important;box-shadow:0 4px 14px rgba(64,58,138,.05)!important}
    #ai .messages .msg.ai{align-self:flex-start!important;background:#fff!important;border:1px solid #ece9f6!important;color:#29283a!important}
    #ai .messages .msg.user{align-self:flex-end!important;background:#6958f5!important;border:1px solid #6958f5!important;color:#fff!important}
    #ai .composer{flex:0 0 auto!important;width:100%!important;min-height:60px!important;margin:8px 0 0!important;padding:6px 7px 6px 16px!important;display:flex!important;align-items:center!important;gap:8px!important;background:#fff!important;border:1px solid #dedbea!important;border-radius:22px!important;box-shadow:0 8px 24px rgba(64,58,138,.09)!important}
    #ai .composer textarea{min-height:42px!important;max-height:120px!important;height:42px!important;line-height:1.5!important;padding:10px 2px!important;background:transparent!important;color:#252433!important}
    #ai .composer .btn{flex:0 0 48px!important;width:48px!important;height:48px!important;padding:0!important;border-radius:16px!important;display:grid!important;place-items:center!important;font-size:14px!important;font-weight:800!important}
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
    .lv-ai-sheet h3{margin:0;font-size:18px}
    .lv-ai-select{width:100%;padding:12px;border:1px solid #dedbea;border-radius:14px;background:#fff;margin:5px 0 10px}
    .lv-ai-label{font-size:11px;color:#77788b;font-weight:700;margin-top:4px}
    .lv-ai-confirm{width:100%;padding:13px;border:0;border-radius:15px;background:#6958f5;color:#fff;font-weight:800;margin-top:5px}
    .lv-ai-cancel{border:0;background:#efedff;color:#6958f5;border-radius:12px;padding:8px 11px;font-weight:700}
    @media(max-width:760px){
      #ai .panel.chat{min-height:0!important;height:auto!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;overflow:visible!important}
      #ai .messages{padding:4px 6px 120px!important}
      #ai .messages .msg{max-width:88%!important}
      #ai .composer{position:fixed!important;left:12px!important;right:12px!important;bottom:auto!important;top:var(--lv-ai-composer-top,auto)!important;z-index:110!important;width:auto!important;min-height:56px!important;margin:0!important;border-radius:20px!important;padding:6px 7px 6px 14px!important;box-shadow:0 10px 30px rgba(64,58,138,.14)!important}
      #ai .composer textarea{height:42px!important;min-height:42px!important}
      #ai .composer .btn{flex-basis:44px!important;width:44px!important;height:44px!important;border-radius:14px!important}
      .lv-ai-rec{padding:11px}
    }
  `;
  function injectStyle(){if(document.getElementById('lvban-ai-chat-final-style'))return;const st=document.createElement('style');st.id='lvban-ai-chat-final-style';st.textContent=css;document.head.appendChild(st)}
  function positionComposer(){
    const composer=document.querySelector('#ai .composer'),nav=document.querySelector('.bottom');
    if(!composer||!nav)return;
    if(window.innerWidth>760){composer.style.removeProperty('top');return}
    const navRect=nav.getBoundingClientRect();
    const h=composer.getBoundingClientRect().height||56;
    const gap=6;
    const top=Math.max(8,Math.round(navRect.top-h-gap));
    document.documentElement.style.setProperty('--lv-ai-composer-top',top+'px');
    const msg=document.querySelector('#ai .messages');
    if(msg)msg.style.paddingBottom=(Math.max(120,Math.round(window.innerHeight-navRect.top+h+18)))+'px';
  }
  function addRecommendationCards(input){
    const box=document.querySelector('#ai .messages');
    const D=window.LVBAN_DATA||{};
    if(!box||!Array.isArray(D.spots)||!D.spots.length)return;
    const text=String(input||'').trim();
    if(!text)return;
    const cities=['福州','平潭','厦门','泉州'];
    const city=cities.find(c=>text.includes(c));
    const pool=D.spots.filter(x=>!city||x.city===city);
    if(!pool.length)return;
    const key=(text.match(/景点|景区|海边|沙滩|逛|玩|去哪|推荐|旅游|打卡/)||[])[0];
    if(!key&&!city)return;
    const picks=pool.slice(0,4);
    const old=box.querySelector('.lv-ai-recs');if(old)old.remove();
    const wrap=document.createElement('div');wrap.className='lv-ai-recs';
    wrap.innerHTML='<div class="lv-ai-recs-title">旅伴为你找到这些可直接加入行程的推荐</div>';
    picks.forEach(x=>{
      const card=document.createElement('div');card.className='lv-ai-rec';
      card.innerHTML='<div class="lv-ai-rec-head"><div><div class="lv-ai-rec-name"></div><div class="lv-ai-rec-city"></div></div></div><div class="lv-ai-rec-address"></div><button class="lv-ai-rec-btn">＋ 加入已创建行程</button>';
      card.querySelector('.lv-ai-rec-name').textContent=x.name||'';
      card.querySelector('.lv-ai-rec-city').textContent=x.city||'';
      card.querySelector('.lv-ai-rec-address').textContent=x.address||'暂无地址';
      card.querySelector('button').onclick=()=>openAddSheet(x);
      wrap.appendChild(card);
    });
    box.appendChild(wrap);
    requestAnimationFrame(()=>{positionComposer();window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'})});
  }
  function openAddSheet(item){
    const trips=Array.isArray(window.db?.trips)?window.db.trips:[];
    if(!trips.length){alert('目前还没有已创建的行程，请先创建一个行程');return}
    const mask=document.createElement('div');mask.className='lv-ai-mask';
    mask.innerHTML='<div class="lv-ai-sheet"><div class="lv-ai-sheet-head"><h3>加入行程</h3><button class="lv-ai-cancel">关闭</button></div><div class="lv-ai-rec" style="margin-bottom:10px"><div class="lv-ai-rec-name"></div><div class="lv-ai-rec-city"></div><div class="lv-ai-rec-address"></div></div><div class="lv-ai-label">选择大行程</div><select class="lv-ai-select lv-ai-trip"></select><div class="lv-ai-label">选择方案</div><select class="lv-ai-select lv-ai-plan"></select><div class="lv-ai-label">选择哪一天</div><select class="lv-ai-select lv-ai-day"></select><button class="lv-ai-confirm">加入当天行程</button></div>';
    document.body.appendChild(mask);
    mask.querySelector('.lv-ai-rec-name').textContent=item.name||'';mask.querySelector('.lv-ai-rec-city').textContent=item.city||'';mask.querySelector('.lv-ai-rec-address').textContent=item.address||'暂无地址';
    const ts=mask.querySelector('.lv-ai-trip'),ps=mask.querySelector('.lv-ai-plan'),ds=mask.querySelector('.lv-ai-day');
    ts.innerHTML=trips.map((t,i)=>'<option value="'+String(t.id).replace(/"/g,'&quot;')+'">'+(t.name||('行程 '+(i+1)))+'</option>').join('');
    function refresh(){
      const t=trips.find(t=>String(t.id)===String(ts.value))||trips[0],plans=Array.isArray(t.plans)?t.plans:[];ps.innerHTML=plans.map((p,i)=>'<option value="'+String(p.id).replace(/"/g,'&quot;')+'">'+(p.name||('方案 '+(i+1)))+'</option>').join('');refreshDays();
    }
    function refreshDays(){const t=trips.find(t=>String(t.id)===String(ts.value))||trips[0],p=(t.plans||[]).find(p=>String(p.id)===String(ps.value))||t.plans?.[0];ds.innerHTML=(p?.days||[]).map((d,i)=>'<option value="'+i+'">'+(d.label||d.title||('DAY '+(i+1)))+' · '+(d.date||'')+'</option>').join('')}
    ts.onchange=refresh;ps.onchange=refreshDays;refresh();
    mask.querySelector('.lv-ai-cancel').onclick=()=>mask.remove();
    mask.querySelector('.lv-ai-confirm').onclick=()=>{
      const t=trips.find(t=>String(t.id)===String(ts.value))||trips[0],p=(t.plans||[]).find(p=>String(p.id)===String(ps.value))||t.plans?.[0],idx=Number(ds.value),d=p?.days?.[idx];
      if(!t||!p||!d)return alert('请选择有效的行程、方案和日期');
      d.items=Array.isArray(d.items)?d.items:[];
      const exists=d.items.some(i=>String(i.name)===String(item.name));
      if(exists){mask.remove();alert('这一天已经有「'+item.name+'」了');return}
      d.items.push({id:(window.uid?window.uid():('ai-'+Date.now())),time:'09:00',type:'景点',name:item.name,address:item.address||'',city:item.city||'',budget:Number(item.price)||0});
      d.items.sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
      try{window.save?.()}catch(e){}
      try{window.activeTrip=t.id;window.activePlan=p.id;window.activeDay=idx}catch(e){}
      mask.remove();
      if(typeof window.renderTrips==='function')window.renderTrips();
      if(typeof window.go==='function')window.go('trips');
      const toast=document.getElementById('lv-toast');if(toast){toast.textContent='已加入 '+(d.label||('DAY '+(idx+1)));toast.style.opacity=1;setTimeout(()=>toast.style.opacity=0,1600)}
    };
  }
  function wrapAskAI(){
    if(window.__lvbanAiInteractionWrapped||typeof window.askAI!=='function')return false;
    const base=window.askAI;
    window.askAI=function(){
      const input=document.getElementById('aiInput');const text=input?input.value.trim():'';
      const result=base.apply(this,arguments);
      setTimeout(()=>addRecommendationCards(text),900);
      return result;
    };
    window.__lvbanAiInteractionWrapped=true;return true;
  }
  function apply(){
    injectStyle();positionComposer();wrapAskAI();
    window.addEventListener('resize',positionComposer,{passive:true});
    window.addEventListener('orientationchange',()=>setTimeout(positionComposer,100),{passive:true});
    setTimeout(wrapAskAI,300);setTimeout(wrapAskAI,1000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
  window.addEventListener('load',apply,{once:true});
})();