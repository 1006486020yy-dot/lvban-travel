/* 旅伴旅行管家 Pro · 兼容与交互增强 */
(function(){
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
  migrate();

  function enhance(){
    if(!window.modal||!window.closeModal)return;

    /* 清掉旧版残留的“发现灵感” */
    document.querySelectorAll('#trips .tabs .tab').forEach(function(btn){
      if((btn.textContent||'').trim()==='发现灵感')btn.remove();
    });

    /* 统一景点/美食数据，优先读取 data.js */
    var source=[];
    var spots=(window.LVBAN_DATA&&Array.isArray(window.LVBAN_DATA.spots))?window.LVBAN_DATA.spots:[];
    var foods=(window.LVBAN_DATA&&Array.isArray(window.LVBAN_DATA.foods))?window.LVBAN_DATA.foods:[];
    spots.forEach(function(x){source.push({type:'景点',city:x.city||'',name:x.name||'',address:x.address||'',note:x.highlight||''});});
    foods.forEach(function(x){source.push({type:'美食',city:x.city||'',name:x.name||'',address:x.address||'',note:x.highlight||''});});
    if(!source.length&&Array.isArray(window.S))window.S.forEach(function(x){source.push({type:'景点',city:x[0],name:x[1],address:x[2],note:''});});
    if(!source.length&&Array.isArray(window.F))window.F.forEach(function(x){source.push({type:'美食',city:x[0],name:x[1],address:x[2],note:''});});

    function esc(v){return String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
    function currentCity(){
      try{
        var d=window.schedules[window.state.plan][window.state.day];
        var title=d&&d.title||'';
        var cs=['福州','平潭','泉州','厦门'];
        for(var i=0;i<cs.length;i++)if(title.indexOf(cs[i])>=0)return cs[i];
      }catch(e){}
      return '';
    }
    function matches(q){
      q=(q||'').trim().toLowerCase();
      var city=currentCity();
      var a=source.filter(function(x){
        if(city&&x.city&&x.city!==city)return false;
        if(!q)return true;
        return (x.name+' '+x.address+' '+x.city).toLowerCase().indexOf(q)>=0;
      });
      if(!a.length&&q)a=source.filter(function(x){return (x.name+' '+x.address+' '+x.city).toLowerCase().indexOf(q)>=0;});
      return a.slice(0,8);
    }

    window.addEvent=function(){
      window.modal('添加日程',
        '<div class="form smart-event-form">'+
          '<label>时间</label><input id="xTime" type="time" value="09:00">'+
          '<label>安排什么？</label>'+
          '<input id="xName" autocomplete="off" placeholder="例如：南普陀寺 / 鼓浪屿 / 午餐">'+
          '<div id="eventSuggestions" style="display:flex;gap:8px;flex-wrap:wrap;margin:-2px 0 5px"></div>'+
          '<label>地址</label>'+
          '<input id="xAddr" placeholder="选择景点后会自动填入地址，也可以手动修改">'+
          '<label>备注</label><textarea id="xNote" placeholder="交通、门票、预约等"></textarea>'+
          '<button class="btn primary" onclick="saveSmartEvent()">加入当天日程</button>'+
        '</div>'
      );

      var name=document.getElementById('xName');
      var addr=document.getElementById('xAddr');
      var box=document.getElementById('eventSuggestions');
      if(!name||!addr||!box)return;

      function render(q){
        var a=matches(q);
        box.innerHTML=a.map(function(x,i){
          return '<button type="button" class="btn" data-i="'+i+'" style="text-align:left">'+esc(x.name)+'<span style="font-size:10px;margin-left:5px;opacity:.65">'+esc(x.type)+'</span></button>';
        }).join('');
        Array.prototype.forEach.call(box.querySelectorAll('button'),function(b){
          b.onclick=function(){
            var x=a[Number(b.getAttribute('data-i'))];
            name.value=x.name;
            addr.value=x.address;
            if(x.note&&document.getElementById('xNote')&&!document.getElementById('xNote').value)document.getElementById('xNote').value=x.note;
            box.innerHTML='<span class="muted">已匹配：'+esc(x.city)+' · '+esc(x.name)+'，地址已自动填充</span>';
          };
        });
      }
      name.addEventListener('input',function(){render(name.value);});
      name.addEventListener('change',function(){
        var a=matches(name.value);
        if(a[0]&&name.value.trim().toLowerCase()===a[0].name.toLowerCase()){
          addr.value=a[0].address;
        }
      });
      render('');
    };

    window.saveSmartEvent=function(){
      var t=document.getElementById('xTime').value;
      var n=document.getElementById('xName').value.trim();
      var a=document.getElementById('xAddr').value.trim();
      var note=document.getElementById('xNote').value.trim();
      if(!n){window.toast('请填写安排内容');return;}
      try{
        window.schedules[window.state.plan][window.state.day].items.push([t||'09:00',n,a,note]);
        window.schedules[window.state.plan][window.state.day].items.sort(function(x,y){return x[0].localeCompare(y[0]);});
        window.closeModal();
        window.renderTrips();
        window.toast('日程已添加');
      }catch(e){window.toast('添加失败，请刷新后重试');}
    };

    /* 给新弹窗增加一点推荐按钮样式 */
    if(!document.getElementById('smartEventStyle')){
      var st=document.createElement('style');st.id='smartEventStyle';
      st.textContent='.smart-event-form #eventSuggestions .btn{padding:8px 10px;font-size:12px}.smart-event-form #eventSuggestions .btn:hover{background:#e8e5ff}';
      document.head.appendChild(st);
    }
  }

  /* index.html 的内联脚本在本文件之后执行，因此必须延后一拍接管函数 */
  setTimeout(enhance,0);
  document.addEventListener('DOMContentLoaded',function(){setTimeout(enhance,0);});
})();
