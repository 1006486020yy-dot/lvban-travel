export async function onRequestPost(context) {
  try {
    const env = context.env || {};
    const request = context.request;
    const body = await request.json().catch(() => ({}));

    const rawMessages = Array.isArray(body.messages)
      ? body.messages.filter(x => x && x.content).map(x => ({
          role: x.role === 'assistant' ? 'assistant' : 'user',
          content: cleanText(x.content)
        }))
      : (body.message ? [{ role: 'user', content: cleanText(body.message) }] : []);

    if (!rawMessages.length) {
      return json({ success:false, error:'message_required', reply:'请告诉我你想怎么规划行程。' },400);
    }

    const apiKey = env.ARK_API_KEY || env.VOLCENGINE_ARK_API_KEY || env.AI_API_KEY;
    const endpointId = env.ARK_ENDPOINT_ID || env.VOLCENGINE_ARK_ENDPOINT_ID;
    const apiBase = (env.ARK_API_BASE || 'https://ark.cn-beijing.volces.com/api/v3').replace(/\/$/,'');

    if (!apiKey || !endpointId) {
      console.error('AI configuration is incomplete');
      return json({ success:false, error:'ai_not_configured', reply:'AI 服务暂时还没有完成配置，请稍后再试。' },500);
    }

    const latestUser = [...rawMessages].reverse().find(x => x.role === 'user')?.content || rawMessages.at(-1)?.content || '';
    const planning = /行程|路线|安排|调整|优化|方案|酒店|入住|交通|高铁|飞机|第[一二三四五六七八九十]天|DAY|加入日程|删除|景点顺序|时间冲突/.test(latestUser);

    // 只保留最近一轮上下文；不再把整段聊天历史重复发送给模型。
    const messages = rawMessages.slice(-2).map(x => ({
      role:x.role,
      content:x.content.slice(-700)
    }));

    // 仅在确实需要结合行程时携带极简行程摘要；普通问答完全不带 tripContext。
    const tripContext = planning ? compactTripContext(body.tripContext || body.context) : '';

    const system = planning
      ? '你是旅伴旅行管家。中文回答，直接给可执行结果；只依据用户提供的信息，不确定就说明待确认。不要长篇解释。'
      : '你是旅伴旅行管家。中文回答，简洁实用，先给结论，不要复述问题。';

    const userMessages = tripContext
      ? [...messages.slice(0,-1), { role:'user', content:`行程摘要：${tripContext}\n用户问题：${latestUser.slice(0,700)}` }]
      : [messages.at(-1)];

    // 普通问题控制在约 260 token 输出；复杂行程问题最多约 480 token。
    const maxTokens = planning ? 480 : 260;

    const response = await fetch(`${apiBase}/chat/completions`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${apiKey}` },
      body:JSON.stringify({
        model:endpointId,
        messages:[{role:'system',content:system},...userMessages],
        temperature:typeof body.temperature==='number'?Math.min(Math.max(body.temperature,0.2),0.6):0.4,
        max_tokens:maxTokens,
        return_token_usage:true
      })
    });

    const raw = await response.text();
    let data; try { data=JSON.parse(raw); } catch { data=null; }
    if (!response.ok) {
      console.error('AI provider error',response.status,raw.slice(0,2000));
      return json({ success:false,error:'provider_request_failed',reply:'AI 暂时连接失败，请稍后再试。' },502);
    }

    const reply=data?.choices?.[0]?.message?.content || '';
    if (!reply) return json({ success:false,error:'empty_ai_response',reply:'AI 暂时没有返回有效内容，请换一种方式描述。' },502);

    // usage 只用于前端/调试观察，不改变现有 UI 逻辑。
    return json({ success:true,reply,usage:data?.usage||null });
  } catch (error) {
    console.error('Cloudflare AI Function Error',error);
    return json({ success:false,error:'server_error',reply:'AI 服务暂时不可用，请稍后再试。' },500);
  }
}

function cleanText(value){
  return String(value ?? '').replace(/\s+/g,' ').trim().slice(0,4000);
}

function compactTripContext(value){
  if(value==null)return '';
  let raw=String(typeof value==='string'?value:JSON.stringify(value));
  if(!raw)return '';

  // 优先尝试解析本地 db/行程 JSON，只抽取名称、城市、日期和当天少量节点。
  try{
    const obj=typeof value==='object'?value:JSON.parse(raw);
    const trips=Array.isArray(obj?.trips)?obj.trips:(Array.isArray(obj)?obj:[]);
    if(trips.length){
      const out=[];
      trips.slice(0,2).forEach(t=>{
        const head=[t.name,t.city,t.people?`${t.people}人`:'' ].filter(Boolean).join(' · ');
        if(head)out.push(head);
        const plans=Array.isArray(t.plans)?t.plans:[];
        const p=plans[0];
        const days=Array.isArray(p?.days)?p.days:[];
        days.slice(-2).forEach(d=>{
          const items=Array.isArray(d.items)?d.items:[];
          const names=items.slice(0,5).map(i=>i?.name).filter(Boolean);
          out.push(`${d.label||''}${d.date?' '+d.date:''}: ${names.join('、')}`.trim());
        });
      });
      return out.join(' | ').slice(0,900);
    }
  }catch(e){ /* fallback below */ }

  // 如果前端传来的不是 JSON，只保留极短尾部，避免整份上下文重复计费。
  return raw.replace(/\s+/g,' ').slice(-900);
}

function json(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type'}});
}

export function onRequestOptions(){
  return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'}});
}
