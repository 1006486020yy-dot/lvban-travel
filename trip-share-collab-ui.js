/* 旅伴旅行管家｜好友协作 / 分享 / 投票入口
   只增加入口和交互弹层，不修改既有行程 UI 结构。
*/
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const trip=()=>window.db?.trips?.find(x=>x.id===window.activeTrip)||window.db?.trips?.[0];
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  function style(){if($('#lv-share-collab-style'))return;const s=document.createElement('style');s.id='lv-share-collab-style';s.textContent=`.lv-share-actions{display:flex;gap:8px;margin:0 0 12px;overflow:auto;padding:2px 0 3px}.lv-share-actions button{flex:1;min-width:88px;padding:10px 9px;border:1px solid #e8e6f4;border-radius:14px;background:#fff;color:#5d4de5;font-size:12px;font-weight:800;white-space:nowrap}.lv-share-actions button.primary{background:var(--p);color:#fff;border-color:var(--p)}.lv-share-panel{padding:2px 0}.lv-share-card{background:#fff;border:1px solid #eceaf6;border-radius:18px;padding:14px;margin:8px 0}.lv-share-card h3{margin:0 0 6px;font-size:15px}.lv-share-card p{margin:0 0 10px;color:var(--muted);font-size:12px;line-height:1.55}.lv-share-vote{display:grid;gap:8px}.lv-share-option{display:flex;justify-content:space-between;align-items:center;padding:11px 12px;border:1px solid #e8e6f4;border-radius:13px;background:#fafaff}.lv-share-option button{padding:7px 10px;border-radius:10px;background:#efedff;color:#5d4de5;font-weight:800}.lv-share-code{display:flex;gap:7px}.lv-share-code input{flex:1;min-width:0;border:1px solid #e8e6f4;border-radius:12px;padding:10px;background:#f8f7fd}`;document.head.appendChild(s)}
  function open(kind){
    const t=trip();if(!t)return;
    const m=$('#modal');if(!m)return;
    const name=esc(t.name||'我的行程');
    let body='';
    if(kind==='share'){
      const url=location.origin+location.pathname+'?trip='+encodeURIComponent(t.id);
      body=`<div class="lv-share-panel"><div class="lv-share-card"><h3>分享指定行程</h3><p>把这条行程分享给朋友。当前页面先生成指定行程入口，后续接入云端后可实现跨设备直接读取。</p><div class="lv-share-code"><input id="lvShareUrl" readonly value="${esc(url)}"><button class="btn primary" id="lvCopyShare">复制链接</button></div></div><div class="lv-share-card"><h3>分享内容</h3><p>${name} · ${esc(t.start||'')} ～ ${esc(t.end||'')}</p><button class="btn primary" id="lvNativeShare">系统分享</button></div></div>`;
    }else if(kind==='collab'){
      body=`<div class="lv-share-panel"><div class="lv-share-card"><h3>好友协作</h3><p>邀请朋友一起查看这条指定行程，并为后续共同编辑、添加节点、修改安排预留入口。</p><label class="muted">协作邀请码</label><div class="lv-share-code" style="margin-top:6px"><input id="lvInviteCode" readonly value="${esc(('LV-'+String(t.id||'trip').slice(-6)).toUpperCase())}"><button class="btn primary" id="lvCopyCode">复制</button></div></div><div class="lv-share-card"><h3>协作权限</h3><div class="actions"><button class="btn">仅查看</button><button class="btn primary">可编辑</button></div></div></div>`;
    }else{
      const key='lvban_vote_'+String(t.id||'trip');const vote=JSON.parse(localStorage.getItem(key)||'{}');
      const opts=[['路线更合适','route'],['景点更合适','spots'],['美食更合适','food']];
      body=`<div class="lv-share-panel"><div class="lv-share-card"><h3>好友投票</h3><p>朋友可以针对当前行程提出选择，先保留在本机，后续接入云端后同步给所有协作者。</p><div class="lv-share-vote">${opts.map(o=>`<div class="lv-share-option"><span>${o[0]} · <b id="lvVote-${o[1]}">${Number(vote[o[1]]||0)}</b>票</span><button data-vote="${o[1]}">投一票</button></div>`).join('')}</div></div></div>`;
    }
    $('#modalTitle').textContent=kind==='share'?'分享行程':kind==='collab'?'好友协作':'好友投票';$('#modalBody').innerHTML=body;m.classList.add('show');
    $('#lvCopyShare')?.addEventListener('click',()=>navigator.clipboard?.writeText($('#lvShareUrl').value).then(()=>window.toast?.('分享链接已复制')));
    $('#lvNativeShare')?.addEventListener('click',()=>{const u=$('#lvShareUrl').value;if(navigator.share)navigator.share({title:t.name||'旅伴行程',text:'邀请你查看我的旅伴行程',url:u});else navigator.clipboard?.writeText(u).then(()=>window.toast?.('链接已复制'))});
    $('#lvCopyCode')?.addEventListener('click',()=>navigator.clipboard?.writeText($('#lvInviteCode').value).then(()=>window.toast?.('邀请码已复制')));
    document.querySelectorAll('[data-vote]').forEach(b=>b.onclick=()=>{const k=b.dataset.vote,v=JSON.parse(localStorage.getItem(key)||'{}');v[k]=Number(v[k]||0)+1;localStorage.setItem(key,JSON.stringify(v));const el=$('#lvVote-'+k);if(el)el.textContent=v[k]});
  }
  function inject(){
    style();
    const page=$('#trips'),head=page?.querySelector('.lv2-head');if(!head)return;
    if($('#lvShareActions'))return;
    const bar=document.createElement('div');bar.id='lvShareActions';bar.className='lv-share-actions';bar.innerHTML='<button class="primary" id="lvShareBtn">分享</button><button id="lvCollabBtn">好友协作</button><button id="lvVoteBtn">投票</button>';
    head.insertAdjacentElement('afterend',bar);
    $('#lvShareBtn').onclick=()=>open('share');$('#lvCollabBtn').onclick=()=>open('collab');$('#lvVoteBtn').onclick=()=>open('vote');
  }
  const boot=()=>{inject();setInterval(inject,400)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.LvbanShareCollab={open,inject};
})();
