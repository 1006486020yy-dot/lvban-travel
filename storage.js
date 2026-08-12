/* 旅伴旅行管家 · 单一数据层 */
(function(){
  const KEY='lvban_pro_store_v1';
  const defaults={trips:[],favorites:{spots:[],foods:[],hotels:[],other:[]},settings:{},aiMemory:[],tools:{}};
  const load=()=>{try{return Object.assign({},defaults,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){return JSON.parse(JSON.stringify(defaults))}};
  const saveStore=s=>{localStorage.setItem(KEY,JSON.stringify(s));return s};
  const uid=()=>('lv-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8));
  window.uid=window.uid||uid;
  function guessCity(a){a=String(a||'');if(/福州/.test(a))return '福州';if(/平潭/.test(a))return '平潭';if(/泉州|石狮/.test(a))return '泉州';return '厦门'}
  function guessType(n){n=String(n||'');return /酒店/.test(n)?'酒店':/D\d+|C\d+|高铁|动车|前往|机场|车站/.test(n)?'交通':/店|餐|美食|粥|面|牛排|肉粽|沙茶|五香|花生汤|麻糍/.test(n)?'美食':'景点'}
  function dayMap(arr){return (arr||[]).map((d,i)=>({id:uid(),label:'DAY '+(i+1),date:d.date,title:d.title||'待安排',items:(d.items||[]).map(x=>({id:uid(),time:x[0]||'09:00',name:x[1]||'',address:x[2]||'',city:guessCity(x[2]||''),type:guessType(x[1]||''),budget:0,note:x[3]||''}))}))}
  function makeMainTrip(){const s=window.schedules||{};return{id:'trip-main',name:'十一福建游',city:'福州 · 平潭 · 泉州 · 厦门',start:'2026-09-28',end:'2026-10-04',people:1,hasAlternateRoutes:true,plans:[{id:'A',name:'方案 A',days:dayMap(s.A||[])},{id:'B',name:'方案 B',days:dayMap(s.B||[])}]}}
  let store=load();if(!Array.isArray(store.trips)||!store.trips.length){store.trips=[makeMainTrip()];saveStore(store)}
  window.LvbanStore={key:KEY,load,save:saveStore,get:load,patch(fn){const s=load();fn(s);return saveStore(s)},export(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(load(),null,2)],{type:'application/json'}));a.download='lvban-backup-'+Date.now()+'.json';a.click()},fav(type,id){return this.patch(s=>{s.favorites[type] ||= [];const a=s.favorites[type],i=a.indexOf(id);i<0?a.push(id):a.splice(i,1)})},isFav(type,id){return !!load().favorites[type]?.includes(id)}};
  window.db={trips:store.trips,spots:(window.LVBAN_DATA?.spots||[]).map(x=>({...x})),foods:(window.LVBAN_DATA?.foods||[]).map(x=>({...x})),hotels:[],favorites:store.favorites||{spots:[],foods:[],hotels:[],other:[]}};
  window.activeTrip=window.db.trips[0]?.id||null;window.activePlan=window.db.trips[0]?.plans?.[0]?.id||'A';window.activeDay=0;
  window.save=()=>saveStore({...load(),trips:window.db.trips,favorites:window.db.favorites||load().favorites});
  window.currentTrip=()=>window.db.trips.find(x=>x.id===window.activeTrip)||window.db.trips[0];window.currentPlan=()=>{const t=window.currentTrip();return t?.plans?.find(x=>x.id===window.activePlan)||t?.plans?.[0]};
  window.selectTrip=id=>{window.activeTrip=id;const t=window.currentTrip();window.activePlan=t?.plans?.[0]?.id||'A';window.activeDay=0;window.renderTrips?.()};window.switchPlan=id=>{window.activePlan=id;window.activeDay=0;window.renderTripDetail?.()};
})();
