/* 旅伴旅行管家 · 首页模块稳定渲染补丁
 * 只负责首页六大入口的内容渲染，不改原版视觉框架。
 */
(function(){
  'use strict';
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const data=()=>window.LVBAN_DATA||{};
  const nav=v=>{const q=String(v||'').trim();if(!q)return;window.open('https://uri.amap.com/search?keyword='+encodeURIComponent(q),'_blank','noopener');};
  const toast=m=>window.toast?.(m);

  function style(){
    if($('#lv-module-fix-style'))return;
    const s=document.createElement('style');s.id='lv-module-fix-style';s.textContent=`
      .lv-module-page{padding:10px 2px 100px}.lv-module-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:14px}.lv-module-head h2{margin:0;font-size:24px}.lv-module-head p{margin:5px 0 0;color:var(--muted);font-size:12px}.lv-module-search{width:100%;height:44px;border:1px solid var(--line);border-radius:14px;background:#fff;padding:0 13px;box-sizing:border-box;font-size:13px;outline:none;margin-bottom:10px}.lv-module-chips{display:flex;gap:7px;overflow:auto;padding:2px 0 12px}.lv-module-chip{flex:0 0 auto;border:0;border-radius:999px;background:#fff;padding:8px 12px;color:#666;font-size:11px}.lv-module-chip.on{background:#efedff;color:var(--p);font-weight:800}.lv-module-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.lv-module-card{background:#fff;border:1px solid #eeeafa;border-radius:18px;padding:14px;box-shadow:0 8px 24px rgba(50,40,100,.06)}.lv-module-card .city{font-size:10px;color:var(--p);font-weight:800}.lv-module-card h3{margin:7px 0 5px;font-size:16px}.lv-module-card p{margin:0;color:var(--muted);font-size:11px;line-height:1.55}.lv-module-actions{display:flex;gap:7px;margin-top:10px;flex-wrap:wrap}.lv-module-actions button{border:0;border-radius:10px;background:#f3f1ff;color:#5d4de5;padding:8px 10px;font-size:11px}.lv-module-empty{background:#fff;border-radius:18px;padding:30px 15px;text-align:center;color:var(--muted);font-size:12px}.lv-traffic-card{min-height:145px}.lv-hotel-note{margin-top:10px;padding:10px;border-radius:12px;background:#f7f6fc;font-size:11px;color:var(--muted);line-height:1.5}
      @media(max-width:760px){.lv-module-grid{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }

  function shell(id,title,sub){const r=$('#'+id);if(!r)return null;r.innerHTML=`<div class="lv-module-page"><div class="lv-module-head"><div><h2>${title}</h2><p>${sub}</p></div></div><div id="${id}SearchWrap"></div><div id="${id}Body"></div></div>`;return r;}
  function chips(id,cities,selected,onPick){const wrap=$('#'+id+'SearchWrap');if(!wrap)return;wrap.innerHTML=`<div class="lv-module-chips"><button class="lv-module-chip ${!selected?'on':''}" data-city="">全部</button>${cities.map(c=>`<button class="lv-module-chip ${selected===c?'on':''}" data-city="${esc(c)}">${esc(c)}</button>`).join('')}</div>`;wrap.querySelectorAll('button').forEach(b=>b.onclick=()=>onPick(b.dataset.city));}

  function renderCatalog(type){
    style();const title=type==='spots'?'景点':'美食',d=data(),all=Array.isArray(d[type==='spots'?'spots':'foods'])?d[type==='spots'?'spots':'foods']:[];const root=shell(type,title,type==='spots'?'按城市浏览景点与地址':'按城市浏览本地美食');if(!root)return;
    const cities=[...new Set(all.map(x=>x.city).filter(Boolean))];let city='';let q='';
    const draw=()=>{chips(type,cities,city,c=>{city=c;draw()});const sw=$('#'+type+'SearchWrap');const search=document.createElement('input');search.className='lv-module-search';search.placeholder=type==='spots'?'搜索景点或城市…':'搜索美食或城市…';search.value=q;sw.prepend(search);search.oninput=()=>{q=search.value.trim().toLowerCase();drawBody()};drawBody()};
    const drawBody=()=>{const body=$('#'+type+'Body');if(!body)return;const arr=all.filter(x=>(!city||x.city===city)&&(!q||`${x.name} ${x.city} ${x.address}`.toLowerCase().includes(q)));body.innerHTML=arr.length?`<div class="lv-module-grid">${arr.map(x=>`<article class="lv-module-card"><div class="city">${esc(x.city||'')}</div><h3>${esc(x.name)}</h3><p>📍 ${esc(x.address||'暂无地址')}</p>${x.highlight?`<p style="margin-top:5px">${esc(x.highlight)}</p>`:''}<div class="lv-module-actions"><button data-nav="${encodeURIComponent((x.name||'')+' '+(x.address||''))}">导航</button><button data-copy="${encodeURIComponent(x.address||'')}">复制地址</button></div></article>`).join('')}</div>`:'<div class="lv-module-empty">暂无匹配内容</div>';body.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>nav(decodeURIComponent(b.dataset.nav)));body.querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>{const x=decodeURIComponent(b.dataset.copy||'');navigator.clipboard?.writeText(x);toast('地址已复制')})};
    draw();
  }

  function renderTraffic(){
    style();const root=shell('traffic','交通','城际交通、本地出行与行程关联');if(!root)return;const t=window.db?.trips?.find(x=>x.id===window.activeTrip)||window.db?.trips?.[0];const city=t?.city||'当前目的地';$('#trafficBody').innerHTML=`<div class="lv-module-grid"><article class="lv-module-card lv-traffic-card"><div class="city">城际交通</div><h3>🚄 高铁 / 动车</h3><p>根据当前行程的出发地与目的地安排城际交通。</p><div class="lv-module-actions"><button onclick="go('trips')">查看行程</button><button onclick="newTrip()">添加交通日程</button></div></article><article class="lv-module-card lv-traffic-card"><div class="city">本地出行</div><h3>🚕 打车 / 地铁 / 公交</h3><p>当前行程目的地：${esc(city)}。可在具体日程中直接导航。</p><div class="lv-module-actions"><button onclick="go('trips')">打开行程</button></div></article><article class="lv-module-card lv-traffic-card"><div class="city">导航</div><h3>📍 地图搜索</h3><p>输入目的地后直接打开高德地图搜索。</p><div class="lv-module-actions"><button onclick="promptNav()">搜索地点</button></div></article><article class="lv-module-card lv-traffic-card"><div class="city">行程交通</div><h3>🧭 日程内导航</h3><p>每条详细日程都支持“导航”和“复制地址”。</p><div class="lv-module-actions"><button onclick="go('trips')">去我的行程</button></div></article></div>`;
  }
  window.promptNav=()=>{const q=prompt('输入要搜索的地点');if(q)nav(q)};

  function renderHotels(){
    style();const root=shell('hotels','酒店','跟随行程管理酒店地址与导航');if(!root)return;const hotels=Array.isArray(data().hotels)?data().hotels:[];const t=window.db?.trips?.find(x=>x.id===window.activeTrip)||window.db?.trips?.[0];if(hotels.length){$('#hotelsBody').innerHTML=`<div class="lv-module-grid">${hotels.map(x=>`<article class="lv-module-card"><div class="city">${esc(x.city||'')}</div><h3>${esc(x.name||'酒店')}</h3><p>📍 ${esc(x.address||'暂无地址')}</p><div class="lv-module-actions"><button onclick="window.open('https://uri.amap.com/search?keyword='+encodeURIComponent('${esc(x.name||'')} ${esc(x.address||'')}'),'_blank')">导航</button></div></article>`).join('')}</div>`}else{$('#hotelsBody').innerHTML=`<div class="lv-module-empty">当前全国数据库暂未填充酒店库。<div class="lv-hotel-note">你的酒店可以先跟随具体行程保存；后续接入酒店数据后，这里会按城市展示酒店、地址和导航。</div>${t?`<div class="lv-module-actions" style="justify-content:center"><button onclick="go('trips')">去我的行程</button></div>`:''}</div>`}
  }

  function install(){
    style();
    const oldGo=window.go;
    window.go=function(page){
      document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id===page));
      document.querySelectorAll('.bottom button').forEach(x=>x.classList.toggle('on',x.dataset.page===page));
      try{
        if(page==='home')window.renderHome?.();
        else if(page==='trips')window.renderTrips?.();
        else if(page==='spots')renderCatalog('spots');
        else if(page==='food')renderCatalog('food');
        else if(page==='traffic')renderTraffic();
        else if(page==='hotels')renderHotels();
      }catch(e){console.error('[module-render-fix]',e)}
    };
    window.__lvModuleRender={renderCatalog,renderTraffic,renderHotels};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
