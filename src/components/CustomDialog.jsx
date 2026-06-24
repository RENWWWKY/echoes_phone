import React, { useState, useEffect, useRef } from "react";

/* --- CUSTOM DIALOG COMPONENT --- */
const CustomDialog = ({ config, onClose }) => {
  const [inputValue, setInputValue] = useState(config.defaultValue || "");
  const inputRef = useRef(null);

  // 自动聚焦输入框
  useEffect(() => {
    if (config.type === "prompt" && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [config.type]);

  const handleConfirm = () => {
    if (config.type === "prompt") {
      config.resolve(inputValue);
    } else {
      config.resolve(true);
    }
    onClose();
  };

  const handleCancel = () => {
    if (config.type === "prompt") {
      config.resolve(null);
    } else {
      config.resolve(false);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-white/90 backdrop-blur-xl w-full max-w-xs rounded-2xl shadow-2xl p-5 border border-white/50 animate-in zoom-in-95 duration-200 flex flex-col gap-4">
        {/* 标题与内容 */}
        <div className="text-center space-y-2">
          {config.title && (
            <h3 className="text-base font-bold text-gray-800">
              {config.title}
            </h3>
          )}
          {config.message && (
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {config.message}
            </p>
          )}
        </div>

        {/* 输入框 (仅 Prompt 模式) */}
        {config.type === "prompt" && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full p-3 bg-gray-100/50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#7A2A3A] outline-none transition-all text-center font-medium"
            placeholder="请输入..."
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          />
        )}

        {/* 按钮组 */}
        <div className="flex gap-3 pt-2">
          {config.type !== "alert" && (
            <button
              onClick={handleCancel}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-colors"
            >
              取消
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-md ${
              config.danger
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-[#2C2C2C] hover:bg-black text-white"
            }`}
          >
            {config.confirmText || "确定"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomDialog;
