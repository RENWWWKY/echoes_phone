import React, { useEffect, useRef } from "react";
import { Copy, Edit2, Trash2, Check, MoreHorizontal } from "lucide-react";

/* ============================================
   MESSAGE MENU COMPONENT
   - Full keyboard navigation
   - ARIA menu pattern
   - Escape to close
   - Click outside to close
   ============================================ */

const MessageMenu = ({
  isOpen,
  position, // { left, right } - 'left' or 'right'
  onCopy,
  onEdit,
  onDelete,
  onMultiSelect,
  onClose,
  isSystem = false,
}) => {
  const menuRef = useRef(null);
  const firstItemRef = useRef(null);

  // Focus first item when menu opens
  useEffect(() => {
    if (isOpen && firstItemRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        firstItemRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      const menuItems = menuRef.current?.querySelectorAll(
        'button[role="menuitem"]'
      );
      if (!menuItems || menuItems.length === 0) return;

      const currentIndex = Array.from(menuItems).findIndex(
        (el) => el === document.activeElement
      );

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          menuItems[(currentIndex + 1) % menuItems.length]?.focus();
          break;
        case "ArrowUp":
          e.preventDefault();
          menuItems[(currentIndex - 1 + menuItems.length) % menuItems.length]?.focus();
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "Tab":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const menuPosition = position === "right" ? "left-0" : "right-0";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[110]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu */}
      <div
        ref={menuRef}
        className={`absolute top-full mt-2 z-[120] animate-zoom-in`}
        style={{
          [position === "right" ? "left" : "right"]: 0,
        }}
        role="menu"
        aria-label="消息操作菜单"
      >
        <div className="bg-[#1a1a1a]/95 backdrop-blur-md text-white rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 items-center border border-white/20 min-w-[120px]">
          {/* Copy Button - Always shown */}
          <button
            ref={firstItemRef}
            onClick={() => {
              onCopy();
              onClose();
            }}
            className="w-full flex flex-col items-center gap-1 p-2 hover:bg-white/20 rounded-lg min-h-[44px] justify-center transition-default touch-target"
            role="menuitem"
            aria-label="复制消息内容"
          >
            <Copy size={14} aria-hidden="true" />
            <span className="text-[11px]">复制</span>
          </button>

          {/* Edit Button - Not for system messages */}
          {!isSystem && (
            <>
              <div className="w-[1px] h-4 bg-white/20" aria-hidden="true" />
              <button
                onClick={() => {
                  onEdit();
                  onClose();
                }}
                className="w-full flex flex-col items-center gap-1 p-2 hover:bg-white/20 rounded-lg min-h-[44px] justify-center transition-default touch-target"
                role="menuitem"
                aria-label="编辑并改写消息"
              >
                <Edit2 size={14} aria-hidden="true" />
                <span className="text-[11px]">改写</span>
              </button>
            </>
          )}

          {/* Multi-select Button */}
          <div className="w-[1px] h-4 bg-white/20" aria-hidden="true" />
          <button
            onClick={() => {
              onMultiSelect();
              onClose();
            }}
            className="w-full flex flex-col items-center gap-1 p-2 hover:bg-white/20 rounded-lg min-h-[44px] justify-center transition-default touch-target"
            role="menuitem"
            aria-label="进入多选模式"
          >
            <Check size={14} aria-hidden="true" />
            <span className="text-[11px]">多选</span>
          </button>

          {/* Delete Button - Not for system messages */}
          {!isSystem && (
            <>
              <div className="w-[1px] h-4 bg-white/20" aria-hidden="true" />
              <button
                onClick={() => {
                  onDelete();
                  onClose();
                }}
                className="w-full flex flex-col items-center gap-1 p-2 hover:bg-red-500/50 rounded-lg min-h-[44px] justify-center transition-default touch-target text-red-300 hover:text-white"
                role="menuitem"
                aria-label="删除此条消息"
              >
                <Trash2 size={14} aria-hidden="true" />
                <span className="text-[11px]">删除</span>
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default MessageMenu;
