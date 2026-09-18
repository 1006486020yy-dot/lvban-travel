/* 旅伴 AI · Quick Prompts V1.1
 * 快捷问题不是固定卡片：只在新聊天且输入框为空时出现，并独立于输入框。
 */
(function(){
  'use strict';
  if(window.__lvbanAiQuickPromptsV11)return;
  window.__lvbanAiQuickPromptsV11=true;
  const STYLE_ID='lvban-ai-quick-prompts-style-v11';
  const ROOT_ID='lvban-ai-quick-prompts-v1';
  const REMOVE_PROMPTS=['把我的行程安排得更轻松一点','帮我优化今天的路线','帮我看看有哪些景点可以删掉'];
  const css=`
    body.lvban-ai-mode #${ROOT_ID}{position:fixed!important;left:50%!important;bottom:155px!important;transform:translateX(-50%)!important;width:min(760px,calc(100% - 32px))!important;display:flex!important;justify-content:flex-end!important;gap:8px!important;z-index:125!important;pointer-events:none!important;box-sizing:border-box!important;transition:opacity .18s ease,transform .18s ease!important}
    body.lvban-ai-mode #${ROOT_ID}.lv-ai-quick-hidden{opacity:0!important;visibility:hidden!important;transform:translate(-50%,8px)!important;pointer-events:none!important}
    body.lvban-ai-mode #${ROOT_ID} button{pointer-events:auto!important;border:1px solid #d4e3f5!important;background:#fff!important;color:#3971b7!important;border-radius:18px!important;padding:8px 14px!important;font-size:12px!important;line-height:18px!important;white-space:nowrap!important;box-shadow:0 6px 18px rgba(40,83,135,.08)!important;backdrop-filter:blur(18px)!important;cursor:pointer!important;transition:all .16s ease!important}
    body.lvban-ai-mode #${ROOT_ID} button:hover{border-color:#a9c9ee!important;transform:translateY(-1px)!important}
    @media(max-width:760px){
      body.lvban-ai-mode #${ROOT_ID}{bottom:140px!important;width:calc(100% - 24px)!important;justify-content:flex-start!important;overflow-x:auto!important;padding:0 2px 2px!important;scrollbar-width:none!important}
      body.lvban-ai-mode #${ROOT_ID}::-webkit-scrollbar{display:none}
      body.lvban-ai-mode #${ROOT_ID} button{font-size:12px!important;padding:7px 11px!important;border-radius:16px!important}
    }
  `;
  function inject(){if(document.getElementById(STYLE_ID))return;const s=document.createElement('style');s.id=STYLE_ID;s.textContent=css;document.head.appendChild(s)}
  function active(){return !!document.getElementById('ai')?.classList.contains('active')}
  function root(){let el=document.getElementById(ROOT_ID);if(!el){el=document.createElement('div');el.id=ROOT_ID;document.body.appendChild(el)}return el}
  function latestText(){const msgs=document.querySelectorAll('#messages .msg');return msgs.length?String(msgs[msgs.length-1].textContent||''):''}
  function hasUserMessage(){return !!document.querySelector('#messages .msg.user')}
  const defaultPrompts=['帮我规划一个周末旅行','推荐附近值得去的景点','帮我找当地特色美食'];
  const promptSets=[
    {keys:['福州','平潭','厦门','福建','旅行','行程'],items:[]},
    {keys:['吃','美食','餐厅','饭','午餐','晚餐'],items:['推荐当地特色美食','帮我把这家店加入行程','附近还有什么值得吃的']},
    {keys:['景点','游玩','哪里','推荐'],items:['推荐几个值得去的地方','这个景点值得去吗？','帮我安排半天游玩路线']}
  ];
  function choose(){const text=latestText();for(const set of promptSets)if(set.keys.some(k=>text.includes(k)))return set.items;return defaultPrompts}
  function send(text){const input=document.getElementById('aiInput');if(!input)return;input.value=text;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();if(typeof window.askAI==='function')window.askAI()}
  function render(){if(!active()){const stale=document.getElementById(ROOT_ID);if(stale)stale.remove();return}const el=root();el.innerHTML='';const input=document.getElementById('aiInput');const shouldShow=!!input&&!String(input.value||'').trim()&&!hasUserMessage();if(!shouldShow){el.classList.add('lv-ai-quick-hidden');return}choose().forEach(text=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=()=>send(text);el.appendChild(b)});el.classList.remove('lv-ai-quick-hidden')}
  function observe(){const messages=document.getElementById('messages');if(messages&&!messages.__lvbanQuickObserved){messages.__lvbanQuickObserved=true;new MutationObserver(render).observe(messages,{childList:true,subtree:true})}const input=document.getElementById('aiInput');if(input&&!input.__lvbanQuickBound){input.__lvbanQuickBound=true;input.addEventListener('input',render);input.addEventListener('focus',render)}}
  function sync(){observe();render()}
  function bindGo(){if(window.__lvbanAiQuickGoWrappedV11)return;const original=window.go;if(typeof original!=='function')return;window.go=function(id){if(id!=='ai'){const el=document.getElementById(ROOT_ID);if(el)el.remove()}const r=original.apply(this,arguments);setTimeout(()=>{if(id==='ai')sync();else{const el=document.getElementById(ROOT_ID);if(el)el.remove()}},0);return r};window.__lvbanAiQuickGoWrappedV11=true}
  function boot(){inject();bindGo();setTimeout(sync,120)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  setInterval(()=>{bindGo();if(active())sync()},1000);
})();
