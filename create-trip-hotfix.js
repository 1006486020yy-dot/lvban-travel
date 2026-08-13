/* 旅伴旅行管家 · 新建行程点击热修复
   只修复“创建行程”按钮没有响应的问题，不改变行程/AI/景点/美食/酒店的数据结构。
*/
(function(){
  'use strict';
  function toast(msg){try{window.toast?.(msg)}catch(e){alert(msg)}}
  function value(id){const el=document.getElementById(id);return el?String(el.value||'').trim():''}
  function fallbackCreate(){
    const name=value('ntName');
    const start=value('ntStart');
    const end=value('ntEnd');
    const cities=Array.isArray(window._selectedCities)?window._selectedCities.filter(Boolean):[];
    if(!name)return toast('请填写行程名称');
    if(!cities.length)return toast('请先选择至少一个目的地');
    if(!start||!end)return toast('请选择开始和结束日期');
    if(end<start)return toast('结束日期不能早于开始日期');
    const uid=window.uid||(()=> 'lv-'+Date.now());
    const days=[];
    const d0=new Date(start+'T00:00:00'),d1=new Date(end+'T00:00:00');
    for(let d=new Date(d0),i=0;d<=d1&&i<31;d.setDate(d.getDate()+1),i++)days.push({id:uid(),label:'DAY '+i,date:d.toISOString().slice(0,10),title:'待安排',items:[]});
    const trip={id:uid(),name,city:cities.join(' · '),start,end,people:1,plans:[{id:'A',name:'方案 A',days:JSON.parse(JSON.stringify(days))},{id:'B',name:'方案 B',days:JSON.parse(JSON.stringify(days))}],cityDurations:[]};
    if(window.db?.trips)window.db.trips.push(trip);else return toast('行程数据尚未加载，请刷新后重试');
    window.activeTrip=trip.id;window.activePlan='A';window.activeDay=0;
    try{window.save?.()}catch(e){}
    try{window.closeModal?.()}catch(e){document.getElementById('modal')?.classList.remove('show')}
    try{window.go?.('trips')}catch(e){}
    try{window.renderTrips?.()}catch(e){}
    toast('行程创建成功');
    setTimeout(function(){
      if(cities.length>1&&typeof window.__lvOpenDurationPicker==='function')window.__lvOpenDurationPicker(trip,cities);
      else if(window._createMode==='ai')window.go?.('ai');
    },80);
  }
  function handle(e){
    const b=e.target?.closest?.('#lvCreateSubmit');
    if(!b)return;
    e.preventDefault();e.stopPropagation();
    b.disabled=false;b.style.pointerEvents='auto';
    try{
      if(typeof window.createTripFromForm==='function'){
        window.createTripFromForm();
      }else fallbackCreate();
    }catch(err){
      console.error('createTripFromForm failed:',err);
      fallbackCreate();
    }
  }
  function install(){
    document.addEventListener('click',handle,true);
    const style=document.createElement('style');
    style.textContent='#lvCreateSubmit{pointer-events:auto!important;position:relative!important;z-index:10001!important;cursor:pointer!important;touch-action:manipulation!important}';
    document.head.appendChild(style);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
