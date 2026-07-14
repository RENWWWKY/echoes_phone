import worldBook from "../components/WorldBook";

// 解析批量链接文本
export const parseStickerLinks = (text) => {
  if (!text) return [];
  return text
    .split("\n")
    .map((line) => {
      // 兼容中文冒号和英文冒号
      const parts = line.split(/[:：]/);
      if (parts.length >= 2) {
        const desc = parts[0].trim();
        // 后面可能还有冒号（如 https://），所以合并剩余部分
        const url = parts.slice(1).join(":").trim();
        if (desc && url.startsWith("http")) {
          return {
            id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            url: url,
            desc: desc,
            enabled: true,
          };
        }
      }
      return null;
    })
    .filter((item) => item !== null);
};

export const safeJSONParse = (text) => {
  if (!text) return null;

  try {
    let clean = text;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) clean = jsonMatch[0];

    const TEMP_Q = "%%_Q_%%";

    clean = clean.replace(/([\{\,\[]\s*)"/g, "$1" + TEMP_Q);
    clean = clean.replace(/"(\s*\:)/g, TEMP_Q + "$1");
    clean = clean.replace(/(\:\s*)"/g, "$1" + TEMP_Q);
    clean = clean.replace(/"\s*(?=[,\}\]])/g, TEMP_Q);

    clean = clean.replace(/([，。！？…、\.,!\?])\s*"/g, "$1”");
    clean = clean.replace(/"(?=\s*[，。！？…、\.,!\?])/g, "”");

    clean = clean.replace(/([\u4e00-\u9fa5])"([\u4e00-\u9fa5])/g, "$1“$2");

    clean = clean.replace(/"(?=[\u4e00-\u9fa5])/g, "“");

    clean = clean.replace(/([\u4e00-\u9fa5])"(?!\s*[:,\}\]])/g, "$1”");

    clean = clean.replace(/"/g, '\\"');

    clean = clean.split(TEMP_Q).join('"');

    clean = clean.replace(/\\\\"/g, '\\"');

    const repairedText = jsonrepair(clean);
    return JSON.parse(repairedText);
  } catch (e) {
    console.error("[Echoes] JSON 解析失败:", e);
    console.log("[Echoes] 问题文本:", text);
    try {
      const simpleRepair = jsonrepair(text);
      return JSON.parse(simpleRepair);
    } catch (err2) {
      throw new Error(`格式解析失败: ${e.message.slice(0, 30)}...`);
    }
  }
};

export const compressImage = (file, maxWidth = 500, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    // 如果是 GIF，直接返回原始 DataURL，不经过 Canvas 压缩以保留动图
    if (file.type === "image/gif") {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/webp", quality));
      };
    };
  });
};

export const formatTime = (date) =>
  date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
export const formatDate = (date) =>
  date.toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

export const formatSmartTime = (timestamp) => {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  const now = new Date();
  const hm = d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today - msgDay) / 86400000);
  if (diffDays === 0) return hm;
  if (diffDays === 1) return `昨天 ${hm}`;
  const md = `${d.getMonth() + 1}月${d.getDate()}日`;
  if (d.getFullYear() === now.getFullYear()) return `${md} ${hm}`;
  return `${d.getFullYear()}年${md} ${hm}`;
};

export const replacePlaceholders = (text, charName, userName) => {
  if (!text) return "";
  return text
    .replace(/\{\{char\}\}/gi, charName) // gi 表示全局+忽略大小写
    .replace(/\{\{user\}\}/gi, userName);
};

// --- 辅助函数：根据时间生成话题引导 ---
export const getTimeBasedGuidance = (dateObj) => {
  const hour = dateObj.getHours();
  const month = dateObj.getMonth() + 1; // 0-11 转 1-12
  const weekday = dateObj.toLocaleDateString("zh-CN", { weekday: "long" }); // 星期一~星期日
  const isWeekend = weekday === "星期六" || weekday === "星期日";

  let timeVibe = "";
  let seasonalVibe = "";

    // 1. 时间段判断（每种世界观给出等价话题）
  if (hour >= 23 || hour < 5) {
    timeVibe = isWeekend
      ? "Late Night (深夜/周末): Modern — parties, late night gaming, emotional venting. Ancient fantasy — late night tavern songs, star-gazing poets. Cyberpunk — underground clubs, net-running. Xianxia — midnight cultivation, ghost stories."
      : "Late Night (深夜/工作日): Modern — insomnia worries, overtime fatigue. Ancient fantasy — late night studying by candle, sentry duty. Cyberpunk — gig-work burnout, street doc visits. Xianxia — late night alchemy, sect patrol.";
  } else if (hour >= 6 && hour < 10) {
    timeVibe = isWeekend
      ? "Morning (早晨/周末): Modern — sleeping in, brunch, lazy plans. Ancient fantasy — morning temple visit, tea house, weekend market. Cyberpunk — hangover recovery, late breakfast. Xianxia — morning meditation, weekend sparring."
      : "Morning (早晨/工作日): Modern — rush hour/commute, breakfast choices. Ancient fantasy — carriage commute, morning academy roll call. Cyberpunk — maglev commute, synth-caffeine. Xianxia — morning qi-gathering, sect assembly.";
  } else if (hour >= 11 && hour <= 13) {
    timeVibe =
      "Lunch Time (午饭): Modern — food delivery indecision, office break chatter. Ancient fantasy — street food stalls, tavern lunch. Cyberpunk — synth-meal pickups, ramen stall. Xianxia — fasting complaints, sect cafeteria gossip.";
  } else if (hour >= 17 && hour <= 20) {
    timeVibe = isWeekend
      ? "Dinner Time (晚饭/周末): Modern — cooking, dining out, parties. Ancient fantasy — banquet gatherings, night market. Cyberpunk — neon club night, underground fights. Xianxia — sect banquet, merchant fair."
      : "Dinner Time (晚饭/工作日): Modern — cooking, relaxing after work. Ancient fantasy — family dinner, street opera. Cyberpunk — dive bar decompression. Xianxia — evening pill-refining, disciples chatting.";
  } else {
    timeVibe =
      "Daily Life (日常): Modern — slacking at work/school, afternoon tea. Ancient fantasy — afternoon poetry, marketplace gossip. Cyberpunk — grid-surfing, body-mod browsing. Xianxia — sect gossip, spirit beast sightings.";
  }

  // 2. 月份/季节判断
  if (month === 12) seasonalVibe = " Season: Winter/December (Cold, Christmas, End of year).";
  else if (month === 1 || month === 2) seasonalVibe = " Season: Winter/New Year (Holidays, Family, Cold).";
  else if (month >= 6 && month <= 8) seasonalVibe = " Season: Summer (Heat waves, AC, Ice cream, Rainstorms).";

  return `  Current Context: It is ${weekday}, ${hour}:00. ${timeVibe}.${seasonalVibe ? " " + seasonalVibe : ""}
  [Generation Strategy]: Choose the world-appropriate examples from above based on {{char}} and {{user}}'s setting. At most 1 thread related to time/season. Rest must be random and diverse. Do NOT make every post about the time/season.
  `;
};
let notificationSetter = null;

// 新增一个初始化函数
export const initNotification = (setter) => {
  notificationSetter = setter;
};

export const showToast = (type, message) => {
  if (notificationSetter) {
    notificationSetter({ type, message: String(message) });
  } else {
    console.warn("Notification setter not initialized!");
  }
};
export const getCurrentTimeObj = (settings) => {
  // 增加防御性代码，防止 settings 为空
  if (!settings) return new Date();

  return settings.useSystem
    ? new Date()
    : new Date(`${settings.customDate}T${settings.customTime}`);
};

// --- 新增辅助函数：按轮次获取最近消息 ---
export const getRecentTurns = (history, limit) => {
  if (history.length === 0) return [];

  let turnsFound = 0;
  let startIndex = 0;
  let currentSender = null;

  // 从后往前遍历，计算轮次
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    // 如果发送者变了（或者是最后一条消息），轮次+1
    if (msg.sender !== currentSender) {
      turnsFound++;
      currentSender = msg.sender;
    }

    // 如果轮次超过限制，停止，当前 i + 1 就是截取点
    if (turnsFound > limit) {
      startIndex = i + 1;
      break;
    }
    // 如果已经遍历到头了，startIndex 保持 0
  }

  return history.slice(startIndex);
};
export const getFormattedMessageText = (m, userName, persona, chatStyle) => {
  const senderName =
    m.sender === "me" ? userName || "User" : persona?.name || "Char";
  let content = m.text || "";

  if (m.isVoice) {
    content = `(发送了一条语音): ${m.text.replace("[语音消息] ", "")}`;
  }
  if (m.sticker) {
    if (!content || !content.trim()) {
      content = `[发送了表情包: ${m.sticker.desc}]`;
    }
  }
  if (m.isForward && m.forwardData) {
    const fwd = m.forwardData;
    content += ` [转发了${
      fwd.type === "post" ? "帖子" : "评论"
    }: "${fwd.content.slice(0, 50)}..."]`;
  }

  let finalLine = `${senderName}: ${content}`;

  // 使用传入的 chatStyle
  const msgStyle = m.style || chatStyle;

  if (
    m.sender !== "me" &&
    m.status &&
    m.status.thought &&
    msgStyle !== "novel"
  ) {
    finalLine += `\n(Inner Thought / True Intention: ${m.status.thought})`;
  }

  return finalLine;
};

export const getContextString = (
  chatHistory,
  userName,
  persona,
  chatStyle,
  limit = 10,
) => {
  if (!chatHistory || !Array.isArray(chatHistory)) return "None.";

  const recent = getRecentTurns(chatHistory, limit);
  if (recent.length === 0) return "None.";

  // 在 map 中传递参数
  return recent
    .map((msg) => getFormattedMessageText(msg, userName, persona, chatStyle))
    .join("\n");
};
export const getWorldInfoString = (worldBook) => {
  if (!worldBook || !Array.isArray(worldBook)) return "";

  return worldBook
    .filter((e) => e.enabled)
    .map((e) => `[${e.name}]: ${e.content}`)
    .join("\n\n");
};
export const getStickerInstruction = (list = charStickers, stickersEnabled) => {
  if (!stickersEnabled) return "";

  const activeList = list.filter((s) => s.enabled !== false);

  if (activeList.length === 0) return "";
  const listStr = list.map((s) => `ID: ${s.id}, Desc: ${s.desc}`).join("\n");
  return `\n[STICKER SYSTEM]\nAvailable Stickers:\n${listStr}[Usage Frequency Rules]
    1. **Frequency constraint**: Use a sticker ONLY when the emotion is strong or the context specifically demands it. 
    2. **Probability**: Aim for a 30% - 40% usage rate. Most responses (approx. 6/10) should have "stickerId": null.
    3. To send a sticker, use "stickerId" field in JSON. Otherwise, set it to null.`;
};

/* --- UTILS --- 部分的 cleanCharacterJson 函数替换为： */

export const cleanCharacterJson = (jsonContent) => {
  try {
    const rawObj =
      typeof jsonContent === "string" ? JSON.parse(jsonContent) : jsonContent;

    // 1. 分别获取外层和内层数据
    const outerData = rawObj;
    const innerData = rawObj.data || {};

    // 2. 智能提取 Description
    // 逻辑：如果 innerDesc 包含"同上" 或 长度明显短于 outerDesc，就使用 outerDesc
    const outerDesc = outerData.description || outerData.persona || "";
    const innerDesc = innerData.description || innerData.persona || "";

    let finalDesc = innerDesc;
    if (
      !innerDesc ||
      innerDesc.includes("同上") ||
      innerDesc.includes("same as") ||
      (outerDesc.length > innerDesc.length && outerDesc.length > 50)
    ) {
      finalDesc = outerDesc;
    }

    // 3. 智能提取 Name
    const name = innerData.name || outerData.name || "Unknown";

    // 4. 清洗 Description (处理 XML 标签)
    // 很多时候 Prompt 会生成 <character> 包裹的内容，这里提取出来
    let richDescription = finalDesc;
    const charTagMatch = finalDesc.match(/<character>([\s\S]*?)<\/character>/i);
    if (charTagMatch) richDescription = charTagMatch[1].trim();

    // 如果还有 personality 字段，追加进去
    if (outerData.personality && typeof outerData.personality === "string") {
      richDescription += `\n\n[Personality Traits]: ${outerData.personality}`;
    }

    // 5. 组合最终文本 Key
    // 5. Combine final text key (first line is plain name, no Name: prefix)
    let cleanText = `${name}\n\nDescription:\n${richDescription}`;

    // 6. 处理 WorldBook (世界书)
    // 同样优先取有内容的那一边
    let rawEntries = [];
    if (
      innerData.character_book &&
      innerData.character_book.entries &&
      innerData.character_book.entries.length > 0
    ) {
      rawEntries = innerData.character_book.entries;
    } else if (outerData.character_book && outerData.character_book.entries) {
      rawEntries = outerData.character_book.entries;
    }

    const worldBookEntries = rawEntries
      .map((entry) => ({
        id: `char_wb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: entry.comment || entry.keys?.[0] || entry.name || `Entry`,
        content: entry.content,
        enabled: entry.enabled !== false,
        group: entry.group || name || "默认分组",
      }))
      .filter((e) => e.content);

    return {
      rawText: cleanText.trim(),
      worldBook: worldBookEntries,
      name: name,
    };
  } catch (e) {
    console.error("Character Parse Error", e);
    return {
      rawText:
        typeof jsonContent === "string"
          ? jsonContent
          : JSON.stringify(jsonContent),
      worldBook: [],
      name: "Unknown",
    };
  }
};

export const isImageMsg = (content) =>
  content && content.startsWith(IMG_TAG_START);

export const getImageDesc = (content) => content.replace(IMG_TAG_START, "");
