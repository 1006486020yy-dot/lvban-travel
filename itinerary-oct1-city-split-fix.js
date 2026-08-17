/* 旅伴旅行管家｜10月1日跨城市同日修补 v3
   不改 UI / 分享层。
   10月1日保持一个 DAY 4，同时属于平潭和厦门；通过 day.cities + item.city 区分上午/下午节点。
*/
(function(){
  'use strict';
  const TRIP_NAMES=['旅伴旅行管家｜十一福建游','十一福建游'];
  const VERSION='fj-oct1-city-split-v3';
  const db=()=>window.db;
  const save=()=>window.save?.();
  const uid=()=>window.uid?.()||('lv-fj-'+Date.now()+'-'+Math.random().toString(36).slice(2));

  function run(){
    const store=db();
    const trips=Array.isArray(store?.trips)?store.trips:[];
    const trip=trips.find(t=>TRIP_NAMES.includes(String(t?.name||''))||String(t?.name||'').includes('十一福建游'));
    const plan=trip?.plans?.find(p=>p.id==='A')||trip?.plans?.[0];
    if(!trip||!plan||!Array.isArray(plan.days))return false;

    const oldDays=plan.days.filter(x=>String(x?.date||'').slice(0,10)==='2026-10-01');
    if(!oldDays.length)return false;
    const oldItems=[];oldDays.forEach(d=>(d.items||[]).forEach(x=>oldItems.push({...x})));

    const isPingtan=x=>{
      const name=String(x?.name||''),city=String(x?.city||'');
      return city==='平潭'||/龙王头海滨浴场|平潭站|高铁.*平潭.*厦门/.test(name);
    };
    let pItems=oldItems.filter(isPingtan),xItems=oldItems.filter(x=>!isPingtan(x));
    if(!pItems.length&&oldItems.length){pItems=oldItems.slice(0,2);xItems=oldItems.slice(2);}
    const unique=arr=>{const seen=new Set();return arr.filter(x=>{const key=String(x?.name||'')+'|'+String(x?.address||'');if(seen.has(key))return false;seen.add(key);return true;});};
    pItems=unique(pItems);xItems=unique(xItems);
    const setItems=(arr,city)=>arr.map((x,i)=>({...x,id:x.id||uid(),city,stop:i+1,stopLabel:`第 ${i+1} 站`}));
    pItems=setItems(pItems,'平潭');xItems=setItems(xItems,'厦门');

    const expectedItems=[...pItems,...xItems];
    const current=oldDays.length===1?oldDays[0]:null;
    const already=current&&current._citySplitVersion===VERSION&&current.city==='平潭'&&Array.isArray(current.cities)&&current.cities.length===2&&current.cities[0]==='平潭'&&current.cities[1]==='厦门'&&JSON.stringify((current.items||[]).map(x=>[x.name,x.city]))===JSON.stringify(expectedItems.map(x=>[x.name,x.city]));

    let changed=false;
    if(!already){
      const day4={day:4,label:'DAY 4',date:'2026-10-01',title:'平潭 → 厦门',city:'平潭',cityLabel:'平潭 → 厦门',cities:['平潭','厦门'],items:expectedItems,_citySplitVersion:VERSION};
      const firstIndex=plan.days.findIndex(x=>String(x?.date||'').slice(0,10)==='2026-10-01');
      plan.days=plan.days.filter(x=>String(x?.date||'').slice(0,10)!=='2026-10-01');
      plan.days.splice(Math.max(0,firstIndex),0,day4);
      changed=true;
    }

    const dayMap={'2026-09-28':1,'2026-09-29':2,'2026-09-30':3,'2026-10-01':4,'2026-10-02':5,'2026-10-03':6,'2026-10-04':7};
    plan.days.forEach(d=>{const n=dayMap[String(d?.date||'').slice(0,10)];if(!n)return;if(d.day!==n){d.day=n;changed=true;}if(d.label!=='DAY '+n){d.label='DAY '+n;changed=true;}});

    if(changed){save();window.activeTrip=trip.id;window.activePlan=plan.id||'A';window._lv2City=null;window._lv2Day=0;window.dispatchEvent(new CustomEvent('lvban-fujian-itinerary-fixed',{detail:{tripId:trip.id}}));setTimeout(()=>window._lvbanTripCanvasV2?.(),80);}
    return true;
  }

  let tries=0;const timer=setInterval(()=>{tries++;if(run()||tries>40)clearInterval(timer)},250);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,100),{once:true});else setTimeout(run,100);
  window.addEventListener('lvban-data-ready',run);
})();
