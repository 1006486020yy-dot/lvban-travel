/* 旅伴｜行程卡片城市标签最终修复
 * 只处理列表卡片左上角城市文字，来源永远是当前行程真实数据。
 */
(function(){'use strict';
const getDB=()=>typeof window.db==='function'?window.db():window.db;
const trips=()=>{const d=getDB();return Array.isArray(d?.trips)?d.trips:[]};
const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
function actualCities(t){
 const p=t?.plans?.find(x=>String(x.id)===String(t.activePlan))||t?.plans?.[0];
 const days=(p?.days?.length?p.days:t?.days)||[]; const out=[];
 days.forEach(d=>{let c=d?.city||d?.cityLabel||d?.location||'';String(c).split(/[·,、/|→＞>]+/).map(x=>x.trim()).filter(Boolean).forEach(x=>{if(!out.includes(x))out.push(x)})});
 if(!out.length&&Array.isArray(t?.cities))t.cities.forEach(c=>{c=String(c||'').trim();if(c&&!out.includes(c))out.push(c)});
 return out;
}
function render(){
 const list=trips(); if(!list.length)return;
 // 优先修带有 data-trip-dom 的卡片；兼容旧卡片结构则按卡片顺序处理。
 document.querySelectorAll('[data-trip-dom]').forEach(card=>{
   const id=card.getAttribute('data-trip-dom'),t=list.find(x=>String(x.id)===String(id));if(!t)return;
   const text=actualCities(t).join(' · ')||'待添加目的地';
   const el=card.querySelector('.city');if(el)el.textContent=text;
 });
 const cards=[...document.querySelectorAll('.ut-card,.trip-card,.trip-item,.trip-list-card')];
 cards.forEach((card,i)=>{if(card.querySelector('[data-delete-dom]')){const t=list.find(x=>String(x.id)===String(card.getAttribute('data-trip-dom'))) || list[i];const el=card.querySelector('.city,.trip-city,.cities,.destination');if(t&&el)el.textContent=actualCities(t).join(' · ')||'待添加目的地'}});
 // 对遗留硬编码文字做一次精确替换，仅在行程列表区域内，不碰其他页面。
 const root=document.querySelector('#tripList')||document.querySelector('#utGrid');if(!root)return;
 root.querySelectorAll('*').forEach(el=>{if(el.children.length===0&&/^(北京\s*[·•]\s*成都\s*[·•]\s*南京|北京\s*·\s*成都\s*·\s*南京)$/.test(el.textContent.trim())){const card=el.closest('[data-trip-dom],.ut-card,.trip-card,.trip-item,.trip-list-card');const t=card?(list.find(x=>String(x.id)===String(card.getAttribute('data-trip-dom')))||list[0]):list[0];el.textContent=actualCities(t).join(' · ')||'待添加目的地'}});
}
function boot(){setTimeout(render,50);setTimeout(render,300);setTimeout(render,900);setTimeout(render,1800)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.addEventListener('lvban-db-change',boot);window.addEventListener('lvban-demo-cleaned',boot);window.addEventListener('lvban-trip-updated',boot);
new MutationObserver(()=>{if(document.querySelector('#tripList,.ut-card,.trip-card'))render()}).observe(document.body,{childList:true,subtree:true});
})();
