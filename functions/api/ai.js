export async function onRequestPost(context) {
  try {
    const env = context.env || {};
    const request = context.request;
    const body = await request.json().catch(() => ({}));

    const messages = Array.isArray(body.messages)
      ? body.messages.filter(x => x && x.content).map(x => ({
          role: x.role === 'assistant' ? 'assistant' : 'user',
          content: String(x.content).slice(0, 12000)
        }))
      : (body.message ? [{ role: 'user', content: String(body.message).slice(0, 12000) }] : []);

    if (!messages.length) {
      return json({ success:false, error:'message_required', reply:'请告诉我你想怎么规划行程。' },400);
    }

    const apiKey = env.ARK_API_KEY || env.VOLCENGINE_ARK_API_KEY || env.AI_API_KEY;
    const endpointId = env.ARK_ENDPOINT_ID || env.VOLCENGINE_ARK_ENDPOINT_ID;
    const apiBase = (env.ARK_API_BASE || 'https://ark.cn-beijing.volces.com/api/v3').replace(/\/$/,'');

    if (!apiKey || !endpointId) {
      console.error('AI configuration is incomplete');
      return json({ success:false, error:'ai_not_configured', reply:'AI 服务暂时还没有完成配置，请稍后再试。' },500);
    }

    const tripContext = body.tripContext || body.context
      ? `\n\n当前用户行程上下文：\n${String(body.tripContext || JSON.stringify(body.context)).slice(0,16000)}`
      : '';

    const system = `你是「旅伴旅行管家」里的旅行 AI 助手。始终使用中文，回答要像真正的旅行管家：先给结论，再给可以直接执行的安排。\n\n你可以帮助用户创建、调整和优化旅行计划；比较不同方案；安排景点、美食、酒店和交通；检查时间冲突；根据地址规划顺路路线。\n\n用户的行程结构是：旅行名称 → 方案 A / 方案 B → 日期 → 当天时间轴。\n\n当用户要求修改行程时，优先给出清晰的可执行结果，包含日期、时间、类型、名称、地址和说明。不要擅自改变用户已经确定的酒店和核心交通。地址不确定时写「待补地址」，不要编造精确门牌号。${tripContext}`;

    const response = await fetch(`${apiBase}/chat/completions`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${apiKey}` },
      body:JSON.stringify({
        model:endpointId,
        messages:[{role:'system',content:system},...messages],
        temperature:typeof body.temperature==='number'?body.temperature:0.6,
        max_tokens:3000
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
    return json({ success:true,reply });
  } catch (error) {
    console.error('Cloudflare AI Function Error',error);
    return json({ success:false,error:'server_error',reply:'AI 服务暂时不可用，请稍后再试。' },500);
  }
}

function json(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type'}});
}

export function onRequestOptions(){
  return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'}});
}
