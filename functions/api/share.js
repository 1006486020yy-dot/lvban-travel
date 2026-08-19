export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const key = (url.searchParams.get('id') || '').trim();
  const kv = env.LVBAN_KV;
  const json = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });

  if (!kv) return json({ ok: false, error: 'LVBAN_KV 未绑定' }, 500);
  if (request.method === 'OPTIONS') return new Response('', { status: 204 });

  if (request.method === 'POST') {
    const body = await request.json().catch(() => null);
    if (!body?.snapshot) return json({ ok: false, error: '缺少行程数据' }, 400);
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
    const record = { ...body, updatedAt: Date.now() };
    await kv.put(`share:${id}`, JSON.stringify(record), { expirationTtl: 60 * 60 * 24 * 180 });
    return json({ ok: true, id, mode: body.mode === 'edit' ? 'edit' : 'view' });
  }

  if (request.method === 'GET') {
    if (!key) return json({ ok: false, error: '缺少分享ID' }, 400);
    const raw = await kv.get(`share:${key}`);
    if (!raw) return json({ ok: false, error: '分享不存在或已过期' }, 404);
    return json({ ok: true, record: JSON.parse(raw) });
  }

  if (request.method === 'PUT') {
    if (!key) return json({ ok: false, error: '缺少分享ID' }, 400);
    const body = await request.json().catch(() => null);
    if (!body?.snapshot) return json({ ok: false, error: '缺少行程数据' }, 400);
    const raw = await kv.get(`share:${key}`);
    if (!raw) return json({ ok: false, error: '分享不存在或已过期' }, 404);
    const old = JSON.parse(raw);
    await kv.put(`share:${key}`, JSON.stringify({ ...old, snapshot: body.snapshot, updatedAt: Date.now() }), { expirationTtl: 60 * 60 * 24 * 180 });
    return json({ ok: true, updatedAt: Date.now() });
  }

  return json({ ok: false, error: 'Method Not Allowed' }, 405);
}
