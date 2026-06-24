import React, { useState, useEffect } from "react";
import { Sparkles, X, MessageSquare } from "lucide-react";

/**
 * 主动消息通知组件
 * 
 * 设计意图：像朋友随手发来的一句话，不喧哗不打扰
 * 视觉语言：融入现有毛玻璃 + 深红酒红系统，无AI味
 */

const ActiveMessageToast = ({ message, onDismiss, onRead }) => {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss?.(message.id), 300);
  };

  const handleRead = () => {
    setExiting(true);
    setTimeout(() => onRead?.(message), 300);
  };

  if (!message) return null;

  return (
    <div
      className={`
        fixed top-4 left-4 right-4 z-[200] 
        transition-all duration-300 ease-out
        ${visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"}
        ${exiting ? "translate-y-2 opacity-0 scale-95" : ""}
      `}
    >
      <div className="glass-panel rounded-2xl p-4 max-w-md mx-auto relative overflow-hidden">
        {/* 微妙的左上角高亮 — 模仿光的切角 */}
        <div
          className="absolute -top-4 -left-4 w-16 h-16 rounded-full opacity-[0.06]"
          style={{ background: "#7A2A3A" }}
        />

        <div className="flex items-start gap-3">
          {/* 图标 — 小火花替代 emoji */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(122,42,58,0.08)" }}>
            <Sparkles size={14} style={{ color: "#7A2A3A" }} />
          </div>

          <div className="flex-1 min-w-0">
            <p 
              className="text-xs leading-relaxed text-gray-700"
              style={{ fontFamily: "var(--app-font)", textWrap: "pretty" }}
            >
              {message.text}
            </p>
            {message.time && (
              <p className="text-[9px] text-gray-400 mt-1.5">
                {message.time}
              </p>
            )}
          </div>

          <div className="flex-shrink-0 flex gap-1">
            <button
              onClick={handleDismiss}
              className="w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* 底部操作 */}
        <div className="flex justify-end mt-3 pt-2 border-t border-gray-100/50">
          <button
            onClick={handleRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all"
            style={{ 
              color: "#7A2A3A",
              background: "rgba(122,42,58,0.06)" 
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(122,42,58,0.12)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(122,42,58,0.06)"}
          >
            <MessageSquare size={10} />
            看看
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActiveMessageToast;
