/**
 * echoes-server — Cloudflare Workers
 * 处理:
 *  - /api/user/:uid/profile   GET/PUT  用户数据读写
 *  - /api/user/:uid/messages  GET/PUT  主动消息
 *  - /api/user/:uid/push      PUT      Web Push subscription
 *  - /api/users               GET      所有开启了主动消息的用户ID列表
 */

// ── Helpers ──────────────────────────────────────────

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

function key(uid, kind) {
  return `user:${uid}:${kind}`;
}

const ALLOWED_ORIGINS = [
  "https://chenxibi.github.io",
  "http://localhost:5173",
  "http://localhost:5174",
];

// ── Router ───────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    // CORS preflight
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
          "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Parse uid from /api/user/:uid/*
    const userMatch = path.match(/^\/api\/user\/([^/]+)(?:\/(.+))?$/);
    
    // ── GET /api/users ── 列出所有活跃用户的 uid
    if (request.method === "GET" && path === "/api/users") {
      // Auth: simple token check (后面加强)
      const users = await env.ECHOES_KV.list({ prefix: "user:" });
      const uids = [...new Set(users.keys.map(k => k.name.split(":")[1]))];
      return json(uids.filter(Boolean));
    }

    if (userMatch) {
      const uid = userMatch[1];
      const sub = userMatch[2] || "profile";

      // ── GET /api/user/:uid/profile ── 读取用户数据
      if (request.method === "GET" && sub === "profile") {
        const data = await env.ECHOES_KV.get(key(uid, "profile"), "json");
        return json(data || {});
      }

      // ── PUT /api/user/:uid/profile ── 写入用户数据
      if (request.method === "PUT" && sub === "profile") {
        const body = await request.json();
        await env.ECHOES_KV.put(key(uid, "profile"), JSON.stringify(body));

        // 更新用户列表（用 uid 作为 key, 存启用状态）
        await env.ECHOES_KV.put(key(uid, "meta"), JSON.stringify({
          enabled: body.activeMessagesEnabled !== false,
          lastActive: Date.now(),
        }));

        return json({ ok: true });
      }

      // ── GET /api/user/:uid/messages ── 拉取待显示的消息
      if (request.method === "GET" && sub === "messages") {
        const msgs = await env.ECHOES_KV.get(key(uid, "messages"), "json");
        return json(msgs || []);
      }

      // ── PUT /api/user/:uid/messages ── 写入消息（GitHub Actions 用）
      if (request.method === "PUT" && sub === "messages") {
        const body = await request.json();
        await env.ECHOES_KV.put(key(uid, "messages"), JSON.stringify(body.messages || []));
        if (body.lastGeneratedAt) {
          await env.ECHOES_KV.put(key(uid, "meta"), JSON.stringify({
            enabled: true,
            lastGeneratedAt: body.lastGeneratedAt,
            todayCount: body.todayCount || 0,
          }));
        }
        return json({ ok: true });
      }

      // ── PUT /api/user/:uid/push ── 存 Web Push subscription
      if (request.method === "PUT" && sub === "push") {
        const body = await request.json();
        await env.ECHOES_KV.put(key(uid, "push"), JSON.stringify(body));
        return json({ ok: true });
      }

      // ── DELETE /api/user/:uid ── 用户关闭功能, 删数据
      if (request.method === "DELETE") {
        await Promise.all([
          env.ECHOES_KV.delete(key(uid, "profile")),
          env.ECHOES_KV.delete(key(uid, "messages")),
          env.ECHOES_KV.delete(key(uid, "push")),
          env.ECHOES_KV.delete(key(uid, "meta")),
        ]);
        return json({ ok: true });
      }
    }

    return json({ error: "not found" }, 404);
  },
};
