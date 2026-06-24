/**
 * GitHub Actions 用：消息生成脚本
 * 每天8-22点每个整点跑一次
 * 检查条件 → 调 LLM 生成消息 → 写回后端 → 触发 Web Push
 *
 * 需要环境变量:
 *   ECHOES_API_BASE=https://echoes-server.xxx.workers.dev
 *   ECHOES_API_KEY=internal-api-key
 *   ECHOES_LLM_API_KEY=sk-...
 *   ECHOES_API_URL=https://api.deepseek.com
 *   ECHOES_API_MODEL=deepseek-v4-flash
 */

const ECHOES_API_BASE = process.env.ECHOES_API_BASE;
const ECHOES_API_KEY = process.env.ECHOES_API_KEY;
const ECHOES_LLM_API_KEY = process.env.ECHOES_LLM_API_KEY;
const ECHOES_API_URL = process.env.ECHOES_API_URL;
const ECHOES_API_MODEL = process.env.ECHOES_API_MODEL || "deepseek-chat";
const LLM_ENDPOINT = `${ECHOES_API_URL}/v1/chat/completions`;

// 可配置参数
const MAX_DAILY_MESSAGES = 3;
const MIN_IDLE_HOURS = 1; // 上次对话后至少1小时
const RECENT_TURNS = 6; // 发最近几轮对话给模型
const ACTIVE_HOURS_START = 8; // 北京时间
const ACTIVE_HOURS_END = 22;

// ── Helpers ──────────────────────────────

function beijingHour() {
  return new Date().toLocaleString("en-US", { timeZone: "Asia/Shanghai", hour: "numeric", hourCycle: "h23" });
}

function todayKey() {
  return new Date().toLocaleString("en-US", { timeZone: "Asia/Shanghai", dateStyle: "short" });
}

function msToNow(ms) {
  return Date.now() - ms;
}

async function apiGet(path) {
  const res = await fetch(`${ECHOES_API_BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} ${res.status}`);
  return res.json();
}

