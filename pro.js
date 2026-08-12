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

  /*
   * index.html 当前仍保留旧版 addEvent。这里在页面脚本执行完成后接管它，
   * 避免继续修改那一大段单文件 HTML，也避免旧补丁互相覆盖。
   */
  function enhance(){
    if(!window.modal || !window.closeModal) return;

    // 之前已经要求移除“发现灵感”，这里强制清理旧 DOM，避免旧版本残留。
    document.querySelectorAll('#trips .tabs .tab').forEach(function(btn){
      if((btn.textContent||'').trim()==='发现灵感') btn.remove();
    });

    // 推荐数据：优先使用统一数据仓库，同时兼容旧版 index.html 的 S/F 数据。
    var spots=(window.LVBAN_DATA&&Array.isArray(window.LVBAN_DATA.spots))?window.LVBAN_DATA.spots:[];
    var foods=(window.LVBAN_DATA&&Array.isArray(window.LVBAN_DATA.foods))?window.LVBAN_DATA.foods:[];
    var source=[];
    spots.forEach(function(x){source.push({type:'景点',city:x.city||'',name:x.name||'',address:x.address||'',note:x.highlight||''});});
    foods.forEach(function(x){source.push({type:'美食',city:x.city||'',name:x.name||'',address:x.address||'',note:x.highlight||''});});
    if(!source.length && Array.isArray(window.S)) window.S.forEach(function(x){source.push({type:'景点',city:x[0],name:x[1],address:x[2],note:''});});
    if(!source.length && Array.isArray(window.F)) window.F.forEach(function(x){source.push({type:'美食',city:x[0],name:x[1],address:x[2],note:''});});

    function cityFromDay(){
      try{
        var d=window.schedules&&window.schedules[window.state.plan][window.state.day];
        var title=(d&&d.title)||'';
        var cities=['福州','平潭','泉州','厦门'];
        for(var i=0;i<cities.length;i++) if(title.indexOf(cities[i])>=0) return cities[i];
      }catch(e){}
      return '';
    }
    function escapeHtml(v){return String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
    function getMatches(q){
      q=(q||'').trim().toLowerCase();
      var city=cityFromDay();
      var arr=source.filter(function(x){
        if(city && x.city && x.city!==city) return false;
        if(!q) return true;
        return (x.name+' '+x.address+' '+x.city).toLowerCase().indexOf(q)>=0;
      });
      if(!arr.length && q){
        arr=source.filter(function(x){return (x.name+' '+x.address+' '+x.city).toLowerCase().indexOf(q)>=0;});
      }
      return arr.slice(0,8);
    }

    window.addEvent=function(){
      window.modal('添加日程',
        '<div class="form smart-event-form">'+
          '<label>时间</label>'+<|DELIM_1zP|>"? Need valid JSON string issue. I accidentally include weird. Let's redo. "content" needs full. Use Python? no. We can craft carefully but long. Maybe update failed? It hasn't returned. Need correct call. We'll call again. 
