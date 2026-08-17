/* 旅伴旅行管家｜城市下日期完整修补
   目标：不改 UI，只补齐“大行程 → 城市 → 日期 → 行程节点”的城市归属。
   福州：9/28、9/29
   平潭：9/29、9/30、10/1
   厦门：10/1、10/2、10/3、10/4
*/
(function(){
  'use strict';
  const TRIP_NAMES=['旅伴旅行管家｜十一福建游','十一福建游'];
  const VERSION='fj-city-date-complete-v1';
  const db=()=>window.db;
  const save=()=>window.save?.();

  function run(){
    const store=db();
    const trips=Array.isArray(store?.trips)?store.trips:[];
    const trip=trips.find(t=>TRIP_NAMES.includes(String(t?.name||''))||String(t?.name||'').includes('十一福建游'));
    const plan=trip?.plans?.find(p=>p.id==='A')||trip?.plans?.[0];
    if(!trip||!plan||!Array.isArray(plan.days))return false;
    let changed=false;

    const setDay=(date,cities,assign)=>{
      const d=plan.days.find(x=>String(x?.date||'').slice(0,10)===date);
      if(!d)return;
      if(JSON.stringify(d.cities||[])!==JSON.stringify(cities)){d.cities=cities;changed=true;}
      if(assign){
        (d.items||[]).forEach((item,index)=>{
          const city=assign(item,index);
          if(city && item.city!==city){item.city=city;changed=true;}
        });
      }
      if(d._cityDateFixVersion!==VERSION){d._cityDateFixVersion=VERSION;changed=true;}
    };

    // 9/29 上午仍在福州，午后进入平潭。
    setDay('2026-09-29',['福州','平潭'],(item,index)=>{
      const n=String(item?.name||'');
      if(/三坊七巷|老福洲|福州站|福州 → 平潭|福州.*平潭/.test(n))return '福州';
      if(/维也纳酒店.*平潭|猴研岛|岐沙澳|田美澳|坛南湾|月海湾|十三妹|毛记潮汕|平潭/.test(n))return '平潭';
      return index<3?'福州':'平潭';
    });

    // 9/28 全部属于福州。
    setDay('2026-09-28',['福州'],()=> '福州');
    // 9/30 全部属于平潭。
    setDay('2026-09-30',['平潭'],()=> '平潭');
    // 10/1 已经是同一个 DAY 4，但上午平潭、下午厦门。
    setDay('2026-10-01',['平潭','厦门'],(item,index)=>{
      const n=String(item?.name||'');
      if(/龙王头|平潭站|平潭.*厦门/.test(n))return '平潭';
      if(/希岸酒店.*厦门|胡里山|白城沙滩|演武大桥|沙坡尾|厦门岛内/.test(n))return '厦门';
      return index<2?'平潭':'厦门';
    });
    // 10/2-10/4 全部属于厦门。
    ['2026-10-02','2026-10-03','2026-10-04'].forEach(date=>setDay(date,['厦门'],()=> '厦门'));

    if(changed){
      save();
      window._lv2City=null;
      window._lv2Day=0;
      window.dispatchEvent(new CustomEvent('lvban-city-date-complete-fixed',{detail:{tripId:trip.id}}));
      setTimeout(()=>window._lvbanTripCanvasV2?.(),80);
    }
    return true;
  }

  let tries=0;
  const timer=setInterval(()=>{tries++;if(run()||tries>50)clearInterval(timer)},250);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,120),{once:true});
  else setTimeout(run,120);
})();
