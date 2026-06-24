import React from "react";
import { ChevronLeft } from "lucide-react";

/* ============================================
   APP WINDOW COMPONENT
   - Full ARIA labeling
   - Keyboard navigation support
   - Focus management
   ============================================ */

const AppWindow = ({ isOpen, title, children, onClose, isChat, actions }) => {
  if (!isOpen) return null;

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className="absolute inset-0 bg-[#F2F2F7]/60 backdrop-blur-2xl z-30 flex flex-col animate-in slide-in-from-bottom-[5%] duration-300"
      role="dialog"
      aria-modal="true"
      aria-label={title || "应用窗口"}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <header className="h-14 px-4 flex items-center justify-between border-b border-gray-200/50 bg-white/40 backdrop-blur-md shrink-0 sticky top-0 z-50">
        <button
          onClick={onClose}
          className="flex items-center text-gray-600 hover:text-black transition-colors touch-target"
          aria-label="返回上一级"
        >
          <ChevronLeft size={22} strokeWidth={1.5} aria-hidden="true" />
          <span className="text-sm font-medium ml-0.5">返回</span>
        </button>
        <h1 className="text-sm font-bold text-gray-800" aria-live="polite">
          {title}
        </h1>
        <div className="flex items-center gap-2">
          {actions ? actions : <div className="w-8"></div>}
        </div>
      </header>

      {/* Content */}
      <main
        className={`flex-grow overflow-y-auto custom-scrollbar ${
          !isChat ? "p-6" : "px-4 pt-4 pb-6"
        }`}
        role="main"
      >
        {children}
      </main>
    </div>
  );
};

export default AppWindow;
