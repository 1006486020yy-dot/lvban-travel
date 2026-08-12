/* 旅伴旅行管家 · 弹层关闭/提交稳定补丁 */
(function(){
  'use strict';
  const modal=()=>document.getElementById('modal');
  function hideModal(){
    const m=modal();
    if(!m)return;
    m.classList.remove('show');
    m.style.display='none';
    m.setAttribute('aria-hidden','true');
    document.body.classList.remove('modal-open');
  }
  window.closeModal=hideModal;
  function bind(){
    const m=modal();
    if(!m||m.dataset.lvModalFix==='1')return;
    m.dataset.lvModalFix='1';
    m.addEventListener('click',function(e){
      const target=e.target.closest('button');
      if(target){
        const text=(target.textContent||'').trim();
        if(text==='关闭'||text==='✕'||target.getAttribute('aria-label')==='关闭'){
          e.preventDefault();e.stopPropagation();hideModal();return;
        }
      }
      if(e.target===m)hideModal();
    },true);
  }
  const oldSave=window.saveDayItem;
  window.saveDayItem=function(){
    if(typeof oldSave==='function'){
      oldSave.apply(this,arguments);
      setTimeout(hideModal,0);
    }
  };
  const oldOpen=window.openModal;
  if(typeof oldOpen==='function'){
    window.openModal=function(title,body){
      const r=oldOpen.apply(this,arguments);
      const m=modal();
      if(m){m.style.display='flex';m.classList.add('show');m.setAttribute('aria-hidden','false');}
      bind();
      return r;
    };
  }
  function start(){bind();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
