export async function onRequestPost(context) {
  try {
    const env = context.env || {};
    const request = context.request;
    const body = await request.json().catch(() => ({}));

    const messages = Array.isArray(body.messages)
      ? body.messages.filter(x => x && x.content).map(x => ({
          role: x.role === 'assistant' ? 'assistant' : 'user',
          content: String(x.content)
        }))
      : (body.message ? [{ role: 'user', content: String(body.message) }] : []);

    if (!messages.length) return json({ success:false, error:'message_required', reply:'请告诉我你想怎么规划行程。' },400);

    const apiKey = env.ARK_API_KEY || env.VOLCENGINE_ARK_API_KEY || env.AI_API_KEY;
    const endpointId = env.ARK_ENDPOINT_ID || env.VOLCENGINE_ARK_ENDPOINT_ID || 'ep-20260803193724-nfb4m';
    const apiBase = (env.ARK_API_BASE || 'https://ark.cn-beijing.volces.com/api/v3').replace(/\/$/,'');
    if (!apiKey) return json({ success:false, error:'missing_api_key', reply:'AI 服务还没有配置 API Key，请到 Cloudflare Pages → Settings → Variables and Secrets 配置 ARK_API_KEY。' },500);

    const tripContext = body.tripContext ? `\n\n当前用户行程上下文：\n${String(body.tripContext).slice(0,12000)}` : '';
    const system = `你是「旅伴旅行管家」的 AI 旅行助手。始终使用中文。你要像真正的旅行管家一样回答：先给结论，再给可执行安排；不要空泛聊天。\n\n你支持：创建/修改/删除日程、优化路线、比较方案 A/B、添加景点/美食/酒店/交通、检查时间冲突、根据地址规划顺路路线。\n\n用户的行程层级是：一级「我的行程」→ 二级「旅行名称」（例如十一福建游）→ 三级「方案 A / 方案 B」→ 横向日期 → 当天时间轴。\n\n当用户明确要求修改行程时，优先输出可执行的数据建议，格式：操作｜日期｜时间｜类型｜名称｜地址｜说明。不要擅自改变用户已经确定的酒店和核心交通。地址缺失时明确标记「待补地址」，不要编造精确门牌号。\n\n当前旅行 App 支持：复制名称、复制地址、地图导航、加入行程、编辑、删除。你可以提醒用户使用这些操作。${tripContext}`;

    const response = await fetch(`${apiBase}/chat/completions`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${apiKey}` },
      body:JSON.stringify({ model:endpointId, messages:[{role:'system',content:system},...messages], temperature:typeof body.temperature==='number'?body.temperature:0.6, max_tokens:3000 })
    });
    const raw = await response.text();
    let data; try { data=JSON.parse(raw); } catch { data=null; }
    if (!response.ok) {
      console.error('Ark API error',response.status,raw.slice(0,2000));
      return json({ success:false,error:'ark_request_failed',status:response.status,reply:'AI 暂时连接失败，请稍后再试。' },502);
    }
    const reply=data?.choices?.[0]?.message?.content || '';
    if (!reply) return json({ success:false,error:'empty_ai_response',reply:'AI 没有返回有效内容，请换一种方式描述。' },502);
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
