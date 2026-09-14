/* 旅伴 AI · 对话框 UI 最终修复层 */
(function(){
  'use strict';
  const css=`
    /* AI 页面只调整视觉容器，不改变 askAI / messages 的业务逻辑 */
    #ai .panel.chat.ai-ui-locked,
    #ai .panel.chat{
      min-height:calc(100vh - 190px)!important;
      height:calc(100vh - 190px)!important;
      padding:16px!important;
      background:rgba(255,255,255,.72)!important;
      border:1px solid rgba(255,255,255,.92)!important;
      border-radius:28px!important;
      box-shadow:0 18px 48px rgba(64,58,138,.08)!important;
      display:flex!important;
      flex-direction:column!important;
      overflow:hidden!important;
    }
    #ai .messages{
      flex:1 1 auto!important;
      min-height:0!important;
      height:auto!important;
      overflow-y:auto!important;
      padding:4px 6px 12px!important;
      gap:14px!important;
    }
    #ai .messages .msg{
      flex:0 0 auto!important;
      max-width:min(78%,680px)!important;
      width:max-content!important;
      min-height:0!important;
      padding:12px 16px!important;
      border-radius:18px!important;
      line-height:1.65!important;
      box-shadow:0 4px 14px rgba(64,58,138,.05)!important;
    }
    #ai .messages .msg.ai{
      align-self:flex-start!important;
      background:#fff!important;
      border:1px solid #ece9f6!important;
      color:#29283a!important;
    }
    #ai .messages .msg.user{
      align-self:flex-end!important;
      background:#6958f5!important;
      border:1px solid #6958f5!important;
      color:#fff!important;
    }
    #ai .composer{
      flex:0 0 auto!important;
      width:100%!important;
      min-height:60px!important;
      margin:8px 0 0!important;
      padding:6px 7px 6px 16px!important;
      display:flex!important;
      align-items:center!important;
      gap:8px!important;
      background:#fff!important;
      border:1px solid #dedbea!important;
      border-radius:22px!important;
      box-shadow:0 8px 24px rgba(64,58,138,.09)!important;
    }
    #ai .composer textarea{
      min-height:42px!important;
      max-height:120px!important;
      height:42px!important;
      line-height:1.5!important;
      padding:10px 2px!important;
      background:transparent!important;
      color:#252433!important;
    }
    #ai .composer textarea::placeholder{color:#a2a0ad!important}
    #ai .composer .btn{
      flex:0 0 48px!important;
      width:48px!important;
      height:48px!important;
      padding:0!important;
      border-radius:16px!important;
      display:grid!important;
      place-items:center!important;
      font-size:14px!important;
      font-weight:800!important;
    }
    @media(max-width:760px){
      #ai .panel.chat.ai-ui-locked,#ai .panel.chat{height:calc(100vh - 150px)!important;min-height:calc(100vh - 150px)!important;padding:12px!important;border-radius:24px!important}
      #ai .messages .msg{max-width:88%!important}
      #ai .composer{min-height:56px!important;border-radius:20px!important;padding-left:14px!important}
      #ai .composer .btn{flex-basis:44px!important;width:44px!important;height:44px!important;border-radius:14px!important}
    }
  `;
  function apply(){
    if(!document.getElementById('lvban-ai-chat-final-style')){
      const st=document.createElement('style');
      st.id='lvban-ai-chat-final-style';
      st.textContent=css;
      document.head.appendChild(st);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});
  else apply();
  window.addEventListener('load',apply,{once:true});
})();
