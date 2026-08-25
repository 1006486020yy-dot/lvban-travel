/* 旅伴旅行管家 · 城市选择最终 UI
 * 仅负责新建行程城市选择；不接管日期、不修改创建逻辑。
 */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  const recommended=['福州','厦门','平潭','杭州','上海','成都','北京','西安'];
  const preset=['北京','上海','广州','深圳','杭州','成都','重庆','南京','西安','福州','平潭','厦门','泉州','长春','张家界','青岛','大连','苏州','长沙','武汉','桂林','昆明','大理','丽江','三亚','珠海','汕头','天津','石家庄','太原','沈阳','哈尔滨','吉林','延吉','济南','烟台','威海','郑州','洛阳','开封','合肥','黄山','宁波','温州','绍兴','嘉兴','金华','台州','南昌','九江','上饶','宜昌','襄阳','岳阳','海口','北海','贵阳','遵义','拉萨','西宁','兰州','敦煌','银川','乌鲁木齐','喀什','西双版纳','腾冲','香格里拉','稻城亚丁','台北'];
  const allCities=()=>[...new Set(preset.concat(window.LVBAN_DATA?.cities||[]).filter(Boolean))];
  const state=()=>window.__lvNewTripState||(window.__lvNewTripState={start:'',end:'',cities:[],cityDays:{},picker:false});
  const setCities=list=>{const s=state();window.__lvNewTripState={...s,cities:[...new Set(list)]};};

  function css(){
    if($('#lv-city-final-style'))return;
    const s=document.createElement('style');s.id='lv-city-final-style';s.textContent=`
      #lvCityUIFinal{border:1px solid #e7e2ff;border-radius:20px;background:linear-gradient(180deg,#fff,#faf8ff);padding:13px;box-shadow:0 8px 26px rgba(105,88,245,.07)}
      .lvcf-bar{display:flex;gap:8px;align-items:center}.lvcf-search{position:relative;flex:1}.lvcf-search-icon{position:absolute;left:13px;top:11px;color:#756c96}.lvcf-input{width:100%;height:44px;box-sizing:border-box;border:1px solid #e6e1f5;border-radius:14px;background:#f8f6ff;padding:0 12px 0 34px;outline:none;color:#312b49}.lvcf-input:focus{border-color:#a79bf7;box-shadow:0 0 0 3px rgba(105,88,245,.08)}
      .lvcf-more{height:44px;border:1px solid #d9d0ff;border-radius:14px;background:linear-gradient(135deg,#f2efff,#e9e4ff);color:#5b4be2;padding:0 14px;font-weight:800;cursor:pointer;white-space:nowrap}.lvcf-label{font-size:11px;color:#77718b;margin:13px 0 7px}.lvcf-pills{display:flex;flex-wrap:wrap;gap:7px}.lvcf-pill{border:1px solid #e5e0f3;background:#fff;color:#403951;border-radius:13px;padding:8px 11px;font-size:12px;cursor:pointer}.lvcf-pill.on{background:#6958f5;border-color:#6958f5;color:#fff;box-shadow:0 5px 12px rgba(105,88,245,.18)}
      .lvcf-selected{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px}.lvcf-chip{display:inline-flex;align-items:center;gap:5px;border-radius:12px;background:#f0edff;color:#5d4de5;padding:7px 10px;font-size:12px;font-weight:700}.lvcf-chip button{border:0;background:transparent;color:inherit;font-weight:900;cursor:pointer;padding:0}
      #lvCityFinalOverlay{position:fixed;inset:0;z-index:100500;display:none;align-items:center;justify-content:center;background:rgba(29,24,55,.42);padding:18px;box-sizing:border-box}#lvCityFinalOverlay.show{display:flex}.lvcf-sheet{width:min(620px,100%);max-height:86vh;overflow:auto;border:1px solid #e3ddff;border-radius:26px;background:linear-gradient(180deg,#fff,#f8f6ff);box-shadow:0 24px 70px rgba(35,26,86,.25);padding:18px;box-sizing:border-box}.lvcf-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:13px}.lvcf-head b{font-size:18px;color:#2e2843}.lvcf-close{width:34px;height:34px;border:0;border-radius:11px;background:#eeeaff;color:#5d4de5;font-size:20px;cursor:pointer}.lvcf-modal-search{position:relative;margin-bottom:12px}.lvcf-modal-search .lvcf-input{background:#f7f5ff}.lvcf-custom{display:none;margin:8px 0;padding:11px 12px;border-radius:13px;background:#f0edff;color:#5d4de5;font-weight:800;cursor:pointer}.lvcf-custom.show{display:block}.lvcf-modal-grid{display:flex;flex-wrap:wrap;gap:8px}.lvcf-done{position:sticky;bottom:0;width:100%;margin-top:16px;height:46px;border:0;border-radius:14px;background:linear-gradient(135deg,#6958f5,#7c69ff);color:#fff;font-weight:900;cursor:pointer;box-shadow:0 8px 18px rgba(105,88,245,.2)}
    `;document.head.appendChild(s);
  }

  function syncDays(){
    const s=state();
    const start=$('#lvntv2Start');
    if(start){start.dispatchEvent(new Event('change',{bubbles:true}));}
    const end=$('#lvntv2End');
    if(end){end.dispatchEvent(new Event('change',{bubbles:true}));}
  }

  function toggleCity(name){
    const s=state();const has=s.cities.includes(name);setCities(has?s.cities.filter(c=>c!==name):s.cities.concat(name));
    renderAll();syncDays();
  }

  function addCustom(value){
    const name=(value||'').trim();if(!name)return;
    const s=state();const existing=s.cities.some(c=>c.toLowerCase()===name.toLowerCase());if(!existing)setCities(s.cities.concat(name));
    renderAll();syncDays();
  }

  function pill(name,modal){
    const selected=state().cities.includes(name);return `<button type="button" class="${modal?'lvcf-pill':'lvcf-pill'} ${selected?'on':''}" data-lvcf-city="${esc(name)}">${selected?'✓ ':''}${esc(name)}</button>`;
  }

  function renderMain(){
    const root=$('#lvCityUIFinal');if(!root)return;const selected=state().cities;qMain.value=qMain.value||'';const q=qMain.value.trim().toLowerCase();
    const list=q?allCities().filter(c=>c.toLowerCase().includes(q)).slice(0,10):[];
    $('#lvCityFinalResults').innerHTML=q?(list.length?list.map(c=>pill(c,false)).join(''):`<button type="button" class="lvcf-pill" data-lvcf-custom-main="1">＋ 使用“${esc(qMain.value.trim())}”</button>`):'';
    $('#lvCityFinalRecommended').innerHTML=q?'':recommended.map(c=>pill(c,false)).join('');
    $('#lvCityFinalSelected').innerHTML=selected.length?selected.map(c=>`<span class="lvcf-chip">${esc(c)}<button type="button" data-lvcf-remove="${esc(c)}">×</button></span>`).join(''):'<span style="font-size:12px;color:#9993aa">尚未选择城市</span>';
    root.querySelectorAll('[data-lvcf-city]').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();toggleCity(b.dataset.lvcfCity)});
    root.querySelectorAll('[data-lvcf-remove]').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();toggleCity(b.dataset.lvcfRemove)});
    const custom=root.querySelector('[data-lvcf-custom-main]');if(custom)custom.onclick=e=>{e.preventDefault();addCustom(qMain.value)};
  }

  let qMain;
  function renderModal(){
    const overlay=$('#lvCityFinalOverlay');if(!overlay)return;const q=$('#lvCityFinalModalSearch').value.trim().toLowerCase();const list=allCities().filter(c=>!q||c.toLowerCase().includes(q));
    $('#lvCityFinalModalGrid').innerHTML=list.map(c=>pill(c,true)).join('');
    const custom=$('#lvCityFinalCustom');custom.classList.toggle('show',!!q&&!allCities().some(c=>c.toLowerCase()===q));custom.textContent=q?`＋ 使用“${$('#lvCityFinalModalSearch').value.trim()}”作为自定义城市`:'';
    overlay.querySelectorAll('[data-lvcf-city]').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();toggleCity(b.dataset.lvcfCity);renderModal()});
  }

  function enhance(){
    const old=$('#lvntv2CitySummary');if(!old||old.dataset.finalCityDone)return false;css();old.dataset.finalCityDone='1';
    const panel=$('#lvntv2CityPanel');if(panel){panel.style.display='none';panel.classList.remove('open');}
    const root=document.createElement('div');root.id='lvCityUIFinal';root.innerHTML=`<div class="lv-city-title" style="font-size:14px;font-weight:800;color:#312b49;margin-bottom:9px">目的地</div><div class="lvcf-bar"><div class="lvcf-search"><span class="lvcf-search-icon">⌕</span><input id="lvCityFinalMainSearch" class="lvcf-input" placeholder="搜索城市或直接输入"></div><button type="button" id="lvCityFinalMore" class="lvcf-more">更多城市</button></div><div class="lvcf-label">推荐城市</div><div id="lvCityFinalRecommended" class="lvcf-pills"></div><div id="lvCityFinalResults" class="lvcf-pills"></div><div class="lvcf-label">已选择</div><div id="lvCityFinalSelected" class="lvcf-selected"></div>`;old.replaceWith(root);qMain=$('#lvCityFinalMainSearch');
    const overlay=document.createElement('div');overlay.id='lvCityFinalOverlay';overlay.innerHTML=`<div class="lvcf-sheet"><div class="lvcf-head"><b>选择更多城市</b><button type="button" class="lvcf-close" id="lvCityFinalClose">×</button></div><div class="lvcf-modal-search"><span class="lvcf-search-icon">⌕</span><input id="lvCityFinalModalSearch" class="lvcf-input" placeholder="搜索预备城市或输入自定义城市"></div><div id="lvCityFinalCustom" class="lvcf-custom"></div><div class="lvcf-label">预备城市</div><div id="lvCityFinalModalGrid" class="lvcf-modal-grid"></div><button type="button" id="lvCityFinalDone" class="lvcf-done">完成选择（0）</button></div>`;document.body.appendChild(overlay);
    const open=()=>{overlay.classList.add('show');renderModal();setTimeout(()=>$('#lvCityFinalModalSearch')?.focus(),30)};$('#lvCityFinalMore').onclick=e=>{e.preventDefault();e.stopPropagation();open()};$('#lvCityFinalClose').onclick=e=>{e.preventDefault();overlay.classList.remove('show')};overlay.onclick=e=>{if(e.target===overlay)overlay.classList.remove('show')};
    $('#lvCityFinalDone').onclick=e=>{e.preventDefault();e.stopPropagation();overlay.classList.remove('show');renderMain();syncDays()};
    $('#lvCityFinalModalSearch').oninput=renderModal;$('#lvCityFinalCustom').onclick=e=>{e.preventDefault();addCustom($('#lvCityFinalModalSearch').value);renderModal()};qMain.oninput=renderMain;renderAll();return true;
  }
  function renderAll(){renderMain();renderModal();const b=$('#lvCityFinalDone');if(b)b.textContent=`完成选择（${state().cities.length}）`;}
  function boot(){let n=0;const timer=setInterval(()=>{if(enhance()||$('#lvCityUIFinal')){clearInterval(timer)}if(++n>100)clearInterval(timer)},150)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
