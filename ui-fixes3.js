/* 旅伴旅行管家 · 行程最终收口 */
(function(){
  function load(){
    if(window.__lvFinalTripLoader)return;
    window.__lvFinalTripLoader=true;
    var s=document.createElement('script');
    s.src='final-trip-fix.js?v=20260811-final6';
    s.onload=function(){
      var c=document.createElement('script');
      c.src='create-trip-fix.js?v=20260811-v3';
      c.onload=function(){
        var f=document.createElement('script');
        f.src='create-trip-submit-fix.js?v=20260812-submit1';
        f.onload=function(){
          var n=document.createElement('script');
          n.src='trip-city-date-nav-fix.js?v=20260812-nav1';
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
