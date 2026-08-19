/* Persist trip deletion so a refresh cannot recreate a deleted seeded trip. */
(function(){
  if(window.__lvDeletePersistFix)return;
  window.__lvDeletePersistFix=true;
  document.addEventListener('click',function(e){
    const btn=e.target.closest?.('[data-act="delete"]');
    if(!btn)return;
    const card=btn.closest?.('.lv-trip-card');
    const id=card?.dataset?.id;
    if(id) window.markTripDeleted?.(id);
  },true);
})();
