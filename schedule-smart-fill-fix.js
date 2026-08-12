/* 旅伴旅行管家 · 日程智能填写
 * 1. “安排什么”提供当前城市的景点推荐 + 常用日程推荐
 * 2. 选择/输入景点名称后，自动从 LVBAN_DATA.spots 填充地址
 * 3. 支持模糊匹配，不覆盖用户已经手动修改过的地址
 */
(function(){
  if(window.__lvScheduleSmartFill)return;
  window.__lvScheduleSmartFill=true;

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const db=()=>window.db;
  const trips=()=>Array.isArray(db()?.trips)?db().trips:[];
  const currentTrip=()=>trips().find(t=>t.id===window.activeTrip)||trips()[0]||null;
  const data=()=>window.LVBAN_DATA||{};
  const spots=()=>Array.isArray(data().spots)?data().spots:[];
  const cityOfTrip=()=>{
    const t=currentTrip();
    if(!t)return '';
    const city=String(t.city||'').split(/[·,，、/]/)[0].trim();
    return city;
  };

  function style(){
    if(document.getElementById('lv-smart-schedule-style'))return;
    const s=document.createElement('style');
    s.id='lv-smart-schedule-style';
    s.textContent=`
      .lv-smart-suggest{margin:2px 0 5px;padding:2px 0 4px}
      .lv-smart-suggest-title{font-size:11px;color:var(--muted);font-weight:700;margin:0 0 7px}
      .lv-smart-chips{display:flex;gap:7px;overflow:auto;padding:1px 1px 4px}
      .lv-smart-chip{flex:0 0 auto;border:1px solid var(--line);background:#fff;color:#5d4de5;border-radius:999px;padding:7px 10px;font-size:11px;cursor:pointer;white-space:nowrap}
      .lv-smart-chip:hover{background:#efedff;border-color:#d9d4ff}
      .lv-smart-match{font-size:10px;color:#2d9a6a;margin:-2px 0 6px;display:none}
      .lv-smart-match.show{display:block}
    `;
    document.head.appendChild(s);
  }

  function findFields(){
    const body=document.getElementById('modalBody');
    if(!body)return null;
    const title=(document.getElementById('modalTitle')?.textContent||'').trim();
    if(title!=='添加日程')return null;
    const texts=[...body.querySelectorAll('input[type="text"]')];
    const name=texts.find(x=>/安排什么|例如.*南普陀|日程/.test(x.placeholder||''))||texts[0];
    const address=texts.find(x=>/地址|可复制|导航/.test(x.placeholder||''))||texts[1];
    if(!name)return null;
    return {body,name,address};
  }

  function normalized(v){return String(v||'').trim().replace(/[（）()·・\s]/g,'').toLowerCase()}

  function matchSpot(value){
    const q=normalized(value);
    if(!q)return null;
    const list=spots();
    const exact=list.find(s=>normalized(s.name)===q);
    if(exact)return exact;
    const city=cityOfTrip();
    const same=list.filter(s=>!city||String(s.city||'')===city);
    const pool=same.length?same:list;
    return pool.find(s=>normalized(s.name).includes(q)||q.includes(normalized(s.name)))||null;
  }

  function fillAddress(name,address,spot,force){
    if(!address||!spot?.address)return;
    const old=String(address.value||'').trim();
    const smart=address.dataset.lvSmartAddress||'';
    if(force||!old||old===smart){
      address.value=spot.address;
      address.dataset.lvSmartAddress=spot.address;
      address.dispatchEvent(new Event('input',{bubbles:true}));
      address.dispatchEvent(new Event('change',{bubbles:true}));
    }
  }

  function render(fields){
    style();
    const {body,name,address}=fields;
    let box=body.querySelector('.lv-smart-suggest');
    if(!box){
      box=document.createElement('div');
      box.className='lv-smart-suggest';
      const anchor=address?.closest('label')||address?.parentElement;
      /* 推荐放在“安排什么”输入框后面，地址字段之前。 */
      if(name.parentElement)name.parentElement.insertAdjacentElement('afterend',box); else body.insertBefore(box,body.firstChild);
    }
    const city=cityOfTrip();
    const citySpots=spots().filter(s=>!city||String(s.city||'')===city).slice(0,6);
    const common=[
      {name:'早餐',address:''},{name:'午餐',address:''},{name:'晚餐',address:''},
      {name:'入住酒店',address:''},{name:'前往下一站',address:''}
    ];
    const items=[...citySpots.map(s=>({name:s.name,address:s.address,spot:s})),...common];
    const unique=[];const seen=new Set();items.forEach(x=>{if(!seen.has(x.name)){seen.add(x.name);unique.push(x)}});
    box.innerHTML='<div class="lv-smart-suggest-title">'+(city?'推荐 · '+esc(city):'推荐日程')+'</div><div class="lv-smart-chips">'+unique.map((x,i)=>'<button type="button" class="lv-smart-chip" data-smart-index="'+i+'">'+esc(x.name)+'</button>').join('')+'</div>';
    box._items=unique;
    box.onclick=e=>{
      const b=e.target.closest('[data-smart-index]');if(!b)return;
      const x=box._items[Number(b.dataset.smartIndex)];if(!x)return;
      name.value=x.name;
      name.dispatchEvent(new Event('input',{bubbles:true}));
      if(x.spot)fillAddress(name,address,x.spot,true);
      else if(address){address.value='';address.dataset.lvSmartAddress='';address.dispatchEvent(new Event('input',{bubbles:true}))}
      name.focus();
    };

    let hint=body.querySelector('.lv-smart-match');
    if(!hint){hint=document.createElement('div');hint.className='lv-smart-match';box.insertAdjacentElement('afterend',hint)}
    const update=()=>{
      const spot=matchSpot(name.value);
      if(spot){
        fillAddress(name,address,spot,false);
        hint.textContent='✓ 已识别“'+spot.name+'”，已自动填入地址：'+spot.address;
        hint.classList.add('show');
      }else{
        hint.textContent='';hint.classList.remove('show');
      }
    };
    if(!name.dataset.lvSmartBound){
      name.dataset.lvSmartBound='1';
      name.addEventListener('input',update);
      name.addEventListener('change',update);
      name.addEventListener('blur',update);
    }
    update();
  }

  function scan(){
    const f=findFields();
    if(f)render(f);
  }

  const mo=new MutationObserver(scan);
  mo.observe(document.body,{subtree:true,childList:true});
  document.addEventListener('click',()=>setTimeout(scan,20),true);
  setInterval(scan,700);
  scan();
})();
