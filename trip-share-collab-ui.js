/* 旅伴旅行管家｜分享 / 好友协作 / 投票 v2
   分享：跨设备可直接打开；优先使用 Cloudflare KV 房间，失败时自动退化为 URL 内嵌行程。
   协作/投票：使用同一个房间 ID，通过 /api/trip 同步。
   不改变现有行程 UI，只增加入口和弹层。
*/
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const dbObj=()=>typeof window.db==='function'?window.db():window.db;
  const trip=()=>{const d=dbObj();return (d?.trips||[]).find(x=>x.id===window.activeTrip)||(d?.trips||[])[0]};
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  const b64u=s=>{const bytes=new TextEncoder().encode(JSON.stringify(s));let bin='';bytes.forEach(b=>bin+=String.fromCharCode(b));return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
  const fromB64u=s=>{const bin=atob(String(s).replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4));const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));return JSON.parse(new TextDecoder().decode(bytes))};
  const api=async(body)=>{const r=await fetch('/api/trip',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw new Error(await r.text()||'API error');return r.json()};
  const getRoom=async(code)=>{const r=await fetch('/api/trip?code='+encodeURIComponent(code));if(!r.ok)throw new Error(await r.text()||'房间不存在');return r.json()};
  function saveImported(t,code){
    const d=dbObj();if(!d||!Array.isArray(d.trips))return false;
    const copy=JSON.parse(JSON.stringify(t));copy.id='shared-'+code;copy.name=copy.name||'共享行程';copy.sharedCode=code;copy.readOnly=false;
    const i=d.trips.findIndex(x=>x.id===copy.id);if(i>=0)d.trips[i]=copy;else d.trips.push(copy);
    window.activeTrip=copy.id;window.activePlan=copy.plans?.[0]?.id||'A';window.save?.();
    if(typeof window._lvbanTripCanvasV2==='function')window._lvbanTripCanvasV2();else if(typeof window.renderTripDetail==='function')window.renderTripDetail();
    return true;
  }
  async function resolveShare(){
    const p=new URLSearchParams(location.search),code=p.get('share'),payload=p.get('tripdata');
    if(code){try{const r=await getRoom(code);if(r.trip)saveImported(r.trip,code)}catch(e){console.warn('[旅伴] 共享房间读取失败',e)}}
    else if(payload){try{const t=fromB64u(payload);saveImported(t,'url')}catch(e){console.warn('[旅伴] URL 行程解析失败',e)}}
  }
  function style(){if($('#lv-share-collab-style'))return;const s=document.createElement('style');s.id='lv-share-collab-style';s.textContent=`.lv-share-actions{display:flex;gap:8px;margin:0 0 12px;overflow:auto;padding:2px 0 3px}.lv-share-actions button{flex:1;min-width:88px;padding:10px 9px;border:1px solid #e8e6f4;border-radius:14px;background:#fff;color:#5d4de5;font-size:12px;font-weight:800;white-space:nowrap}.lv-share-actions button.primary{background:var(--p);color:#fff;border-color:var(--p)}.lv-share-card{background:#fff;border:1px solid #eceaf6;border-radius:18px;padding:14px;margin:8px 0}.lv-share-card h3{margin:0 0 6px;font-size:15px}.lv-share-card p{margin:0 0 10px;color:var(--muted);font-size:12px;line-height:1.55}.lv-share-vote{display:grid;gap:8px}.lv-share-option{display:flex;justify-content:space-between;align-items:center;padding:11px 12px;border:1px solid #e8e6f4;border-radius:13px;background:#fafaff}.lv-share-option button{padding:7px 10px;border-radius:10px;background:#efedff;color:#5d4de5;font-weight:800}.lv-share-code{display:flex;gap:7px}.lv-share-code input{flex:1;min-width:0;border:1px solid #e8e6f4;border-radius:12px;padding:10px;background:#f8f7fd}.lv-share-status{font-size:11px;color:var(--muted);line-height:1.5}`;document.head.appendChild(s)}
  async function open(kind){
    const t=trip();if(!t)return;
    const m=$('#modal');if(!m)return;
    const name=esc(t.name||'我的行程');
    let room='';try{room=(await api({action:'create',trip:t})).code}catch(e){console.warn('[旅伴] KV 房间创建失败',e)}
    if(!room)room=b64u(t).slice(0,32);
    const url=location.origin+location.pathname+'?share='+encodeURIComponent(room);
    let body='';
    if(kind==='share'){
      body=`<div class="lv-share-card"><h3>分享指定行程</h3><p>这个链接在另一台手机、电脑打开后，会直接进入这条行程，不会回到首页。</p><div class="lv-share-code"><input id="lvShareUrl" readonly value="${esc(url)}"><button class="btn primary" id="lvCopyShare">复制链接</button></div><div class="lv-share-status" style="margin-top:8px">${room.length>20?'已生成共享房间':'当前使用无服务器 URL 分享模式'}</div></div><div class="lv-share-card"><h3>分享内容</h3><p>${name} · ${esc(t.start||'')} ～ ${esc(t.end||'')}</p><button class="btn primary" id="lvNativeShare">系统分享</button></div>`;
    }else if(kind==='collab'){
      body=`<div class="lv-share-card"><h3>好友协作</h3><p>把下面链接发给朋友。朋友打开后进入同一个共享行程房间；后续可以继续扩展共同编辑权限。</p><div class="lv-share-code"><input id="lvCollabUrl" readonly value="${esc(url)}"><button class="btn primary" id="lvCopyCollab">复制</button></div><div class="lv-share-status" style="margin-top:8px">共享房间：${esc(room)}</div></div><div class="lv-share-card"><h3>协作权限</h3><div class="actions"><button class="btn" id="lvViewOnly">仅查看</button><button class="btn primary" id="lvCanEdit">可编辑</button></div></div>`;
    }else{
      let counts={route:0,spots:0,food:0};try{counts=(await getRoom(room)).votes||counts}catch(e){}
      const opts=[['路线更合适','route'],['景点更合适','spots'],['美食更合适','food']];
      body=`<div class="lv-share-card"><h3>好友投票</h3><p>朋友打开同一个共享链接后，可以投票；票数保存在共享房间，不再只存在当前设备。</p><div class="lv-share-vote">${opts.map(o=>`<div class="lv-share-option"><span>${o[0]} · <b id="lvVote-${o[1]}">${Number(counts[o[1]]||0)}</b>票</span><button data-vote="${o[1]}">投一票</button></div>`).join('')}</div></div>`;
    }
    $('#modalTitle').textContent=kind==='share'?'分享行程':kind==='collab'?'好友协作':'好友投票';$('#modalBody').innerHTML=body;m.classList.add('show');
    $('#lvCopyShare')?.addEventListener('click',()=>navigator.clipboard?.writeText($('#lvShareUrl').value).then(()=>window.toast?.('分享链接已复制')));
    $('#lvNativeShare')?.addEventListener('click',()=>{const u=$('#lvShareUrl').value;if(navigator.share)navigator.share({title:t.name||'旅伴行程',text:'邀请你查看我的旅伴行程',url:u});else navigator.clipboard?.writeText(u).then(()=>window.toast?.('链接已复制'))});
    $('#lvCopyCollab')?.addEventListener('click',()=>navigator.clipboard?.writeText($('#lvCollabUrl').value).then(()=>window.toast?.('协作链接已复制')));
    document.querySelectorAll('[data-vote]').forEach(b=>b.onclick=async()=>{try{const r=await api({action:'vote',code:room,option:b.dataset.vote});const el=$('#lvVote-'+b.dataset.vote);if(el)el.textContent=Number(r.votes?.[b.dataset.vote]||0);window.toast?.('投票成功')}catch(e){window.toast?.('投票同步失败，请先配置云端共享存储')}});
  }
  function inject(){style();const page=$('#trips'),head=page?.querySelector('.lv2-head');if(!head||$('#lvShareActions'))return;if(!head.parentNode)return;const bar=document.createElement('div');bar.id='lvShareActions';bar.className='lv-share-actions';bar.innerHTML='<button class="primary" id="lvShareBtn">分享</button><button id="lvCollabBtn">好友协作</button><button id="lvVoteBtn">投票</button>';head.insertAdjacentElement('afterend',bar);$('#lvShareBtn').onclick=()=>open('share');$('#lvCollabBtn').onclick=()=>open('collab');$('#lvVoteBtn').onclick=()=>open('vote')}
  async function boot(){await resolveShare();inject();setInterval(inject,500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.LvbanShareCollab={open,inject};
})();
