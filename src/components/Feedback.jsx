import React, { useState, useRef } from "react";
import { MessageSquare, Send, Paperclip, X, Image } from "lucide-react";

const MAX_FILES = 3;
const MAX_SIZE_MB = 3;
const TG_TOKEN = "8603400358:AAGDpK65rf4JRtEwBc5M2SkqyMznqxbQJxY";
const TG_CHAT_ID = "6224897691";

const Feedback = ({ onClose }) => {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [tooLargeFiles, setTooLargeFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    const newTooLarge = [];
    const valid = [];

    for (const f of selected) {
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        newTooLarge.push(f.name);
      } else {
        valid.push(f);
      }
    }

    setFiles((prev) => {
      const combined = [...prev, ...valid];
      return combined.slice(0, MAX_FILES);
    });
    setTooLargeFiles(newTooLarge);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!name.trim()) return alert("请填写名字");
    if (!message.trim()) return alert("请填写反馈内容");

    setSending(true);

    // 构建文字消息
    let textMsg = `📩 <b>Echoes 反馈</b>\n\n`;
    textMsg += `<b>名字：</b>${name.trim()}\n`;
    if (contact.trim()) {
      textMsg += `<b>联系方式：</b>${contact.trim()}\n`;
    }
    textMsg += `<b>反馈内容：</b>\n${message.trim()}`;

    try {
      // 1. 先发文字消息
      const textRes = await fetch(
        `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: TG_CHAT_ID,
            text: textMsg,
            parse_mode: "HTML",
          }),
        }
      );

      if (!textRes.ok) {
        const err = await textRes.json();
        throw new Error(err.description || "文字发送失败");
      }

      // 2. 再逐张发图片
      for (const f of files) {
        const imgForm = new FormData();
        imgForm.append("chat_id", TG_CHAT_ID);
        imgForm.append("photo", f, f.name);
        // 图片附带caption说明属于哪个反馈
        imgForm.append("caption", `来自 ${name.trim()} 的截图 (${f.name})`);

        const imgRes = await fetch(
          `https://api.telegram.org/bot${TG_TOKEN}/sendPhoto`,
          { method: "POST", body: imgForm }
        );

        if (!imgRes.ok) {
          console.warn("图片发送失败:", f.name);
        }
      }

      setSent(true);
    } catch (err) {
      alert("发送失败：" + (err.message || "请稍后重试"));
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4 animate-in fade-in">
        <div className="p-4 bg-green-50 rounded-full">
          <Send size={32} className="text-green-500" />
        </div>
        <p className="text-sm font-bold text-gray-700">反馈已发送</p>
        <p className="text-xs text-gray-400">感谢你的反馈！</p>
        <button
          onClick={() => {
            setSent(false);
            setName("");
            setContact("");
            setMessage("");
            setFiles([]);
            onClose();
          }}
          className="px-6 py-2 bg-gray-100 rounded-full text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors"
        >
          返回
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4 p-1 animate-in fade-in">
      {/* 名字 */}
      <div>
        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
          名字 <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="怎么称呼你？"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-gray-400 transition-colors"
        />
      </div>

      {/* 联系方式 */}
      <div>
        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
          联系方式 <span className="text-gray-300">(选填)</span>
        </label>
        <input
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="邮箱 / 微信 / 手机号..."
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-gray-400 transition-colors"
        />
      </div>

      {/* 上传图片 */}
      <div>
        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
          截图/附件 <span className="text-gray-300">(选填 · 最多{MAX_FILES}张 · 每张≤{MAX_SIZE_MB}MB)</span>
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {files.map((f, i) => (
            <div
              key={i}
              className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 group"
            >
              <img
                src={URL.createObjectURL(f)}
                alt={f.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removeFile(i)}
                className="absolute top-0 right-0 p-0.5 bg-black/50 rounded-bl text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} />
              </button>
            </div>
          ))}
          {files.length < MAX_FILES && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-14 h-14 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors"
            >
              <Image size={16} />
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        {tooLargeFiles.length > 0 && (
          <p className="text-[10px] text-red-400">
            以下文件过大 (超{MAX_SIZE_MB}MB): {tooLargeFiles.join(", ")}
          </p>
        )}
      </div>

      {/* 反馈内容 */}
      <div className="flex-1 flex flex-col">
        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
          反馈内容 <span className="text-red-400">*</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="请描述你的问题、建议或想法..."
          className="flex-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-gray-400 transition-colors resize-none min-h-[120px]"
        />
      </div>

      {/* 提交 */}
      <button
        onClick={handleSubmit}
        disabled={sending}
        className="w-full py-2.5 bg-[#2C2C2C] text-white text-xs font-bold rounded-full flex items-center justify-center gap-2 hover:bg-black transition-colors disabled:opacity-50"
      >
        {sending ? (
          <>发送中...</>
        ) : (
          <>
            <Send size={14} />
            提交反馈
          </>
        )}
      </button>

      <p className="text-[9px] text-gray-400 text-center">
        你的反馈将直接发送至开发者
      </p>
    </div>
  );
};

export default Feedback;
