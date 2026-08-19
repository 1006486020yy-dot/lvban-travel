/* 旅伴旅行管家 · 统一分享 / 好友协作
   不改现有行程 UI，只在行程详情顶部增加一个“分享”入口。
*/
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  const api='/api/share';
  let sharedId=new URLSearchParams(location.search).get('share');
  let sharedMode=new URLSearchParams(location.search).get('mode')||'view';
  let syncReady=false;
  const toast=m=>window.toast?.(m)||alert(m);
  const trip=()=>window.db?.trips?.find(t=>t.id===window.activeTrip)||window.db?.trips?.[0];

  function style(){
    if($('#lv-share-style'))return;
    const s=document.createElement('style');s.id='lv-share-style';s.textContent=`
      .lv-share-btn{width:auto!important;min-width:78px!important;height:38px!important;padding:0 13px!important;border-radius:13px!important;background:#efedff!important;color:#5d4de5!important;font-size:12px!important;font-weight:800!important}
      .lv-share-modal{position:fixed;inset:0;z-index:120;background:#17172a66;display:none;align-items:flex-end}.lv-share-modal.show{display:flex}
      .lv-share-sheet{width:100%;background:#f7f8fc;border-radius:28px 28px 0 0;padding:20px;box-shadow:0 -15px 45px #25243b22}
      .lv-share-sheet h3{margin:0 0 7px;font-size:20px}.lv-share-sheet p{margin:0 0 16px;color:#77788b;font-size:12px;line-height:1.6}
      .lv-share-option{width:100%;display:block;text-align:left;padding:15px 16px;margin:9px 0;border-radius:17px;background:#fff;border:1px solid #e8e6f4}
      .lv-share-option b{display:block;font-size:14px}.lv-share-option span{display:block;margin-top:4px;color:#77788b;font-size:11px}
      .lv-share-result{margin-top:14px;padding:13px;border-radius:16px;background:#fff;border:1px solid #e8e6f4;word-break:break-all;font-size:11px;color:#5d4de5}
      .lv-share-actions{display:flex;gap:8px;margin-top:10px}.lv-share-actions button{flex:1;padding:11px;border-radius:13px;background:#efedff;color:#5d4de5;font-weight:800}.lv-share-close{margin-top:10px;width:100%;padding:12px;border-radius:13px;background:#fff;color:#77788b}
    `;document.head.appendChild(s);
  }

  function modal(){
    let m=$('#lvShareModal');if(m)return m;
    m=document.createElement('div');m.id='lvShareModal';m.className='lv-share-modal';m.innerHTML=`<div class="lv-share-sheet"><h3>分享行程</h3><p>把当前这个大行程分享给朋友。好友协作编辑也统一从这里进入。</p><button class="lv-share-option" id="lvShareView"><b>只读查看</b><span>朋友只能查看这个行程，不能修改。</span></button><button class="lv-share-option" id="lvShareEdit"><b>好友协作编辑</b><span>朋友打开链接后可以共同编辑这个行程。</span></button><div id="lvShareResult"></div><button class="lv-share-close" id="lvShareClose">关闭</button></div>`;document.body.appendChild(m);
    $('#lvShareClose',m).onclick=()=>m.classList.remove('show');m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('show')});
    $('#lvShareView',m).onclick=()=>create('view');$('#lvShareEdit',m).onclick=()=>create('edit');return m;
  }

  async function create(mode){
    const t=trip();if(!t)return toast('当前没有可分享的行程');
    const result=$('#lvShareResult');if(result)result.innerHTML='正在生成分享链接…';
    const snapshot={trip:JSON.parse(JSON.stringify(t)),activePlan:window.activePlan||t.plans?.[0]?.id||'A'};
    try{
      const r=await fetch(api,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({mode,snapshot})});
      const data=await r.json();if(!data.ok)throw new Error(data.error||'生成失败');
      const link=location.origin+location.pathname+'?share='+encodeURIComponent(data.id)+'&mode='+mode;
      if(result)result.innerHTML=`<div class="lv-share-result">${esc(link)}</div><div class="lv-share-actions"><button id="lvCopyShare">复制链接</button><button id="lvOpenShare">打开</button></div>`;
      $('#lvCopyShare').onclick=async()=>{try{await navigator.clipboard.writeText(link);toast('分享链接已复制')}catch(e){toast('复制失败，请长按链接复制')}};
      $('#lvOpenShare').onclick=()=>location.href=link;
    }catch(e){if(result)result.innerHTML=`<div class="lv-share-result">${esc(e.message||'分享失败')}</div>`;}
  }

  function addButton(){
    const page=$('#trips');if(!page||!window.db?.trips?.length)return;
    const head=page.querySelector('.lv2-head');if(!head)return;
    if($('#lvShareBtn',head))return;
    const btn=document.createElement('button');btn.id='lvShareBtn';btn.className='lv-share-btn';btn.textContent='↗ 分享';btn.onclick=()=>modal().classList.add('show');
    const more=$('#lv2More',head);if(more)head.insertBefore(btn,more);else head.appendChild(btn);
  }

  function observe(){
    style();
    const page=$('#trips');if(!page)return setTimeout(observe,250);
    const mo=new MutationObserver(()=>setTimeout(addButton,0));mo.observe(page,{childList:true,subtree:true});addButton();
  }

  async function loadShared(){
    if(!sharedId)return;
    try{
      const r=await fetch(api+'?id='+encodeURIComponent(sharedId),{cache:'no-store'});const data=await r.json();
      if(!data.ok||!data.record?.snapshot?.trip)throw new Error(data.error||'分享不存在或已过期');
      const t=data.record.snapshot.trip;
      window.db.trips=[t];window.activeTrip=t.id;window.activePlan=data.record.snapshot.activePlan||t.plans?.[0]?.id||'A';window.activeDay=0;
      window.__lvbanShared={id:sharedId,mode:sharedMode};
      const originalSave=window.save;
      if(sharedMode==='edit'&&!syncReady){
        window.save=function(){originalSave?.();return syncShared()};syncReady=true;
      }
      setTimeout(()=>{window.go?.('trips');window.renderTrips?.();window.renderTripDetail?.()},150);
    }catch(e){console.error('[旅伴分享]',e);setTimeout(()=>toast(e.message||'分享加载失败'),300);}
  }

  async function syncShared(){
    if(!window.__lvbanShared?.id||window.__lvbanShared.mode!=='edit')return;
    const t=trip();if(!t)return;
    try{await fetch(api+'?id='+encodeURIComponent(window.__lvbanShared.id),{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({snapshot:{trip:JSON.parse(JSON.stringify(t)),activePlan:window.activePlan||t.plans?.[0]?.id||'A'}})});}catch(e){console.warn('[旅伴分享同步失败]',e)}
  }

  function boot(){observe();if(sharedId)setTimeout(loadShared,300);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
