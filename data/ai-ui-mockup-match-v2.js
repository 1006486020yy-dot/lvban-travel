/* 旅伴 AI · Mockup UI Match V2
 * 按用户确认的 UI 参考图实现 AI 页面视觉与组件。
 * 只处理 AI 页面；不替换 askAI / API / 其他业务页面。
 */
(function(){
  'use strict';
  if(window.__lvbanAiMockupMatchV2)return;
  window.__lvbanAiMockupMatchV2=true;

  const STYLE_ID='lvban-ai-mockup-match-style-v2';
  const css=`
    body.lvban-ai-mode{background:#f7faff!important;overflow:hidden!important}
    body.lvban-ai-mode .app{max-width:none!important;width:100%!important;margin:0!important;padding:0!important}
    body.lvban-ai-mode .top{display:none!important}
    body.lvban-ai-mode #ai{position:fixed!important;inset:0!important;z-index:30!important;display:flex!important;flex-direction:column!important;padding:0!important;background:linear-gradient(180deg,#fafdff 0%,#f3f8ff 100%)!important;overflow:hidden!important}

    /* 顶栏 */
    body.lvban-ai-mode #ai>.title{height:66px!important;min-height:66px!important;margin:0!important;padding:0 62px!important;display:flex!important;align-items:center!important;justify-content:center!important;position:relative!important;background:rgba(255,255,255,.86)!important;border-bottom:1px solid #e5edf7!important;backdrop-filter:blur(24px)!important;z-index:80!important;box-sizing:border-box!important}
    body.lvban-ai-mode #ai>.title>div:first-child{text-align:center!important}
    body.lvban-ai-mode #ai>.title h2{font-size:18px!important;line-height:24px!important;font-weight:850!important;color:#172033!important;margin:0!important;letter-spacing:-.2px!important}
    body.lvban-ai-mode #ai>.title .muted,body.lvban-ai-mode #ai>.title>.trip-level{display:none!important}
    body.lvban-ai-mode #ai .lv-ai-new-chat-inline{display:none!important}

    /* AI 内容区 */
    body.lvban-ai-mode #ai>.panel.chat{position:relative!important;flex:1 1 auto!important;min-height:0!important;height:auto!important;padding:0!important;margin:0!important;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;display:flex!important;overflow:hidden!important}
    body.lvban-ai-mode #ai .messages{width:min(820px,100%)!important;max-width:820px!important;margin:0 auto!important;padding:26px 22px 150px!important;min-height:0!important;height:100%!important;overflow-y:auto!important;overflow-x:hidden!important;display:flex!important;flex-direction:column!important;gap:15px!important;scroll-behavior:smooth!important}
    body.lvban-ai-mode #ai .messages::-webkit-scrollbar{width:6px}body.lvban-ai-mode #ai .messages::-webkit-scrollbar-thumb{background:#d9e6f4;border-radius:10px}
    body.lvban-ai-mode #ai .messages .msg{font-size:14px!important;line-height:1.72!important;max-width:78%!important;width:max-content!important;min-height:0!important;padding:13px 16px!important;border-radius:20px!important;box-shadow:none!important;white-space:pre-wrap!important}
    body.lvban-ai-mode #ai .messages .msg.ai{align-self:flex-start!important;background:#fff!important;color:#273248!important;border:1px solid #e1eaf4!important;border-bottom-left-radius:8px!important;box-shadow:0 7px 22px rgba(38,78,126,.055)!important}
    body.lvban-ai-mode #ai .messages .msg.user{align-self:flex-end!important;background:#1681ff!important;color:#fff!important;border:0!important;border-bottom-right-radius:8px!important;box-shadow:0 8px 22px rgba(22,129,255,.19)!important}
    body.lvban-ai-mode #ai .messages .msg.ai:first-child{max-width:min(680px,100%)!important;padding:19px 20px!important;border-radius:23px!important;border-bottom-left-radius:10px!important;background:linear-gradient(145deg,#fff,#f8fbff)!important;border-color:#dce8f5!important;box-shadow:0 12px 34px rgba(38,78,126,.08)!important;font-size:15px!important}

    /* 首页欢迎区：参考图中的机器人 + 快捷卡片 */
    body.lvban-ai-mode #lvban-ai-welcome-v2{width:min(820px,100%);margin:0 auto;padding:22px 22px 8px;box-sizing:border-box;text-align:center}
    body.lvban-ai-mode #lvban-ai-welcome-v2 .robot{width:72px;height:72px;margin:4px auto 12px;border-radius:24px;display:grid;place-items:center;font-size:40px;background:linear-gradient(145deg,#eaf4ff,#cfe4ff);box-shadow:0 14px 34px rgba(55,126,210,.16)}
    body.lvban-ai-mode #lvban-ai-welcome-v2 h3{margin:0;color:#172033;font-size:19px;font-weight:850}
    body.lvban-ai-mode #lvban-ai-welcome-v2 p{margin:7px 0 16px;color:#8291a6;font-size:12px;line-height:1.65}
    body.lvban-ai-mode #lvban-ai-quick-v2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;text-align:left}
    body.lvban-ai-mode .lv-ai-quick-card{min-height:72px;padding:12px;border-radius:18px;border:1px solid #e0eaf5;background:rgba(255,255,255,.94);box-shadow:0 8px 22px rgba(38,78,126,.055);cursor:pointer;display:flex;align-items:center;gap:10px;box-sizing:border-box}
    body.lvban-ai-mode .lv-ai-quick-icon{width:38px;height:38px;flex:0 0 38px;border-radius:13px;display:grid;place-items:center;background:#edf5ff;font-size:20px}
    body.lvban-ai-mode .lv-ai-quick-card b{display:block;color:#273248;font-size:13px}body.lvban-ai-mode .lv-ai-quick-card span{display:block;margin-top:3px;color:#96a3b3;font-size:10px}

    /* 输入框 */
    body.lvban-ai-mode #ai .composer{position:fixed!important;left:50%!important;right:auto!important;bottom:76px!important;top:auto!important;transform:translateX(-50%)!important;z-index:130!important;width:min(760px,calc(100% - 32px))!important;min-height:58px!important;max-height:130px!important;height:auto!important;margin:0!important;padding:6px 7px 6px 13px!important;display:flex!important;align-items:flex-end!important;gap:7px!important;background:rgba(255,255,255,.96)!important;border:1px solid #dbe6f2!important;border-radius:25px!important;box-shadow:0 13px 38px rgba(35,76,124,.15)!important;backdrop-filter:blur(24px)!important;box-sizing:border-box!important}
    body.lvban-ai-mode #ai .composer textarea{flex:1 1 auto!important;width:auto!important;min-width:0!important;min-height:44px!important;max-height:100px!important;height:44px!important;padding:10px 3px!important;border:0!important;outline:0!important;background:transparent!important;color:#1f2b3f!important;font-size:14px!important;line-height:1.5!important;resize:none!important}
    body.lvban-ai-mode #ai .composer textarea::placeholder{color:#9ba8b9!important}
    body.lvban-ai-mode #ai .composer .btn{flex:0 0 45px!important;width:45px!important;height:45px!important;min-height:45px!important;padding:0!important;border-radius:16px!important;background:#1681ff!important;color:#fff!important;display:grid!important;place-items:center!important;font-size:0!important;font-weight:800!important;box-shadow:0 7px 16px rgba(22,129,255,.22)!important}
    body.lvban-ai-mode #ai .composer .btn:after{content:'➤';font-size:17px!important;line-height:1!important;transform:translateX(1px)!important}

    /* AI 底部主导航：保留原有 go()，视觉改为参考图 */
    body.lvban-ai-mode .bottom{display:grid!important;position:fixed!important;left:50%!important;bottom:8px!important;transform:translateX(-50%)!important;width:min(680px,calc(100% - 20px))!important;z-index:125!important;padding:6px!important;border-radius:22px!important;background:rgba(255,255,255,.92)!important;border:1px solid #e1eaf4!important;box-shadow:0 12px 34px rgba(35,76,124,.13)!important;backdrop-filter:blur(22px)!important}
    body.lvban-ai-mode .bottom button{background:transparent!important;color:#8391a3!important;padding:6px 4px!important;border-radius:15px!important;font-size:10px!important}
    body.lvban-ai-mode .bottom button.on{background:#eaf3ff!important;color:#1681ff!important}
    body.lvban-ai-mode .bottom strong{display:block!important;font-size:18px!important;line-height:20px!important}

    /* 历史菜单 */
    body.lvban-ai-mode #lvban-ai-history-menu-v1{left:12px!important;top:12px!important;width:42px!important;height:42px!important;border-radius:14px!important;background:rgba(255,255,255,.9)!important;color:#1681ff!important;border:1px solid #dfe9f5!important;box-shadow:0 8px 24px rgba(35,76,124,.11)!important;backdrop-filter:blur(20px)!important;font-size:19px!important}
    body.lvban-ai-mode #lvban-ai-history-drawer-v1{z-index:200!important}
    body.lvban-ai-mode .lv-ai-history-backdrop{background:rgba(21,46,78,.20)!important;backdrop-filter:blur(5px)!important}
    body.lvban-ai-mode .lv-ai-history-panel{width:min(330px,86vw)!important;background:rgba(248,251,255,.98)!important;border-right:1px solid #dfe9f5!important;box-shadow:20px 0 60px rgba(29,63,105,.18)!important;padding:18px 15px 90px!important}
    body.lvban-ai-mode .lv-ai-history-brand{font-size:18px!important;color:#172033!important}.lv-ai-history-brand small{color:#8795a8!important}
    body.lvban-ai-mode .lv-ai-history-close{background:#eaf3ff!important;color:#1681ff!important;border:0!important}
    body.lvban-ai-mode .lv-ai-history-new{background:#1681ff!important;border-radius:16px!important;box-shadow:0 10px 22px rgba(22,129,255,.20)!important}
    body.lvban-ai-mode .lv-ai-history-label{color:#8795a8!important}.lv-ai-history-item{border-radius:16px!important}
    body.lvban-ai-mode .lv-ai-history-item.active{background:#fff!important;border-color:#dce8f6!important;box-shadow:0 6px 18px rgba(32,61,110,.07)!important}
    body.lvban-ai-mode .lv-ai-history-title{color:#243148!important}.lv-ai-history-meta{color:#98a5b5!important}

    /* 右下角回到首页/功能栏：参考图最后一屏 */
    #lvban-ai-nav-fab-v2{position:fixed;right:18px;bottom:84px;z-index:155;display:none;flex-direction:column;align-items:flex-end;gap:8px}
    body.lvban-ai-mode #lvban-ai-nav-fab-v2{display:flex}
    #lvban-ai-nav-fab-v2 .fab-menu{display:none;flex-direction:column;gap:7px;padding:8px;border-radius:20px;background:rgba(255,255,255,.96);border:1px solid #dce7f4;box-shadow:0 14px 40px rgba(29,63,105,.16);backdrop-filter:blur(20px)}
    #lvban-ai-nav-fab-v2.open .fab-menu{display:flex}
    #lvban-ai-nav-fab-v2 button{width:42px;height:42px;border-radius:14px;border:1px solid #e0e9f4;background:#fff;color:#5f7187;font-size:11px;font-weight:800;box-shadow:0 5px 15px rgba(35,76,124,.06)}
    #lvban-ai-nav-fab-v2 button.home{background:#1681ff;color:#fff;border-color:#1681ff}
    #lvban-ai-nav-fab-v2 .fab-toggle{width:46px;height:46px;border-radius:16px;background:#1681ff;color:#fff;border:0;font-size:18px;box-shadow:0 10px 24px rgba(22,129,255,.25)}

    @media(max-width:760px){
      body.lvban-ai-mode #ai>.title{height:58px!important;min-height:58px!important;padding:0 55px!important}
      body.lvban-ai-mode #ai .messages{padding:18px 12px 138px!important;gap:12px!important}
      body.lvban-ai-mode #ai .messages .msg{max-width:88%!important;font-size:14px!important}
      body.lvban-ai-mode #ai .messages .msg.ai:first-child{max-width:100%!important;padding:16px 17px!important}
      body.lvban-ai-mode #lvban-ai-welcome-v2{padding:18px 12px 4px}.lv-ai-quick-card{min-height:68px!important;padding:10px!important}
      body.lvban-ai-mode #ai .composer{left:10px!important;right:10px!important;bottom:68px!important;transform:none!important;width:auto!important;border-radius:21px!important;min-height:54px!important}
      body.lvban-ai-mode #ai .composer .btn{width:43px!important;height:43px!important;min-height:43px!important;flex-basis:43px!important;border-radius:15px!important}
      body.lvban-ai-mode .bottom{width:calc(100% - 16px)!important;bottom:7px!important;border-radius:21px!important}
      body.lvban-ai-mode #lvban-ai-history-menu-v1{left:9px!important;top:9px!important;width:40px!important;height:40px!important}
      #lvban-ai-nav-fab-v2{right:10px;bottom:128px}
    }
  `;

  function inject(){if(document.getElementById(STYLE_ID))return;const s=document.createElement('style');s.id=STYLE_ID;s.textContent=css;document.head.appendChild(s)}
  function active(){return !!document.getElementById('ai')?.classList.contains('active')}
  function quickAction(text){const input=document.getElementById('aiInput');if(!input)return;input.value=text;input.focus();input.dispatchEvent(new Event('input',{bubbles:true}))}
  function ensureWelcome(){
    const chat=document.querySelector('#ai>.chat');if(!chat)return;
    let box=document.getElementById('lvban-ai-welcome-v2');
    if(!box){
      box=document.createElement('div');box.id='lvban-ai-welcome-v2';
      box.innerHTML='<div class="robot">🤖</div><h3>你的专属旅行规划助手</h3><p>问我任何旅行问题，我来为你规划<br>行程、景点、美食、酒店……</p><div id="lvban-ai-quick-v2"><button class="lv-ai-quick-card" type="button"><span class="lv-ai-quick-icon">✈️</span><span><b>行程规划</b><span>定制专属行程</span></span></button><button class="lv-ai-quick-card" type="button"><span class="lv-ai-quick-icon">🏔️</span><span><b>景点推荐</b><span>热门景点攻略</span></span></button><button class="lv-ai-quick-card" type="button"><span class="lv-ai-quick-icon">🍜</span><span><b>美食推荐</b><span>当地特色美食</span></span></button><button class="lv-ai-quick-card" type="button"><span class="lv-ai-quick-icon">💬</span><span><b>旅行问答</b><span>解决旅行疑问</span></span></button></div>';
      const panel=chat;panel.insertBefore(box,panel.firstChild);
      const qs=[
        '帮我规划一个轻松的福建旅行行程',
        '推荐平潭值得去的景点',
        '推荐厦门当地特色美食',
        '厦门旅行有哪些需要注意的问题？'
      ];
      box.querySelectorAll('.lv-ai-quick-card').forEach((b,i)=>b.onclick=()=>quickAction(qs[i]));
    }
    const isHome=document.body.dataset.lvAiScreen!=='chat';
    box.style.display=isHome?'block':'none';
  }
  function ensureFab(){
    if(document.getElementById('lvban-ai-nav-fab-v2'))return;
    const wrap=document.createElement('div');wrap.id='lvban-ai-nav-fab-v2';
    wrap.innerHTML='<div class="fab-menu"><button class="home" data-go="home">⌂<br>回到首页</button><button data-go="trips">▣<br>行程</button><button data-go="spots">⌖<br>景点</button><button data-go="food">●<br>美食</button><button data-go="ai">✦<br>AI</button></div><button class="fab-toggle" type="button" aria-label="打开功能栏">⌂</button>';
    document.body.appendChild(wrap);
    wrap.querySelector('.fab-toggle').onclick=()=>wrap.classList.toggle('open');
    wrap.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{wrap.classList.remove('open');if(typeof window.go==='function')window.go(b.dataset.go)});
  }
  function sync(id){
    const on=active()&&id==='ai';
    document.body.classList.toggle('lvban-ai-mode',on);
    if(on){ensureWelcome();ensureFab();setTimeout(ensureWelcome,100);}
    else{document.body.dataset.lvAiScreen='home'}
  }
  function bind(){
    if(window.__lvbanAiMockupGoWrappedV2)return;
    const original=window.go;if(typeof original!=='function')return;
    window.go=function(id){
      if(id==='ai')document.body.dataset.lvAiScreen='home';
      const r=original.apply(this,arguments);
      setTimeout(()=>{sync(id)},0);
      return r;
    };
    window.__lvbanAiMockupGoWrappedV2=true;
  }
  function boot(){inject();bind();ensureFab();if(active())sync('ai')}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  setInterval(()=>{bind();if(active()){document.body.classList.add('lvban-ai-mode');ensureWelcome();ensureFab()}else document.body.classList.remove('lvban-ai-mode')},800);
  document.addEventListener('click',e=>{if(e.target.closest('#ai .messages .msg.user'))document.body.dataset.lvAiScreen='chat';ensureWelcome()},true);
})();
