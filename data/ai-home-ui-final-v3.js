/* 旅伴 AI · Home UI Final V3
 * 4 个固定卡片改为情境式快速提问；恢复 AI 内的首页/行程/景点/美食/AI 导航。
 */
(function(){
  'use strict';
  if(window.__lvbanAiHomeUiFinalV3)return;
  window.__lvbanAiHomeUiFinalV3=true;
  const STYLE_ID='lvban-ai-home-ui-final-v3-style';
  const ROOT_ID='lvban-ai-quick-prompts-v1';
  const css=`
    /* 不再长期显示四个固定入口卡片：只隐藏包含四个旧入口的共同容器 */
    body.lvban-ai-mode .lv-ai-fixed-home-actions{display:none!important}

    /* AI 页面保留一条轻量底部功能栏：首页是明确返回入口 */
    body.lvban-ai-mode .bottom{
      display:grid!important;position:fixed!important;left:50%!important;bottom:8px!important;transform:translateX(-50%)!important;
      z-index:118!important;width:min(620px,calc(100% - 24px))!important;grid-template-columns:repeat(5,1fr)!important;
      gap:3px!important;padding:6px!important;background:rgba(255,255,255,.94)!important;border:1px solid #e2ebf6!important;
      border-radius:22px!important;box-shadow:0 12px 36px rgba(35,72,119,.14)!important;backdrop-filter:blur(24px)!important;
    }
    body.lvban-ai-mode .bottom button{min-height:46px!important;border:0!important;border-radius:16px!important;background:transparent!important;color:#7d8ca2!important;font-size:11px!important;font-weight:700!important}
    body.lvban-ai-mode .bottom button.active,body.lvban-ai-mode .bottom button:last-child{color:#1677ff!important;background:#edf5ff!important}
    body.lvban-ai-mode .bottom button:first-child{color:#1677ff!important}
    body.lvban-ai-mode #${ROOT_ID}{bottom:78px!important}
    body.lvban-ai-mode .lv-ai-composer-portal-v6{bottom:78px!important}
    @media(max-width:760px){
      body.lvban-ai-mode .bottom{bottom:6px!important;width:calc(100% - 16px)!important;border-radius:20px!important}
      body.lvban-ai-mode .bottom button{min-height:44px!important}
      body.lvban-ai-mode #${ROOT_ID}{bottom:70px!important}
      body.lvban-ai-mode .lv-ai-composer-portal-v6{bottom:70px!important}
    }
  `;
  function inject(){if(document.getElementById(STYLE_ID))return;const s=document.createElement('style');s.id=STYLE_ID;s.textContent=css;document.head.appendChild(s)}
  function findFixedCards(){
    const ai=document.getElementById('ai');if(!ai)return;
    if(ai.querySelector('.lv-ai-fixed-home-actions'))return;
    const terms=['帮我规划行程','推荐景点','推荐美食','旅行问答'];
    const nodes=[...ai.querySelectorAll('*')].filter(el=>{
      const t=String(el.textContent||'').replace(/\\s+/g,'').trim();
      return terms.every(x=>t.includes(x));
    });
    if(!nodes.length)return;
    let target=nodes.sort((a,b)=>a.childElementCount-b.childElementCount)[0];
    /* 向上找一个同时包含四个入口、但不要把整个 AI panel 吃掉的容器 */
    while(target.parentElement && target.parentElement!==ai){
      const p=target.parentElement,t=String(p.textContent||'').replace(/\\s+/g,'');
      if(terms.every(x=>t.includes(x)) && p.children.length<=8)target=p;else break;
    }
    target.classList.add('lv-ai-fixed-home-actions');
  }
  function bindNav(){
    const nav=document.querySelector('.bottom');if(!nav)return;
    [...nav.querySelectorAll('button')].forEach((b,i)=>{
      if(b.__lvbanAiHomeNav)return;
      b.__lvbanAiHomeNav=true;
      b.addEventListener('click',()=>{if(i===0&&typeof window.go==='function')setTimeout(()=>window.go('home'),0)},{capture:true});
    });
  }
  function sync(){
    if(!document.getElementById('ai')?.classList.contains('active'))return;
    findFixedCards();bindNav();
  }
  function bindGo(){
    if(window.__lvbanAiHomeGoWrapped)return;
    const original=window.go;if(typeof original!=='function')return;
    window.go=function(id){const r=original.apply(this,arguments);setTimeout(sync,80);return r};
    window.__lvbanAiHomeGoWrapped=true;
  }
  function boot(){inject();bindGo();setTimeout(sync,120)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  new MutationObserver(()=>sync()).observe(document.body,{childList:true,subtree:true});
  setInterval(()=>{bindGo();sync()},900);
})();
