/* 旅伴旅行管家｜10月1日跨城市同日修补 v2
   不改 UI / 分享层。
   业务结构：大行程 → 城市 → 日期 → 行程节点。
   10月1日必须是同一个 DAY 4：
   - 平潭城市：DAY 4，只显示上午节点
   - 厦门城市：DAY 4，只显示下午节点
   10月2～10月4继续为 DAY 5～DAY 7。
*/
(function(){
  'use strict';
  const TRIP_NAMES=['旅伴旅行管家｜十一福建游','十一福建游'];
  const VERSION='fj-oct1-city-split-v2';
  const db=()=>window.db;
  const save=()=>window.save?.();
  const uid=()=>window.uid?.()||('lv-fj-'+Date.now()+'-'+Math.random().toString(36).slice(2));

  function run(){
    const d=db();
    const trips=Array.isArray(d?.trips)?d.trips:[];
    const trip=trips.find(t=>TRIP_NAMES.includes(String(t?.name||''))||String(t?.name||'').includes('十一福建游'));
    const plans=trip?.plans;
    const plan=plans?.find(p=>p.id==='A')||plans?.[0];
    if(!trip||!plan||!Array.isArray(plan.days))return false;

    const oct1=plan.days.find(x=>String(x?.date||'').slice(0,10)==='2026-10-01');
    if(!oct1)return false;

    // 兼容旧修补产生的“两条 10/01 DAY 4”：先合并回一个真实的 DAY 4。
    const oldOct1=plan.days.filter(x=>String(x?.date||'').slice(0,10)==='2026-10-01');
    let allItems=[];
    oldOct1.forEach(day=>(day.items||[]).forEach(x=>allItems.push({...x})));

    const isPingtan=x=>{
      const name=String(x?.name||'');
      const city=String(x?.city||'');
      return city==='平潭'||/龙王头海滨浴场|平潭站|高铁.*平潭.*厦门/.test(name);
    };
    let pingtanItems=allItems.filter(isPingtan);
    let xiamenItems=allItems.filter(x=>!isPingtan(x));

    // 如果旧数据只有一条 DAY 4 且没有 city 字段，则按业务顺序拆分。
    if(!pingtanItems.length&&allItems.length){
      pingtanItems=allItems.slice(0,2);
      xiamenItems=allItems.slice(2);
    }

    // 防止旧数据中已经有两个相同节点导致重复。
    const unique=arr=>{
      const seen=new Set();
      return arr.filter(x=>{
        const key=String(x?.name||'')+'|'+String(x?.address||'');
        if(seen.has(key))return false;
        seen.add(key);return true;
      });
    };
    pingtanItems=unique(pingtanItems);
    xiamenItems=unique(xiamenItems);

    const setItems=(items,city)=>items.map((x,i)=>({...x,id:x.id||uid(),city,stop:i+1,stopLabel:`第 ${i+1} 站`}));
    const pItems=setItems(pingtanItems,'平潭');
    const xItems=setItems(xiamenItems,'厦门');

    let changed=false;
    const day4={
      day:4,
      label:'DAY 4',
      date:'2026-10-01',
      title:'平潭 → 厦门',
      city:'平潭',
      cityLabel:'平潭 → 厦门',
      cities:['平潭','厦门'],
      items:[...pItems,...xItems],
      _citySplitVersion:VERSION
    };

    const oldSignature=JSON.stringify(oldOct1.map(x=>({city:x.city,title:x.title,items:(x.items||[]).map(y=>[y.name,y.city])})));
    const newSignature=JSON.stringify({city:day4.city,cities:day4.cities,items:day4.items.map(x=>[x.name,x.city])});
    if(oldOct1.length!==1||oldSignature!==newSignature||oct1._citySplitVersion!==VERSION){
      const firstIndex=plan.days.findIndex(x=>String(x?.date||'').slice(0,10)==='2026-10-01');
      plan.days=plan.days.filter(x=>String(x?.date||'').slice(0,10)!=='2026-10-01');
      plan.days.splice(Math.max(0,firstIndex),0,day4);
      changed=true;
    }

    const dayMap={
      '2026-09-28':1,'2026-09-29':2,'2026-09-30':3,
      '2026-10-01':4,'2026-10-02':5,'2026-10-03':6,'2026-10-04':7
    };
    plan.days.forEach(day=>{
      const n=dayMap[String(day?.date||'').slice(0,10)];
      if(!n)return;
      if(day.day!==n){day.day=n;changed=true;}
      const label='DAY '+n;
      if(day.label!==label){day.label=label;changed=true;}
    });

    if(changed){
      save();
      window.activeTrip=trip.id;
      window.activePlan=plan.id||'A';
      window._lv2City=null;
      window._lv2Day=0;
      window.dispatchEvent(new CustomEvent('lvban-fujian-itinerary-fixed',{detail:{tripId:trip.id}}));
      setTimeout(()=>window._lvbanTripCanvasV2?.(),80);
    }
    return true;
  }

  let tries=0;
  const timer=setInterval(()=>{tries++;if(run()||tries>40)clearInterval(timer)},250);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,100),{once:true});
  else setTimeout(run,100);
  window.addEventListener('lvban-data-ready',run);
})();