async function apiPut(path, data) {
  const res = await fetch(`${ECHOES_API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`PUT ${path} ${res.status}`);
  return res.json();
}

async function sendWebPush(subscription, payload) {
  // Web Push protocol — 用 web-push 库
  // 简化版: 这里需要 web-push 模块, 在 Actions 环境里安装
  // 暂时留空, 后面补
}

// ── Prompt Builder ────────────────────────

function buildPrompt(profile) {
  const {
    charFacts = "",
    userFacts = "",
    charPersona = "一个关心用户的AI角色",
    userName = "用户",
    charName = "TA",
    memories = "",
    conversations = [],
  } = profile;

  const recentChat = conversations
    .slice(-RECENT_TURNS)
    .map((m) => `${m.role === "user" ? userName : charName}: ${m.content}`)
    .join("\n");

  return `你正在扮演${charName}。

关于${charName}:
${charPersona}
${charFacts ? `\n补充事实:\n${charFacts}` : ""}

关于${userName}:
${userFacts ? `${userFacts}` : "暂无"}

${memories ? `\n记忆:\n${memories}` : ""}

最近的对话:
${recentChat}

现在，请以${charName}的口吻，主动给${userName}发一条消息。规则：
1. 自然、不机械，像真人会主动发的那种消息
2. 可以基于上面的对话语境、记忆或当前时间/假设的天气/心情来展开
3. 语气要与${charName}的人设完全一致
4. 长短适中，1-3句话，不要长篇大论
5. 不要加"以下是我的消息"之类的引导语，直接发消息内容
6. 绝对不要以"分析"、"总结"、"以下"等词汇开头
7. 像真正的聊天消息一样，可以有自然的换行

直接输出消息内容：`;
}

// ── Main ─────────────────────────────────

async function main() {
  console.log(`[${new Date().toISOString()}] echoes active-message job start`);

  const hour = parseInt(beijingHour());
  if (hour < ACTIVE_HOURS_START || hour >= ACTIVE_HOURS_END) {
    console.log(`Hour ${hour} outside active window ${ACTIVE_HOURS_START}-${ACTIVE_HOURS_END}, skip`);
    return;
  }

  // 1. 获取所有用户
  const users = await apiGet("/api/users");
  console.log(`Found ${users.length} users`);

  let generated = 0;
  let skipped = 0;

  for (const uid of users) {
    try {
      // 2. 读用户数据和 meta
      const profile = await apiGet(`/api/user/${uid}/profile`);
      const metaRes = await fetch(`${ECHOES_API_BASE}/api/user/${uid}/meta`);
      let meta = {};
      try { meta = await metaRes.json(); } catch (e) {}

      // 3. 检查条件
      const lastMsgTime = profile.lastMessageTimestamp || 0;
      const idleMs = msToNow(lastMsgTime);
      const idleHours = idleMs / 3600000;

      if (idleHours < MIN_IDLE_HOURS) {
        console.log(`  ${uid}: idle ${idleHours.toFixed(1)}h < ${MIN_IDLE_HOURS}h, skip`);
        skipped++;
        continue;
      }

      // 今天计数
      const today = todayKey();
      const todayCount = (meta.todayCount && meta.todayDate === today) ? meta.todayCount : 0;
      if (todayCount >= MAX_DAILY_MESSAGES) {
        console.log(`  ${uid}: today ${todayCount}/${MAX_DAILY_MESSAGES}, skip`);
        skipped++;
        continue;
      }

      // 4. 调 LLM 生成消息
      const prompt = buildPrompt({
        charFacts: profile.charFacts || "",
        userFacts: profile.userFacts || "",
        charPersona: profile.charPersona || profile.persona || "一个关心用户的AI角色",
        userName: profile.userName || "用户",
        charName: profile.charName || "TA",
        memories: profile.memories || "",
        conversations: profile.conversations || [],
      });

      console.log(`  ${uid}: generating...`);

      const llmRes = await fetch(LLM_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ECHOES_LLM_API_KEY}`,
        },
        body: JSON.stringify({
          model: ECHOES_API_MODEL,
          messages: [
            { role: "system", content: "你正在扮演一个角色，你的回复就是角色说的话，不需要任何前缀或修饰。" },
            { role: "user", content: prompt },
          ],
          temperature: 0.9,
          max_tokens: 300,
        }),
      });

      if (!llmRes.ok) {
        console.error(`  ${uid}: LLM error ${llmRes.status}`);
        continue;
      }

      const llmData = await llmRes.json();
      const messageContent = llmData.choices?.[0]?.message?.content?.trim();
      if (!messageContent) {
        console.error(`  ${uid}: empty response`);
        continue;
      }

      // 5. 构造消息对象
      const msgObj = {
        id: `active_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        role: "character",
        content: messageContent,
        timestamp: Date.now(),
        type: "active",
        context: { // 存下来给 regenerate 用
          prompt,
          charPersona: profile.charPersona || profile.persona,
          charName: profile.charName || "TA",
          generatedAt: new Date().toISOString(),
        },
      };

      // 6. 获取已有消息列表，追加新消息
      let existingMsgs = [];
      try {
        existingMsgs = await apiGet(`/api/user/${uid}/messages`);
      } catch (e) {}
      existingMsgs.push(msgObj);

      // 7. 写回
      await apiPut(`/api/user/${uid}/messages`, {
        messages: existingMsgs,
        lastGeneratedAt: Date.now(),
        todayCount: todayCount + 1,
        todayDate: today,
      });

      // 8. Web Push（后面补）
      // try {
      //   const pushSubRes = await fetch(`${ECHOES_API_BASE}/api/user/${uid}/push`);
      //   const pushSub = await pushSubRes.json();
      //   if (pushSub && pushSub.endpoint) {
      //     await sendWebPush(pushSub, {
      //       title: `${profile.charName || "TA"} 发来一条消息`,
      //       body: messageContent.slice(0, 100),
      //       icon: "/pwa-192x192_v3.png",
      //       data: { url: "https://chenxibi.github.io/echoes_phone/" },
      //     });
      //   }
      // } catch (e) {}

      console.log(`  ${uid}: ✅ generated "${messageContent.slice(0, 50)}..."`);
      generated++;
    } catch (e) {
      console.error(`  ${uid}: error - ${e.message}`);
    }
  }

  console.log(`Done. Generated: ${generated}, Skipped: ${skipped}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
