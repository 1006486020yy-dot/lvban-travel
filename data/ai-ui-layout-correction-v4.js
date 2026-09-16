/* 旅伴 AI · Layout Correction V4
 * 针对实际截图：去掉机器人与四个固定卡片；快速问独立放在输入框上方。
 */
(function(){
  'use strict';
  if(window.__lvbanAiLayoutCorrectionV4)return;
  window.__lvbanAiLayoutCorrectionV4=true;
  const STYLE_ID='lvban-ai-layout-correction-v4-style';
  const css=`
    /* 1. 首页欢迎区不再显示机器人 */
    body.lvban-ai-mode #lvban-ai-welcome-v2 .robot{display:none!important}

    /* 2. 彻底隐藏原来四个固定入口卡片 */
    body.lvban-ai-mode #lvban-ai-quick-v2{display:none!important}
    body.lvban-ai-mode #lvban-ai-welcome-v2 .lv-ai-quick-card{display:none!important}

    /* 3. 快速问是独立的快捷提问区，不进入输入框 */
    body.lvban-ai-mode #lvban-ai-quick-prompts-v1{
      position:fixed!important;
      left:50%!important;
      right:auto!important;
      bottom:145px!important;
      transform:translateX(-50%)!important;
      width:min(760px,calc(100% - 32px))!important;
      display:flex!important;
      flex-direction:row!important;
      justify-content:flex-end!important;
      align-items:center!important;
      gap:8px!important;
      padding:0!important;
      margin:0!important;
      z-index:124!important;
      pointer-events:none!important;
      box-sizing:border-box!important;
    }
    body.lvban-ai-mode #lvban-ai-quick-prompts-v1.lv-ai-quick-hidden{display:none!important}
    body.lvban-ai-mode #lvban-ai-quick-prompts-v1 button{
      pointer-events:auto!important;
      flex:0 0 auto!important;
      max-width:none!important;
      height:42px!important;
      min-height:42px!important;
      padding:0 15px!important;
      border-radius:21px!important;
      border:1px solid #d7e4f4!important;
      background:rgba(255,255,255,.96)!important;
      color:#3971b7!important;
      font-size:13px!important;
      line-height:42px!important;
      white-space:nowrap!important;
      box-shadow:0 6px 18px rgba(40,83,135,.08)!important;
      backdrop-filter:blur(18px)!important;
      box-sizing:border-box!important;
    }

    /* 欢迎标题保持轻量，不再占用卡片空间 */
    body.lvban-ai-mode #lvban-ai-welcome-v2{
      padding-top:30px!important;
      padding-bottom:0!important;
    }
    body.lvban-ai-mode #lvban-ai-welcome-v2 h3{margin-top:0!important}

    @media(max-width:760px){
      body.lvban-ai-mode #lvban-ai-quick-prompts-v1{
        bottom:128px!important;
        width:calc(100% - 20px)!important;
        justify-content:flex-start!important;
        overflow-x:auto!important;
        overflow-y:hidden!important;
        scrollbar-width:none!important;
      }
      body.lvban-ai-mode #lvban-ai-quick-prompts-v1::-webkit-scrollbar{display:none!important}
      body.lvban-ai-mode #lvban-ai-quick-prompts-v1 button{
        height:38px!important;
        min-height:38px!important;
        line-height:38px!important;
        padding:0 13px!important;
        font-size:12px!important;
        border-radius:19px!important;
      }
      body.lvban-ai-mode #lvban-ai-welcome-v2{padding-top:22px!important}
    }
  `;
  function inject(){if(document.getElementById(STYLE_ID))return;const s=document.createElement('style');s.id=STYLE_ID;s.textContent=css;document.head.appendChild(s)}
  function sync(){
    if(!document.getElementById('ai')?.classList.contains('active'))return;
    const welcome=document.getElementById('lvban-ai-welcome-v2');
    if(welcome){
      const robot=welcome.querySelector('.robot');if(robot)robot.style.setProperty('display','none','important');
      const quick=welcome.querySelector('#lvban-ai-quick-v2');if(quick)quick.style.setProperty('display','none','important');
    }
  }
  function boot(){inject();sync()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  new MutationObserver(sync).observe(document.body,{childList:true,subtree:true});
  setInterval(sync,900);
})();
