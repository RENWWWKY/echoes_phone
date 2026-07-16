import React, { useState } from "react";
import { Banknote } from "lucide-react"; // 假设你用的是 lucide
import mapBg from "../map_bg.png";

export const VoiceMessageBubble = ({ msg, isMe }) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const cleanText = msg.text.replace("[Voice Message] ", "");
  const duration = Math.min(60, Math.max(2, Math.ceil(cleanText.length / 3)));

  const handleClick = () => {
    setShowTranscript(!showTranscript);

    // 触发 1.5秒 的丝滑波动动画
    if (!isPlaying) {
      setIsPlaying(true);
      setTimeout(() => setIsPlaying(false), 600);
    }
  };

  // 基础静态高度 (静止时的样子)
  const baseHeights = [40, 70, 100, 60, 80, 40, 30, 50];

  return (
    <>
      {/* 1. 定义一个局部的 CSS 动画关键帧 */}
      <style>{`
        @keyframes visual-wave {
          0% { height: 20%; }
          50% { height: 100%; }
          100% { height: 20%; }
        }
      `}</style>

      <div
        onClick={handleClick}
        className={`px-4 py-3 rounded-2xl shadow-sm text-sm cursor-pointer transition-all select-none group ${
          isMe
            ? "bg-[#2C2C2C] text-white rounded-tr-none hover:bg-[#3a3a3a]"
            : "bg-white border border-gray-100 text-gray-800 rounded-tl-none hover:bg-gray-50"
        }`}
      >
        <div className="flex items-center gap-3">
          {/* 2. 拟真声波条 (容器) */}
          <div className="flex items-center gap-[2px] h-4 select-none">
            {baseHeights.map((h, idx) => {
              const animationDelay = `-${idx * 0.15 + Math.random() * 0.5}s`;

              return (
                <div
                  key={idx}
                  // [修改] 宽度从 w-1 改为 w-[2px]，更加精致
                  className={`w-[2px] rounded-full ${
                    isMe ? "bg-white/90" : "bg-gray-400"
                  }`}
                  style={{
                    height: isPlaying ? "auto" : `${h}%`,
                    animation: isPlaying
                      ? `visual-wave 0.6s ease-in-out infinite`
                      : "none",
                    animationDelay: isPlaying ? animationDelay : "0s",
                    transition: "height 0.3s ease-out",
                  }}
                ></div>
              );
            })}
          </div>

          {/* 时长 */}
          <div
            className={`text-xs font-mono font-bold ${
              isMe ? "text-white/60" : "text-gray-400"
            }`}
          >
            {duration}''
          </div>
        </div>

        {/* 语音转文字内容 */}
        {showTranscript && (
          <div
            className={`mt-3 text-xs leading-relaxed opacity-80 border-l-2 pl-2 pt-1 animate-in slide-in-from-top-1 duration-200 ${
              isMe ? "border-white/20" : "border-gray-200"
            }`}
          >
            {cleanText}
          </div>
        )}
      </div>
    </>
  );
};

export const TransferBubble = ({ msg, isMe, onInteract }) => {
  const { amount, status, note } = msg.transfer || {
    amount: 0,
    status: "pending",
    note: "",
  };
  const isPending = status === "pending";
  const isAccepted = status === "accepted";

  // 颜色逻辑
  const bgColor = isPending ? "bg-black/60" : "bg-black/40";
  const textColor = "text-white";

  return (
    <div
      className={`w-48 p-2 rounded-xl select-none transition-all shadow-sm ${bgColor} ${textColor} ${
        isMe ? "rounded-tr-none" : "rounded-tl-none"
      }`}
    >
      {/* 1. 顶部：图标与金额 */}
      {/* 如果没有备注，底部留一点 margin (mb-3)，如果有备注，mb-1 紧凑一点 */}
      <div className={`flex items-center gap-3 ${note ? "mb-1" : "mb-3"}`}>
        <div className="p-1.5 rounded-full shrink-0 bg-white/20 text-white">
          <Banknote size={18} />
        </div>
        <div className="overflow-hidden min-w-0">
          <div className="text-[9px] font-bold opacity-90 mb-0.5 truncate">
            {isMe ? "Transfer to them" : "Transfer to you"}
          </div>
          <div className="text-lg font-bold font-mono tracking-tight truncate">
            ¥ {amount}
          </div>
        </div>
      </div>

      {/* 2. 备注区域 (仅当有备注时显示) */}
      {note && (
        <div className="text-[9px] opacity-80 mb-1 pl-[42px] leading-tight break-words font-medium">
          {note}
        </div>
      )}

      {/* 3. Bottom: Status Bar */}
      <div className="flex justify-between items-center border-t border-white/20 pt-1.5">
        <span className="text-[9px] font-bold opacity-90">
          {isPending ? "Waiting" : isAccepted ? "Received" : "Refunded"}
        </span>

        {/* Action Buttons */}
        {!isMe && isPending && (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInteract("reject");
              }}
              className="px-1.5 py-0.5 bg-white/15 hover:bg-white/25 text-white text-[9px] rounded font-bold backdrop-blur-sm"
            >
              Decline
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInteract("accept");
              }}
              className="px-1.5 py-0.5 bg-white/15 hover:bg-white/25 text-white text-[9px] rounded font-bold backdrop-blur-sm"
            >
              Accept
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const LocationBubble = ({ name, address }) => (
  <div className="flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden w-64 shadow-sm select-none">
    {/* 上半部分：地图背景图 */}
    <div className="h-24 bg-gray-100 relative">
      {/* 记得确保 mapBg 已经 import 进来了 */}
      <img
        src={mapBg}
        alt="Map"
        className="w-full h-full object-cover"
        draggable="false"
      />

      {/* 自定义 SVG 图标容器 - 绝对居中定位 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -mt-3 drop-shadow-md">
        <svg
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8 text-[#CE4A3A]" // 这里控制大小(w-8 h-8)和颜色(text-red-600)
          fill="currentColor" // 使用 currentColor 让它跟随 className 的颜色
        >
          <path d="M511.913993 63.989249C317.882076 63.989249 159.973123 221.898203 159.973123 415.930119c0 187.323366 315.473879 519.998656 328.890979 534.103813 6.020494 6.364522 14.449185 9.976818 23.221905 9.976818 0.172014 0 0.516042 0 0.688056 0 8.944734 0 17.545439-4.128339 23.393919-11.008903l109.22896-125.054258c145.179909-177.690576 218.629934-314.957836 218.629934-407.845456C864.026877 221.898203 706.117924 63.989249 511.913993 63.989249zM511.913993 575.903242c-88.415253 0-159.973123-71.55787-159.973123-159.973123s71.55787-159.973123 159.973123-159.973123 159.973123 71.55787 159.973123 159.973123S600.329246 575.903242 511.913993 575.903242z" />
        </svg>
      </div>
    </div>

    {/* 下半部分：文字信息 */}
    <div className="p-3 bg-white">
      <div className="text-sm font-medium text-gray-900 truncate leading-tight mb-1">
        {name}
      </div>
      <div className="text-xs text-gray-500 truncate leading-tight">
        {address}
      </div>
    </div>
  </div>
);
