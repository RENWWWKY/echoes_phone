import React from "react";

/* ============================================
   APP ICON COMPONENT
   - Standardized touch targets (44x44px min)
   - Full ARIA labels
   - Keyboard focus support
   ============================================ */

const AppIcon = ({
  icon,
  label,
  onClick,
  isActive = false,
  customIcon, // Optional custom image URL
  badge, // Optional notification badge
  ariaLabel, // Optional explicit aria-label (defaults to label)
}) => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <button
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`
        flex flex-col items-center gap-1 
        p-2 
        rounded-2xl 
        transition-default
        touch-target
        cursor-pointer
        ${
          isActive
            ? "bg-[var(--color-primary-alpha)]"
            : "hover:bg-[var(--color-interactive-ghost)]"
        }
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2
      `}
      aria-label={ariaLabel || label}
      aria-pressed={isActive}
      title={label}
      type="button"
    >
      {/* Icon Container */}
      <div
        className={`
          w-14 h-14 
          bg-white 
          rounded-[18px] 
          shadow-sm 
          flex 
          items-center 
          justify-center 
          text-[var(--color-primary)]
          transition-default
          group-hover:scale-105
          ${isActive ? "ring-2 ring-[var(--color-primary)]/30" : ""}
        `}
      >
        {customIcon ? (
          <img
            src={customIcon}
            alt=""
            className="w-full h-full object-cover rounded-[18px]"
            aria-hidden="true"
          />
        ) : typeof icon === "function" || typeof icon === "object" ? (
          icon
        ) : (
          <span aria-hidden="true">{icon}</span>
        )}

        {/* Notification Badge */}
        {badge && badge > 0 && (
          <span
            className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1"
            aria-label={`${badge}条新通知`}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>

      {/* Label */}
      <span
        className={`
          text-[10px] 
          font-medium 
          text-center 
          max-w-[60px] 
          truncate
          ${
            isActive
              ? "text-[var(--color-primary)] font-semibold"
              : "text-gray-600"
          }
        `}
      >
        {label}
      </span>
    </button>
  );
};

export default AppIcon;
