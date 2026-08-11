/* 旅伴旅行管家 · UI 最终交互修复 v2
   1. 总行程卡片右上角三点菜单：复制 / 收藏 / 删除
   2. 行程页移除“发现灵感”
   3. 首页工具箱入口 + 真实可点击工具
   4. 保留单一“＋ 创建行程”入口
*/
(function(){
  const $=s=>document.querySelector(s);
  const $$=s=>Array.from(document.querySelectorAll(s));
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const toast=m=>window.toast?.(m);
  const save=()=>window.save?.();

  function removeLegacy(){
    $$('.float').forEach(x=>x.remove());
    $$('#trips .tabs .tab').forEach(x=>{if((x.textContent||'').trim()==='发现灵感')x.remove();});
  }

  function deleteTrip(id){
    const trips=window.db?.trips||[];
    const t=trips.find(x=>x.id===id);
    if(!t)return;
    if(!confirm('确定删除「'+(t.name||'这个行程')+'」吗？删除后不可恢复。'))return;
    window.db.trips=trips.filter(x=>x.id!==id);
    window.activeTrip=window.db.trips[0]?.id||null;
    window.activePlan=window.db.trips[0]?.plans?.[0]?.id||'A';
    window.activeDay=0;
    save();
    window.renderTrips?.();
    toast('行程已删除');
  }
  window.deleteTrip=deleteTrip;

  function copyTrip(t){
    if(!t)return;
    const clone=JSON.parse(JSON.stringify(t));
    clone.id=window.uid?.()||('trip_'+Date.now());
    clone.name=(t.name||'行程')+'（副本）';
    (clone.plans||[]).forEach(p=>{
      p.days=(p.days||[]).map(d=>({...d,id:window.uid?.()||('day_'+Date.now()+Math.random()),items:(d.items||[]).map(i=>({...i,id:window.uid?.()||('item_'+Date.now()+Math.random())}))}));
    });
    window.db.trips.push(clone);
    window.activeTrip=clone.id;
    window.activePlan=clone.plans?.[0]?.id||'A';
    window.activeDay=0;
    save();
    window.renderTrips?.();
    toast('已复制行程');
  }

  function openTripMenu(id,anchor){
    $$('.trip-more-menu').forEach(x=>x.remove());
    const t=(window.db?.trips||[]).find(x=>x.id===id);
    if(!t)return;
    const menu=document.createElement('div');
    menu.className='trip-more-menu';
    menu.innerHTML='<button data-act="copy">复制行程</button><button data-act="fav">收藏行程</button><button data-act="delete" class="danger">删除行程</button>';
    menu.onclick=e=>{
      const b=e.target.closest('button');if(!b)return;
      e.preventDefault();e.stopPropagation();
      if(b.dataset.act==='copy')copyTrip(t);
      if(b.dataset.act==='fav'){
        t.favorite=!t.favorite;save();toast(t.favorite?'已收藏行程':'已取消收藏');
      }
      if(b.dataset.act==='delete')deleteTrip(id);
      menu.remove();
    };
    document.body.appendChild(menu);
    const r=anchor.getBoundingClientRect();
    const mw=154;
    menu.style.left=Math.min(window.innerWidth-mw-10,Math.max(10,r.right-mw))+'px';
    menu.style.top=Math.min(window.innerHeight-150,r.bottom+6)+'px';
    setTimeout(()=>document.addEventListener('click',()=>menu.remove(),{once:true}),0);
  }
  window.openTripMenu=openTripMenu;

  function addMoreButton(card,t){
    card.querySelector('.trip-more')?.remove();
    card.style.position='relative';
    const more=document.createElement('button');
    more.type='button';
    more.className='trip-more';
    more.textContent='⋯';
    more.setAttribute('aria-label','行程更多操作');
    more.onclick=e=>{e.preventDefault();e.stopPropagation();openTripMenu(t.id,more);};
    card.appendChild(more);
  }

  function patchCards(){
    const cards=$$('#trips .trip-card');
    const trips=window.db?.trips||[];
    cards.forEach((card,i)=>{if(i<trips.length)addMoreButton(card,trips[i]);});
  }

  /* ---------- 工具箱 ---------- */
  const TOOLS=[
    ['budget','💰','旅行预算','住宿、餐饮、交通、门票一键估算'],
    ['currency','💱','汇率换算','输入金额和汇率立即换算'],
    ['time','🕐','时差 / 当地时间','输入 UTC 时区查看当地时间'],
    ['luggage','🧳','行李清单','自动生成并逐项勾选'],
    ['checklist','📋','旅行清单','证件、预约、门票、出发事项'],
    ['weather','🌦️','天气查询','输入城市查询未来天气'],
    ['transport','🚇','交通换乘','记录机场、高铁、地铁换乘信息'],
    ['distance','📍','距离计算','输入两个地点计算直线距离'],
    ['aa','💵','人均费用 AA','多人旅行自动计算每人费用'],
    ['countdown','⏱️','旅行倒计时','距离出发还有多少天']
  ];

  function openToolbox(){
    const m=$('#modal'),b=$('#modalBody'),t=$('#modalTitle');
    if(!m||!b)return;
    if(t)t.textContent='工具箱';
    b.innerHTML='<div class="toolbox-grid">'+TOOLS.map(x=>`<button class="toolbox-item" onclick="window.openTravelTool('${x[0]}')"><span>${x[1]}</span><div><b>${esc(x[2])}</b><small>${esc(x[3])}</small></div></button>`).join('')+'</div>';
    m.classList.add('show');
  }
  window.openToolbox=openToolbox;

  function toolShell(title,html){
    const b=$('#modalBody'),t=$('#modalTitle'),m=$('#modal');
    if(t)t.textContent=title;
    if(b)b.innerHTML=html;
    m?.classList.add('show');
  }
  const field=(id,label,type='number',value='',ph='')=>`<label>${label}</label><input id="${id}" type="${type}" value="${esc(value)}" placeholder="${esc(ph)}">`;

  function openTravelTool(id){
    if(id==='budget')return toolShell('旅行预算计算器',`<div class="form">${field('tbPeople','人数','number','2')}${field('tbDays','旅行天数','number','5')}${field('tbHotel','每晚住宿（元）','number','400')}${field('tbFood','每人每天餐饮（元）','number','120')}${field('tbTransport','交通总计（元）','number','500')}${field('tbTicket','门票总计（元）','number','300')}<button class="btn primary" onclick="calcBudget()">计算预算</button><div id="toolResult" class="tool-result"></div></div>`);
    if(id==='currency')return toolShell('汇率换算',`<div class="form">${field('tcAmount','人民币金额','number','1000')}${field('tcRate','1 人民币 = 外币','number','0.12','例如美元可填 0.14')}${field('tcName','外币名称','text','','例如 USD / JPY')}<button class="btn primary" onclick="calcCurrency()">立即换算</button><div id="toolResult" class="tool-result"></div></div>`);
    if(id==='time')return toolShell('时差 / 当地时间',`<div class="form">${field('ttUtc','目的地 UTC 时区','number','8','例如日本填 9，美国东部填 -4')}${field('ttBase','基准 UTC 时区','number','8')}<button class="btn primary" onclick="calcLocalTime()">查看当地时间</button><div id="toolResult" class="tool-result"></div></div>`);
    if(id==='luggage')return renderChecklistTool('行李清单','lvban_luggage',['身份证 / 护照','手机与充电器','充电宝','衣物','洗漱用品','常用药品','雨具','耳机','水杯']);
    if(id==='checklist')return renderChecklistTool('旅行清单','lvban_checklist',['身份证 / 护照','机票 / 高铁票','酒店订单','景点预约','支付方式','旅行保险','充电设备','出发前关灯关水']);
    if(id==='weather')return toolShell('天气查询',`<div class="form">${field('twCity','城市','text','','例如：厦门、福州、东京')}<button class="btn primary" onclick="queryWeather()">查询天气</button><div id="toolResult" class="tool-result"></div></div>`);
    if(id==='transport')return toolShell('交通换乘',`<div class="form">${field('trFrom','出发地','text','','例如：厦门站')}${field('trTo','目的地','text','','例如：鼓浪屿三丘田码头')}<label>交通方式</label><select id="trType"><option>高铁 / 动车</option><option>地铁</option><option>公交</option><option>网约车</option><option>步行</option></select>${field('trNote','备注','text','','班次、站点、预计耗时等')}<button class="btn primary" onclick="saveTransportTool()">保存这段换乘</button><div id="toolResult" class="tool-result"></div></div>`);
    if(id==='distance')return toolShell('距离计算',`<div class="form">${field('tdLat1','地点 A 纬度','number','24.4798')}${field('tdLon1','地点 A 经度','number','118.0894')}${field('tdLat2','地点 B 纬度','number','24.4450')}${field('tdLon2','地点 B 经度','number','118.0650')}<button class="btn primary" onclick="calcDistance()">计算距离</button><div id="toolResult" class="tool-result"></div><small class="muted">可在地图中复制坐标后使用。</small></div>`);
    if(id==='aa')return toolShell('人均费用 AA',`<div class="form">${field('aaTotal','总费用（元）','number','1000')}${field('aaPeople','人数','number','2')}<button class="btn primary" onclick="calcAA()">计算</button><div id="toolResult" class="tool-result"></div></div>`);
    if(id==='countdown')return toolShell('旅行倒计时',`<div class="form">${field('cdDate','出发日期','date',new Date().toISOString().slice(0,10))}<button class="btn primary" onclick="calcCountdown()">查看倒计时</button><div id="toolResult" class="tool-result"></div></div>`);
  }
  window.openTravelTool=openTravelTool;

  function result(v){const x=$('#toolResult');if(x)x.innerHTML='<div class="tool-result-box">'+v+'</div>';}
  window.calcBudget=()=>{const p=+$('#tbPeople').value||0,d=+$('#tbDays').value||0,h=+$('#tbHotel').value||0,f=+$('#tbFood').value||0,tr=+$('#tbTransport').value||0,tk=+$('#tbTicket').value||0;const total=h*d+f*p*d+tr+tk;result(`<b>预计总预算 ¥${total.toFixed(0)}</b><br><span>约 ¥${p?(total/p).toFixed(0):0} / 人</span>`)};
  window.calcCurrency=()=>{const a=+$('#tcAmount').value||0,r=+$('#tcRate').value||0,n=$('#tcName').value||'外币';result(`<b>¥${a.toFixed(2)} ≈ ${(a*r).toFixed(2)} ${esc(n)}</b>`)};
  window.calcLocalTime=()=>{const u=new Date();const dest=+$('#ttUtc').value||0,base=+$('#ttBase').value||0;const local=new Date(u.getTime()+(dest-base)*3600000);result(`<b>当地时间：${local.toLocaleString('zh-CN',{hour12:false})}</b><br><span>与基准时区 ${dest-base>=0?'+':''}${dest-base} 小时</span>`)};
  window.calcDistance=()=>{const a=+$('#tdLat1').value,b=+$('#tdLon1').value,c=+$('#tdLat2').value,d=+$('#tdLon2').value;const R=6371,toRad=x=>x*Math.PI/180,dl=toRad(c-a),dn=toRad(d-b),q=Math.sin(dl/2)**2+Math.cos(toRad(a))*Math.cos(toRad(c))*Math.sin(dn/2)**2;result(`<b>直线距离约 ${(R*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q))).toFixed(2)} 公里</b>`)};
  window.calcAA=()=>{const t=+$('#aaTotal').value||0,p=+$('#aaPeople').value||0;result(`<b>每人应付 ¥${p?(t/p).toFixed(2):0}</b>`)};
  window.calcCountdown=()=>{const v=$('#cdDate').value;if(!v)return;const d=Math.ceil((new Date(v+'T00:00:00')-new Date(new Date().toDateString()+' 00:00:00'))/86400000);result(d>0?`<b>距离出发还有 ${d} 天</b>`:d===0?'<b>今天出发 ✈️</b>':'<b>出发日期已过去</b>')};

  function renderChecklistTool(title,key,defaults){
    const saved=JSON.parse(localStorage.getItem(key)||'null')||defaults.map(x=>({text:x,done:false}));
    toolShell(title,`<div class="check-tool"><div id="checkRows">${saved.map((x,i)=>`<label class="check-row"><input type="checkbox" ${x.done?'checked':''} onchange="toggleCheck('${key}',${i},this.checked)"><span>${esc(x.text)}</span></label>`).join('')}</div><div class="check-add"><input id="newCheck" placeholder="添加自己的事项"><button class="btn" onclick="addCheck('${key}')">添加</button></div><button class="btn primary" onclick="clearChecks('${key}')">全部清空</button></div>`);
  }
  window.toggleCheck=(key,i,v)=>{const a=JSON.parse(localStorage.getItem(key)||'[]');if(a[i])a[i].done=v;localStorage.setItem(key,JSON.stringify(a));};
  window.addCheck=key=>{const input=$('#newCheck'),v=input?.value.trim();if(!v)return;const a=JSON.parse(localStorage.getItem(key)||'[]');a.push({text:v,done:false});localStorage.setItem(key,JSON.stringify(a));const title=key==='lvban_luggage'?'行李清单':'旅行清单';const defaults=[];renderChecklistTool(title,key,defaults);};
  window.clearChecks=key=>{localStorage.removeItem(key);toast('已清空清单');openTravelTool(key==='lvban_luggage'?'luggage':'checklist');};

  window.saveTransportTool=()=>{const f=$('#trFrom').value.trim(),t=$('#trTo').value.trim(),ty=$('#trType').value,n=$('#trNote').value.trim();if(!f||!t)return toast('请填写出发地和目的地');const a=JSON.parse(localStorage.getItem('lvban_transports')||'[]');a.push({from:f,to:t,type:ty,note:n,time:Date.now()});localStorage.setItem('lvban_transports',JSON.stringify(a));result(`<b>已保存</b><br>${esc(f)} → ${esc(t)}<br>${esc(ty)}${n?' · '+esc(n):''}`)};

  async function queryWeather(){
    const city=$('#twCity')?.value.trim();if(!city)return toast('请输入城市');
    result('正在查询天气…');
    try{
      const g=await fetch('https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(city)+'&count=1&language=zh&format=json').then(r=>r.json());
      const x=g.results?.[0];if(!x)throw new Error('找不到城市');
      const w=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${x.latitude}&longitude=${x.longitude}&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=5`).then(r=>r.json());
      const code=w.current?.weather_code;const text={0:'晴',1:'基本晴',2:'局部多云',3:'阴',45:'雾',48:'雾',51:'小雨',53:'小雨',55:'小雨',61:'雨',63:'中雨',65:'大雨',71:'小雪',73:'中雪',75:'大雪',80:'阵雨',81:'阵雨',82:'强阵雨',95:'雷雨'}[code]||'天气';
      const rows=(w.daily?.time||[]).map((d,i)=>`${d.slice(5)} · ${w.daily.temperature_2m_min[i]}~${w.daily.temperature_2m_max[i]}℃ · 降雨概率 ${w.daily.precipitation_probability_max[i]}%`).join('<br>');
      result(`<b>${esc(x.name)}：${text}，${w.current?.temperature_2m}℃</b><br>体感 ${w.current?.apparent_temperature}℃ · 风速 ${w.current?.wind_speed_10m} km/h<br><br>${rows}`);
    }catch(e){result('天气查询失败，请检查城市名称或网络连接。')}
  }
  window.queryWeather=queryWeather;

  /* ---------- 首页工具箱 ---------- */
  function addToolbox(){
    const home=$('#home'),grid=home?.querySelector('.grid');if(!grid||grid.querySelector('.toolbox-entry'))return;
    const b=document.createElement('button');
    b.className='card tile toolbox-entry';
    b.innerHTML='<div class="ico">🧰</div><b>工具箱</b><span class="muted">预算、天气、清单、倒计时等实用工具</span>';
    b.onclick=openToolbox;
    grid.appendChild(b);
  }

  function installStyle(){
    if($('#trip-menu-toolbox-style-v2'))return;
    const st=document.createElement('style');st.id='trip-menu-toolbox-style-v2';st.textContent=`
      .trip-more{position:absolute!important;right:12px!important;top:12px!important;width:34px!important;height:34px!important;border-radius:12px!important;background:rgba(255,255,255,.82)!important;color:#5f6074!important;font-size:22px!important;line-height:1!important;display:grid!important;place-items:center!important;z-index:20!important;box-shadow:0 5px 14px rgba(60,50,100,.08)!important}
      .trip-more-menu{position:fixed;z-index:99999;width:154px;padding:6px;border-radius:15px;background:rgba(255,255,255,.98);box-shadow:0 18px 40px rgba(30,25,60,.18);border:1px solid #eeeaf8;backdrop-filter:blur(20px)}
      .trip-more-menu button{display:block;width:100%;padding:11px 12px;border-radius:10px;background:transparent;text-align:left;color:#222;font-size:13px}
      .trip-more-menu button:hover{background:#f5f3ff}.trip-more-menu .danger{color:#d94e5c}
      .toolbox-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.toolbox-item{display:flex;gap:10px;align-items:flex-start;text-align:left;padding:14px;border-radius:16px;background:#fff;border:1px solid #eceaf5;box-shadow:0 6px 18px rgba(60,50,100,.05)}.toolbox-item>span{font-size:23px}.toolbox-item b{display:block;font-size:13px}.toolbox-item small{display:block;color:#77788b;font-size:11px;line-height:1.45;margin-top:4px}
      .tool-result{margin-top:4px}.tool-result-box{padding:14px;border-radius:16px;background:#fff;border:1px solid #eceaf5;line-height:1.7}.check-row{display:flex;align-items:center;gap:10px;padding:12px 4px;border-bottom:1px solid #eeeaf5}.check-row input{width:18px;height:18px}.check-add{display:flex;gap:8px;margin:12px 0}.check-add input{flex:1;padding:11px;border:1px solid var(--line);border-radius:13px}.check-tool{display:grid;gap:8px}
      @media(max-width:760px){.toolbox-grid{grid-template-columns:1fr}.trip-more-menu{width:150px}}
    `;document.head.appendChild(st);
  }

  function patch(){
    removeLegacy();
    addToolbox();
    patchCards();
  }

  /* 不改动原有行程画布，只在原有 renderTrips 后补齐菜单和首页工具箱。 */
  const wrapRender=(name,after)=>{
    const fn=window[name];
    if(!fn||fn.__lvbanWrapped)return;
    const w=function(){const r=fn.apply(this,arguments);setTimeout(after,0);return r};
    w.__lvbanWrapped=true;window[name]=w;
  };

  installStyle();
  wrapRender('renderTrips',patch);
  wrapRender('renderHome',()=>{addToolbox();patch()});
  setTimeout(patch,100);
  setTimeout(patch,500);
  window.addEventListener('load',()=>setTimeout(patch,300));
})();