/* 旅伴 AI · AI 推荐加入行程 V3
 * 只补强“AI 回复后出现可加入行程组件”这一层，不改原聊天请求。
 * 支持：目录内景点/美食/酒店；目录外 AI 推荐；尤其兼容“推荐几家店/餐厅”的自然语言回复。
 */
(function(){
  'use strict';
  if(window.__lvbanAiItineraryIntentV3)return;
  window.__lvbanAiItineraryIntentV3=true;

  const STYLE='lvban-ai-intent-v3-style';
  const ROOT='lv-ai-smart-recs-v3';
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  const D=()=>window.LVBAN_DATA||{};

  function catalog(){
    return [
      ...(Array.isArray(D().foods)?D().foods:[]).map(x=>({...x,__type:'美食'})),
      ...(Array.isArray(D().spots)?D().spots:[]).map(x=>({...x,__type:'景点'})),
      ...(Array.isArray(D().hotels)?D().hotels:[]).map(x=>({...x,__type:'酒店'}))
    ];
  }
  function typeOf(s){
    s=String(s||'');
    if(/酒店|住宿|入住|民宿|宾馆|客栈/.test(s))return'酒店';
    if(/餐厅|饭店|美食|小吃|餐馆|饭馆|咖啡|甜品|奶茶|火锅|烧烤|海鲜|面馆|粉店|茶馆|菜馆|吃饭|午餐|晚餐|早餐|店里|这家店|门店/.test(s))return'美食';
    if(/景点|景区|公园|花园|寺|古城|古镇|沙滩|海滩|海边|村|岩|索道|博物馆|展馆|打卡|游玩|风车|湾|岛/.test(s))return'景点';
    return'其他';
  }
  function exact(text){
    const s=String(text||''),out=[];
    catalog().forEach(x=>{if(x.name&&s.includes(String(x.name))&&!out.some(y=>y.name===x.name))out.push({...x,source:'catalog'})});
    return out.slice(0,8);
  }
  function parse(text){
    const s=String(text||'').replace(/\r/g,'');
    const hit=exact(s); if(hit.length)return hit;
    const lines=s.split('\n').map(x=>x.trim()).filter(Boolean);
    const city=(s.match(/福州|平潭|厦门|泉州|杭州|北京/)||[])[0]||'';
    const out=[];
    for(let i=0;i<lines.length;i++){
      let raw=lines[i].replace(/^\s*(?:[-*•●▪·]|\d+[\.、)）]|第\s*\d+\s*[站个家])\s*/,'').trim();
      if(raw.length<2||raw.length>100)continue;
      if(/^(你好|好的|可以|当然|建议|如果|首先|其次|另外|总结|说明|原因|方案|行程|推荐一下|整体|因此|备注|注意)/.test(raw))continue;
      let type=typeOf(raw);
      if(type==='其他' && /推荐|适合|值得|可以去|可以吃|必吃|值得吃|值得去/.test(raw)){
        type=/店|餐厅|饭店|小吃|咖啡|火锅|烧烤|海鲜|面馆|早餐|午餐|晚餐|吃/.test(raw)?'美食':type;
      }
      if(type==='其他')continue;
      const am=raw.match(/(?:地址|位于|位置|地址是)\s*[:：]\s*(.+)$/);
      let address=am?am[1].trim():'';
      let name=raw.replace(/^(?:景点|美食|酒店|餐厅|饭店|推荐)\s*[:：-]?\s*/,'').trim();
      name=name.split(/[：:，,。；;]/)[0].trim();
      name=name.replace(/^(?:推荐|可以考虑|可以去|可以吃|例如|比如)\s*/,'').trim();
      if(!address && lines[i+1]){
        const nm=lines[i+1].match(/^(?:地址|位于|位置|地址是)\s*[:：]\s*(.+)$/);
        if(nm){address=nm[1].trim();i++;}
      }
      if(name.length<2||out.some(x=>x.name===name))continue;
      out.push({name,address,city,__type:type,source:'ai',note:'AI回复生成 · 请确认后加入'});
      if(out.length>=8)break;
    }
    return out;
  }
  function current(){
    const trips=Array.isArray(window.db?.trips)?window.db.trips:[];
    const t=trips.find(x=>String(x.id)===String(window.activeTrip))||trips[0];
    const p=t?.plans?.find(x=>String(x.id)===String(window.activePlan))||t?.plans?.[0];
    const idx=Number.isFinite(Number(window.activeDay))?Number(window.activeDay):0;
    return {trips,t,p,idx,day:p?.days?.[idx]};
  }
  function css(){
    if(document.getElementById(STYLE))return;
    const s=document.createElement('style');s.id=STYLE;s.textContent=`
      #ai .${ROOT}{display:grid;gap:10px;margin:10px 0 14px;max-width:min(92%,680px)}
      #ai .${ROOT}-title{font-size:12px;font-weight:800;color:#737487;padding:2px 3px}
      #ai .lv-ai-smart-card-v3{background:rgba(255,255,255,.98);border:1px solid #e5e8f2;border-radius:18px;padding:13px;box-shadow:0 7px 20px rgba(55,73,110,.07)}
      #ai .lv-ai-smart-head-v3{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
      #ai .lv-ai-smart-name-v3{font-size:14px;font-weight:850;color:#25263a;line-height:1.45}
      #ai .lv-ai-smart-type-v3{display:inline-flex;padding:4px 8px;border-radius:10px;background:#eef5ff;color:#3971b7;font-size:10px;font-weight:800;white-space:nowrap}
      #ai .lv-ai-smart-meta-v3{margin-top:5px;font-size:11px;color:#85879a;line-height:1.5}
      #ai .lv-ai-smart-note-v3{margin-top:6px;font-size:11px;color:#66687b;line-height:1.5}
      #ai .lv-ai-smart-actions-v3{display:flex;gap:7px;margin-top:10px}
      #ai .lv-ai-smart-actions-v3 button{flex:1;padding:9px 10px;border-radius:12px;border:1px solid #dfe7f5;background:#f7fbff;color:#3971b7;font-size:12px;font-weight:800}
      #ai .lv-ai-smart-actions-v3 .primary{background:#4d8fe5;color:#fff;border-color:#4d8fe5}
      #ai .lv-ai-smart-added-v3{background:#f1f7ff!important;color:#3971b7!important;border-color:#d7e8fb!important}
      .lv-ai-smart-mask-v3{position:fixed;inset:0;z-index:150;background:rgba(20,24,38,.38);display:flex;align-items:flex-end}
      .lv-ai-smart-sheet-v3{width:100%;max-height:82vh;overflow:auto;background:#f7f8fc;border-radius:27px 27px 0 0;padding:18px}
      .lv-ai-smart-sheet-head-v3{display:flex;align-items:center;justify-content:space-between;margin-bottom:13px}.lv-ai-smart-sheet-v3 h3{margin:0;font-size:18px}
      .lv-ai-smart-label-v3{font-size:11px;color:#7a7c8d;font-weight:750;margin-top:7px}.lv-ai-smart-select-v3{width:100%;padding:12px;border:1px solid #dfe2ed;border-radius:14px;background:#fff;margin:5px 0 9px;outline:0}
      .lv-ai-smart-confirm-v3{width:100%;padding:13px;border:0;border-radius:15px;background:#4d8fe5;color:#fff;font-weight:850;margin-top:6px}.lv-ai-smart-close-v3{border:0;background:#edf3fb;color:#3971b7;border-radius:12px;padding:8px 11px;font-weight:750}
    `;document.head.appendChild(s);
  }
  function sheet(item,btn){
    const {trips,t,p}=current();
    if(!trips.length){alert('目前还没有已创建的行程，请先创建一个行程');return;}
    const mask=document.createElement('div');mask.className='lv-ai-smart-mask-v3';
    mask.innerHTML=`<div class="lv-ai-smart-sheet-v3"><div class="lv-ai-smart-sheet-head-v3"><h3>加入你的日程</h3><button class="lv-ai-smart-close-v3">关闭</button></div><div class="lv-ai-smart-card-v3"><div class="lv-ai-smart-head-v3"><div class="lv-ai-smart-name-v3"></div><span class="lv-ai-smart-type-v3"></span></div><div class="lv-ai-smart-meta-v3"></div><div class="lv-ai-smart-note-v3"></div></div><div class="lv-ai-smart-label-v3">加入大行程</div><select class="lv-ai-smart-select-v3 trip"></select><div class="lv-ai-smart-label-v3">加入方案</div><select class="lv-ai-smart-select-v3 plan"></select><div class="lv-ai-smart-label-v3">加入哪一天</div><select class="lv-ai-smart-select-v3 day"></select><button class="lv-ai-smart-confirm-v3">确认加入当天行程</button></div>`;
    document.body.appendChild(mask);
    mask.querySelector('.lv-ai-smart-name-v3').textContent=item.name;mask.querySelector('.lv-ai-smart-type-v3').textContent=item.__type;
    mask.querySelector('.lv-ai-smart-meta-v3').textContent=(item.city?item.city+' · ':'')+(item.address||'AI未提供地址');
    mask.querySelector('.lv-ai-smart-note-v3').textContent=item.source==='catalog'?'来自旅伴内容库':'AI提供 · 加入前确认';
    const ts=mask.querySelector('.trip'),ps=mask.querySelector('.plan'),ds=mask.querySelector('.day');
    ts.innerHTML=trips.map((x,i)=>`<option value="${esc(x.id)}">${esc(x.name||('行程 '+(i+1)))}</option>`).join('');
    if(t)ts.value=String(t.id);
    function refreshPlans(){const x=trips.find(y=>String(y.id)===String(ts.value))||trips[0];const ps0=Array.isArray(x?.plans)?x.plans:[];ps.innerHTML=ps0.map((z,i)=>`<option value="${esc(z.id)}">${esc(z.name||('方案 '+(i+1)))}</option>`).join('');if(p&&ps0.some(z=>String(z.id)===String(p.id)))ps.value=String(p.id);refreshDays()}
    function refreshDays(){const x=trips.find(y=>String(y.id)===String(ts.value))||trips[0],z=(x?.plans||[]).find(y=>String(y.id)===String(ps.value))||x?.plans?.[0];ds.innerHTML=(z?.days||[]).map((d,i)=>`<option value="${i}">${esc(d.label||d.title||('DAY '+(i+1)))}${d.date?' · '+esc(d.date):''}</option>`).join('')}
    ts.onchange=refreshPlans;ps.onchange=refreshDays;refreshPlans();mask.querySelector('.lv-ai-smart-close-v3').onclick=()=>mask.remove();
    mask.querySelector('.lv-ai-smart-confirm-v3').onclick=()=>{const x=trips.find(y=>String(y.id)===String(ts.value))||trips[0],z=(x?.plans||[]).find(y=>String(y.id)===String(ps.value))||x?.plans?.[0],i=Number(ds.value),d=z?.days?.[i];if(!x||!z||!d){alert('请选择有效的行程、方案和日期');return}d.items=Array.isArray(d.items)?d.items:[];if(d.items.some(y=>String(y.name||'').trim()===String(item.name||'').trim())){mask.remove();btn.textContent='已在当天行程';btn.classList.add('lv-ai-smart-added-v3');btn.disabled=true;return}const stop=d.items.length+1;d.items.push({id:window.uid?window.uid():('ai-'+Date.now()),stop,stopLabel:`第 ${stop} 站`,type:item.__type||'其他',name:String(item.name||'').trim(),address:String(item.address||''),note:String(item.note||''),city:String(item.city||d.city||''),source:item.source==='catalog'?'catalog':'ai'});try{window.save?.()}catch(e){}try{window.dispatchEvent(new CustomEvent('lvban-db-change'))}catch(e){}try{window.activeTrip=x.id;window.activePlan=z.id;window.activeDay=i}catch(e){}mask.remove();btn.textContent='已加入 '+(d.label||d.title||'当天行程');btn.classList.add('lv-ai-smart-added-v3');btn.disabled=true;if(typeof window.renderTrips==='function')window.renderTrips();if(typeof window.go==='function')window.go('trips')};
  }
  function render(reply){
    const box=document.querySelector('#ai .messages');if(!box)return;
    box.querySelectorAll('.'+ROOT).forEach(x=>x.remove());
    const items=parse(reply);if(!items.length)return;
    const wrap=document.createElement('div');wrap.className=ROOT;wrap.innerHTML='<div class="lv-ai-smart-recs-v3-title">AI 推荐内容，可直接加入你的日程</div>';
    items.forEach(item=>{const c=document.createElement('div');c.className='lv-ai-smart-card-v3';c.innerHTML='<div class="lv-ai-smart-head-v3"><div class="lv-ai-smart-name-v3"></div><span class="lv-ai-smart-type-v3"></span></div><div class="lv-ai-smart-meta-v3"></div><div class="lv-ai-smart-note-v3"></div><div class="lv-ai-smart-actions-v3"><button class="lv-ai-smart-add-v3 primary">＋ 加入日程</button><button class="lv-ai-smart-copy-v3">查看内容</button></div>';c.querySelector('.lv-ai-smart-name-v3').textContent=item.name;c.querySelector('.lv-ai-smart-type-v3').textContent=item.__type;c.querySelector('.lv-ai-smart-meta-v3').textContent=(item.city?item.city+' · ':'')+(item.address||'AI未提供地址');c.querySelector('.lv-ai-smart-note-v3').textContent=item.source==='catalog'?'来自旅伴内容库':'AI提供 · 加入前确认';const b=c.querySelector('.lv-ai-smart-add-v3');b.onclick=()=>sheet(item,b);c.querySelector('.lv-ai-smart-copy-v3').onclick=()=>alert(item.__type+'\n'+item.name+'\n'+(item.address||'AI未提供地址')+'\n\n来源：'+(item.source==='catalog'?'旅伴内容库':'AI回复'));wrap.appendChild(c)});
    box.appendChild(wrap);
  }
  function findReply(){
    const nodes=document.querySelectorAll('#messages .msg.ai');
    return nodes[nodes.length-1]||null;
  }
  let lastNode=null,lastText='';
  function scan(){
    if(!document.getElementById('ai')?.classList.contains('active'))return;
    const n=findReply();if(!n)return;const text=(n.innerText||n.textContent||'').trim();if(text.length<2)return;
    if(n!==lastNode||text!==lastText){lastNode=n;lastText=text;clearTimeout(scan.t);scan.t=setTimeout(()=>render(text),350)}
  }
  function boot(){
    css();scan();
    new MutationObserver(()=>scan()).observe(document.body,{subtree:true,childList:true,characterData:true});
    setInterval(scan,500);
    window.addEventListener('resize',scan,{passive:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
