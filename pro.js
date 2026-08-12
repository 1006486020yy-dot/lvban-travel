/* 旅伴旅行管家 Pro · 智能日程增强（轻量版）
 * 重点：不再使用高频 setInterval / 自触发 MutationObserver，避免页面卡顿。
 */
(function(){
  'use strict';
  const $=s=>document.querySelector(s);
  const data=()=>window.LVBAN_DATA||{};
  const normCity=s=>String(s||'').replace(/(省|市|自治区|特别行政区)$/,'').replace(/市$/,'');
  function currentTrip(){try{return window.currentTrip&&window.currentTrip()||window.db?.trips?.find(x=>x.id===window.activeTrip)}catch(e){return null}}
  function currentPlan(){const t=currentTrip();return t?.plans?.find(x=>x.id===window.activePlan)||t?.plans?.[0]||null}
  function activeDay(){return currentPlan()?.days?.[window.activeDay]||null}
  function tripCities(){
    const t=currentTrip(), raw=String(t?.city||'');
    const list=raw.split(/[·,，、/]/).map(normCity).filter(Boolean);
    const d=activeDay();
    if(d?.city) list.unshift(normCity(d.city));
    if(d?.title){(data().cities||[]).forEach(c=>{const n=normCity(c);if(n&&d.title.includes(n))list.unshift(n)})}
    return [...new Set(list)];
  }
  function fullAddress(x,city){
    const a=String(x?.address||'').trim();
    if(!a)return '';
    if(/^(北京市|天津市|上海市|重庆市|香港特别行政区|澳门特别行政区)/.test(a))return a;
    const c=normCity(city);
    if(c==='北京'&&!a.includes('北京市'))return '北京市'+a;
    if(c==='上海'&&!a.includes('上海市'))return '上海市'+a;
    if(c==='天津'&&!a.includes('天津市'))return '天津市'+a;
    if(c==='重庆'&&!a.includes('重庆市'))return '重庆市'+a;
    return a;
  }
  function source(){
    const d=data(), out=[];
    (Array.isArray(d.spots)?d.spots:[]).forEach(x=>{if(x?.name)out.push({type:'景点',city:normCity(x.city),name:x.name,address:x.address||'',note:x.highlight||x.description||'',transport:x.transport||'',latlng:x.latlng||'',rating:Number(x.rating)||0,duration:x.duration||'',tags:x.tags||''})});
    (Array.isArray(d.foods)?d.foods:[]).forEach(x=>{if(x?.name)out.push({type:'美食',city:normCity(x.city),name:x.name,address:x.address||'',note:x.highlight||x.dishes||'',transport:x.transport||'',latlng:x.latlng||'',rating:Number(x.rating)||0,duration:'',tags:x.tags||''})});
    return out;
  }
  function matches(q,city){
    const qq=String(q||'').trim().toLowerCase(), c=normCity(city), all=source();
    let arr=all.filter(x=>!c||!x.city||normCity(x.city)===c);
    if(qq)arr=arr.filter(x=>(x.name+' '+x.address+' '+x.city+' '+x.tags+' '+x.note).toLowerCase().includes(qq));
    arr.sort((a,b)=>(b.rating||0)-(a.rating||0));
    return arr;
  }
  function style(){
    if($('#lvbanSmartEventStyle'))return;
    const s=document.createElement('style');s.id='lvbanSmartEventStyle';s.textContent=`
      .lvban-smart-wrap{margin:2px 0 12px;padding:0}.lvban-smart-title{font-size:13px;font-weight:700;color:#6f6f83;margin:0 0 7px}.lvban-smart-city{width:100%;padding:10px 12px;border:1px solid #e5e2f5;border-radius:12px;background:#fff;color:#333;margin-bottom:8px}.lvban-smart-recommend{display:flex;gap:8px;overflow-x:auto;padding:1px 1px 5px;scrollbar-width:none}.lvban-smart-recommend::-webkit-scrollbar{display:none}.lvban-smart-recommend button{flex:0 0 auto;min-width:150px;max-width:220px;padding:9px 11px;border:1px solid #e3e0f4;border-radius:13px;background:#fff;color:#5c4fe5;font-size:12px;font-weight:700;text-align:left;cursor:pointer}.lvban-smart-recommend button:active{transform:scale(.98)}.lvban-smart-meta{display:block;font-size:10px;line-height:1.4;color:#999;margin-top:3px;font-weight:500;white-space:normal}.lvban-smart-match{font-size:11px;color:#6254e8;margin:-3px 0 7px;line-height:1.4}.lvban-smart-empty{font-size:11px;color:#999;padding:5px 0}
    `;document.head.appendChild(s);
  }
  function enhance(){
    const body=$('#modalBody'), title=$('#modalTitle');
    if(!body||String(title?.textContent||'').trim()!=='添加日程')return;
    const name=$('#diName'), addr=$('#diAddr'); if(!name||!addr)return;
    if($('#lvbanSmartWrap'))return;
    style();
    const cities=tripCities(); let selected=cities[0]||'';
    const wrap=document.createElement('div');wrap.id='lvbanSmartWrap';wrap.className='lvban-smart-wrap';
    const label=document.createElement('div');label.className='lvban-smart-title';label.textContent='智能推荐 · '+(selected||'当前目的地');wrap.appendChild(label);
    let select=null;
    if(cities.length>1){
      select=document.createElement('select');select.className='lvban-smart-city';
      cities.forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;o.selected=c===selected;select.appendChild(o)});
      wrap.appendChild(select);
    }
    const list=document.createElement('div');list.className='lvban-smart-recommend';wrap.appendChild(list);
    name.parentNode.insertBefore(wrap,name);
    const setField=(el,v)=>{if(!el)return;el.value=v||'';el.dispatchEvent(new Event('input',{bubbles:true}))};
    const pick=x=>{
      const c=normCity(x.city||selected);setField(name,x.name);setField(addr,fullAddress(x,c));
      const note=$('#diNote');if(note&&!note.value){const n=[];if(x.note)n.push(x.note);if(x.transport)n.push('交通：'+x.transport);if(x.duration)n.push('推荐游玩时间：'+x.duration);setField(note,n.join('\n'))}
      const d=activeDay();if(d&&c)d.city=c;
      $('#lvbanMatchText')?.remove();const m=document.createElement('div');m.id='lvbanMatchText';m.className='lvban-smart-match';m.textContent='✓ 已选择 '+c+' · '+x.name+'，地址已自动填入';addr.parentNode.insertBefore(m,addr);
    };
    const render=q=>{
      const c=select?select.value:selected, r=matches(q,c).slice(0,8);list.innerHTML='';
      if(!q&&r.length) {const meta=document.createElement('span');meta.className='lvban-smart-meta';meta.textContent='根据 '+(c||'当前目的地')+' 推荐';list.appendChild(meta)}
      r.forEach(x=>{const b=document.createElement('button');b.type='button';b.dataset.name=x.name;b.innerHTML='';const t=document.createElement('span');t.textContent=x.name;b.appendChild(t);const sm=document.createElement('span');sm.className='lvban-smart-meta';sm.textContent=fullAddress(x,c);b.appendChild(sm);list.appendChild(b)});
      if(!r.length){const e=document.createElement('span');e.className='lvban-smart-empty';e.textContent='暂无匹配，可继续手动填写';list.appendChild(e)}
    };
    select?.addEventListener('change',()=>{selected=select.value;label.textContent='智能推荐 · '+selected;render(name.value)});
    name.addEventListener('input',()=>render(name.value));
    list.addEventListener('click',e=>{const b=e.target.closest('button[data-name]');if(!b)return;e.preventDefault();const c=select?select.value:selected;const r=matches(b.dataset.name,c);const x=r.find(v=>v.name===b.dataset.name)||r[0];if(x)pick(x)});
    render('');
  }
  // app.js 已先加载，这里只包一层添加日程入口，不轮询、不监听整棵 DOM。
  const original=window.openDayEditor;
  if(typeof original==='function')window.openDayEditor=function(){original();requestAnimationFrame(enhance)};
  else document.addEventListener('DOMContentLoaded',()=>{const fn=window.openDayEditor;if(typeof fn==='function')window.openDayEditor=function(){fn();requestAnimationFrame(enhance)}});
})();
