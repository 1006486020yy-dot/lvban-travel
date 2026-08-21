/* 旅伴旅行管家 · 新建行程 V2 FINAL
   日期：先选开始日期，自动进入结束日期；
   城市：一个选择框，先显示推荐城市，点击后展开更多城市并支持多选；
   城市天数：只有选完城市后才出现，并自动按总天数分配，可 +/- 调整；
   创建：保存大行程后进入新建行程的详细页。
*/
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  const fmtDate=d=>{if(!d)return '';const [y,m,day]=d.split('-');return `${y}年${Number(m)}月${Number(day)}日`;};
  const daysBetween=(a,b)=>{if(!a||!b)return 0;const x=new Date(a+'T00:00:00'),y=new Date(b+'T00:00:00');return y>=x?Math.floor((y-x)/86400000)+1:0;};
  const recommended=['北京','上海','杭州','成都','重庆','南京','西安','广州','深圳','三亚','福州','厦门'];
  const fallback=['北京','上海','杭州','成都','重庆','南京','西安','广州','深圳','三亚','福州','平潭','泉州','厦门','青岛','大连','苏州','长沙','武汉','桂林','昆明','大理','丽江','珠海','汕头','香港','澳门'];
  function allCities(){const d=window.LVBAN_DATA||{};const db=Array.isArray(d.cities)?d.cities:[];return [...new Set(fallback.concat(db).filter(Boolean))];}
  function style(){
    if($('#lv-new-trip-v2-style'))return;
    const s=document.createElement('style');s.id='lv-new-trip-v2-style';s.textContent=`
      .lvntv2{display:grid;gap:10px}.lvntv2 label{font-size:12px;color:#77788b}.lvntv2 input{width:100%;padding:12px;border:1px solid #e8e6f4;border-radius:14px;background:#fff;outline:0;box-sizing:border-box}
      .lvntv2-date{display:grid;grid-template-columns:1fr 1fr;gap:8px}.lvntv2-datebox{padding:10px;border:1px solid #e8e6f4;border-radius:16px;background:#fff}.lvntv2-datebox b{display:block;font-size:11px;color:#77788b;margin-bottom:5px}.lvntv2-datebox input{border:0;padding:2px 0;background:transparent}
      .lvntv2-citybox{border:1px solid #e8e6f4;border-radius:16px;background:#fff;padding:10px;cursor:pointer}.lvntv2-cityhead{display:flex;align-items:center;justify-content:space-between;gap:8px}.lvntv2-citychips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.lvntv2-citychip{padding:7px 10px;border-radius:12px;background:#f0eeff;color:#5d4de5;font-size:12px}.lvntv2-picker{display:none;margin-top:9px;padding-top:10px;border-top:1px solid #eee}.lvntv2-picker.open{display:block}.lvntv2-section{font-size:11px;color:#77788b;margin:7px 0}.lvntv2-grid{display:flex;flex-wrap:wrap;gap:7px}.lvntv2-citybtn{padding:9px 12px;border:1px solid #e8e6f4;border-radius:13px;background:#fff;color:#444;font-size:12px}.lvntv2-citybtn.on{background:#6958f5;color:#fff;border-color:#6958f5}.lvntv2-days{display:grid;gap:8px}.lvntv2-dayrow{display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:8px;padding:10px 12px;border-radius:15px;background:#fff;border:1px solid #e8e6f4}.lvntv2-dayrow b{font-size:13px}.lvntv2-dayrow small{display:block;color:#888;font-size:10px;margin-top:2px}.lvntv2-step{width:34px;height:34px;border-radius:11px;background:#efedff;color:#5d4de5;font-weight:900}.lvntv2-count{min-width:48px;text-align:center;font-weight:800}.lvntv2-hint{font-size:11px;color:#77788b;line-height:1.5}.lvntv2-error{font-size:11px;color:#d64d5b}.lvntv2-total{display:flex;justify-content:space-between;padding:10px 12px;border-radius:14px;background:#f0eeff;color:#5d4de5;font-size:12px;font-weight:800}
      .lvntv2-hidden{display:none!important}
      @media(max-width:560px){.lvntv2-date{grid-template-columns:1fr 1fr}}
    `;document.head.appendChild(s);
  }
  function getState(){return window.__lvNewTripState||{start:'',end:'',cities:[],cityDays:{},picker:false};}
  function setState(s){window.__lvNewTripState=s;}
  function defaultDays(cities,total){const n=cities.length;const out={};if(!n||!total)return out;let left=total;cities.forEach((c,i)=>{const remain=n-i;const v=i===n-1?left:Math.max(1,Math.floor(left/remain));out[c]=v;left-=v;});return out;}
  function renderDays(){
    const s=getState(),box=$('#lvntv2Days'),wrap=$('#lvntv2DaysWrap');
    if(!box||!wrap)return;
    if(!s.cities.length){wrap.classList.add('lvntv2-hidden');box.innerHTML='';return;}
    wrap.classList.remove('lvntv2-hidden');
    const total=daysBetween(s.start,s.end);
    if(!total){box.innerHTML='<div class="lvntv2-hint">先选择完整的开始和结束日期。</div>';return;}
    if(total<s.cities.length){box.innerHTML='<div class="lvntv2-error">当前旅行只有 '+total+' 天，但选择了 '+s.cities.length+' 个城市。至少需要每个城市 1 天。</div>';return;}
    let sum=0;
    box.innerHTML=s.cities.map(c=>{const v=Number(s.cityDays[c]||1);sum+=v;return `<div class="lvntv2-dayrow"><div><b>${esc(c)}</b><small>安排 ${v} 天</small></div><button type="button" class="lvntv2-step" data-city="${esc(c)}" data-op="minus">−</button><span class="lvntv2-count">${v} 天</span><button type="button" class="lvntv2-step" data-city="${esc(c)}" data-op="plus">＋</button></div>`;}).join('')+`<div class="lvntv2-total"><span>已分配</span><span>${sum} / ${total} 天</span></div>`+(sum!==total?`<div class="lvntv2-error">还差 ${Math.abs(total-sum)} 天，请调整各城市天数。</div>`:'<div class="lvntv2-hint">城市天数已分配完成，可以创建行程。</div>');
    box.querySelectorAll('[data-op]').forEach(b=>b.onclick=()=>{const city=b.dataset.city,op=b.dataset.op;const vals={...s.cityDays};const cur=Number(vals[city]||1);const other=s.cities.filter(x=>x!==city).reduce((n,x)=>n+Number(vals[x]||1),0);if(op==='minus'&&cur>1)vals[city]=cur-1;if(op==='plus'&&other+cur<total)vals[city]=cur+1;setState({...s,cityDays:vals});renderDays();});
  }
  function renderCities(){
    const s=getState(),chips=$('#lvntv2Selected'),grid=$('#lvntv2CityGrid'),rec=$('#lvntv2Recommended');
    if(chips)chips.innerHTML=s.cities.length?s.cities.map(c=>`<span class="lvntv2-citychip">${esc(c)}</span>`).join(''):'<span class="lvntv2-hint">点击选择城市</span>';
    const paint=(root,list)=>{if(!root)return;root.innerHTML=list.map(c=>`<button type="button" class="lvntv2-citybtn ${s.cities.includes(c)?'on':''}" data-city="${esc(c)}">${esc(c)}</button>`).join('');root.querySelectorAll('[data-city]').forEach(b=>b.onclick=e=>{e.stopPropagation();toggleCity(b.dataset.city);});};
    paint(rec,recommended.filter(c=>allCities().includes(c)));paint(grid,allCities());
  }
  function toggleCity(c){
    const s=getState();
    const cities=s.cities.includes(c)?s.cities.filter(x=>x!==c):s.cities.concat(c);
    const total=daysBetween(s.start,s.end);let cityDays={...s.cityDays};
    Object.keys(cityDays).forEach(x=>{if(!cities.includes(x))delete cityDays[x];});
    if(total>=cities.length&&total>0)cityDays=defaultDays(cities,total);else cities.forEach(x=>{if(!cityDays[x])cityDays[x]=1;});
    setState({...s,cities,cityDays});renderCities();renderDays();
  }
  function save(){
    const s=getState(),name=$('#tName')?.value.trim(),total=daysBetween(s.start,s.end),sum=s.cities.reduce((n,c)=>n+Number(s.cityDays[c]||0),0);
    if(!name)return toast('请先填写行程名称');if(!s.start||!s.end)return toast('请选择完整的出行日期');if(s.end<s.start)return toast('结束日期不能早于开始日期');if(!s.cities.length)return toast('请选择至少一个城市');if(total!==sum)return toast('请把城市天数分配完整');
    const cityRanges=[];let cursor=new Date(s.start+'T00:00:00');s.cities.forEach(c=>{const days=Number(s.cityDays[c]),st=cursor.toISOString().slice(0,10),en=new Date(cursor.getTime()+(days-1)*86400000).toISOString().slice(0,10);cityRanges.push({city:c,days,start:st,end:en});cursor=new Date(cursor.getTime()+days*86400000);});
    const t={id:'trip-'+Date.now(),name,start:s.start,end:s.end,cities:s.cities.slice(),cityDays:{...s.cityDays},cityRanges,plan:'方案A',city:s.cities.join(' · ')};
    let trips=JSON.parse(localStorage.getItem('lvban-trips')||'[]');trips.push(t);localStorage.setItem('lvban-trips',JSON.stringify(trips));window.customTrips=trips;
    closeModal();if(typeof renderTrips==='function')renderTrips();if(typeof openCustom==='function')openCustom(trips.length-1);toast('新建行程成功');
  }
  function open(){
    style();setState({start:'',end:'',cities:[],cityDays:{},picker:false});
    modal('新建行程',`<div class="lvntv2"><div class="trip-level">一级类目：我的行程</div><label>行程名称</label><input id="tName" placeholder="例如：十一福建游"><label>出行日期</label><div class="lvntv2-date"><div class="lvntv2-datebox"><b>开始日期</b><input id="lvntv2Start" type="date"></div><div class="lvntv2-datebox"><b>结束日期</b><input id="lvntv2End" type="date"></div></div><div id="lvntv2DateHint" class="lvntv2-hint">先点击开始日期，选择后会自动进入结束日期。</div><label>选择城市</label><div id="lvntv2CityBox" class="lvntv2-citybox"><div class="lvntv2-cityhead"><b>选择城市</b><span>⌄</span></div><div id="lvntv2Selected" class="lvntv2-citychips"></div><div id="lvntv2Picker" class="lvntv2-picker"><div class="lvntv2-section">推荐城市</div><div class="lvntv2-grid" id="lvntv2Recommended"></div><div class="lvntv2-section">更多城市</div><div class="lvntv2-grid" id="lvntv2CityGrid"></div></div></div><div id="lvntv2DaysWrap" class="lvntv2-hidden"><label>城市停留天数</label><div id="lvntv2Days" class="lvntv2-days"></div><div class="lvntv2-hint">城市顺序就是行程顺序。选择城市后，可分别调整每个城市停留天数。</div></div><button type="button" class="btn primary" id="lvntv2Create">创建行程</button></div>`);
    const st=$('#lvntv2Start'),en=$('#lvntv2End');
    st.addEventListener('change',()=>{const s=getState();s.start=st.value;if(!s.end||s.end<s.start)s.end=st.value;en.min=st.value;en.value=s.end;setState(s);if(st.value){const hint=$('#lvntv2DateHint');if(hint)hint.textContent='已选择开始日期，请选择结束日期。';try{en.focus();en.showPicker?.();}catch(e){en.focus();}renderDays();}});
    en.addEventListener('change',()=>{const s=getState();s.end=en.value;setState(s);const hint=$('#lvntv2DateHint');if(hint)hint.textContent=en.value?`行程日期：${fmtDate(s.start)} → ${fmtDate(s.end)}`:'请选择结束日期';renderDays();});
    $('#lvntv2CityBox').onclick=e=>{if(e.target.closest('button'))return;const s=getState();s.picker=!s.picker;setState(s);$('#lvntv2Picker').classList.toggle('open',s.picker);};
    renderCities();renderDays();$('#lvntv2Create').onclick=save;
  }
  window.newTrip=open;window.__lvbanNewTripV2=true;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',style);else style();
})();
