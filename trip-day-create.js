/* 旅伴旅行管家 · 每日行程创建入口
   创建每日行程使用第一站 / 第二站 / 第三站，不填写具体时间。
   选择类型后，根据当前城市从景点 / 美食 / 酒店库推荐内容，并自动带出地址、备注。
*/
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const trips=()=>Array.isArray(window.db?.trips)?window.db.trips:[];
  const current=()=>trips().find(t=>t.id===window.activeTrip)||trips()[0];
  const plan=()=>{const t=current();return t?.plans?.find(p=>p.id===window.activePlan)||t?.plans?.[0]};
  const city=()=>String(window._lv2City||plan()?.days?.[Number(window._lv2Day||0)]?.city||'').trim();
  const data=()=>window.LVBAN_DATA||{};

  function itemsByType(type){
    const d=data();
    if(type==='景点')return (d.spots||[]).filter(x=>String(x.city||'').trim()===city());
    if(type==='美食')return (d.foods||[]).filter(x=>String(x.city||'').trim()===city());
    if(type==='酒店')return (d.hotels||[]).filter(x=>String(x.city||'').trim()===city());
    return [];
  }
  const label=x=>x.name||'';
  const address=x=>x.address||'';
  const note=x=>x.note||x.highlight||x.recommended||x.dishes||x.tags||'';

  function style(){
    if($('#lv-create-style'))return;
    const s=document.createElement('style');s.id='lv-create-style';s.textContent=`
      .lv-create-mask{position:fixed;inset:0;z-index:100;background:#17172a66;display:flex;align-items:flex-end}
      .lv-create-sheet{width:100%;max-height:90vh;overflow:auto;background:#f7f8fc;border-radius:28px 28px 0 0;padding:20px}
      .lv-create-grid{display:grid;gap:9px}.lv-create-grid label{font-size:12px;color:#77788b}
      .lv-create-grid input,.lv-create-grid textarea,.lv-create-grid select{width:100%;padding:12px;border:1px solid #e8e6f4;border-radius:14px;background:#fff;outline:0;box-sizing:border-box}
      .lv-create-actions{display:flex;gap:8px;margin-top:12px}.lv-create-actions button{flex:1;padding:12px;border-radius:14px;background:#fff;color:#5d4de5;font-weight:800;border:1px solid #e8e6f4}.lv-create-actions .primary{background:#6958f5;color:#fff;border:0}
      .lv-recommend-wrap{display:grid;gap:7px}.lv-recommend-list{display:flex;gap:7px;overflow:auto;padding:2px 0 4px;scrollbar-width:none}.lv-recommend-list::-webkit-scrollbar{display:none}
      .lv-recommend-btn{flex:0 0 auto;max-width:210px;text-align:left;padding:9px 11px;border:1px solid #e7e5f2;background:#fff;border-radius:12px;font-size:11px;color:#45455a}.lv-recommend-btn b{display:block;font-size:12px;color:#24243a}.lv-recommend-btn small{display:block;margin-top:3px;color:#85859a}
      .lv-recommend-empty{font-size:11px;color:#999;padding:4px 0}
    `;document.head.appendChild(s);
  }

  function refreshRecommendations(mask){
    const type=$('#lvCreateType',mask)?.value;
    const list=$('#lvRecommendList',mask);if(!list)return;
    const arr=itemsByType(type).slice(0,12);
    list.innerHTML=arr.length?arr.map((x,i)=>`<button type="button" class="lv-recommend-btn" data-rec="${i}"><b>${escapeHtml(label(x))}</b><small>${escapeHtml(address(x)||note(x)||'点击选择')}</small></button>`).join(''):`<div class="lv-recommend-empty">${city()?`暂无${type}库数据，可手动填写。`:'当前日期暂未识别城市，可手动填写。'}</div>`;
    list.querySelectorAll('[data-rec]').forEach(b=>b.onclick=()=>{
      const x=arr[Number(b.dataset.rec)];if(!x)return;
      $('#lvCreateName',mask).value=label(x);$('#lvCreateAddress',mask).value=address(x);$('#lvCreateNote',mask).value=note(x);
    });
  }
  function escapeHtml(v){return String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c))}

  function openForm(){
    style();if($('.lv-create-mask'))return;
    const t=current(),p=plan(),i=Number(window._lv2Day||0),existing=Array.isArray(p?.days?.[i]?.items)?p.days[i].items:[],nextNo=existing.length+1;
    const mask=document.createElement('div');mask.className='lv-create-mask';
    mask.innerHTML=`<div class="lv-create-sheet"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><b style="font-size:18px">添加行程节点</b><button type="button" id="lvCreateClose" style="background:#fff;border:1px solid #e8e6f4;border-radius:12px;padding:8px 12px">关闭</button></div><div class="lv-create-grid"><label>站点顺序</label><input id="lvCreateStop" value="第 ${nextNo} 站" readonly><label>类型</label><select id="lvCreateType"><option>景点</option><option>美食</option><option>交通</option><option>酒店</option><option>其他</option></select><div class="lv-recommend-wrap"><label>推荐${city()?` · ${escapeHtml(city())}`:''}</label><div id="lvRecommendList" class="lv-recommend-list"></div></div><label>名称</label><input id="lvCreateName" placeholder="从上面的推荐中选择，或手动填写"><label>地址</label><input id="lvCreateAddress" placeholder="选择推荐后自动带出，也可手动填写"><label>备注</label><textarea id="lvCreateNote" rows="3" placeholder="选择推荐后自动带出，也可手动填写"></textarea></div><div class="lv-create-actions"><button type="button" id="lvCreateCancel">取消</button><button type="button" class="primary" id="lvCreateSave">添加到当天</button></div></div>`;
    document.body.appendChild(mask);
    const close=()=>mask.remove();
    $('#lvCreateClose',mask).onclick=close;$('#lvCreateCancel',mask).onclick=close;
    $('#lvCreateType',mask).onchange=()=>refreshRecommendations(mask);
    refreshRecommendations(mask);
    $('#lvCreateSave',mask).onclick=()=>{
      const tt=current(),pp=plan(),dayIndex=Number(window._lv2Day||0);if(!tt||!pp||!pp.days?.[dayIndex])return alert('当前日期不存在');
      const name=$('#lvCreateName',mask).value.trim();if(!name)return alert('请填写行程名称');
      pp.days[dayIndex].items=Array.isArray(pp.days[dayIndex].items)?pp.days[dayIndex].items:[];const stopNo=pp.days[dayIndex].items.length+1;
      pp.days[dayIndex].items.push({stop:stopNo,stopLabel:`第 ${stopNo} 站`,type:$('#lvCreateType',mask).value,name,address:$('#lvCreateAddress',mask).value.trim(),note:$('#lvCreateNote',mask).value.trim(),city:pp.days[dayIndex].city||window._lv2City||''});
      try{window.dispatchEvent(new CustomEvent('lvban-db-change'));}catch(e){}
      close();window._lvbanTripCanvasV2?.();
    };
  }
  window.__lvbanOpenCreateDay=openForm;window.openCreateDayForm=openForm;
  function addLegacyButton(){const day=$('.lv2-day');if(!day||$('.lv2-add-day'))return;if($('.lv2-create-day-btn'))return;const b=document.createElement('button');b.className='lv2-create-day-btn';b.textContent='＋ 添加行程节点';b.type='button';b.onclick=openForm;const meta=$('.lv2-day-meta',day);if(meta)meta.appendChild(b);else day.prepend(b)}
  function boot(){addLegacyButton()}
  new MutationObserver(boot).observe(document.body,{childList:true,subtree:true});window.addEventListener('load',()=>setTimeout(boot,100));setInterval(boot,500);
})();
