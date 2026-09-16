/* 旅伴 AI · 本地多会话聊天记录
 * 仅负责 AI 历史会话 UI 与 localStorage，不改动原 askAI/API 逻辑。
 */
(function(){
  'use strict';
  if(window.__lvbanAiChatHistoryV1)return;
  window.__lvbanAiChatHistoryV1=true;

  const KEY='lvban_ai_chats_v1';
  const MAX_CHATS=40;
  const STYLE_ID='lvban-ai-history-style-v1';
  const DRAWER_ID='lvban-ai-history-drawer-v1';
  const BTN_ID='lvban-ai-history-menu-v1';
  const GREETING='你好，我是旅伴 AI。\n你可以直接说：\n• 把10月2日安排得轻松一点\n• 方案A和B哪个更适合我\n• 把某家店加入10月3日晚餐\n• 重新规划厦门半天行程';
  let store={version:1,activeId:null,chats:[]};
  let observer=null;
  let suppressUntil=0;
  let rendering=false;
  let ready=false;

  function uid(){return 'chat-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}
  function now(){return Date.now()}
  function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function loadStore(){
    try{
      const raw=localStorage.getItem(KEY);
      if(raw){const x=JSON.parse(raw);if(x&&Array.isArray(x.chats))store=x}
    }catch(e){console.warn('[旅伴 AI] 聊天记录读取失败',e)}
    if(!store.chats.length){
      const id=uid(),t=now();
      store={version:1,activeId:id,chats:[{id,title:'新聊天',createdAt:t,updatedAt:t,messages:[{role:'ai',content:GREETING,time:t}]}]};
      persist();
    }
    if(!store.chats.some(x=>x.id===store.activeId))store.activeId=store.chats[0].id;
  }
  function persist(){
    try{store.chats.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));store.chats=store.chats.slice(0,MAX_CHATS);localStorage.setItem(KEY,JSON.stringify(store))}
    catch(e){console.warn('[旅伴 AI] 聊天记录保存失败',e)}
  }
  function activeChat(){return store.chats.find(x=>x.id===store.activeId)||null}
  function titleFor(text){
    const s=String(text||'').replace(/\s+/g,' ').trim();
    if(!s)return '新聊天';
    return s.length>20?s.slice(0,20)+'…':s;
  }
  function dateLabel(ts){
    const d=new Date(ts||0),n=new Date();
    if(d.toDateString()===n.toDateString())return d.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
    const y=d.getFullYear()===n.getFullYear()?'':d.getFullYear()+'年';
    return y+(d.getMonth()+1)+'月'+d.getDate()+'日';
  }
  function injectStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
      #${BTN_ID}{position:fixed!important;left:14px!important;top:82px!important;z-index:145!important;width:42px!important;height:42px!important;border-radius:15px!important;background:#ffffffdf!important;color:#5d4de5!important;border:1px solid rgba(255,255,255,.95)!important;box-shadow:0 10px 28px rgba(64,58,138,.14)!important;backdrop-filter:blur(18px)!important;font-size:20px!important;display:none!important;align-items:center!important;justify-content:center!important;cursor:pointer!important}
      #${BTN_ID}.show{display:flex!important}
      #${DRAWER_ID}{position:fixed!important;inset:0!important;z-index:140!important;display:none!important;pointer-events:none!important}
      #${DRAWER_ID}.show{display:block!important;pointer-events:auto!important}
      .lv-ai-history-backdrop{position:absolute;inset:0;background:rgba(20,20,35,.24);backdrop-filter:blur(2px)}
      .lv-ai-history-panel{position:absolute;left:0;top:0;bottom:0;width:min(320px,86vw);background:rgba(247,248,252,.97);border-right:1px solid rgba(255,255,255,.9);box-shadow:18px 0 48px rgba(40,36,90,.16);padding:18px 14px 92px;overflow:auto;transform:translateX(-102%);transition:transform .22s ease;box-sizing:border-box}
      #${DRAWER_ID}.show .lv-ai-history-panel{transform:translateX(0)}
      .lv-ai-history-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:2px 4px 14px}
      .lv-ai-history-brand{font-size:18px;font-weight:900;color:#202033}.lv-ai-history-brand small{display:block;margin-top:3px;font-size:10px;color:#89879a;font-weight:600}
      .lv-ai-history-close{width:36px;height:36px;border-radius:12px;background:#efedff;color:#6958f5;font-size:18px}
      .lv-ai-history-new{width:100%;padding:12px 14px;border-radius:15px;background:#6958f5;color:#fff;font-weight:800;text-align:left;box-shadow:0 9px 22px rgba(105,88,245,.18);margin-bottom:18px}
      .lv-ai-history-label{font-size:11px;color:#8b8999;font-weight:800;margin:0 4px 8px}
      .lv-ai-history-list{display:grid;gap:7px}
      .lv-ai-history-item{width:100%;border:1px solid transparent;background:transparent;border-radius:15px;padding:11px 12px;text-align:left;cursor:pointer;box-sizing:border-box}
      .lv-ai-history-item:hover{background:#fff}
      .lv-ai-history-item.active{background:#fff;border-color:#e7e3fa;box-shadow:0 5px 16px rgba(64,58,138,.07)}
      .lv-ai-history-title{font-size:13px;font-weight:800;color:#2b293a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:4px}
      .lv-ai-history-meta{display:flex;justify-content:space-between;gap:8px;margin-top:5px;font-size:10px;color:#9997a7}
      .lv-ai-history-empty{padding:26px 10px;text-align:center;color:#9997a7;font-size:12px}
      .lv-ai-history-panel::-webkit-scrollbar{width:5px}.lv-ai-history-panel::-webkit-scrollbar-thumb{background:#ddd9ee;border-radius:10px}
      @media(max-width:760px){#${BTN_ID}{left:12px!important;top:76px!important;width:40px!important;height:40px!important;border-radius:14px!important}.lv-ai-history-panel{width:min(330px,84vw)}}
    `;document.head.appendChild(s);
  }
  function buildUI(){
    if(document.getElementById(DRAWER_ID))return;
    const b=document.createElement('button');b.id=BTN_ID;b.type='button';b.title='最近聊天';b.setAttribute('aria-label','最近聊天');b.textContent='☰';b.onclick=openDrawer;document.body.appendChild(b);
    const d=document.createElement('div');d.id=DRAWER_ID;d.innerHTML=`<div class="lv-ai-history-backdrop"></div><aside class="lv-ai-history-panel" aria-label="最近聊天"><div class="lv-ai-history-head"><div class="lv-ai-history-brand">旅伴 AI<small>最近聊天</small></div><button class="lv-ai-history-close" type="button" aria-label="收起">‹</button></div><button class="lv-ai-history-new" type="button">＋ 新建聊天</button><div class="lv-ai-history-label">最近不同聊天</div><div class="lv-ai-history-list"></div></aside>`;document.body.appendChild(d);
    d.querySelector('.lv-ai-history-backdrop').onclick=closeDrawer;
    d.querySelector('.lv-ai-history-close').onclick=closeDrawer;
    d.querySelector('.lv-ai-history-new').onclick=newChat;
  }
  function renderList(){
    const list=document.querySelector('#'+DRAWER_ID+' .lv-ai-history-list');if(!list)return;
    const chats=store.chats.slice().sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
    list.innerHTML=chats.length?chats.map(c=>{const last=c.messages?.[c.messages.length-1];return `<button class="lv-ai-history-item ${c.id===store.activeId?'active':''}" data-chat-id="${esc(c.id)}" type="button"><div class="lv-ai-history-title">${esc(c.title||'新聊天')}</div><div class="lv-ai-history-meta"><span>${esc(last?.content||'')}</span><span>${dateLabel(c.updatedAt)}</span></div></button>`}).join(''):'<div class="lv-ai-history-empty">还没有聊天记录</div>';
    list.querySelectorAll('.lv-ai-history-item').forEach(x=>x.onclick=()=>switchChat(x.dataset.chatId));
  }
  function setButtonVisible(){
    const ai=document.getElementById('ai'),b=document.getElementById(BTN_ID);if(!b)return;
    const yes=!!(ai&&ai.classList.contains('active'));b.classList.toggle('show',yes);if(!yes)closeDrawer();
  }
  function setTitleButton(){
    const ai=document.getElementById('ai');if(!ai)return;
    const title=ai.querySelector('.title');if(!title)return;
    if(!title.querySelector('.lv-ai-new-chat-inline')){
      const wrap=document.createElement('div');wrap.className='lv-ai-new-chat-inline';wrap.style.cssText='display:flex;align-items:center;gap:6px;margin-left:auto;';
      const btn=document.createElement('button');btn.className='btn';btn.type='button';btn.textContent='＋ 新聊天';btn.onclick=newChat;wrap.appendChild(btn);title.insertBefore(wrap,title.lastElementChild||null);
    }
  }
  function renderMessages(){
    const box=document.getElementById('messages'),chat=activeChat();if(!box||!chat)return;
    rendering=true;suppressUntil=performance.now()+250;box.innerHTML='';
    (chat.messages||[]).forEach(m=>{const el=document.createElement('div');el.className='msg '+(m.role==='user'?'user':'ai');el.textContent=m.content||'';box.appendChild(el)});
    const input=document.getElementById('aiInput');if(input)input.value='';
    requestAnimationFrame(()=>{box.scrollTop=box.scrollHeight;rendering=false});
  }
  function syncFromDOM(){
    if(rendering||performance.now()<suppressUntil)return;
    const chat=activeChat(),box=document.getElementById('messages');if(!chat||!box)return;
    const nodes=[...box.querySelectorAll('.msg')];
    const messages=nodes.map(n=>({role:n.classList.contains('user')?'user':'ai',content:n.textContent||'',time:now()}));
    if(!messages.length)return;
    const before=JSON.stringify(chat.messages||[]),after=JSON.stringify(messages);
    if(before!==after){chat.messages=messages;chat.updatedAt=now();const firstUser=messages.find(x=>x.role==='user');if(firstUser&&(!chat.title||chat.title==='新聊天'))chat.title=titleFor(firstUser.content);persist();renderList()}
  }
  function startObserver(){
    if(observer)return;const box=document.getElementById('messages');if(!box)return;
    observer=new MutationObserver(()=>{setTimeout(syncFromDOM,0)});observer.observe(box,{childList:true,subtree:true,characterData:true});
  }
  function openDrawer(){
    if(!document.getElementById('ai')?.classList.contains('active'))return;
    syncFromDOM();renderList();document.getElementById(DRAWER_ID)?.classList.add('show');
  }
  function closeDrawer(){document.getElementById(DRAWER_ID)?.classList.remove('show')}
  function newChat(){
    syncFromDOM();const id=uid(),t=now();store.chats.unshift({id,title:'新聊天',createdAt:t,updatedAt:t,messages:[{role:'ai',content:GREETING,time:t}]});store.activeId=id;persist();renderMessages();renderList();closeDrawer();setTimeout(()=>document.getElementById('aiInput')?.focus(),80);
  }
  function switchChat(id){
    if(!store.chats.some(x=>x.id===id))return;syncFromDOM();store.activeId=id;persist();renderMessages();renderList();closeDrawer();
  }
  function init(){
    loadStore();injectStyle();buildUI();renderList();setTitleButton();setButtonVisible();startObserver();ready=true;
    const ai=document.getElementById('ai');if(ai&&ai.classList.contains('active'))renderMessages();
  }
  const originalGo=window.go;
  if(typeof originalGo==='function'&&!window.__lvbanAiGoWrapped){
    window.go=function(id){const r=originalGo.apply(this,arguments);setTimeout(()=>{if(id==='ai'){setTitleButton();setButtonVisible();startObserver();if(ready)renderMessages()}else setButtonVisible()},0);return r};
    window.__lvbanAiGoWrapped=true;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  setInterval(()=>{if(ready){setButtonVisible();setTitleButton();startObserver()}},700);
  window.addEventListener('beforeunload',syncFromDOM);
})();
