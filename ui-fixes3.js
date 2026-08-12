/* 旅伴旅行管家 · 行程最终收口 */
(function(){
  function load(){
    if(window.__lvFinalTripLoader)return;
    window.__lvFinalTripLoader=true;
    var s=document.createElement('script');
    s.src='final-trip-fix.js?v=20260812-final7';
    s.onload=function(){
      var c=document.createElement('script');
      c.src='create-trip-fix.js?v=20260812-create5';
      c.onload=function(){
        var f=document.createElement('script');
        f.src='create-trip-submit-fix.js?v=20260812-submit2';
        f.onload=function(){
          var n=document.createElement('script');
          n.src='trip-city-date-nav-fix.js?v=20260812-nav2';
          n.onload=function(){
            var z=document.createElement('script');
            z.src='schedule-smart-fill-fix.js?v=20260812-smart2';
            document.head.appendChild(z);
          };
          document.head.appendChild(n);
        };
        document.head.appendChild(f);
      };
      document.head.appendChild(c);
    };
    document.head.appendChild(s);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else load();
})();
