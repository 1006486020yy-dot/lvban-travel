/* 旅伴旅行管家 Pro · 行程增强 */
(function(){
  'use strict';

  function migrate(){
    try{
      var a=JSON.parse(localStorage.getItem('lvban-trips')||'[]');
      if(!Array.isArray(a))return;
      var changed=false;
      function d(v){if(!v)return null;var x=new Date(String(v).slice(0,10)+'T00:00:00');return isNaN(x)?null:x;}
      a.forEach(function(t){
        if(typeof t.hasBackup!=='boolean'){t.hasBackup=false;changed=true;}
        if(!Array.isArray(t.schedulesA)){
          var s=d(t.start),e=d(t.end),days=[];
          if(s&&e&&e>=s){for(var x=new Date(s);x<=e;x.setDate(x.getDate()+1))days.push({date:x.toISOString().slice(0,10),title:'待安排',items:[]});}
          t.schedulesA=days;changed=true;
        }
        if(!t.hasBackup)t.schedulesB=null;
      });
      if(changed)localStorage.setItem('lvban-trips',JSON.stringify(a));
    }catch(e){}
  }

  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

  function buildSource(){
    var out=[];
    var d=window.LVBAN_DATA||{};
    if(Array.isArray(d.spots))d.spots.forEach(function(x){
      if(x&&x.name)out.push({type:'景点',city:x.city||'',name:x.name,address:x.address||'',note:x.highlight||''});
    });
    if(Array.isArray(d.foods))d.foods.forEach(function(x){
      if(x&&x.name)out.push({type:'美食',city:x.city||'',name:x.name,address:x.address||'',note:x.highlight||''});
    });
    return out;
  }

  function currentCity(){
    try{
      var s=window.schedules;
      var st=window.state;
      if(!s||!st||!s[st.plan])return '';
      var d=s[st.plan][st.day];
      var title=(d&&d.title)||'';
      var cities=(window.LVBAN_DATA&&window.LVBAN_DATA.cities)||['福州','平潭','泉州','厦门'];
      for(var i=0;i<cities.length;i++)if(title.indexOf(cities[i])>=0)return cities[i];
    }catch(e){}
    return '';
  }

  function matches(q){
    var source=buildSource();
    q=(q||'').trim().toLowerCase();
    var city=currentCity();
    var arr=source.filter(function(x){
      if(city&&x.city&&x.city!==city)return false;
      if(!q)return true;
      return (x.name+' '+x.address+' '+x.city).toLowerCase().indexOf(q)>=0;
    });
    if(!arr.length&&q){
      arr=source.filter(function(x){return (x.name+' '+x.address+' '+x.city).toLowerCase().indexOf(q)>=0;});
    }
    return arr.slice(0,10);
  }

  function installStyle(){
    if(document.getElementById('lvbanSmartEventStyle'))return;
    var st=document.createElement('style');
    st.id='lvbanSmartEventStyle';
    st.textContent=''+
      '.lvban-smart-recommend{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 8px}'+
      '.lvban-smart-recommend button{padding:8px 11px;border:1px solid #e4e1f5;border-radius:13px;background:#fff;color:#5d4de5;font-size:12px;font-weight:700;cursor:pointer}'+
      '.lvban-smart-recommend button:hover{background:#efedff}'+
      '.lvban-smart-match{font-size:11px;color:#6958f5;margin:-3px 0 7px;line-height:1.5}';
    document.head.appendChild(st);
  }

  function enhanceEventForm(){
    var body=document.getElementById('modalBody');
    var title=document.getElementById('modalTitle');
    if(!body||!title)return;
    if((title.textContent||'').trim()!=='添加日程')return;

    var name=document.getElementById('xName') || body.querySelector('input[placeholder*="南普陀"], input[placeholder*="安排"]');
    if(!name)return;
    var addr=document.getElementById('xAddr') || body.querySelector('input[placeholder*="地址"]');
    if(!addr)return;

    installStyle();

    var old=document.getElementById('lvbanRecommendBox');
    if(old)old.remove();
    var match=document.getElementById('lvbanMatchText');
    if(match)match.remove();

    var box=document.createElement('div');
    box.id='lvbanRecommendBox';
    box.className='lvban-smart-recommend';
    var label=document.createElement('div');
    label.style.cssText='width:100%;font-size:12px;color:#77788b;margin-bottom:0';
    label.textContent=currentCity()?'推荐景点 · '+currentCity():'推荐景点 / 美食';
    box.appendChild(label);

    var initial=matches('');
    initial.slice(0,6).forEach(function(x){
      var b=document.createElement('button');
      b.type='button';
      b.textContent=x.name;
      b.title=x.address||'';
      b.onclick=function(){selectItem(x);};
      box.appendChild(b);
    });

    name.parentNode.insertBefore(box,name.nextSibling);

    function selectItem(x){
      name.value=x.name;
      if(addr)addr.value=x.address||'';
      var note=document.getElementById('xNote') || body.querySelector('textarea');
      if(note&&!note.value&&x.note)note.value=x.note;
      name.dispatchEvent(new Event('input',{bubbles:true}));
      var oldMatch=document.getElementById('lvbanMatchText');
      if(oldMatch)oldMatch.remove();
      var m=document.createElement('div');
      m.id='lvbanMatchText';m.className='lvban-smart-match';
      m.textContent='✓ 已识别：'+(x.city?x.city+' · ':'')+x.name+'｜地址已自动填入';
      addr.parentNode.insertBefore(m,addr);
    }

    function refresh(q){
      var result=matches(q);
      box.innerHTML='';
      var lab=document.createElement('div');
      lab.style.cssText='width:100%;font-size:12px;color:#77788b;margin-bottom:0';
      lab.textContent=q?'匹配结果':'推荐景点 · '+(currentCity()||'当前目的地');
      box.appendChild(lab);
      result.slice(0,6).forEach(function(x){
        var b=document.createElement('button');b.type='button';b.textContent=x.name;b.title=x.address||'';b.onclick=function(){selectItem(x);};box.appendChild(b);
      });
      if(!result.length){
        var t=document.createElement('span');t.style.cssText='font-size:11px;color:#999;padding:7px 0';t.textContent='暂无匹配，可继续手动填写';box.appendChild(t);
      }
    }

    if(!name.dataset.lvbanBound){
      name.dataset.lvbanBound='1';
      name.addEventListener('input',function(){refresh(name.value);});
      name.addEventListener('blur',function(){
        var q=name.value.trim().toLowerCase();
        if(!q)return;
        var r=matches(q);
        var exact=r.find(function(x){return x.name.toLowerCase()===q;});
        if(exact)selectItem(exact);
      });
    }
  }

  function observe(){
    if(!document.body)return;
    var run=function(){setTimeout(enhanceEventForm,20);};
    var mo=new MutationObserver(run);
    mo.observe(document.body,{subtree:true,childList:true});
    setInterval(enhanceEventForm,700);
    run();
  }

  migrate();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe);else observe();
})();
