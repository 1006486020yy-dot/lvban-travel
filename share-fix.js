/* 旅伴旅行管家 · 统一分享 / 好友协作编辑
   只增加一个“分享”入口，不改现有行程页面结构、内容和城市/日期逻辑。
*/
(function(){
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  const api='/api/share';
  const toast=m=>window.toast?.(m)||alert(m);
  const currentTrip=()=>window.db?.trips?.find(t=>t.id===window.activeTrip)||window.db?.trips?.[0]||null;
  const snapshot=()=>{const t=currentTrip();return t?JSON.parse(JSON.stringify(t)):null};
  const css=()=>{if(document.getElementById('lv-share-final-style'))return;const s=document.createElement('style');s.id='lv-share-final-style';s.textContent=`
  .lv-share-final-btn{display:inline-flex!important;align-items:center!important;gap:5px!important;padding:9px 13px!important;border-radius:12px!important;background:#6958f5!important;color:#fff!important;font-size:12px!important;font-weight:800!important;box-shadow:0 5px 14px rgba(105,88,245,.18)!important;cursor:pointer!important;position:relative!important;z-index:5!important}
  .lv-share-final-head{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:10px!important}
  .lv-share-final-mask{position:fixed;inset:0;z-index:99999;background:rgba(23,23,42,.5);display:flex;align-items:flex-end}
  .lv-share-final-sheet{width:100%;max-height:88vh;overflow:auto;background:#f7f8fc;border-radius:28px 28px 0 0;padding:20px;box-sizing:border-box}
  .lv-share-final-actions{display:flex;gap:9px;margin-top:14px}.lv-share-final-actions button{flex:1;padding:13px 10px;border:0;border-radius:14px;background:#efedff;color:#5d4de5;font-weight:800}.lv-share-final-actions .primary{background:#6958f5;color:#fff}
  .lv-share-final-url{width:100%;padding:12px;border:1px solid #e8e6f4;border-radius:14px;background:#fff;font-size:12px;box-sizing:border-box}
  .lv-collab-mask{position:fixed;inset:0;z-index:100000;background:rgba(23,23,42,.5);display:flex;align-items:flex-end}.lv-collab-sheet{width:100%;max-height:90vh;overflow:auto;background:#f7f8fc;border-radius:28px 28px 0 0;padding:20px;box-sizing:border-box}.lv-collab-sheet input,.lv-collab-sheet textarea{width:100%;box-sizing:border-box;border:1px solid #e8e6f4;border-radius:13px;padding:11px;background:#fff}.lv-collab-sheet textarea{min-height:90px;resize:vertical}.lv-collab-row{display:flex;gap:8px;margin-top:10px}.lv-collab-row button{flex:1;border:0;border-radius:13px;padding:12px;font-weight:800;background:#efedff;color:#5d4de5}.lv-collab-row .primary{background:#6958f5;color:#fff}
  `;document.head.appendChild(s)};

  async function createLink(mode){
    const snap=snapshot();
    if(!snap) throw new Error('当前没有可分享的行程');
    const r=await fetch(api,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({mode,snapshot:snap})});
    const data=await r.json();if(!data.ok)throw new Error(data.error||'分享失败');
    return location.origin+location.pathname+'?share='+encodeURIComponent(data.id);
  }

  function openShare(){
    css();const o=document.createElement('div');o.className='lv-share-final-mask';o.innerHTML=`<div class="lv-share-final-sheet">
      <div style="display:flex;justify-content:space-between;align-items:center"><h2 style="margin:0">分享行程</h2><button class="btn" id="lvShareClose">关闭</button></div>
      <p class="muted" style="line-height:1.6;margin:9px 0 14px">把这一个大行程分享给朋友。朋友打开后可以选择只查看，或进入好友协作编辑。你当前的其他行程不会被分享。</p>
      <div class="lv-share-final-actions"><button id="lvShareView">只读分享</button><button class="primary" id="lvShareEdit">好友协作编辑</button></div>
      <div id="lvShareResult" style="display:none;margin-top:14px"><input class="lv-share-final-url" id="lvShareUrl" readonly><div class="lv-share-final-actions"><button id="lvShareSystem">系统分享</button><button class="primary" id="lvShareCopy">复制链接</button></div></div>
    </div>`;document.body.appendChild(o);
    o.querySelector('#lvShareClose').onclick=()=>o.remove();
    const make=async mode=>{try{const url=await createLink(mode);o.querySelector('#lvShareResult').style.display='block';o.querySelector('#lvShareUrl').value=url;o.dataset.url=url;o.querySelector('#lvShareCopy').onclick=async()=>{await navigator.clipboard?.writeText(url);o.querySelector('#lvShareCopy').textContent='已复制'};o.querySelector('#lvShareSystem').onclick=async()=>{if(navigator.share)await navigator.share({title:currentTrip()?.name||'旅伴旅行管家',text:mode==='edit'?'邀请你一起编辑行程':'分享我的旅行行程',url});else o.querySelector('#lvShareCopy').click()}}catch(e){toast(e.message||'分享链接生成失败')}};
    o.querySelector('#lvShareView').onclick=()=>make('view');o.querySelector('#lvShareEdit').onclick=()=>make('edit');
  }

  function inject(){css();if(location.search.includes('share='))return;const detail=document.getElementById('tripDetail');if(!detail)return;const head=detail.querySelector('.trip-head');if(!head||head.querySelector('.lv-share-final-btn'))return;const btn=document.createElement('button');btn.type='button';btn.className='lv-share-final-btn';btn.innerHTML='↗ 分享';btn.onclick=e=>{e.stopPropagation();openShare()};const wrap=document.createElement('div');wrap.className='lv-share-final-head';while(head.firstChild)wrap.appendChild(head.firstChild);wrap.appendChild(btn);head.appendChild(wrap)}

  function sharedStyles(){css()}
  let shared={id:null,record:null,edit:false};
  const activeSharedPlan=()=>shared.record?.snapshot?.plans?.find(p=>p.id===shared.record?.snapshot?.activePlan)||shared.record?.snapshot?.plans?.[0]||shared.record?.snapshot;
  function cities(p){const out=[];(p?.days||[]).forEach(d=>{String(d.city||'').split(/[·,、/|→＞>]+/).forEach(c=>{c=c.trim();if(c&&!out.includes(c))out.push(c)});(d.items||[]).forEach(x=>{const c=String(x.city||'').trim();if(c&&!out.includes(c))out.push(c)})});return out}
  function dayCities(d){const out=[];String(d?.city||'').split(/[·,、/|→＞>]+/).forEach(c=>{c=c.trim();if(c)out.push(c)});(d?.items||[]).forEach(x=>{const c=String(x.city||'').trim();if(c&&!out.includes(c))out.push(c)});return out}
  function renderShared(){
    sharedStyles();const t=shared.record?.snapshot||{},p=activeSharedPlan(),box=document.getElementById('tripDetail');if(!box||!p)return;
    const cs=cities(p);let city=shared.city;if(!cs.includes(city))city=cs[0]||'';shared.city=city;
    const ids=(p.days||[]).map((d,i)=>dayCities(d).includes(city)?i:-1).filter(i=>i>=0);let di=ids.includes(shared.day)?shared.day:(ids[0]??0);shared.day=di;const d=p.days?.[di];
    box.innerHTML=`<div class="lv2"><div class="lv2-head"><button class="lv2-back" id="lvSharedBack">‹</button><div class="lv2-title"><h2>${esc(t.name||'共享行程')}</h2><p>${shared.edit?'好友协作编辑':'只读分享'} · ${esc(t.start||'')} ${t.end?'→ '+esc(t.end):''}</p></div><button class="lv2-more" id="lvSharedClose">⋯</button></div>
      <div class="lv2-row">${cs.map(c=>`<button class="lv2-city ${c===city?'on':''}" data-scity="${esc(c)}">${esc(c)}</button>`).join('')}</div>
      <div class="lv2-row">${ids.map(i=>{const x=p.days[i];return `<button class="lv2-date ${i===di?'on':''}" data-sday="${i}"><b>${esc(x?.title||'DAY '+(i+1))}</b><small>${esc(x?.date||'')}</small></button>`}).join('')}</div>
      <div class="lv2-detail-label">当天行程详情</div><section class="lv2-day"><div class="lv2-day-meta"><div class="date">${esc(d?.date||'')}</div><h3>${esc(d?.title||'当天行程')}</h3><p>${esc(city)} · ${(d?.items||[]).length} 项安排</p></div>
      ${(d?.items||[]).map((x,k)=>`<article class="lv2-event"><div class="lv2-stop">${esc(x.stopLabel||`第 ${k+1} 站`)}</div><div class="lv2-card"><span class="lv2-type">${esc(x.type||'行程')}</span><h3>${esc(x.name||'未命名')}</h3>${x.address?`<div class="lv2-address">📍 ${esc(x.address)}</div>`:''}${x.note?`<div class="lv2-note">${esc(x.note)}</div>`:''}<div class="lv2-actions">${x.address?`<button data-copy="${encodeURIComponent(x.address)}">复制地址</button>`:''}${shared.edit?`<button data-edit-shared="${k}">编辑</button><button data-del-shared="${k}">删除</button>`:''}</div></div></article>`).join('')||'<div class="lv2-empty">当天还没有安排</div>'}
      ${shared.edit?'<button class="lv2-add-day" id="lvSharedAdd">＋ 添加行程节点</button>':''}</section></div>`;
    box.querySelector('#lvSharedBack').onclick=()=>history.back();box.querySelector('#lvSharedClose').onclick=()=>history.back();
    box.querySelectorAll('[data-scity]').forEach(b=>b.onclick=()=>{shared.city=b.dataset.scity;shared.day=null;renderShared()});box.querySelectorAll('[data-sday]').forEach(b=>b.onclick=()=>{shared.day=Number(b.dataset.sday);renderShared()});
    box.querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>navigator.clipboard?.writeText(decodeURIComponent(b.dataset.copy)).then(()=>toast('地址已复制')));
    box.querySelectorAll('[data-del-shared]').forEach(b=>b.onclick=()=>{if(confirm('确定删除这个行程节点吗？')){d.items.splice(Number(b.dataset.delShared),1);saveShared().then(renderShared)}});
    box.querySelectorAll('[data-edit-shared]').forEach(b=>b.onclick=()=>openEditShared(d,Number(b.dataset.editShared)));
    box.querySelector('#lvSharedAdd')?.addEventListener('click',()=>openEditShared(d,-1));
  }
  async function saveShared(){await fetch(api+'?id='+encodeURIComponent(shared.id),{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({snapshot:shared.record.snapshot})})}
  function openEditShared(d,index){
    css();const x=index>=0?d.items[index]:{type:'景点',name:'',address:'',note:''};const o=document.createElement('div');o.className='lv-collab-mask';o.innerHTML=`<div class="lv-collab-sheet"><div style="display:flex;justify-content:space-between;align-items:center"><h2 style="margin:0">${index>=0?'编辑行程节点':'添加行程节点'}</h2><button class="btn" id="ceClose">关闭</button></div><p class="muted">修改会同步到这条好友协作链接。</p><label>类型<input id="ceType" value="${esc(x.type)}"></label><label>名称<input id="ceName" value="${esc(x.name)}"></label><label>地址<input id="ceAddress" value="${esc(x.address)}"></label><label>备注<textarea id="ceNote">${esc(x.note)}</textarea></label><div class="lv-collab-row"><button id="ceCancel">取消</button><button class="primary" id="ceSave">保存</button></div></div>`;document.body.appendChild(o);o.querySelector('#ceClose').onclick=o.querySelector('#ceCancel').onclick=()=>o.remove();o.querySelector('#ceSave').onclick=async()=>{x.type=o.querySelector('#ceType').value.trim();x.name=o.querySelector('#ceName').value.trim();x.address=o.querySelector('#ceAddress').value.trim();x.note=o.querySelector('#ceNote').value.trim();if(index<0)d.items.push(x);else d.items[index]=x;await saveShared();o.remove();renderShared()}}
  async function loadShared(){const m=location.search.match(/[?&]share=([^&]+)/);if(!m)return;try{shared.id=decodeURIComponent(m[1]);const r=await fetch(api+'?id='+encodeURIComponent(shared.id));const data=await r.json();if(!data.ok)throw new Error(data.error||'分享不存在');shared.record=data.record;shared.edit=shared.record.mode==='edit';document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));document.getElementById('trips')?.classList.add('active');renderShared()}catch(e){document.body.innerHTML='<div style="padding:40px;text-align:center">'+esc(e.message||'分享链接无效')+'</div>'}}
  css();setTimeout(inject,50);setTimeout(inject,300);setTimeout(inject,1000);setInterval(inject,700);new MutationObserver(inject).observe(document.body,{childList:true,subtree:true});window.addEventListener('load',()=>setTimeout(loadShared,250));
})();
