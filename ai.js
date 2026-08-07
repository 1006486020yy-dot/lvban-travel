const ARK_URL = "https://ark.cn-beijing.volces.com/api/v3/chat/completions";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    }
  });
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ env }) {
  return json({
    ok: true,
    configured: Boolean(env?.ARK_API_KEY && env?.ARK_ENDPOINT_ID)
  });
}

export async function onRequestPost({ request, env }) {
  if (!env?.ARK_API_KEY || !env?.ARK_ENDPOINT_ID) {
    return json({
      error: "AI 后台尚未完成配置",
      code: "ARK_CONFIG_MISSING"
    }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "请求数据不是有效 JSON" }, 400);
  }

  const messages = Array.isArray(body?.messages) ? body.messages : [];
  if (!messages.length) {
    return json({ error: "缺少 messages" }, 400);
  }

  const payload = {
    model: env.ARK_ENDPOINT_ID,
    messages,
    temperature: typeof body.temperature === "number" ? body.temperature : 0.7,
    stream: false
  };

  try {
    const upstream = await fetch(ARK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.ARK_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text || "方舟接口返回了无法解析的内容" };
    }

    if (!upstream.ok) {
      return json({
        error: data?.error?.message || data?.error || `AI 接口请求失败（HTTP ${upstream.status}）`,
        upstreamStatus: upstream.status
      }, upstream.status);
    }

    return json(data, 200);
  } catch (error) {
    return json({
      error: error?.message || "AI 后台连接失败",
      code: "ARK_REQUEST_FAILED"
    }, 502);
  }
}
