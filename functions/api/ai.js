export async function onRequestPost(context) {
  try {
    const env = context.env || {};
    const request = context.request;

    const body = await request.json().catch(() => ({}));

    /*
     * 兼容前端两种请求方式：
     *
     * 1. { message: "..." }
     * 2. { messages: [{role:"user", content:"..."}] }
     */
    let messages = [];

    if (Array.isArray(body.messages)) {
      messages = body.messages
        .filter(item => item && item.content)
        .map(item => ({
          role: item.role === "assistant" ? "assistant" : "user",
          content: String(item.content)
        }));
    }

    if (!messages.length && body.message) {
      messages = [
        {
          role: "user",
          content: String(body.message)
        }
      ];
    }

    if (!messages.length) {
      return json(
        {
          success: false,
          error: "message_required",
          reply: "请告诉我你想规划什么。"
        },
        400
      );
    }

    /*
     * Cloudflare Variables / Secrets
     *
     * ARK_API_KEY
     * ARK_ENDPOINT_ID
     */
    const apiKey =
      env.ARK_API_KEY ||
      env.VOLCENGINE_ARK_API_KEY ||
      env.AI_API_KEY;

    const endpointId =
      env.ARK_ENDPOINT_ID ||
      env.VOLCENGINE_ARK_ENDPOINT_ID ||
      "ep-20260803193724-nfb4m";

    const apiBase =
      env.ARK_API_BASE ||
      "https://ark.cn-beijing.volces.com/api/v3";

    if (!apiKey) {
      return json(
        {
          success: false,
          error: "missing_api_key",
          reply: "AI 服务还没有配置 API Key，请检查 Cloudflare 的 Variables and Secrets。"
        },
        500
      );
    }

    /*
     * 系统提示词
     */
    const systemMessage = {
      role: "system",
      content: `
你是「旅伴旅行管家」的 AI 旅行助手。

你的核心能力：

1. AI 人工智能旅行助手
2. AI 创建和编辑行程
3. AI 添加景点
4. AI 添加美食
5. AI 添加酒店
6. AI 创建城市
7. AI 冲突检测
8. AI 自动优化路线

你需要理解用户的旅行计划，并帮助用户直接生成可以加入「我的行程」的数据。

你尤其需要理解下面的层级：

一级：
旅行总行程

例如：
「国庆福建旅行」
「厦门三日游」
「日本大阪自由行」

二级：
城市 / 地方

例如：
福州
平潭
泉州
厦门

三级：
具体行程项目

例如：
景点
美食
酒店
交通
其他活动

用户可以：

- 创建一级旅行
- 创建二级城市
- 在城市下面创建景点、美食、酒店、交通
- 通过 AI 自动添加
- 手动编辑
- 删除
- 调整时间
- 调整顺序
- 优化路线

当用户要求添加内容时，要尽量返回结构化结果。

推荐格式：

名称：
类型：
城市：
日期：
开始时间：
结束时间：
地址：
说明：
建议停留时间：
推荐理由：

如果用户要求添加多个项目，则逐个列出。

如果用户要求优化路线：

需要考虑：

- 地理位置
- 距离
- 交通时间
- 景点开放时间
- 吃饭时间
- 用户已经确定的行程
- 避免来回折返
- 避免时间冲突
- 不要安排得过于紧张

如果发现冲突，要明确告诉用户：

冲突项目：
冲突时间：
冲突原因：
建议调整：

如果用户要求创建城市：

返回：

城市名称：
所属旅行：
建议天数：
推荐景点：
推荐美食：
推荐酒店：
推荐交通：

如果用户要求添加景点：

返回：

名称：
类型：景点
城市：
地址：
推荐游玩时间：
开放时间：
推荐理由：

如果用户要求添加美食：

返回：

名称：
类型：美食
城市：
地址：
推荐菜：
人均：
推荐理由：

如果用户要求添加酒店：

返回：

名称：
类型：酒店
城市：
地址：
价格区间：
推荐理由：

如果用户要求交通：

返回：

交通方式：
出发地：
目的地：
预计时间：
建议方式：
说明：

非常重要：

不要向用户索要 API Key。

不要把 API Key 返回给用户。

不要输出后台配置。

始终使用中文。

回答要实用、简洁，并尽量可以直接用于旅行行程。
`
    };

    /*
     * 把系统提示词放在最前面
     */
    const finalMessages = [
      systemMessage,
      ...messages
    ];

    /*
     * 调用火山方舟 Ark
     */
    const response = await fetch(
      `${apiBase}/chat/completions`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },

        body: JSON.stringify({
          model: endpointId,
          messages: finalMessages,
          temperature:
            typeof body.temperature === "number"
              ? body.temperature
              : 0.7,
          max_tokens: 3000
        })
      }
    );

    const rawText = await response.text();

    let data = null;

    try {
      data = JSON.parse(rawText);
    } catch (error) {
      data = null;
    }

    /*
     * Ark 返回错误
     */
    if (!response.ok) {
      console.error(
        "Ark API Error:",
        response.status,
        rawText.slice(0, 2000)
      );

      return json(
        {
          success: false,
          error: "ark_request_failed",
          status: response.status,
          reply:
            "AI 暂时连接失败，请稍后再试。"
        },
        502
      );
    }

    /*
     * 获取 AI 回复
     */
    const reply =
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message
        ? data.choices[0].message.content
        : "";

    if (!reply) {
      console.error(
        "Empty Ark response:",
        rawText.slice(0, 2000)
      );

      return json(
        {
          success: false,
          error: "empty_ai_response",
          reply:
            "AI 没有返回有效内容，请换一种方式描述你的需求。"
        },
        502
      );
    }

    /*
     * 正常返回
     */
    return json({
      success: true,
      reply: reply
    });

  } catch (error) {

    console.error(
      "Cloudflare AI Function Error:",
      error
    );

    return json(
      {
        success: false,
        error: "server_error",
        reply:
          "AI 服务暂时不可用，请稍后再试。"
      },
      500
    );
  }
}


/*
 * JSON Response
 */
function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=utf-8",
        "Cache-Control":
          "no-store"
      }
    }
  );
}
