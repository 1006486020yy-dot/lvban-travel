/* 旅伴 · 分享主人同步 V1
 * 记录分享ID，并把好友协作后的云端快照真正写回主人本地行程。
 */
(function(){
'use strict';
const API='/api/share', KEY='lvban_share_links_v1';
const getMap=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}};
const putMap=m=>{try{localStorage.setItem(KEY,JSON.stringify(m))}catch(e){}};
const trip=()=>window.db?.trips?.find(t=>String(t.id)===String(window.activeTrip))||window.db?.trips?.[0]||null;
const toast=m=>window.toast?.(m)||alert(m);
function remember(id,mode){const t=trip();if(!t||!id)return;const m=getMap();m[String(t.id)]={id,mode,updatedAt:Date.now()};putMap(m)}
function installFetchHook(){if(window.__lvbanShareFetchHook)return;window.__lvbanShareFetchHook=true;const raw=window.fetch;window.fetch=function(input,init){const url=typeof input==='string'?input:(input?.url||'');const method=(init?.method||input?.method||'GET').toUpperCase();return raw.apply(this,arguments).then(async res=>{try{if(method==='POST'&&url.includes('/api/share')){const clone=res.clone();const d=await clone.json();if(d?.ok&&d?.id)remember(d.id,JSON.parse(init?.body||'{}').mode||'view')}}catch(e){}return res})}}
async function sync(){const t=trip();if(!t)return toast('请先打开需要同步的行程');const rec=getMap()[String(t.id)];if(!rec?.id)return toast('这个行程还没有建立分享记录，请重新点一次“好友协作编辑”分享。');try{const r=await fetch(API+'?id='+encodeURIComponent(rec.id),{cache:'no-store'}),d=await r.json();if(!d.ok)throw Error(d.error||'获取分享失败');const cloud=d.record?.snapshot;if(!cloud)throw Error('分享数据为空');const idx=(window.db.trips||[]).findIndex(x=>String(x.id)===String(t.id));if(idx<0)throw Error('找不到本地行程');const old=window.db.trips[idx];window.db.trips[idx]=cloud;window.activeTrip=cloud.id;window.activePlan=cloud.plans?.[0]?.id||window.activePlan||'A';window.activeDay=0;window.save?.();window.__lvbanOpenTripDetail?.(cloud.id);window.dispatchEvent(new CustomEvent('lvban-trip-updated',{detail:{trip:cloud}}));toast('已同步好友最新修改');renderButtons()}catch(e){console.error(e);toast(e.message||'同步失败')}}
function renderButtons(){const host=document.querySelector('#tripDetail')||document.querySelector('#utDetail');if(!host)return;if(host.querySelector('#lvOwnerSync'))return;const b=document.createElement('button');b.id='lvOwnerSync';b.className='btn';b.type='button';b.textContent='↻ 同步好友修改';b.style.cssText='margin:8px 0;padding:10px 14px;border-radius:13px;background:#efedff;color:#5d4de5;font-weight:800';b.onclick=sync;const title=host.querySelector('.title')||host.firstElementChild;if(title)title.appendChild(b);else host.prepend(b)}
function boot(){installFetchHook();setTimeout(renderButtons,250);setTimeout(renderButtons,800);setTimeout(renderButtons,1600)}
document.addEventListener('click',e=>{const b=e.target?.closest?.('[data-sync-share],#lvOwnerSync');if(!b)return;e.preventDefault();e.stopPropagation();sync()},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
new MutationObserver(()=>renderButtons()).observe(document.body,{childList:true,subtree:true});
window.__lvbanSyncShare=sync;
})();
