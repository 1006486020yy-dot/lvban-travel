/* 旅伴 AI · Mockup UI Match V1
 * 只重做 AI 页面视觉层；不替换 askAI、不改聊天记录、不改其他页面。
 */
(function(){
  'use strict';
  if(window.__lvbanAiMockupMatchV1)return;
  window.__lvbanAiMockupMatchV1=true;

  const STYLE_ID='lvban-ai-mockup-match-style-v1';
  const css=`
    /* ===== AI 独立沉浸式页面 ===== */
    body.lvban-ai-mode{background:#f7faff!important;overflow-x:hidden}
    body.lvban-ai-mode .app{max-width:none!important;width:100%!important;margin:0!important;padding:0!important}
    body.lvban-ai-mode .top{display:none!important}
    body.lvban-ai-mode .bottom{display:none!important}
    body.lvban-ai-mode #ai{position:fixed!important;inset:0!important;z-index:30!important;display:flex!important;flex-direction:column!important;padding:0!important;background:linear-gradient(180deg,#fbfdff 0%,#f6f9ff 100%)!important;overflow:hidden!important}

    /* 顶部栏：白色玻璃 + 蓝色 iOS 风格 */
    body.lvban-ai-mode #ai>.title{height:72px!important;min-height:72px!important;margin:0!important;padding:0 22px 0 76px!important;display:flex!important;align-items:center!important;justify-content:center!important;position:relative!important;background:rgba(255,255,255,.78)!important;border-bottom:1px solid #e9eff8!important;backdrop-filter:blur(24px)!important;z-index:50!important;box-sizing:border-box!important}
    body.lvban-ai-mode #ai>.title>div:first-child{text-align:center!important}
    body.lvban-ai-mode #ai>.title h2{font-size:17px!important;line-height:22px!important;font-weight:800!important;color:#172033!important;margin:0!important;letter-spacing:-.2px!important}
    body.lvban-ai-mode #ai>.title .muted{display:none!important}
    body.lvban-ai-mode #ai>.title>.trip-level{display:none!important}
    body.lvban-ai-mode #ai .lv-ai-new-chat-inline{display:none!important}

    /* 聊天主体 */
    body.lvban-ai-mode #ai>.panel.chat{position:relative!important;flex:1 1 auto!important;min-height:0!important;height:auto!important;padding:0!important;margin:0!important;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;display:flex!important;overflow:hidden!important}
    body.lvban-ai-mode #ai .messages{width:min(820px,100%)!important;max-width:820px!important;margin:0 auto!important;padding:34px 28px 128px!important;min-height:0!important;height:100%!important;overflow-y:auto!important;overflow-x:hidden!important;display:flex!important;flex-direction:column!important;gap:18px!important;scroll-behavior:smooth!important}
    body.lvban-ai-mode #ai .messages::-webkit-scrollbar{width:7px}
    body.lvban-ai-mode #ai .messages::-webkit-scrollbar-thumb{background:#dce6f4;border-radius:10px}

    /* AI / 用户消息 */
    body.lvban-ai-mode #ai .messages .msg{font-size:14px!important;line-height:1.72!important;max-width:76%!important;width:max-content!important;min-height:0!important;padding:13px 16px!important;border-radius:20px!important;box-shadow:none!important;white-space:pre-wrap!important}
    body.lvban-ai-mode #ai .messages .msg.ai{align-self:flex-start!important;background:#fff!important;color:#273248!important;border:1px solid #e5ebf4!important;border-bottom-left-radius:7px!important;box-shadow:0 5px 18px rgba(32,61,110,.055)!important}
    body.lvban-ai-mode #ai .messages .msg.user{align-self:flex-end!important;background:#1677ff!important;color:#fff!important;border:0!important;border-bottom-right-radius:7px!important;box-shadow:0 7px 20px rgba(22,119,255,.18)!important}

    /* 首条欢迎语做成 mockup 的欢迎块 */
    body.lvban-ai-mode #ai .messages .msg.ai:first-child{max-width:min(680px,100%)!important;padding:20px 22px!important;border-radius:24px!important;border-bottom-left-radius:10px!important;background:linear-gradient(145deg,#ffffff,#f8fbff)!important;border-color:#dfe9f7!important;box-shadow:0 12px 34px rgba(44,91,153,.08)!important;font-size:15px!important}

    /* 输入区：浮动白色胶囊组件 */
    body.lvban-ai-mode #ai .composer{position:fixed!important;left:50%!important;right:auto!important;bottom:18px!important;top:auto!important;transform:translateX(-50%)!important;z-index:130!important;width:min(760px,calc(100% - 32px))!important;min-height:60px!important;max-height:130px!important;height:auto!important;margin:0!important;padding:7px 8px 7px 17px!important;display:flex!important;align-items:flex-end!important;gap:8px!important;background:rgba(255,255,255,.94)!important;border:1px solid #dce6f2!important;border-radius:25px!important;box-shadow:0 14px 42px rgba(35,72,119,.16)!important;backdrop-filter:blur(24px)!important;box-sizing:border-box!important}
    body.lvban-ai-mode #ai .composer textarea{flex:1 1 auto!important;width:auto!important;min-width:0!important;min-height:44px!important;max-height:100px!important;height:44px!important;padding:11px 2px!important;border:0!important;outline:0!important;background:transparent!important;color:#1f2b3f!important;font-size:14px!important;line-height:1.5!important;resize:none!important}
    body.lvban-ai-mode #ai .composer textarea::placeholder{color:#9ba8b9!important}
    body.lvban-ai-mode #ai .composer .btn{flex:0 0 46px!important;width:46px!important;height:46px!important;min-height:46px!important;padding:0!important;border-radius:17px!important;background:#1677ff!important;color:#fff!important;display:grid!important;place-items:center!important;font-size:0!important;font-weight:800!important;box-shadow:0 7px 16px rgba(22,119,255,.22)!important}
    body.lvban-ai-mode #ai .composer .btn:after{content:'↑';font-size:21px!important;line-height:1!important;font-weight:800!important;transform:translateY(-1px)!important}

    /* 左上角菜单按钮 */
    body.lvban-ai-mode #lvban-ai-history-menu-v1{left:18px!important;top:16px!important;width:42px!important;height:42px!important;border-radius:14px!important;background:rgba(255,255,255,.88)!important;color:#1677ff!important;border:1px solid #e1eaf5!important;box-shadow:0 8px 24px rgba(35,72,119,.10)!important;backdrop-filter:blur(20px)!important;font-size:19px!important}

    /* 历史侧栏：完全换成 mockup 的蓝白 iOS 风格 */
    body.lvban-ai-mode #lvban-ai-history-drawer-v1{z-index:200!important}
    body.lvban-ai-mode .lv-ai-history-backdrop{background:rgba(20,39,68,.22)!important;backdrop-filter:blur(5px)!important}
    body.lvban-ai-mode .lv-ai-history-panel{width:min(336px,86vw)!important;background:rgba(248,251,255,.98)!important;border-right:1px solid #e2ebf6!important;box-shadow:20px 0 60px rgba(29,63,105,.18)!important;padding:18px 15px 30px!important}
    body.lvban-ai-mode .lv-ai-history-brand{font-size:18px!important;color:#172033!important}
    body.lvban-ai-mode .lv-ai-history-brand small{color:#8795a8!important}
    body.lvban-ai-mode .lv-ai-history-close{background:#eaf3ff!important;color:#1677ff!important;border:0!important}
    body.lvban-ai-mode .lv-ai-history-new{background:#1677ff!important;border-radius:16px!important;box-shadow:0 10px 22px rgba(22,119,255,.20)!important}
    body.lvban-ai-mode .lv-ai-history-label{color:#8795a8!important}
    body.lvban-ai-mode .lv-ai-history-item{border:1px solid transparent!important;border-radius:16px!important;padding:12px 13px!important}
    body.lvban-ai-mode .lv-ai-history-item:hover{background:#fff!important}
    body.lvban-ai-mode .lv-ai-history-item.active{background:#fff!important;border-color:#dce8f6!important;box-shadow:0 6px 18px rgba(32,61,110,.07)!important}
    body.lvban-ai-mode .lv-ai-history-title{color:#243148!important;font-size:13px!important}
    body.lvban-ai-mode .lv-ai-history-meta{color:#98a5b5!important}

    /* 推荐卡片跟随新视觉 */
    body.lvban-ai-mode .lv-ai-recs{gap:10px!important}
    body.lvban-ai-mode .lv-ai-recs-title{color:#7e8ca0!important}
    body.lvban-ai-mode .lv-ai-rec{background:#fff!important;border:1px solid #e0e9f4!important;border-radius:19px!important;box-shadow:0 7px 22px rgba(35,72,119,.06)!important}
    body.lvban-ai-mode .lv-ai-rec-city{color:#1677ff!important}
    body.lvban-ai-mode .lv-ai-rec-btn{background:#1677ff!important;border-radius:13px!important}
    body.lvban-ai-mode .lv-ai-mask{z-index:250!important;background:rgba(20,39,68,.34)!important}
    body.lvban-ai-mode .lv-ai-sheet{background:#f7faff!important;border-radius:28px 28px 0 0!important}
    body.lvban-ai-mode .lv-ai-confirm{background:#1677ff!important}
    body.lvban-ai-mode .lv-ai-cancel{background:#eaf3ff!important;color:#1677ff!important}

    @media(max-width:760px){
      body.lvban-ai-mode #ai>.title{height:62px!important;min-height:62px!important;padding-left:64px!important;padding-right:64px!important}
      body.lvban-ai-mode #ai .messages{padding:22px 14px 104px!important;gap:14px!important}
      body.lvban-ai-mode #ai .messages .msg{max-width:88%!important;font-size:14px!important}
      body.lvban-ai-mode #ai .messages .msg.ai:first-child{max-width:100%!important;padding:17px 18px!important}
      body.lvban-ai-mode #ai .composer{left:12px!important;right:12px!important;bottom:12px!important;transform:none!important;width:auto!important;border-radius:22px!important;min-height:56px!important;padding-left:14px!important}
      body.lvban-ai-mode #ai .composer .btn{width:44px!important;height:44px!important;min-height:44px!important;flex-basis:44px!important;border-radius:15px!important}
      body.lvban-ai-mode #lvban-ai-history-menu-v1{left:11px!important;top:10px!important;width:40px!important;height:40px!important;border-radius:13px!important}
      body.lvban-ai-mode .lv-ai-history-panel{width:min(340px,88vw)!important}
    }
  `;
  function inject(){if(document.getElementById(STYLE_ID))return;const s=document.createElement('style');s.id=STYLE_ID;s.textContent=css;document.head.appendChild(s)}
  function sync(id){
    const ai=document.getElementById('ai');
    const active=!!(ai&&ai.classList.contains('active'));
    document.body.classList.toggle('lvban-ai-mode',active&&id==='ai');
    if(active){
      const b=document.getElementById('lvban-ai-history-menu-v1');if(b)b.style.setProperty('display','flex','important');
      const input=document.getElementById('aiInput');if(input)input.setAttribute('aria-label','输入你的旅行问题');
    }
  }
  function bind(){
    if(window.__lvbanAiMockupGoWrapped)return;
    const original=window.go;
    if(typeof original!=='function')return;
    window.go=function(id){const r=original.apply(this,arguments);setTimeout(()=>sync(id),0);return r};
    window.__lvbanAiMockupGoWrapped=true;
    sync(document.getElementById('ai')?.classList.contains('active')?'ai':'');
  }
  function boot(){inject();bind();setTimeout(()=>{if(document.getElementById('ai')?.classList.contains('active'))sync('ai')},120)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  setInterval(()=>{bind();const active=document.getElementById('ai')?.classList.contains('active');document.body.classList.toggle('lvban-ai-mode',!!active)},900);
})();
