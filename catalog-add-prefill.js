/* 旅伴｜从景点/美食/酒店库加入行程时预填每日节点 */
(function(){
  'use strict';
  function apply(){
    const p=window._lvbanCatalogPending,mask=document.querySelector('.lv-create-mask');
    if(!p||!mask)return;
    const name=mask.querySelector('#lvCreateName'),addr=mask.querySelector('#lvCreateAddress'),note=mask.querySelector('#lvCreateNote'),type=mask.querySelector('#lvCreateType');
    if(!name)return;
    if(type)type.value=p.type||'景点';
    name.value=p.name||'';if(addr)addr.value=p.address||'';if(note)note.value=p.note||'';
    delete window._lvbanCatalogPending;
  }
  new MutationObserver(apply).observe(document.body,{childList:true,subtree:true});
})();
