/* 旅伴旅行管家 · 每日行程创建入口
   在新版 V2 行程详情中补回“创建每日行程”按钮。
   不改变城市 / 日期筛选逻辑；按钮只对当前选中的日期新增一条安排。
*/
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const trips=()=>Array.isArray(window.db?.trips)?window.db.trips:[];
  const current=()=>trips().find(t=>t.id===window.activeTrip)||trips()[0];
  const plan=()=>{const t=current();return t?.plans?.find(p=>p.id===window.activePlan)||t?.plans?.[0]};
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  function addButton(){
    const day=$('.lv2-day');
    if(!day || $('.lv2-create-day-btn')) return;
    const b=document.createElement('button');
    b.className='lv2-create-day-btn';
    b.textContent='＋ 创建每日行程';
    b.type='button';
    b.onclick=openForm;
    const meta=$('.lv2-day-meta',day);
    if(meta) meta.appendChild(b); else day.prepend(b);
  }
  function style(){
    if($('#lv-create-style'))return;
    const s=document.createElement('style');s.id='lv-create-style';s.textContent=`
      .lv2-create-day-btn{margin-top:10px;padding:9px 13px;border-radius:12px;background:#efedff;color:#5d4de5;font-size:12px;font-weight:800}
      .lv-create-mask{position:fixed;inset:0;z-index:100;background:#17172a66;display:flex;align-items:flex-end}
      .lv-create-sheet{width:100%;max-height:90vh;overflow:auto;background:#f7f8fc;border-radius:28px 28px 0 0;padding:20px}
      .lv-create-grid{display:grid;gap:9px}.lv-create-grid label{font-size:12px;color:#77788b}.lv-create-grid input,.lv-create-grid textarea,.lv-create-grid select{width:100%;padding:12px;border:1px solid #e8e6f4;border-radius:14px;background:#fff;outline:0}
      .lv-create-actions{display:flex;gap:8px;margin-top:12px}.lv-create-actions button{flex:1;padding:12px;border-radius:14px;background:#fff;color:#5d4de5;font-weight:800}.lv-create-actions .primary{background:#6958f5;color:#fff}
    `;document.head.appendChild(s);
  }
  function openForm(){
    style(); if($('.lv-create-mask'))return;
    const mask=document.createElement('div');mask.className='lv-create-mask';
    mask.innerHTML=`<div class="lv-create-sheet"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><b style="font-size:18px">创建每日行程</b><button type="button" id="lvCreateClose" style="background:#fff;border-radius:12px;padding:8px 12px">关闭</button></div><div class="lv-create-grid"><label>时间</label><input id="lvCreateTime" type="time" value="09:00"><label>类型</label><select id="lvCreateType"><option>景点</option><option>美食</option><option>交通</option><option>酒店</option><option>其他</option></select><label>名称</label><input id="lvCreateName" placeholder="例如：鼓浪屿、南普陀寺、午餐"><label>地址</label><input id="lvCreateAddress" placeholder="填写详细地址"><label>备注</label><textarea id="lvCreateNote" rows="3" placeholder="可选"></textarea></div><div class="lv-create-actions"><button type="button" id="lvCreateCancel">取消</button><button type="button" class="primary" id="lvCreateSave">保存到当天</button></div></div>`;
    document.body.appendChild(mask);
    const close=()=>mask.remove();$('#lvCreateClose',mask).onclick=close;$('#lvCreateCancel',mask).onclick=close;
    $('#lvCreateSave',mask).onclick=()=>{
      const t=current(),p=plan();const i=Number(window._lv2Day||0);if(!t||!p||!p.days?.[i])return alert('当前日期不存在');
      const name=$('#lvCreateName',mask).value.trim();if(!name)return alert('请填写行程名称');
      p.days[i].items=Array.isArray(p.days[i].items)?p.days[i].items:[];
      p.days[i].items.push({time:$('#lvCreateTime',mask).value||'09:00',type:$('#lvCreateType',mask).value,name,address:$('#lvCreateAddress',mask).value.trim(),note:$('#lvCreateNote',mask).value.trim(),city:p.days[i].city||window._lv2City||''});
      try{window.dispatchEvent(new CustomEvent('lvban-db-change'));}catch(e){}
      close();
      if(typeof window._lvbanTripCanvasV2==='function')window._lvbanTripCanvasV2();
      else if(typeof window._lvbanTripCanvas==='function')window._lvbanTripCanvas();
    };
  }
  function boot(){addButton();}
  new MutationObserver(boot).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('load',()=>setTimeout(boot,100));
  setInterval(boot,500);
})();
