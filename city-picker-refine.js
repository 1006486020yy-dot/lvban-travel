/* 旅伴旅行管家｜城市选择交互精修
 * 仅负责“新建行程 → 选择城市”的 UI，不改变原有行程数据结构。
 */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  const fallback=['北京','上海','杭州','成都','重庆','南京','西安','广州','深圳','三亚','福州','平潭','泉州','厦门','青岛','大连','苏州','长沙','武汉','桂林','昆明','大理','丽江','珠海','汕头','香港','澳门'];
  const recommended=['福州','平潭','厦门','杭州','上海','成都','北京','广州'];
  const allCities=()=>[...new Set(fallback.concat(window.LVBAN_DATA?.cities||[]).filter(Boolean))];
  const state=()=>window.__lvNewTripState||(window.__lvNewTripState={start:'',end:'',cities:[],cityDays:{}});
  const daysBetween=(a,b)=>{if(!a||!b)return 0;const x=new Date(a+'T00:00:00'),y=new Date(b+'T00:00:00');return y>=x?Math.floor((y-x)/86400000)+1:0};

  function style(){
    if($('#lv-city-refine-style'))return;
    const s=document.createElement('style');s.id='lv-city-refine-style';s.textContent=`
      .lv-refine-wrap{display:grid;gap:9px}
      .lv-refine-box{border:1px solid #e9e7f2;border-radius:18px;background:#fff;padding:13px;transition:.2s;box-shadow:0 3px 14px rgba(60,50,100,.035)}
      .lv-refine-box:focus-within{border-color:#d9d4ff;box-shadow:0 6px 20px rgba(105,88,245,.08)}
      .lv-refine-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px}
      .lv-refine-title{font-size:14px;font-weight:800;color:#262432}.lv-refine-more{border:0;background:transparent;color:#6958f5;font-size:12px;font-weight:700;padding:4px;cursor:pointer}
      .lv-refine-searchrow{display:flex;gap:8px;align-items:center}.lv-refine-search{position:relative;flex:1}.lv-refine-search input{width:100%!important;box-sizing:border-box;padding:11px 12px 11px 34px!important;border:0!important;background:#f7f6fb!important;border-radius:13px!important;outline:0!important}.lv-refine-icon{position:absolute;left:12px;top:10px;color:#898795;font-size:15px;pointer-events:none}
      .lv-refine-recs{display:flex;gap:7px;overflow:auto;padding:2px 1px 3px;scrollbar-width:none}.lv-refine-recs::-webkit-scrollbar{display:none}.lv-refine-rec{white-space:nowrap;border:1px solid #ebe9f3;background:#fff;border-radius:12px;padding:8px 11px;font-size:12px;color:#444;cursor:pointer}.lv-refine-rec.on{background:#6958f5;color:#fff;border-color:#6958f5}
      .lv-refine-selected{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.lv-refine-chip{display:inline-flex;align-items:center;gap:4px;background:#f0eeff;color:#5d4de5;border-radius:11px;padding:6px 9px;font-size:11px}.lv-refine-chip button{border:0;background:transparent;color:inherit;padding:0;cursor:pointer;font-weight:900}
      .lv-refine-morepanel{display:none;position:fixed;inset:0;z-index:100300;background:rgba(20,18,32,.22);backdrop-filter:blur(4px);align-items:flex-end;justify-content:center}.lv-refine-morepanel.open{display:flex}.lv-refine-sheet{width:min(680px,100%);max-height:82vh;background:#fff;border-radius:24px 24px 0 0;padding:18px 16px 22px;box-shadow:0 -12px 35px rgba(30,25,60,.16);overflow:auto;animation:lvRefineUp .22s ease}.lv-refine-sheet-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.lv-refine-sheet-head b{font-size:17px}.lv-refine-close{border:0;background:#f3f2f7;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:18px}.lv-refine-grid{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.lv-refine-city{border:1px solid #e8e6f0;background:#fff;border-radius:13px;padding:9px 12px;font-size:12px;cursor:pointer}.lv-refine-city.on{background:#6958f5;color:#fff;border-color:#6958f5}.lv-refine-use{display:none;margin-top:9px;padding:11px;border-radius:13px;background:#f5f3ff;color:#5d4de5;font-size:12px;cursor:pointer}.lv-refine-use.show{display:block}.lv-refine-footer{position:sticky;bottom:-22px;margin:16px -16px -22px;padding:12px 16px;background:rgba(255,255,255,.94);border-top:1px solid #eee;display:flex;align-items:center;gap:10px}.lv-refine-count{flex:1;font-size:12px;color:#777}.lv-refine-done{border:0;border-radius:13px;background:#6958f5;color:#fff;font-weight:800;padding:11px 22px;cursor:pointer}
      @keyframes lvRefineUp{from{transform:translateY(30px);opacity:.4}to{transform:translateY(0);opacity:1}}
    `;document.head.appendChild(s);
  }
  function toggleCity(c){const s=state();const cities=s.cities.includes(c)?s.cities.filter(x=>x!==c):s.cities.concat(c);window.__lvNewTripState={...s,cities};if(typeof window.updateDaysForCities==='function')window.updateDaysForCities(cities);render();if(typeof window.renderDays==='function')window.renderDays();}
  function addCustom(v){v=String(v||'').trim();if(!v)return;const s=state();if(!s.cities.some(x=>x.toLowerCase()===v.toLowerCase())){window.__lvNewTripState={...s,cities:s.cities.concat(v)};if(typeof window.updateDaysForCities==='function')window.updateDaysForCities(window.__lvNewTripState.cities)};render();if(typeof window.renderDays==='function')window.renderDays();}
  function render(){
    const root=$('#lvntv2CitySummary');if(!root)return;
    const s=state();let wrap=$('#lvRefineWrap');
    if(!wrap){wrap=document.createElement('div');wrap.id='lvRefineWrap';wrap.className='lv-refine-wrap';root.replaceWith(wrap)}
    wrap.innerHTML=`<div class="lv-refine-box"><div class="lv-refine-head"><span class="lv-refine-title">目的地</span><button type="button" class="lv-refine-more" id="lvRefineMore">更多城市 ›</button></div><div class="lv-refine-searchrow"><div class="lv-refine-search"><span class="lv-refine-icon">⌕</span><input id="lvRefineSearch" placeholder="搜索城市"></div></div><div style="font-size:11px;color:#888;margin:10px 0 6px">推荐城市</div><div class="lv-refine-recs" id="lvRefineRecs"></div><div class="lv-refine-selected" id="lvRefineSelected"></div></div><div class="lv-refine-morepanel" id="lvRefinePanel"><div class="lv-refine-sheet"><div class="lv-refine-sheet-head"><b>选择更多城市</b><button type="button" class="lv-refine-close" id="lvRefineClose">×</button></div><div class="lv-refine-search"><span class="lv-refine-icon">⌕</span><input id="lvRefineMoreSearch" placeholder="搜索或输入城市名称"></div><div id="lvRefineUse" class="lv-refine-use"></div><div style="font-size:11px;color:#888;margin:14px 0 4px">城市</div><div class="lv-refine-grid" id="lvRefineGrid"></div><div class="lv-refine-footer"><span class="lv-refine-count" id="lvRefineCount"></span><button type="button" class="lv-refine-done" id="lvRefineDone">完成选择</button></div></div></div>`;
    const selected=$('#lvRefineSelected');selected.innerHTML=s.cities.map(c=>`<span class="lv-refine-chip">${esc(c)}<button type="button" data-city="${esc(c)}">×</button></span>`).join('');selected.querySelectorAll('button').forEach(b=>b.onclick=e=>{e.stopPropagation();toggleCity(b.dataset.city)});
    const rec=$('#lvRefineRecs');rec.innerHTML=recommended.map(c=>`<button type="button" class="lv-refine-rec ${s.cities.includes(c)?'on':''}" data-city="${esc(c)}">${esc(c)}</button>`).join('');rec.querySelectorAll('button').forEach(b=>b.onclick=()=>toggleCity(b.dataset.city));
    const panel=$('#lvRefinePanel');$('#lvRefineMore').onclick=()=>{panel.classList.add('open');$('#lvRefineMoreSearch').focus();renderMore()};$('#lvRefineClose').onclick=()=>panel.classList.remove('open');$('#lvRefineDone').onclick=()=>panel.classList.remove('open');panel.onclick=e=>{if(e.target===panel)panel.classList.remove('open')};
    $('#lvRefineSearch').oninput=e=>{const q=e.target.value.trim().toLowerCase();if(q){panel.classList.add('open');$('#lvRefineMoreSearch').value=e.target.value;renderMore()}};
    renderMore();
  }
  function renderMore(){const root=$('#lvRefineGrid'),input=$('#lvRefineMoreSearch'),use=$('#lvRefineUse'),count=$('#lvRefineCount');if(!root)return;const q=(input?.value||'').trim().toLowerCase(),s=state(),list=allCities().filter(c=>!q||c.toLowerCase().includes(q));root.innerHTML=list.map(c=>`<button type="button" class="lv-refine-city ${s.cities.includes(c)?'on':''}" data-city="${esc(c)}">${esc(c)}</button>`).join('');root.querySelectorAll('button').forEach(b=>b.onclick=()=>{toggleCity(b.dataset.city);renderMore()});if(use){const exact=list.some(c=>c.toLowerCase()===q);use.classList.toggle('show',!!q&&!exact);use.innerHTML=q?`＋ 使用“${esc(input.value.trim())}”作为自定义城市`:'';use.onclick=()=>{addCustom(input.value);input.value='';renderMore()}}if(count)count.textContent=`已选择 ${s.cities.length} 个城市`}
  function boot(){style();if(!$('#lvntv2CitySummary'))return;render();const old=$('#lvntv2CitySummary');if(old){new MutationObserver(()=>{if(!$('#lvRefineWrap')&&$('#lvntv2CitySummary'))render()}).observe(old.parentNode||document.body,{childList:true,subtree:true})}}
  let tries=0;const timer=setInterval(()=>{if($('#lvntv2CitySummary')||tries++>40){clearInterval(timer);boot()}},150);
})();
