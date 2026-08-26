/* 旅伴 · 分享主人同步 V2
 * 好友协作后的云端快照 -> 主人本地行程，按 trip / plan / day 合并，避免覆盖或丢失原有节点。
 */
(function(){
'use strict';
const API='/api/share',KEY='lvban_share_links_v2';
const getMap=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}};
const putMap=m=>{try{localStorage.setItem(KEY,JSON.stringify(m))}catch(e){}};
const trips=()=>window.db?.trips||[];
const trip=()=>trips().find(t=>String(t.id)===String(window.activeTrip))||trips()[0]||null;
const toast=m=>window.toast?.(m)||alert(m);
function remember(id,mode,ownerTripId){const t=trips().find(x=>String(x.id)===String(ownerTripId))||trip();if(!t||!id)return;const m=getMap();m[String(t.id)]={id,mode,ownerTripId:t.id,updatedAt:Date.now()};putMap(m)}
function installFetchHook(){if(window.__lvbanShareFetchHookV2)return;window.__lvbanShareFetchHookV2=true;const raw=window.fetch;window.fetch=function(input,init){const url=typeof input==='string'?input:(input?.url||'');const method=(init?.method||input?.method||'GET').toUpperCase();return raw.apply(this,arguments).then(async res=>{try{if(method==='POST'&&url.includes('/api/share')){const body=JSON.parse(init?.body||'{}');const clone=res.clone(),d=await clone.json();if(d?.ok&&d?.id)remember(d.id,body.mode||'view',body.ownerTripId)}}catch(e){}return res})}}
function clone(v){return JSON.parse(JSON.stringify(v))}
function itemKey(x){if(!x)return '';return String(x.id||x.nodeId||x.eventId||`${x.date||''}|${x.time||''}|${x.type||''}|${x.name||''}`)}
function mergeDay(localDay,cloudDay){const base=clone(localDay||{}),ci=Array.isArray(cloudDay?.items)?cloudDay.items:[];const li=Array.isArray(base.items)?base.items:[];const byKey=new Map(li.map(x=>[itemKey(x),x]));ci.forEach(x=>{const k=itemKey(x);if(byKey.has(k))Object.assign(byKey.get(k),clone(x));else li.push(clone(x))});base.items=li;Object.keys(cloudDay||{}).forEach(k=>{if(k!=='items')base[k]=clone(cloudDay[k])});return base}
function mergeTrip(local,cloud){const out=clone(local);if(!cloud)return out;if(Array.isArray(cloud.plans)&&Array.isArray(out.plans)){
  cloud.plans.forEach(cp=>{let lp=out.plans.find(x=>String(x.id)===String(cp.id));if(!lp){out.plans.push(clone(cp));return}if(Array.isArray(cp.days)){lp.days=cp.days.map((cd,i)=>mergeDay(lp.days?.[i]||{},cd))}}
  );
  Object.keys(cloud).forEach(k=>{if(k!=='plans')out[k]=clone(cloud[k])});
}else if(Array.isArray(cloud.days)&&Array.isArray(out.days)){out.days=cloud.days.map((cd,i)=>mergeDay(out.days?.[i]||{},cd));Object.keys(cloud).forEach(k=>{if(k!=='days')out[k]=clone(cloud[k])})}
else return clone(cloud);
out.id=local.id;return out}
async function sync(){const current=trip();if(!current)return toast('请先打开需要同步的行程');const rec=getMap()[String(current.id)]||Object.values(getMap()).find(x=>String(x.ownerTripId)===String(current.id));if(!rec?.id)return toast('这个行程还没有建立分享记录，请重新点一次“好友协作编辑”分享。');try{const r=await fetch(API+'?id='+encodeURIComponent(rec.id),{cache:'no-store'}),d=await r.json();if(!d.ok)throw Error(d.error||'获取分享失败');const cloud=d.record?.snapshot;if(!cloud)throw Error('分享数据为空');const idx=trips().findIndex(x=>String(x.id)===String(current.id));if(idx<0)throw Error('找不到本地行程');const merged=mergeTrip(current,cloud);window.db.trips[idx]=merged;window.activeTrip=merged.id;window.activePlan=merged.plans?.find(x=>String(x.id)===String(d.record?.activePlan))?.id||merged.plans?.[0]?.id||window.activePlan||'A';window.activeDay=0;window.save?.();window.__lvbanOpenTripDetail?.(merged.id);window.dispatchEvent(new CustomEvent('lvban-trip-updated',{detail:{trip:merged,source:'share-sync'}}));toast('已同步好友最新修改');renderButtons()}catch(e){console.error('[旅伴同步]',e);toast(e.message||'同步失败')}}
function renderButtons(){const host=document.querySelector('#tripDetail')||document.querySelector('#utDetail');if(!host)return;if(host.querySelector('#lvOwnerSync'))return;const b=document.createElement('button');b.id='lvOwnerSync';b.className='btn';b.type='button';b.textContent='↻ 同步好友修改';b.style.cssText='margin:8px 0;padding:10px 14px;border-radius:13px;background:#efedff;color:#5d4de5;font-weight:800';b.onclick=sync;const title=host.querySelector('.title')||host.firstElementChild;if(title)title.appendChild(b);else host.prepend(b)}
function boot(){installFetchHook();setTimeout(renderButtons,250);setTimeout(renderButtons,800);setTimeout(renderButtons,1600)}
document.addEventListener('click',e=>{const b=e.target?.closest?.('[data-sync-share],#lvOwnerSync');if(!b)return;e.preventDefault();e.stopPropagation();sync()},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
new MutationObserver(()=>renderButtons()).observe(document.body,{childList:true,subtree:true});
window.__lvbanSyncShare=sync;
})();