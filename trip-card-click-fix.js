/* 旅伴旅行管家 · 行程卡片点击兼容修复
   原因：ui-fixes.js 使用 #trips 画布，而 itinerary-layout-final.js 的
   openTripCanvas 只寻找 #tripDetail，两个渲染器发生覆盖，导致卡片点击无响应。
   这里在列表画布存在时锁定 ui-fixes 的点击入口；进入其他详情结构时不干预。
*/
(function(){
  'use strict';
  let uiOpen=null;
  let uiDetail=null;
  let uiSwitchPlan=null;

  function capture(){
    if(!window._tripUI)return;
    if(!uiOpen && typeof window.openTripCanvas==='function') uiOpen=window.openTripCanvas;
    if(!uiDetail && typeof window.renderTripDetail==='function') uiDetail=window.renderTripDetail;
    if(!uiSwitchPlan && typeof window.switchPlan==='function') uiSwitchPlan=window.switchPlan;
  }

  function restore(){
    capture();
    /* ui-fixes 的列表页没有 #tripDetail；此时 itinerary-layout-final
       不应该覆盖它的打开逻辑。 */
    if(window._tripUI && !document.getElementById('tripDetail')){
      if(uiOpen) window.openTripCanvas=uiOpen;
      if(uiDetail) window.renderTripDetail=uiDetail;
      if(uiSwitchPlan) window.switchPlan=uiSwitchPlan;
    }
  }

  /* 给现有异步渲染器留出加载时间，并覆盖 itinerary-layout-final 的周期性入口锁定。 */
  const timer=setInterval(restore,100);
  window.addEventListener('load',()=>setTimeout(restore,50));
  setTimeout(()=>clearInterval(timer),300000);
})();
