/* 旅伴 AI · AI 行程智能加入 V2
 * AI 回复不再受限于本地目录：目录优先匹配；目录没有时，尝试从 AI 回复提取并生成 AI 节点。
 * 景点 / 美食 / 酒店分别识别；不改原有聊天 API，只增强回复后的行程交互。
 */
(function(){
  'use strict';
  if(window.__lvbanAiItineraryIntentV2)return;
  window.__lvbanAiItineraryIntentV2=true;
  const STYLE_ID='lvban-ai-itinerary-intent-v2-style';
  const ROOT_CLASS='lv-ai-smart-recs';
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  const data=()=>window.LVBAN_DATA||{};
  const allCatalog=()=>[
    ...(Array.isArray(data().spots)?data().spots:[]).map(x=>({...x,__type:'景点'})),
    ...(Array.isArray(data().foods)?data().foods:[]).map(x=>({...x,__type:'美食'})),
    ...(Array.isArray(data().hotels)?data().hotels:[]).map(x=>({...x,__type:'酒店'}))
  ];
  const typeByText=(s)=>{s=String(s||'');if(/酒店|住宿|入住|民宿/.test(s))return'酒店';if(/美食|餐厅|饭店|小吃|吃饭|午餐|晚餐|早餐|咖啡|火锅|烧烤/.test(s))return'美食';if(/景点|景区|寺|公园|花园|沙滩|古城|村|岩|索道|博物馆|打卡|游玩/.test(s))return'景点';return'其他'};
  function inject(){if(document.getElementById(STYLE_ID))return;const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
    #ai .${ROOT_CLASS}{display:grid;gap:10px;margin:8px 0 10px;max-width:min(92%,680px)}
    #ai .${ROOT_CLASS}-title{font-size:12px;font-weight:800;color:#737487;padding:2px 3px}
    #ai .lv-ai-smart-card{background:rgba(255,255,255,.98);border:1px solid #e5e8f2;border-radius:18px;padding:13px;box-shadow:0 7px 20px rgba(55,73,110,.07)}
    #ai .lv-ai-smart-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
    #ai .lv-ai-smart-name{font-size:14px;font-weight:850;color:#25263a;line-height:1.45}
    #ai .lv-ai-smart-type{display:inline-flex;align-items:center;padding:4px 8px;border-radius:10px;background:#eef5ff;color:#3971b7;font-size:10px;font-weight:800;white-space:nowrap}
    #ai .lv-ai-smart-meta{margin-top:5px;font-size:11px;color:#85879a;line-height:1.5}
    #ai .lv-ai-smart-note{margin-top:6px;font-size:11px;color:#66687b;line-height:1.5}
    #ai .lv-ai-smart-actions{display:flex;gap:7px;margin-top:10px}
    #ai .lv-ai-smart-actions button{flex:1;padding:9px 10px;border-radius:12px;border:1px solid #dfe7f5;background:#f7fbff;color:#3971b7;font-size:12px;font-weight:800}
    #ai .lv-ai-smart-actions .primary{background:#4d8fe5;color:#fff;border-color:#4d8fe5}
    #ai .lv-ai-smart-added{background:#f1f7ff!important;color:#3971b7!important;border-color:#d7e8fb!important}
    .lv-ai-smart-mask{position:fixed;inset:0;z-index:150;background:rgba(20,24,38,.38);display:flex;align-items:flex-end}
    .lv-ai-smart-sheet{width:100%;max-height:82vh;overflow:auto;background:#f7f8fc;border-radius:27px 27px 0 0;padding:18px}
    .lv-ai-smart-sheet-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:13px}.lv-ai-smart-sheet h3{margin:0;font-size:18px}
    .lv-ai-smart-label{font-size:11px;color:#7a7c8d;font-weight:750;margin-top:7px}.lv-ai-smart-select{width:100%;padding:12px;border:1px solid #dfe2ed;border-radius:14px;background:#fff;margin:5px 0 9px;outline:0}
    .lv-ai-smart-confirm{width:100%;padding:13px;border:0;border-radius:15px;background:#4d8fe5;color:#fff;font-weight:850;margin-top:6px}.lv-ai-smart-close{border:0;background:#edf3fb;color:#3971b7;border-radius:12px;padding:8px 11px;font-weight:750}
  `;document.head.appendChild(s)}
  function currentDay(){
    const trips=Array.isArray(window.db?.trips)?window.db.trips:[];
    const active=trips.find(t=>String(t.id)===String(window.activeTrip));
    const t=active||trips[0];
    const p=t?.plans?.find(x=>String(x.id)===String(window.activePlan))||t?.plans?.[0];
    const idx=Number.isFinite(Number(window._lv2Day))?Number(window._lv2Day):Number(window.activeDay||0);
    return {trips,t,p,idx,day:p?.days?.[idx]};
  }
  function catalogMatch(text){
    const s=String(text||'');
    const arr=allCatalog();
    const found=[];
    arr.forEach(x=>{if(x.name&&s.includes(String(x.name))&&!found.some(y=>String(y.name)===String(x.name)))found.push({...x,source:'catalog'})});
    return found;
  }
  function extractAIItems(text){
    const s=String(text||'').replace(/\r/g,'');
    const found=catalogMatch(s);
    if(found.length)return found.slice(0,8);
    const lines=s.split('\n').map(x=>x.replace(/^\s*(?:[-*•●▪·]|\d+[\.、)]|第\s*\d+\s*[站个])\s*/,'').trim()).filter(Boolean);
    const out=[];
    for(let i=0;i<lines.length;i++){
      const line=lines[i];
      if(line.length<2||line.length>80)continue;
      if(/^(你好|好的|可以|当然|建议|如果|首先|其次|另外|总结|说明|原因|方案|行程|推荐|这里|整体|因此|备注|地址[:：]?|时间[:：]?)/.test(line))continue;
      const type=typeByText(line);
      if(type==='其他')continue;
      let name=line.replace(/^(景点|美食|酒店)\s*[:：-]?\s*/,'').trim();
      name=name.split(/[：:，,。；;]/)[0].trim();
      if(name.length<2)continue;
      let address='';const am=line.match(/(?:地址|位于|位置)\s*[:：]\s*(.+)$/);if(am)address=am[1].trim();
      const next=lines[i+1]||'';if(!address){const nm=next.match(/^(?:地址|位于|位置)\s*[:：]\s*(.+)$/);if(nm){address=nm[1].trim();i++}}
      if(out.some(x=>x.name===name))continue;
      out.push({name,address,city:(s.match(/福州|平潭|厦门|泉州/)||[])[0]||'',note:'AI回复生成 · 请确认后加入',__type:type,source:'ai'});
      if(out.length>=8)break;
    }
    return out;
  }
  function inferFromReply(text){
    const items=extractAIItems(text);
    if(!items.length)return[];
    const defaultCity=(currentDay().day?.city)||'';
    return items.map(x=>({...x,city:x.city||defaultCity,source:x.source||'ai'}));
  }
  function openSheet(item,button){
    const {trips}=currentDay();
    if(!trips.length){alert('目前还没有已创建的行程，请先创建一个行程');return}
    const mask=document.createElement('div');mask.className='lv-ai-smart-mask';
    mask.innerHTML=`<div class="lv-ai-smart-sheet"><div class="lv-ai-smart-sheet-head"><h3>加入你的日程</h3><button class="lv-ai-smart-close">关闭</button></div><div class="lv-ai-smart-card"><div class="lv-ai-smart-head"><div class="lv-ai-smart-name"></div><span class="lv-ai-smart-type"></span></div><div class="lv-ai-smart-meta"></div><div class="lv-ai-smart-note"></div></div><div class="lv-ai-smart-label">加入大行程</div><select class="lv-ai-smart-select lv-ai-smart-trip"></select><div class="lv-ai-smart-label">加入方案</div><select class="lv-ai-smart-select lv-ai-smart-plan"></select><div class="lv-ai-smart-label">加入哪一天</div><select class="lv-ai-smart-select lv-ai-smart-day"></select><button class="lv-ai-smart-confirm">确认加入当天行程</button></div>`;
    document.body.appendChild(mask);
    mask.querySelector('.lv-ai-smart-name').textContent=item.name||'';mask.querySelector('.lv-ai-smart-type').textContent=item.__type||'其他';
    mask.querySelector('.lv-ai-smart-meta').textContent=(item.city?item.city+' · ':'')+(item.address||'AI未提供地址');mask.querySelector('.lv-ai-smart-note').textContent=item.note||((item.source==='catalog')?'来自旅伴内容库':'AI生成内容，加入前可确认');
    const ts=mask.querySelector('.lv-ai-smart-trip'),ps=mask.querySelector('.lv-ai-smart-plan'),ds=mask.querySelector('.lv-ai-smart-day');
    ts.innerHTML=trips.map((t,i)=>`<option value="${esc(t.id)}">${esc(t.name||('行程 '+(i+1)))}</option>`).join('');
    const initial=currentDay();if(initial.t)ts.value=String(initial.t.id);
    function refreshPlans(){const t=trips.find(t=>String(t.id)===String(ts.value))||trips[0];const plans=Array.isArray(t?.plans)?t.plans:[];ps.innerHTML=plans.map((p,i)=>`<option value="${esc(p.id)}">${esc(p.name||('方案 '+(i+1)))}</option>`).join('');if(initial.p&&plans.some(p=>String(p.id)===String(initial.p.id)))ps.value=String(initial.p.id);refreshDays()}
    function refreshDays(){const t=trips.find(t=>String(t.id)===String(ts.value))||trips[0];const p=(t?.plans||[]).find(p=>String(p.id)===String(ps.value))||t?.plans?.[0];ds.innerHTML=(p?.days||[]).map((d,i)=>`<option value="${i}">${esc(d.label||d.title||('DAY '+(i+1)))}${d.date?' · '+esc(d.date):''}</option>`).join('');if(initial.day&&p?.days?.[initial.idx])ds.value=String(initial.idx)}
    ts.onchange=refreshPlans;ps.onchange=refreshDays;refreshPlans();mask.querySelector('.lv-ai-smart-close').onclick=()=>mask.remove();
    mask.querySelector('.lv-ai-smart-confirm').onclick=()=>{
      const t=trips.find(t=>String(t.id)===String(ts.value))||trips[0],p=(t?.plans||[]).find(p=>String(p.id)===String(ps.value))||t?.plans?.[0],idx=Number(ds.value),d=p?.days?.[idx];if(!t||!p||!d){alert('请选择有效的行程、方案和日期');return}
      d.items=Array.isArray(d.items)?d.items:[];
      if(d.items.some(i=>String(i.name||'').trim()===String(item.name||'').trim())){mask.remove();if(button){button.textContent='已在当天行程';button.classList.add('lv-ai-smart-added');button.disabled=true}alert('这一天已经有「'+item.name+'」了');return}
      const stop=d.items.length+1;
      d.items.push({id:(window.uid?window.uid():('ai-'+Date.now())),stop,stopLabel:`第 ${stop} 站`,type:item.__type||'其他',name:String(item.name||'').trim(),address:String(item.address||''),note:String(item.note||''),city:String(item.city||d.city||''),source:item.source==='catalog'?'catalog':'ai'});
      try{window.save?.()}catch(e){}
      try{window.dispatchEvent(new CustomEvent('lvban-db-change'))}catch(e){}
      try{window.activeTrip=t.id;window.activePlan=p.id;window.activeDay=idx;window._lv2Day=idx;window._lv2City=d.city||item.city||''}catch(e){}
      mask.remove();if(button){button.textContent='已加入 '+(d.label||d.title||'当天行程');button.classList.add('lv-ai-smart-added');button.disabled=true}
      if(typeof window.renderTrips==='function')window.renderTrips();
      if(typeof window._lvbanTripCanvasV2==='function')window._lvbanTripCanvasV2();
    };
  }
  function render(reply){
    const box=document.querySelector('#ai .messages');if(!box)return;
    document.querySelectorAll('#ai .lv-ai-recs').forEach(x=>x.remove());
    document.querySelectorAll('#ai .'+ROOT_CLASS).forEach(x=>x.remove());
    const items=inferFromReply(reply);if(!items.length)return;
    const wrap=document.createElement('div');wrap.className=ROOT_CLASS;wrap.innerHTML='<div class="lv-ai-smart-title">AI 回复中的内容，可直接加入你的日程</div>';
    items.forEach(item=>{
      const card=document.createElement('div');card.className='lv-ai-smart-card';
      card.innerHTML='<div class="lv-ai-smart-head"><div class="lv-ai-smart-name"></div><span class="lv-ai-smart-type"></span></div><div class="lv-ai-smart-meta"></div><div class="lv-ai-smart-note"></div><div class="lv-ai-smart-actions"><button class="lv-ai-smart-add primary">＋ 加入日程</button><button class="lv-ai-smart-copy">查看内容</button></div>';
      card.querySelector('.lv-ai-smart-name').textContent=item.name;card.querySelector('.lv-ai-smart-type').textContent=item.__type;
      card.querySelector('.lv-ai-smart-meta').textContent=(item.city?item.city+' · ':'')+(item.address||'AI未提供地址');
      card.querySelector('.lv-ai-smart-note').textContent=item.note||((item.source==='catalog')?'来自旅伴内容库':'AI提供 · 加入前确认');
      const add=card.querySelector('.lv-ai-smart-add');add.onclick=()=>openSheet(item,add);
      card.querySelector('.lv-ai-smart-copy').onclick=()=>alert((item.__type||'内容')+'\n'+item.name+'\n'+(item.address||'AI未提供地址')+'\n\n来源：'+(item.source==='catalog'?'旅伴内容库':'AI回复'));
      wrap.appendChild(card);
    });
    box.appendChild(wrap);
    requestAnimationFrame(()=>{const m=box.querySelectorAll('.msg');const last=m[m.length-1];last?.scrollIntoView({behavior:'smooth',block:'nearest'})});
  }
  function wrapAsk(){
    if(window.__lvbanAiSmartAskWrapped)return true;
    if(typeof window.askAI!=='function')return false;
    const base=window.askAI;
    window.askAI=function(){
      const result=base.apply(this,arguments);
      setTimeout(()=>{const msgs=document.querySelectorAll('#messages .msg.ai');const last=msgs[msgs.length-1];if(last)render(String(last.textContent||''))},1400);
      return result;
    };
    window.__lvbanAiSmartAskWrapped=true;return true;
  }
  function boot(){inject();wrapAsk();setTimeout(wrapAsk,400);setTimeout(wrapAsk,1200)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  setInterval(()=>{wrapAsk()},800);
})();
