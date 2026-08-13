/* 旅伴旅行管家 · 首页出发倒计时
   只负责首页倒计时，不修改行程、AI、景点、美食、酒店逻辑。
*/
(function(){
  'use strict';
  function parseDate(v){
    if(!v)return null;
    const d=new Date(String(v).slice(0,10)+'T00:00:00');
    return Number.isNaN(d.getTime())?null:d;
  }
  function today(){const d=new Date();d.setHours(0,0,0,0);return d;}
  function trips(){
    try{
      const list=window.db&&Array.isArray(window.db.trips)?window.db.trips:[];
      return list.filter(t=>parseDate(t&&t.start));
    }catch(e){return []}
  }
  function pick(){
    const now=today(), list=trips().map(t=>({t,start:parseDate(t.start),end:parseDate(t.end||t.start)})).sort((a,b)=>a.start-b.start);
    if(!list.length)return null;
    return list.find(x=>x.start<=now&&x.end&&now<=x.end)||list.find(x=>x.start>=now)||list[list.length-1];
  }
  function render(){
    const hero=document.querySelector('#home .hero');
    if(!hero)return;
    let box=document.getElementById('lv-home-countdown');
    if(!box){
      box=document.createElement('div');
      box.id='lv-home-countdown';
      box.style='margin-top:16px;padding:15px 16px;border-radius:20px;background:#ffffff22;border:1px solid #ffffff45;color:#fff;';
      hero.appendChild(box);
    }
    const item=pick();
    if(!item){box.innerHTML='<strong style="display:block;font-size:25px">暂无旅行计划</strong><small style="display:block;margin-top:5px;opacity:.9">创建行程后，这里会自动显示距离出发还有几天</small>';return;}
    const now=today(),s=item.start,e=item.end,name=String(item.t.name||'我的旅行');
    if(s<=now&&e&&now<=e){
      box.innerHTML='<strong style="display:block;font-size:25px">旅行进行中</strong><small style="display:block;margin-top:5px;opacity:.9">'+name+' · '+String(item.t.start)+' 至 '+String(item.t.end||item.t.start)+'</small>';
      return;
    }
    const days=Math.max(0,Math.ceil((s-now)/86400000));
    box.innerHTML='<strong style="display:block;font-size:34px;font-weight:900">'+days+' 天</strong><small style="display:block;margin-top:4px;opacity:.9">距离出发 · '+name+' · '+String(item.t.start)+'</small>';
  }
  window.LvbanCountdown={render};
  const boot=()=>{render();setInterval(render,60000);};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else setTimeout(boot,0);
})();
