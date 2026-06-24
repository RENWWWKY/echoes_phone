import React, { useRef, useEffect } from "react";
import {
  Send,
  Plus,
  Mic,
  Smile,
  Image as ImageIcon,
  Banknote,
  MapPin,
  X,
} from "lucide-react";

/* ============================================
   CHAT INPUT COMPONENT
   - Standardized min/max height
   - Full keyboard navigation (Tab + Enter)
   - ARIA labels on all icon buttons
   - Screen reader announcements
   ============================================ */

const ChatInput = ({
  chatInput,
  setChatInput,
  onSend,
  onStop,
  onOpenSticker,
  onOpenMediaMenu,
  onSendImage,
  onSendTransfer,
  onOpenLocation,
  isVoiceMode,
  setIsVoiceMode,
  showMediaMenu,
  loading,
  chatStyle,
  isGhostwriting,
  onGhostwrite,
}) => {
  const inputRef = useRef(null);
  const announceRef = useRef(null);

  // Auto-resize with standardized min/max
  useEffect(() => {
    if (inputRef.current) {
      const el = inputRef.current;
      el.style.height = "auto";
      el.style.height = `${Math.min(Math.max(el.scrollHeight, 42), 120)}px`;
    }
  }, [chatInput]);

  // Keyboard handler for Enter to send
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (chatInput.trim()) {
        onSend();
      }
    }
    // Escape to cancel voice mode
    if (e.key === "Escape" && isVoiceMode) {
      setIsVoiceMode(false);
    }
  };

  // Announce to screen readers
  const announceToScreenReader = (message) => {
    if (announceRef.current) {
      announceRef.current.textContent = message;
    }
  };

  const getPlaceholder = () => {
    if (isVoiceMode) return "语音输入中...";
    if (chatStyle === "novel" && !chatInput) return "点击右侧按钮可AI代写...";
    return "发消息给TA...";
  };

  return (
    <div className="p-3 glass-panel border-t border-white/50 shrink-0 relative z-[100]">
      {/* Screen reader live region */}
      <div
        ref={announceRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {loading ? (
        /* Stop Generation Button */
        <div className="flex justify-center">
          <button
            onClick={onStop}
            className="w-full py-2.5 bg-red-50 text-red-500 rounded-full text-xs font-bold flex items-center justify-center gap-2 animate-pulse touch-target transition-default"
            aria-label="取消生成，停止AI回复"
          >
            <X size={14} aria-hidden="true" />
            <span>取消生成</span>
          </button>
        </div>
      ) : (
        <div className="relative flex items-end gap-1.5 md:gap-2">
          {/* Media Menu Popup */}
          {showMediaMenu && (
            <div
              className="absolute bottom-14 left-0 bg-white/90 backdrop-blur-xl border border-gray-200 p-2 rounded-xl shadow-xl flex gap-4 animate-zoom-in z-50"
              role="menu"
              aria-label="媒体发送选项"
            >
              <button
                onClick={() => {
                  onOpenSticker();
                  announceToScreenReader("打开表情面板");
                }}
                className="flex flex-col items-center gap-1 text-gray-600 hover:text-black touch-target transition-default"
                role="menuitem"
                aria-label="发送表情"
              >
                <div className="p-2 bg-gray-100 rounded-full">
                  <Smile size={20} aria-hidden="true" />
                </div>
                <span className="text-[10px]">表情</span>
              </button>

              <button
                onClick={() => {
                  onSendImage();
                  announceToScreenReader("发送图片");
                }}
                className="flex flex-col items-center gap-1 text-gray-600 hover:text-black touch-target transition-default"
                role="menuitem"
                aria-label="发送图片"
              >
                <div className="p-2 bg-gray-100 rounded-full">
                  <ImageIcon size={20} aria-hidden="true" />
                </div>
                <span className="text-[10px]">图片</span>
              </button>

              <button
                onClick={() => {
                  onSendTransfer();
                  announceToScreenReader("发送转账");
                }}
                className="flex flex-col items-center gap-1 text-gray-600 hover:text-black touch-target transition-default"
                role="menuitem"
                aria-label="发送转账"
              >
                <div className="p-2 bg-gray-100 rounded-full">
                  <Banknote size={20} aria-hidden="true" />
                </div>
                <span className="text-[10px]">转账</span>
              </button>

              <button
                onClick={() => {
                  onOpenLocation();
                  announceToScreenReader("发送位置");
                }}
                className="flex flex-col items-center gap-1 text-gray-600 hover:text-black touch-target transition-default"
                role="menuitem"
                aria-label="发送位置"
              >
                <div className="p-2 bg-gray-100 rounded-full">
                  <MapPin size={20} aria-hidden="true" />
                </div>
                <span className="text-[10px]">位置</span>
              </button>
            </div>
          )}

          {/* Left Action Buttons */}
          <div className="flex gap-1 shrink-0">
            {/* Plus/Menu Button */}
            <button
              onClick={() => {
                onOpenMediaMenu();
                announceToScreenReader(showMediaMenu ? "关闭菜单" : "打开菜单");
              }}
              className={`p-2 md:p-2.5 rounded-full transition-default touch-target ${
                showMediaMenu
                  ? "bg-[#2C2C2C] text-white rotate-45 shadow-lg"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
              aria-label={showMediaMenu ? "关闭菜单" : "打开更多选项"}
              aria-expanded={showMediaMenu}
              aria-haspopup="menu"
            >
              <Plus size={20} strokeWidth={1.5} aria-hidden="true" />
            </button>

            {/* Voice Mode Button */}
            <button
              onClick={() => {
                setIsVoiceMode(!isVoiceMode);
                announceToScreenReader(
                  isVoiceMode ? "切换到文字模式" : "切换到语音模式"
                );
              }}
              className={`p-2 md:p-2.5 rounded-full transition-default touch-target ${
                isVoiceMode
                  ? "bg-[var(--color-primary)] text-white shadow-md"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
              aria-label={isVoiceMode ? "关闭语音模式" : "开启语音模式"}
              aria-pressed={isVoiceMode}
            >
              <Mic size={20} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>

          {/* Text Input Area */}
          <div className="relative flex-grow min-w-0">
            <textarea
              ref={inputRef}
              id="chat-input"
              autoComplete="off"
              value={chatInput}
              onChange={(e) => {
                setChatInput(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholder()}
              rows={1}
              className={`
                w-full 
                min-h-[42px] max-h-[120px]
                border rounded-2xl py-2.5 pl-4 pr-10 
                text-sm 
                focus:outline-none 
                transition-default
                shadow-inner 
                custom-scrollbar
                resize-none
                ${
                  isVoiceMode
                    ? "bg-[var(--color-primary-alpha)] border-[var(--color-primary)]/30 text-[var(--color-primary)] placeholder:text-[var(--color-primary)]/50"
                    : "bg-white/60 border-gray-200 text-gray-800 focus:border-gray-400"
                }
              `}
              style={{
                height: "auto",
                minHeight: "42px",
                maxHeight: "120px",
              }}
              aria-label="输入消息"
              aria-multiline="true"
            />

            {/* Ghostwrite Button (Novel Mode) */}
            {chatStyle === "novel" && !isVoiceMode && (
              <button
                onClick={onGhostwrite}
                disabled={isGhostwriting}
                className="absolute right-2 top-1/2 -translate-y-1/2 -mt-[3px] p-1.5 text-xs text-[var(--color-primary)] hover:bg-[var(--color-primary-alpha)] rounded-full transition-default touch-target"
                aria-label="AI代写内容"
                title="AI代写"
              >
                {isGhostwriting ? (
                  <span className="animate-spin inline-block">⟳</span>
                ) : (
                  <span>✎</span>
                )}
              </button>
            )}
          </div>

          {/* Send / Trigger Button */}
          <div className="flex gap-1 shrink-0 items-end pb-1">
            {chatInput.trim().length > 0 ? (
              /* Send Button */
              <button
                onClick={() => {
                  onSend();
                  announceToScreenReader("消息已发送");
                }}
                className="p-2 md:p-2.5 bg-[var(--color-interactive)] text-white rounded-full hover:bg-black transition-default shadow-md animate-zoom-in touch-target"
                aria-label="发送消息"
              >
                <Send size={18} strokeWidth={1.5} aria-hidden="true" />
              </button>
            ) : (
              /* Trigger AI Response Button */
              <button
                onClick={() => {
                  announceToScreenReader("触发AI回复");
                }}
                className="p-2 md:p-2.5 text-gray-400 hover:text-[var(--color-primary)] rounded-full hover:bg-[var(--color-primary-alpha)] transition-default touch-target"
                aria-label="触发AI主动回复"
              >
                <SparkleIcon size={18} strokeWidth={1.5} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Simple sparkle icon component (inline to avoid extra imports)
const SparkleIcon = ({ size = 16, strokeWidth = 1.5, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" />
    <path d="M19 17l1 3 3-1-2-2h2z" />
    <path d="M5 21l1-3-3 1 2 2h-2z" />
  </svg>
);

export default ChatInput;
