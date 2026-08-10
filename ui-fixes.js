/* 旅伴旅行管家 UI 修复层 */
(function(){
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const toastMsg=t=>{if(window.toast) return window.toast(t);let x=document.getElementById('lv-toast');if(!x){x=document.createElement('div');x.id='lv-toast';x.style='position:fixed;left:50%;bottom:100px;transform:translateX(-50%);z-index:200;padding:10px 14px;border-radius:14px;background:#222;color:#fff;font-size:13px';document.body.appendChild(x)}x.textContent=t;clearTimeout(x._t);x.style.opacity=1;x._t=setTimeout(()=>x.style.opacity=0,1400)};
  function css(){
    if(document.getElementById('lv-fix-style'))return;
    const s=document.createElement('style');s.id='lv-fix-style';s.textContent=`
      .bottom{grid-template-columns:repeat(6,1fr)!important;max-width:720px}
      .bottom .create-tab{background:linear-gradient(135deg,#6958f5,#8c78ff)!important;color:#fff!important;border-radius:18px!important;transform:translateY(-8px);box-shadow:0 8px 20px rgba(105,88,245,.28)}
      .bottom .create-tab strong{font-size:25px!important;line-height:20px}
      .trip-card,.plan,.day,.tab,.day-tab{cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none}
      .trip-card:active,.plan:active,.day:active,.tab:active,.day-tab:active{transform:scale(.985)}
      .create-flow{display:grid;gap:14px}.create-step{padding:14px 15px;border-radius:18px;background:#f0eeff}.create-step span{display:block;color:#77788b;font-size:12px;margin-top:4px;line-height:1.5}.choice-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}.choice{padding:13px;border-radius:15px;background:#fff;border:1px solid #e8e6f4;color:#555;font-weight:700}.choice.on{background:#efedff;border:2px solid #6958f5;color:#5d4de5}.ai-quick{display:flex;gap:8px;overflow:auto;padding:3px 0 8px}.ai-quick button{white-space:nowrap;background:#f1efff;color:#5d4de5;border-radius:14px;padding:9px 12px}.ai-title{display:flex;align-items:center;gap:10px}.ai-orb{width:42px;height:42px;border-radius:15px;background:linear-gradient(135deg,#6958f5,#9b7af5);display:grid;place-items:center;color:#fff;font-size:21px}.ai-subtitle{color:#77788b;font-size:12px;margin-top:4px}.msg.ai{box-shadow:0 4px 18px rgba(50,45,100,.05)}
    `;document.head.appendChild(s);
  }
  function cleanTripLabels(){
    document.querySelectorAll('#tripDetail .crumb,#tripDetail .trip-level,#tripList .crumb,#tripList .trip-level').forEach(el=>{
      const t=(el.textContent||'').trim();
      if(/一级类目|二级类目|三级类目/.test(t))el.remove();
    });
  }
  function setupBottom(){
    const nav=document.querySelector('.bottom');if(!nav)return;
    nav.innerHTML=`<button data-page="home" onclick="go('home')"><strong>⌂</strong>首页</button><button data-page="trips" onclick="go('trips')"><strong>☷</strong>行程</button><button class="create-tab" onclick="openNewTrip()" aria-label="创建行程"><strong>＋</strong>创建</button><button data-page="spots" onclick="go('spots')"><strong>⌖</strong>景点</button><button data-page="food" onclick="go('food')"><strong>●</strong>美食</button><button data-page="ai" onclick="go('ai')"><strong>✦</strong>AI</button>`;
    const active=document.querySelector('.page.active')?.id||'home';nav.querySelectorAll('[data-page]').forEach(x=>x.classList.toggle('on',x.dataset.page===active));
  }
  const oldGo=window.go;
  window.go=function(id){oldGo?.(id);setTimeout(()=>{setupBottom();cleanTripLabels();if(id==='ai')setupAI();},0)};
  const oldRender=window.renderTrips;
  window.renderTrips=function(){oldRender?.();setTimeout(()=>{cleanTripLabels();setupBottom();},0)};
  function setupAI(){
    const page=document.getElementById('ai');if(!page)return;
    const title=page.querySelector('.title');if(title){title.innerHTML=`<div class="ai-title"><div class="ai-orb">✦</div><div><h2 style="margin:0">旅伴 AI</h2><div class="ai-subtitle">你的专属旅行规划助手</div></div></div>`;}
    const oldQuick=page.querySelector('.ai-quick');if(!oldQuick){
      const panel=page.querySelector('.panel');if(panel){const q=document.createElement('div');q.className='ai-quick';q.innerHTML=['帮我优化今天行程','方案 A 和 B 怎么选','把这个景点加入行程','帮我安排厦门一天'].map(t=>`<button onclick="aiQuick(${JSON.stringify(t)})">${t}</button>`).join('');panel.insertBefore(q,panel.firstChild);}
    }
    const composer=page.querySelector('.composer');if(composer){const ta=page.querySelector('#aiInput');if(ta)ta.placeholder='告诉我你的旅行需求，例如：把10月2日安排得轻松一点';}
    page.querySelectorAll('*').forEach(el=>{if(el.children.length===0&&/火山方舟|已接\\s*\/api\/ai/.test(el.textContent||''))el.textContent='';});
  }
  window.aiQuick=function(text){const i=document.getElementById('aiInput');if(i){i.value=text;window.askAI?.();}};
  window.askAI=async function(){
    const input=document.getElementById('aiInput'),box=document.getElementById('messages');if(!input||!box)return;const text=input.value.trim();if(!text)return;input.value='';box.insertAdjacentHTML('beforeend',`<div class="msg user">${esc(text)}</div>`);const pending=document.createElement('div');pending.className='msg ai';pending.textContent='正在思考…';box.appendChild(pending);box.scrollTop=box.scrollHeight;
    try{
      const t=window.currentTrip?.(),p=window.currentPlan?.(),d=p?.days?.[window.activeDay||0];
      const context=d?`旅行：${t?.name||'未命名'}\n方案：${p?.name||'方案 A'}\n日期：${d.date}\n当天主题：${d.title}\n当天行程：${JSON.stringify(d.items||[])}`:'';
      const r=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'user',content:text}],tripContext:context})});
      const j=await r.json();pending.textContent=j.reply||'暂时没有得到回复，请稍后再试。';
    }catch(e){pending.textContent='AI 暂时连接不上，请稍后再试。';}
    box.scrollTop=box.scrollHeight;
  };
  function init(){css();setupBottom();cleanTripLabels();setupAI();setTimeout(()=>{setupBottom();cleanTripLabels();setupAI();},250);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();