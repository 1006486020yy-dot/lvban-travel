/* 旅伴旅行管家 · 数据兼容入口
   行程 UI 统一由 final-trip-fix.js 接管，避免旧补丁重复渲染。 */
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
})();
