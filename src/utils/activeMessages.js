/**
 * 主动消息功能 - 前端模块
 * 负责:
 *   1. 生成/读取用户 token
 *   2. 同步数据到后端
 *   3. 拉取主动消息
 *   4. Web Push 注册
 */

// ── Token 管理 ─────────────────────────────

export function getUserId() {
  let uid = localStorage.getItem("echoes_uid");
  if (!uid) {
    uid = crypto.randomUUID();
    localStorage.setItem("echoes_uid", uid);
  }
  return uid;
}

// ── API 调用 ───────────────────────────────

const API_BASE = "https://echoes-server.bcx0216.workers.dev";

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return res.json();
}

// ── 数据同步 ───────────────────────────────

export async function syncProfile(uid, data) {
  return api(`/api/user/${uid}/profile`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ── 拉取主动消息 ───────────────────────────

export async function fetchActiveMessages(uid) {
  return api(`/api/user/${uid}/messages`);
}

// ── 标记消息已读/清空 ─────────────────────

export async function clearActiveMessages(uid) {
  return api(`/api/user/${uid}/messages`, {
    method: "PUT",
    body: JSON.stringify({ messages: [] }),
  });
}

// ── 用户关闭功能 ──────────────────────────

export async function disableActiveMessages(uid) {
  return api(`/api/user/${uid}`, { method: "DELETE" });
}

// ── Web Push 注册 ─────────────────────────

export async function registerPush(uid) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Web Push not supported");
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.warn("Notification permission denied");
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    // VAPID public key 需要从后端获取, 暂时留空
    const vapidPublicKey = "BH5azEAVggc-ab33IZ_VCa0DDJmci-c0WRxc-0mubUnkD9yxpdWJNMF8S4wmClLO2Yj3tjwMGpbsZBi_6Dg_Osk";
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
  }

  // 存到后端
  await api(`/api/user/${uid}/push`, {
    method: "PUT",
    body: JSON.stringify(subscription.toJSON()),
  });

  return subscription;
}

// ── Helpers ────────────────────────────────

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
