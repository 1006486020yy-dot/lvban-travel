/* 旅伴旅行管家 Pro · 全国旅游数据库
   53 城市 / 411 景点 / 277 美食 / 130 酒店
   本文件只负责景点、美食、酒店数据与对应展示，不修改行程 / AI / 交通核心逻辑。
*/
window.LVBAN_DATA=__FULL_DB_PAYLOAD_PLACEHOLDER__;
(function(){
 const D=window.LVBAN_DATA||{};
 const esc=s=>String(s??'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
 const addr=x=>x.地址||'';
 const city=x=>x.城市||'';
 const goNav=(name,address)=>{ const q=encodeURIComponent((name||'')+' '+(address||'')); window.open('https://www.amap.com/search?query='+q,'_blank'); };
 const copy=async v=>{ try{await navigator.clipboard.writeText(v||'');toast('地址已复制');} catch(e){const ta=document.createElement('textarea');ta.value=v||'';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();toast('地址已复制');} };
 const add=(name,address)=>{ if(typeof addFromCatalog==='function'){addFromCatalog(name,address);return;} if(typeof toast==='function')toast('已加入行程：'+name); };
 const cities=()=>['全部',...new Set((D.cities||[]).map(x=>x.城市).filter(Boolean))];
 function chips(target,key){ const host=document.getElementById(target); if(!host)return; const active=window.__catalogState?.[key]||'全部'; host.innerHTML=cities().map(c=>`<button class="chip ${active===c?'on':''}" data-city="${esc(c)}">${c}</button>`).join(''); host.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{window.__catalogState=window.__catalogState||{};window.__catalogState[key]=b.dataset.city;renderAll();})); }
 function card(x,type){ let title='',meta='',extra=''; if(type==='spot'){title=x.景点名称||'';meta=`${city(x)} · ${x.类型||'景点'}`;extra=`<div class="addr">📍 ${addr(x)}</div><div class="muted">${x.简介||''}</div><div class="muted" style="margin-top:5px">游玩 ${x.推荐游玩时间||'-'} · ${x.推荐季节||'-'} · 门票 ${x.门票||'-'} · ${x.开放时间||'-'}</div><div class="muted">${x.标签||''}</div>`;} else if(type==='food'){title=x.店名||'';meta=`${city(x)} · ${x.类型||'美食'}`;extra=`<div class="addr">📍 ${addr(x)}</div><div class="muted">推荐菜：${x.推荐菜||'-'} · 人均：${x.人均||'-'}</div><div class="muted">${x.标签||''}</div>`;} else {title=x.酒店名称||'';meta=`${city(x)} · ${x.星级||'酒店'}`;extra=`<div class="addr">📍 ${addr(x)}</div><div class="muted">价格：${x.价格区间||'-'} · ${x.标签||''}</div>`;} const a=esc(addr(x)),n=esc(title); return `<article class="data card"><div class="city">${meta}</div><h3>${title}</h3>${extra}<div class="actions"><button class="btn" data-copy="${a}">复制地址</button><button class="btn" data-nav="${n}" data-address="${a}">导航</button><button class="btn primary" data-add="${n}" data-add-address="${a}">＋ 加入行程</button></div></article>`; }
 function bind(host){host.querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>copy(b.dataset.copy));host.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>goNav(b.dataset.nav,b.dataset.address));host.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>add(b.dataset.add,b.dataset.addAddress));}
 function render(type){const state=window.__catalogState=window.__catalogState||{spot:'全部',food:'全部',hotel:'全部'};const arr=type==='spot'?D.spots||[]:type==='food'?D.foods||[]:D.hotels||[];const cityVal=state[type]||'全部';const listId=type==='spot'?'spotList':type==='food'?'foodList':'hotelList';const cityId=type==='spot'?'spotCities':type==='food'?'foodCities':'hotelCities';chips(cityId,type);const host=document.getElementById(listId);if(!host)return;const filtered=arr.filter(x=>cityVal==='全部'||city(x)===cityVal);host.innerHTML=filtered.map(x=>card(x,type)).join('')||'<div class="empty">暂无该城市数据</div>';bind(host);}
 function renderAll(){render('spot');render('food');render('hotel');}
 window.renderSpots=()=>render('spot');window.renderFoods=()=>render('food');window.renderHotels=()=>render('hotel');
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(renderAll,0));else setTimeout(renderAll,0);
})();
