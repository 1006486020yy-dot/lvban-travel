/* 旅伴旅行管家 · 新建行程提交按钮稳定修复
   修复：选择目的地后“创建行程”无响应。
   使用 document 捕获阶段接管唯一提交按钮，避免旧补丁/遮罩层导致点击失效。
*/
(function(){
  if(window.__lvCreateSubmitFix)return;
  window.__lvCreateSubmitFix=true;

  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid=()=>window.uid?.()||('lv-'+Date.now()+'-'+Math.random().toString(36).slice(2));
  const toast=m=>window.toast?.(m)||alert(m);

  function getDB(){
    if(typeof window.db==='function')return window.db();
    return window.db||null;
  }
  function save(){window.save?.();}

  function makeDays(start,end){
    const out=[];
    const a=new Date(String(start||'').slice(0,10)+'T00:00:00');
    const b=new Date(String(end||start||'').slice(0,10)+'T00:00:00');
    if(isNaN(a)||isNaN(b)||a>b)return out;
    for(let d=new Date(a),i=0;d<=b;d.setDate(d.getDate()+1),i++){
      const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
      out.push({id:uid(),date:`${y}-${m}-${day}`,name:'待安排',items:[]});
    }
    return out;
  }

  function showDurationPicker(trip,cities){
    if(cities.length<2)return;
    const old=document.querySelector('.lv-submit-days-mask');old?.remove();
    const a=new Date(String(trip.start||'').slice(0,10)+'T00:00:00');
    const b=new Date(String(trip.end||trip.start||'').slice(0,10)+'T00:00:00');
    const total=Math.max(1,Math.round((b-a)/86400000)+1);
    const base=Math.floor(total/cities.length),rem=total%cities.length;
    const vals=cities.map((c,i)=>base+(i<rem?1:0));
    const mask=document.createElement('div');mask.className='lv-submit-days-mask';
    mask.innerHTML=`<div class="lv-days-modal" role="dialog" aria-modal="true">
      <div class="lv-days-modal-head"><h3>安排每个城市玩几天</h3><button type="button" class="lv-modal-close" data-close>×</button></div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:13px">你的行程共 <b style="color:var(--p)">${total} 天</b>，请分配到每个城市。</div>
      <div class="lv-duration-list">${cities.map((c,i)=>`<div class="lv-duration-row"><div class="lv-duration-city">${esc(c)}<small>第 ${i+1} 个目的地</small></div><input class="lv-duration-input" data-city="${esc(c)}" type="number" min="1" max="${total}" value="${vals[i]}"></div>`).join('')}</div>
      <div class="lv-days-modal-foot"><span class="lv-days-status" data-status></span><button type="button" class="lv-primary" data-save-days>保存分配</button></div>
    </div>`;
    document.body.appendChild(mask);
    const inputs=[...mask.querySelectorAll('.lv-duration-input')],status=$('[data-status]',mask),btn=$('[data-save-days]',mask);
    const check=()=>{
      const sum=inputs.reduce((n,x)=>n+Math.max(0,Number(x.value)||0),0);
      const ok=sum===total;
      status.textContent=ok?`已分配 ${sum}/${total} 天`:(sum<total?`当前 ${sum}/${total} 天，还需 ${total-sum} 天`:`当前 ${sum}/${total} 天，需减少 ${sum-total} 天`);
      status.className='lv-days-status '+(ok?'ok':'bad');
      btn.disabled=!ok;
      return ok;
    };
    inputs.forEach(x=>x.addEventListener('input',check));
    check();
    $('[data-close]',mask).onclick=()=>mask.remove();
    mask.onclick=e=>{if(e.target===mask)mask.remove()};
    btn.onclick=()=>{
      if(!check())return;
      trip.cityDurations=inputs.map(x=>({city:x.dataset.city,days:Number(x.value)}));
      trip.city=trip.cityDurations.map(x=>x.city).join(' · ');
      save();
      mask.remove();
      window.renderTrips?.();
      window.renderHome?.();
      toast('行程已创建，城市天数已保存');
    };
  }

  function createTrip(){
    const name=($('#ntName')?.value||'').trim();
    const citiesRaw=window._selectedCities||[];
    const cityInput=($('#ntCity')?.value||'').trim();
    const cities=citiesRaw.length?citiesRaw:(cityInput?[cityInput]:[]);
    const start=$('#ntStart')?.value||'';
    const end=$('#ntEnd')?.value||'';
    const alternate=!!$('#ntAlternate')?.checked;
    const mode=window._createMode||'manual';

    if(!name)return toast('请先填写行程名称');
    if(!cities.length)return toast('请选择至少一个目的地');
    if(!start||!end)return toast('请选择开始日期和结束日期');
    if(end<start)return toast('结束日期不能早于开始日期');

    const days=makeDays(start,end);
    if(!days.length)return toast('日期无效，请重新选择日期');
    const makePlan=(id,name)=>({id,name,days:days.map(d=>({id:uid(),date:d.date,name:d.name,items:[]}))});
    const trip={
      id:uid(),name,city:cities.join(' · '),cities:[...cities],start,end,
      hasAlternateRoutes:alternate,
      plans:alternate?[makePlan('A','方案 A'),makePlan('B','方案 B')]:[makePlan('A','方案 A')],
      favorite:false,createdAt:Date.now()
    };

    const data=getDB();
    if(!data)return toast('本地数据初始化失败，请刷新页面后重试');
    if(!Array.isArray(data.trips))data.trips=[];
    data.trips.unshift(trip);
    window.activeTrip=trip.id;
    window.activePlan='A';
    window.activeDay=0;
    save();

    const modal=$('#modal');
    if(modal)modal.classList.remove('show');
    window.renderTrips?.();
    window.renderHome?.();

    if(cities.length>1){
      setTimeout(()=>showDurationPicker(trip,cities),80);
    }else if(mode==='ai'){
      setTimeout(()=>window.go?.('ai'),80);
      toast('行程已创建，进入 AI 规划');
    }else{
      toast('行程已创建');
    }
  }

  /* 捕获阶段优先于旧版按钮监听，避免“看得到但点不动”。 */
  document.addEventListener('click',function(e){
    const btn=e.target.closest?.('#lvCreateSubmit');
    if(!btn)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if(btn.dataset.busy==='1')return;
    btn.dataset.busy='1';
    try{createTrip()}finally{setTimeout(()=>{btn.dataset.busy='0'},300)}
  },true);

  /* 防止旧遮罩/透明层挡住新建表单。 */
  const css=document.createElement('style');
  css.textContent=`.lv-submit-days-mask{position:fixed;inset:0;background:rgba(25,20,50,.38);backdrop-filter:blur(5px);z-index:10000;display:flex;align-items:center;justify-content:center;padding:18px}.lv-submit-days-mask .lv-days-modal{width:min(560px,100%);max-height:min(720px,90vh);overflow:auto;background:#fff;border-radius:24px;box-shadow:0 24px 70px rgba(30,20,80,.25);padding:20px}.lv-submit-days-mask .lv-days-modal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}.lv-submit-days-mask .lv-modal-close{width:38px;height:38px;border:0;border-radius:12px;background:#f2f0fa;color:#555;font-size:20px}.lv-submit-days-mask .lv-duration-list{display:flex;flex-direction:column;gap:10px}.lv-submit-days-mask .lv-duration-row{display:grid;grid-template-columns:1fr 100px;align-items:center;gap:12px;padding:12px;border:1px solid var(--line);border-radius:14px}.lv-submit-days-mask .lv-duration-city{font-size:14px;font-weight:800}.lv-submit-days-mask .lv-duration-city small{display:block;color:var(--muted);font-size:10px;margin-top:3px}.lv-submit-days-mask .lv-duration-input{width:100%;height:42px;border:1px solid var(--line);border-radius:11px;text-align:center;font-size:14px;font-weight:800}.lv-submit-days-mask .lv-days-modal-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:16px;padding-top:13px;border-top:1px solid var(--line)}.lv-submit-days-mask .lv-days-status{font-size:12px;color:var(--muted)}.lv-submit-days-mask .lv-days-status.ok{color:#2d9a6a;font-weight:800}.lv-submit-days-mask .lv-days-status.bad{color:#d94e5c;font-weight:800}.lv-submit-days-mask .lv-primary{height:44px;padding:0 18px;border:0;border-radius:13px;background:var(--p);color:#fff;font-size:13px;font-weight:800}.lv-submit-days-mask .lv-primary:disabled{opacity:.45}`;
  document.head.appendChild(css);
})();
