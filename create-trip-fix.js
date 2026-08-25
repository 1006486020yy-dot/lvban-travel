/* 旅伴旅行管家 · 新建行程唯一运行时入口 */
(function(){
  'use strict';
  var SRC='new-trip-form-v2.js?v=20260825-final';
  function bind(){
    if(typeof window.openNewTrip==='function'){
      window.newTrip=window.openNewTrip;
      window.__lvbanNewTripV2=true;
      document.querySelectorAll('button').forEach(function(b){
        var text=(b.textContent||'').replace(/\s+/g,'');
        if(text.indexOf('新建行程')>=0 && !b.dataset.lvNewTripBound){
          b.dataset.lvNewTripBound='1';
          b.onclick=function(e){e.preventDefault();e.stopPropagation();window.openNewTrip();};
        }
      });
      return true;
    }
    return false;
  }
  function load(){
    if(typeof window.openNewTrip==='function')return bind();
    if(document.getElementById('lv-create-trip-v2-loader'))return false;
    var s=document.createElement('script');
    s.id='lv-create-trip-v2-loader';
    s.src=SRC;
    s.onload=function(){setTimeout(bind,0);setTimeout(bind,100);};
    s.onerror=function(){console.error('[lvban] new-trip-form-v2.js load failed');};
    document.head.appendChild(s);
    return false;
  }
  function boot(){load();setTimeout(bind,100);setTimeout(bind,500);setTimeout(bind,1500);setTimeout(bind,3000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.addEventListener('load',boot);
  new MutationObserver(function(){bind();}).observe(document.body,{childList:true,subtree:true});
})();