/* 旅伴旅行管家｜10月1日跨城同日修补
   不改 UI / 分享。
   2026-10-01 = 同一个 DAY 4：平潭 DAY 4 上午 + 厦门 DAY 4 下午。
   后续日期顺延：10/02 DAY 5、10/03 DAY 6、10/04 DAY 7。
*/
(function(){
  'use strict';
  const TRIP_NAME='旅伴旅行管家｜十一福建游';
  const getTrips=()=>Array.isArray(window.db?.trips)?window.db.trips:[];
  const persist=()=>{
    try{window.dispatchEvent(new CustomEvent('lvban-db-change'));}catch(e){}
    try{window.save?.();}catch(e){}
  };

  function normalizeDayNumbers(plan){
    if(!Array.isArray(plan?.days))return false;
    let changed=false;
    const dayByDate={
      '2026-09-28':1,
      '2026-09-29':2,
      '2026-09-30':3,
      '2026-10-01':4,
      '2026-10-02':5,
      '2026-10-03':6,
      '2026-10-04':7
    };
    plan.days.forEach(d=>{
      const date=String(d?.date||'');
      const n=dayByDate[date];
      if(!n)return;
      if(Number(d.day)!==n){d.day=n;changed=true;}

      if(date==='2026-10-01'){
        const city=String(d?.city||'');
        const title=city==='平潭'?'DAY 4 上午':city==='厦门'?'DAY 4 下午':'DAY 4';
        if(d.title!==title){d.title=title;changed=true;}
        if(d.label!==title){d.label=title;changed=true;}
      }else{
        const title=`DAY ${n}`;
        if(String(d.title||'').match(/^DAY\s+\d+/) && d.title!==title){d.title=title;changed=true;}
        if(String(d.label||'').match(/^DAY\s+\d+/) && d.label!==title){d.label=title;changed=true;}
      }
    });
    return changed;
  }

  function run(){
    const trip=getTrips().find(t=>String(t?.name||'').trim()===TRIP_NAME);
    const plan=trip?.plans?.[0];
    if(!trip||!plan||!Array.isArray(plan.days))return false;

    const oct1=plan.days.filter(d=>String(d?.date)==='2026-10-01');
    if(!oct1.length)return false;

    const all=[];
    oct1.forEach(d=>(Array.isArray(d.items)?d.items:[]).forEach(x=>all.push({...x})));
    const isPingtan=x=>{
      const n=String(x?.name||'');
      const c=String(x?.city||'');
      return c==='平潭'||/龙王头海滨浴场|高铁｜平潭 → 厦门|高铁.*平潭.*厦门|平潭站/.test(n);
    };
    const pItems=all.filter(isPingtan);
    const xItems=all.filter(x=>!isPingtan(x));
    if(!pItems.some(x=>String(x?.name||'').includes('龙王头海滨浴场')))return false;
    if(!xItems.some(x=>String(x?.name||'').includes('胡里山炮台')))return false;

    let changed=false;
    const already=oct1.length===2 &&
      oct1.some(d=>String(d.city)==='平潭'&&String(d.title)==='DAY 4 上午'&&d.items?.some(x=>String(x.name||'').includes('龙王头海滨浴场'))) &&
      oct1.some(d=>String(d.city)==='厦门'&&String(d.title)==='DAY 4 下午'&&d.items?.some(x=>String(x.name||'').includes('胡里山炮台')));

    if(!already){
      const makeDay=(city,title,items)=>({
        day:4,
        date:'2026-10-01',
        city,
        cityLabel:city,
        title,
        label:title,
        items:items.map((x,i)=>({...x,city,stop:i+1,stopLabel:`第 ${i+1} 站`}))
      });
      const pDay=makeDay('平潭','DAY 4 上午',pItems);
      const xDay=makeDay('厦门','DAY 4 下午',xItems);
      const firstOct1=plan.days.findIndex(d=>String(d?.date)==='2026-10-01');
      plan.days=plan.days.filter(d=>String(d?.date)!=='2026-10-01');
      plan.days.splice(Math.max(0,firstOct1),0,pDay,xDay);
      changed=true;
    }

    // 关键修补：同一个 10/01 占用 DAY 4 后，10/02～10/04 必须顺延为 DAY 5～DAY 7。
    if(normalizeDayNumbers(plan))changed=true;

    if(changed){
      persist();
      window._lv2Day=0;
      setTimeout(()=>{window._lvbanTripCanvasV2?.();window.renderTripDetail?.();},80);
    }
    return true;
  }

  let n=0;
  const timer=setInterval(()=>{n++;if(run()||n>40)clearInterval(timer)},300);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,100),{once:true});
  else setTimeout(run,100);
  window.addEventListener('lvban-data-ready',run);
})();
