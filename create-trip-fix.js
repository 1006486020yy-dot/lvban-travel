/* Legacy creator bridge: V2 is the only new-trip UI. */
(function(){
  function load(){
    var s=document.getElementById('lv-create-trip-v2-loader');
    if(s)return;
    s=document.createElement('script');
    s.id='lv-create-trip-v2-loader';
    s.src='new-trip-form-v2.js?v=20260824-final-3';
    s.onload=function(){ if(typeof window.newTrip==='function') window.openNewTrip=window.newTrip; };
    document.head.appendChild(s);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){load();setTimeout(load,300);});
  else {load();setTimeout(load,300);}
})();