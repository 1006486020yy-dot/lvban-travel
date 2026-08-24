(function(){
 const KEY='lvban_pro_store_v1'; const DELETED_KEY='lvban_deleted_trips_v1';
 const defaults={trips:[],favorites:{spots:[],foods:[],hotels:[],other:[]},settings:{},aiMemory:[],tools:{}};
 function load(){try{return Object.assign({},defaults,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){return JSON.parse(JSON.stringify(defaults));}}
 function deleted(){try{return JSON.parse(localStorage.getItem(DELETED_KEY)||'[]');}catch(e){return []}}
 function saveStore(s){localStorage.setItem(KEY,JSON.stringify(s));return s;}
 window.LvbanStore={key:KEY,load,save:saveStore,get(){return load()},patch(fn){const s=load();fn(s);return saveStore(s)},export(){const blob=new Blob([JSON.stringify(load(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='lvban-backup-'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)},importFile(file,done){const r=new FileReader();r.onload=()=>{try{saveStore(JSON.parse(r.result));done&&done(true)}catch(e){done&&done(false)}};r.readAsText(file)},fav(type,id){return this.patch(s=>{s.favorites[type] ||= [];const a=s.favorites[type],i=a.indexOf(id);i<0?a.push(id):a.splice(i,1)})},isFav(type,id){return load().favorites[type]?.includes(id)}};
 const uid=()=>('lv-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7)); window.uid=uid;
 function dayMap(arr){return (arr||[]).map((d,i)=>({id:uid(),label:'DAY '+i,date:d.date,title:d.title,city:d.city,items:(d.items||[]).map(x=>({id:uid(),time:x[0]||'09:00',name:x[1]||'',address:x[2]||'',city:guessCity(x[2]||'',d.city),type:guessType(x[1]||''),budget:0,note:x[3]||''}))}));}
 function guessCity(a,fallback=''){if(/福州/.test(a))return '福州';if(/平潭/.test(a))return '平潭';if(/泉州|石狮/.test(a))return '泉州';return fallback||'厦门';}
 function guessType(n){return /酒店/.test(n)?'酒店':/D\d+|C\d+|高铁|动车|前往|机场|车站/.test(n)?'交通':/店|餐|美食|粥|面|牛排|肉粽|沙茶|五香|花生汤|麻糍/.test(n)?'美食':'景点';}
 function makeMainTrip(){const schedules=window.schedules||{};return {id:'trip-main',name:'旅伴旅行管家｜十一福建游',city:'福州 · 平潭 · 厦门',start:'2026-09-28',end:'2026-10-04',people:1,plans:[{id:'A',name:'方案 A',days:dayMap(schedules.A||[])},{id:'B',name:'方案 B',days:dayMap(schedules.B||[])}]};}
 const existing=load(),removed=deleted(); let trips=Array.isArray(existing.trips)?existing.trips.filter(t=>!removed.includes(t.id)):[];
 if(!trips.length&&!removed.includes('trip-main'))trips=[makeMainTrip()];
 window.db={trips,spots:(window.LVBAN_DATA?.spots||[]).map(x=>({...x})),foods:(window.LVBAN_DATA?.foods||[]).map(x=>({...x})),hotels:[],favorites:existing.favorites||{spots:[],foods:[],hotels:[],other:[]}};
 window.activeTrip=window.db.trips[0]?.id||null;window.activePlan=window.db.trips[0]?.plans?.[0]?.id||'A';window.activeDay=0;
 window.save=function(){saveStore({...load(),trips:window.db.trips,favorites:window.db.favorites||load().favorites});};
 window.markTripDeleted=function(id){if(!id)return;const a=deleted();if(!a.includes(id))a.push(id);localStorage.setItem(DELETED_KEY,JSON.stringify(a));};
 window.currentTrip=()=>window.db.trips.find(x=>x.id===window.activeTrip)||window.db.trips[0];
 window.currentPlan=()=>{const t=window.currentTrip();return t?.plans?.find(x=>x.id===window.activePlan)||t?.plans?.[0];};
 window.selectTrip=function(id){window.activeTrip=id;const t=window.currentTrip();window.activePlan=t?.plans?.[0]?.id||'A';window.activeDay=0;window.renderTrips?.();};
 window.switchPlan=function(id){window.activePlan=id;window.activeDay=0;window.__lvbanRenderTripDetail?.()||window.renderTripDetail?.();};
 
 // 新建行程唯一入口：禁止旧 create-trip-fix.js 再覆盖 newTrip。
 function activateNewTripV2(){
   if(window.__lvbanNewTripV2 && typeof window.newTrip==='function'){
     window.openNewTrip=window.newTrip;
     return;
   }
   const id='lv-storage-new-trip-v2';
   let s=document.getElementById(id);
   if(s){
     if(window.__lvbanNewTripV2){window.openNewTrip=window.newTrip;return;}
     s.addEventListener('load',()=>{window.openNewTrip=window.newTrip;});
     return;
   }
   s=document.createElement('script');
   s.id=id;
   s.src='new-trip-form-v2.js?v=20260824-final-2';
   s.onload=()=>{if(typeof window.newTrip==='function')window.openNewTrip=window.newTrip;};
   s.onerror=()=>{};
   document.head.appendChild(s);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{setTimeout(activateNewTripV2,0);setTimeout(activateNewTripV2,300);});
 else {setTimeout(activateNewTripV2,0);setTimeout(activateNewTripV2,300);}
})();