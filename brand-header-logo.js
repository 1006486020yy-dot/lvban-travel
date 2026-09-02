/* 旅伴旅行管家 Pro · 品牌角标 */
(function(){
  'use strict';
  function mount(){
    const top=document.querySelector('.top');
    if(!top || top.dataset.brandLogoMounted==='1') return;
    top.dataset.brandLogoMounted='1';
    const title=document.createElement('div');
    title.className='brand-title';
    title.innerHTML='<img class="brand-logo" src="assets/travelmate-logo.svg?v=20260902-1" alt="旅伴旅行管家 Logo"><div class="brand-copy"><div class="brand-name">旅伴旅行管家</div><div class="brand-sub">TRAVELMATE · 行程 / 景点 / 美食 / AI</div></div>';
    top.textContent='';
    top.appendChild(title);
    const style=document.createElement('style');
    style.textContent='.top{display:flex;align-items:center;gap:12px}.brand-title{display:flex;align-items:center;gap:12px;min-width:0}.brand-logo{width:48px;height:48px;display:block;flex:0 0 48px;border-radius:14px;box-shadow:0 7px 18px rgba(79,70,229,.16)}.brand-copy{min-width:0}.brand-name{font-size:21px;line-height:1.15;font-weight:900;letter-spacing:-.2px}.brand-sub{display:block;font-size:11px;line-height:1.25;color:var(--muted);font-weight:500;margin-top:4px;white-space:nowrap}@media(max-width:760px){.top{padding:12px 14px;gap:9px}.brand-title{gap:9px}.brand-logo{width:40px;height:40px;flex-basis:40px;border-radius:12px}.brand-name{font-size:18px}.brand-sub{font-size:9px;margin-top:3px}}';
    document.head.appendChild(style);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
  window.addEventListener('load',mount,{once:true});
})();