import { safeJSONParse } from "./helpers";

/* --- API HANDLER --- */
const generateContent = async (params, apiConfig, onError, signal) => {
  const { prompt, systemInstruction, isJson = true } = params;
  let content = null;

  console.log(`[Echoes] Starting Generation. isJson: ${isJson}`);

  try {
    if (apiConfig.baseUrl && apiConfig.key) {
      const messages = [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ];

      console.group("📝 [Echoes Debug] 发送给 AI 的完整数据");
      console.log(
        "%c系统指令 (System Prompt):",
        "color: blue; font-weight: bold;",
      );
      console.log(systemInstruction);
      console.log(
        "%c用户指令 (User Prompt):",
        "color: green; font-weight: bold;",
      );
      console.log(prompt);
      console.log(
        "%c完整消息结构 (Messages Array):",
        "color: purple; font-weight: bold;",
        messages,
      );
      console.groupEnd();

      let url = apiConfig.baseUrl.replace(/\/$/, "");
      if (!url.includes("/chat/completions")) {
        url = `${url}/chat/completions`;
      }

      console.log(`[Echoes] Requesting URL: ${url}`);

      // Manual Timeout Logic
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request Timed Out (360s)")), 360000),
      );

      const fetchPromise = fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiConfig.key}`,
        },
        signal: signal,
        body: JSON.stringify({
          model: apiConfig.model || "gpt-4o",
          messages: messages,
          temperature: 0.85,
          response_format: isJson ? { type: "json_object" } : undefined,
        }),
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        const errText = await response.text();
        console.error("[Echoes] API Error Response:", errText);
        let errMsg = `API Error (${response.status})`;
        try {
          const errJson = JSON.parse(errText);
          if (errJson.error && errJson.error.message)
            errMsg += `: ${errJson.error.message}`;
          else errMsg += `: ${errText.substring(0, 50)}...`;
        } catch (e) {
          errMsg += `: ${errText.substring(0, 50)}...`;
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      console.log("[Echoes] API Response Data:", data);

      if (!data.choices || data.choices.length === 0) {
        throw new Error("API returned no choices (Empty response)");
      }

      content = data.choices[0].message?.content;
      console.log("[Echoes] Content extracted:", content);
    } else {
      throw new Error("未配置 API 信息。请在设置中输入 Base URL 和 Key。");
    }
  } catch (error) {
    if (error.name === "AbortError" || error.name === "TimeoutError") {
      console.log("[Echoes] Generation aborted or timed out");
      // Only show toast if it's a timeout, abort is manual
      if (error.name === "TimeoutError" && onError) onError("请求超时 (360s)");
      return null;
    }

    console.error("[Echoes] Generation Error:", error);
    if (onError)
      onError(error instanceof Error ? error.message : String(error));
    return null;
  }

  if ((!content || !String(content).trim()) && onError) {
    onError("API 返回内容为空 (或仅含空白符)");
    return null;
  }

  if (isJson) {
    try {
      return safeJSONParse(content);
    } catch (e) {
      console.error("[Echoes] SafeJSONParse failed:", e);
      if (onError)
        onError(`解析失败: ${e.message}\n内容: ${content.substring(0, 20)}...`);
      return null;
    }
  }

  return content;
};

export default generateContent;
