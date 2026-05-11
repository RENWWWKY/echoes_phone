import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  Activity,
  User,
  Camera,
  Copy,
  Edit2,
  Trash2,
  Check,
  Share,
  MoreHorizontal,
  Dices,
} from "lucide-react";
import { echoesDB } from "../utils/appHelpers";

/* ============================================
   CHAT BUBBLE COMPONENT
   - Standardized bubble rendering
   - Full accessibility (ARIA labels, keyboard nav)
   - Screen reader support
   ============================================ */

// 3D 骰子面（1-6 点）
const FaceDots = ({ n }) => {
  const dots = {
    1: [[1,1]],
    2: [[0,2],[2,0]],
    3: [[0,2],[1,1],[2,0]],
    4: [[0,0],[0,2],[2,0],[2,2]],
    5: [[0,0],[0,2],[1,1],[2,0],[2,2]],
    6: [[0,0],[0,2],[1,0],[1,2],[2,0],[2,2]],
  }[n];
  return (
    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-1.5">
      {Array.from({length:9}).map((_,i)=>{
        const r=Math.floor(i/3), c=i%3;
        const active=dots.some(([dr,dc])=>dr===r&&dc===c);
        return <div key={i} className="flex items-center justify-center">
          {active && <div className="w-2 h-2 rounded-full bg-gray-800" />}
        </div>;
      })}
    </div>
  );
};

// 3D 骰子组件
const DiceFace = ({ value }) => {
  const targetAngles = {
    1: "rotateX(-90deg)",
    2: "rotateX(180deg)",
    3: "rotateY(90deg) rotateX(-90deg)",
    4: "rotateY(-90deg) rotateX(-90deg)",
    5: "",
    6: "rotateX(90deg)",
  };
  const target = targetAngles[value] || "";

  const [rolling, setRolling] = useState(true);
  const [angle, setAngle] = useState(`${Math.random()*720}deg ${Math.random()*720}deg 0deg`);

  useEffect(() => {
    let count = 0;
    const total = 8;
    const interval = setInterval(() => {
      count++;
      if (count < total) {
        const rx = Math.floor(Math.random() * 4) * 90;
        const ry = Math.floor(Math.random() * 4) * 90;
        setAngle(`rotateX(${rx + Math.random()*180}deg) rotateY(${ry + Math.random()*180}deg) rotateZ(0deg)`);
      } else {
        setRolling(false);
        clearInterval(interval);
      }
    }, 80);
    return () => clearInterval(interval);
  }, []);

  const style = rolling
    ? { transform: angle, transition: "none" }
    : { transform: target, transition: "transform 0.4s cubic-bezier(0.22, 0.89, 0.38, 1.02)" };

  return (
    <div style={{ perspective: 120, width: 44, height: 44 }}>
      <div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d", ...style }}
      >
        <div className="absolute inset-0 bg-white rounded-lg shadow-inner border border-gray-200" style={{ transform: "translateZ(22px)" }}>
          <FaceDots n={1} />
        </div>
        <div className="absolute inset-0 bg-white rounded-lg shadow-inner border border-gray-200" style={{ transform: "rotateY(180deg) translateZ(22px)" }}>
          <FaceDots n={6} />
        </div>
        <div className="absolute inset-0 bg-white rounded-lg shadow-inner border border-gray-200" style={{ transform: "rotateY(90deg) translateZ(22px)" }}>
          <FaceDots n={4} />
        </div>
        <div className="absolute inset-0 bg-white rounded-lg shadow-inner border border-gray-200" style={{ transform: "rotateY(-90deg) translateZ(22px)" }}>
          <FaceDots n={3} />
        </div>
        <div className="absolute inset-0 bg-white rounded-lg shadow-inner border border-gray-200" style={{ transform: "rotateX(90deg) translateZ(22px)" }}>
          <FaceDots n={5} />
        </div>
        <div className="absolute inset-0 bg-white rounded-lg shadow-inner border border-gray-200" style={{ transform: "rotateX(-90deg) translateZ(22px)" }}>
          <FaceDots n={2} />
        </div>
      </div>
    </div>
  );
};

const ChatBubble = ({
  msg,
  index,
  isMe,
  persona,
  avatar,
  userAvatar,
  charStickers,
  userStickers,
  chatStyle,
  expandedChatStatusIndex,
  onToggleStatus,
  onCopy,
  onEdit,
  onDelete,
  onRegenerate,
  isMultiSelectMode,
  isSelected,
  onToggleSelect,
  formatTime,
}) => {
  const isSystem = msg.isSystem;
  const isTransfer = msg.isTransfer;
  const isVoice = msg.isVoice;
  const isLocation = msg.isLocation;
  const isDice = msg.isDice;
  const isForward = msg.isForward;
  const isSticker = msg.sticker || msg.stickerId;
  const isRealImage = msg.isImage && msg.imageKey;
  const hasStatus = msg.sender === "char" && msg.status;

  // 加载真实图片
  const [realImageUrl, setRealImageUrl] = useState(null);
  useEffect(() => {
    if (isRealImage && msg.imageKey) {
      echoesDB.getItem(msg.imageKey).then((data) => {
        if (data) setRealImageUrl(data);
      });
    }
  }, [isRealImage, msg.imageKey]);

  // Determine sticker URL
  let stickerUrl = null;
  if (isSticker) {
    if (msg.sticker?.url) {
      stickerUrl = msg.sticker.url;
    } else if (msg.stickerId) {
      const found =
        userStickers.find((s) => s.id === msg.stickerId) ||
        charStickers.find((s) => s.id === msg.stickerId);
      if (found) stickerUrl = found.url;
    }
  }

  // System message bubble
  if (isSystem) {
    return (
      <div
        className="relative group flex justify-center my-4 animate-fade-in"
        role="listitem"
      >
        <button
          className="bg-gray-200/60 backdrop-blur-sm text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm cursor-pointer transition-default hover:bg-gray-200"
          aria-label={`系统消息: ${msg.text}`}
          onClick={() => {}}
          onContextMenu={(e) => e.preventDefault()}
        >
          {msg.text.replace("[系统通知] ", "")}
        </button>
      </div>
    );
  }

  // Main bubble container
  const bubbleContent = (
    <div
      className={`
        flex gap-3 relative max-w-full
        ${isMe ? "flex-row-reverse" : "flex-row"}
        ${isMultiSelectMode ? "cursor-pointer hover:bg-gray-100/50 p-2 rounded-xl transition-default" : ""}
      `}
      role="listitem"
      aria-label={
        isMe
          ? `我的消息: ${msg.text?.substring(0, 50)}${msg.text?.length > 50 ? "..." : ""}`
          : `${persona?.name || "AI"}的消息: ${msg.text?.substring(0, 50)}${msg.text?.length > 50 ? "..." : ""}`
      }
    >
      {/* Multi-select checkbox */}
      {isMultiSelectMode && (
        <div
          className={`
            w-6 h-6 rounded-full border-2 flex items-center justify-center transition-default self-center shrink-0
            ${
              isSelected
                ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
                : "border-gray-300 bg-white"
            }
          `}
          aria-hidden="true"
        >
          {isSelected && <Check size={14} className="text-white" />}
        </div>
      )}

      {/* Avatar */}
      <div
        className={`
          w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm
          ${isMe ? "bg-gray-200" : "bg-white border border-gray-100"}
        `}
        aria-hidden="true"
      >
        {isMe ? (
          userAvatar ? (
            <img
              src={userAvatar}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={14} className="text-gray-500" />
          )
        ) : avatar ? (
          <img src={avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-800 text-[10px] font-bold">
            {persona?.name?.[0] || "?"}
          </span>
        )}
      </div>

      {/* Message Content Column */}
      <div
        className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[72%] relative`}
      >
        {/* Transfer Bubble */}
        {isTransfer && (
          <TransferBubble
            msg={msg}
            isMe={isMe}
            onCopy={onCopy}
            onEdit={onEdit}
            onDelete={onDelete}
            isMultiSelectMode={isMultiSelectMode}
          />
        )}

        {/* Sticker */}
        {stickerUrl && !isTransfer && (
          <div className="w-32 rounded-xl overflow-hidden shadow-sm border border-gray-100">
            <img src={stickerUrl} alt={msg.sticker?.desc || "表情包"} />
          </div>
        )}

        {/* Voice Message */}
        {isVoice && !isTransfer && (
          <VoiceMessageBubble msg={msg} isMe={isMe} />
        )}

        {/* Location */}
        {isLocation && !isTransfer && (
          <LocationBubble name={msg.location?.name || "地点"} address={msg.location?.address || ""} />
        )}

        {/* Dice */}
        {isDice && !isTransfer && (
          <div className={`p-2 rounded-2xl ${
            isMe ? "bg-[#2C2C2C]" : "bg-white border border-gray-200"
          }`}>
            <DiceFace value={msg.dice?.result || 1} rolling={false} />
          </div>
        )}

        {/* Real Image */}
        {isRealImage && !isTransfer && (
          <div
            className="cursor-pointer overflow-hidden rounded-xl border-2 border-white shadow-sm bg-white relative group/img transition-default active:scale-95"
            role="img"
            aria-label="发送的图片"
          >
            {realImageUrl ? (
              <img
                src={realImageUrl}
                alt="发送的图片"
                className="w-48 max-h-64 object-cover rounded-xl"
              />
            ) : (
              <div className="w-48 h-32 bg-gray-200 flex items-center justify-center animate-pulse">
                <Camera size={24} className="text-gray-400" aria-hidden="true" />
              </div>
            )}
          </div>
        )}

        {/* Fake Image */}
        {msg.text?.startsWith("[图片]") && !isTransfer && !isRealImage && (
          <div
            className="cursor-pointer overflow-hidden rounded-xl border-2 border-white shadow-sm bg-white relative group/img transition-default active:scale-95"
            onClick={() => {}}
            role="img"
            aria-label={`图片: ${msg.text.replace("[图片] ", "")}`}
          >
            <div className="w-48 h-32 bg-gray-200 flex items-center justify-center">
              <Camera size={24} className="text-gray-400" aria-hidden="true" />
            </div>
            <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] p-1 truncate">
              {msg.text.replace("[图片] ", "")}
            </p>
          </div>
        )}

        {/* Forward Card */}
        {isForward && !isTransfer && (
          <div
            className={`
              px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap
              ${
                isMe
                  ? "bg-[var(--color-bubble-user-bg)] text-[var(--color-bubble-user-text)] rounded-tr-none"
                  : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
              }
            `}
          >
            <div className="text-left max-w-[240px] pl-3 border-l-2 border-white/30 my-1">
              <div className="flex items-center gap-2 mb-1 opacity-70">
                <Share size={10} aria-hidden="true" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {msg.forwardData?.type === "post" ? "帖子" : "评论"}
                </span>
              </div>
              <div className="text-[10px] opacity-80 mb-1 font-bold">
                @{msg.forwardData?.author}
              </div>
              <div className="text-xs opacity-80 line-clamp-3 leading-relaxed">
                {msg.forwardData?.content}
              </div>
            </div>
          </div>
        )}

        {/* Regular Text Bubble */}
        {!isTransfer && !stickerUrl && !isVoice && !isLocation && !isDice && !isForward && !isRealImage && !msg.text?.startsWith("[图片]") && (
          <div
            className={`
              px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap select-text
              ${
                isMe
                  ? "bg-[var(--color-bubble-user-bg)] text-[var(--color-bubble-user-text)] rounded-tr-none"
                  : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
              }
            `}
          >
            {msg.text}
          </div>
        )}

        {/* Status Expand Button (AI messages only) */}
        {hasStatus && !isMultiSelectMode && (
          <button
            onClick={() => onToggleStatus(index)}
            className={`
              self-center p-1.5 rounded-full transition-default
              ${
                expandedChatStatusIndex === index
                  ? "bg-[var(--color-primary)] text-white shadow-md transform scale-110"
                  : "text-gray-300 hover:text-[var(--color-primary)] hover:bg-gray-100"
              }
            `}
            aria-label={
              expandedChatStatusIndex === index ? "收起状态详情" : "查看状态详情"
            }
            aria-expanded={expandedChatStatusIndex === index}
          >
            <Activity size={12} aria-hidden="true" />
          </button>
        )}

        {/* Time + Regenerate (hidden until hover) */}
        {!isMultiSelectMode && (
          <div
            className={`
              flex gap-3 mt-1 items-center opacity-0 group-hover:opacity-100 transition-default
              ${isMe ? "mr-12 flex-row-reverse" : "ml-12 pl-1 flex-row"}
            `}
          >
            <span className="text-[9px] text-gray-300">{msg.time}</span>
            {msg.sender === "char" && !isTransfer && (
              <button
                onClick={() => onRegenerate(index)}
                className="text-gray-300 hover:text-black transition-default p-1 touch-target"
                aria-label="重新生成此条回复"
                title="重新生成"
              >
                <RotateCcw size={11} aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {/* Status Expanded Card */}
        {expandedChatStatusIndex === index && hasStatus && (
          <div
            className="ml-12 mt-1 w-64 glass-card p-3 rounded-xl animate-bubble-in border border-gray-200/50 relative z-10"
            role="region"
            aria-label="AI状态详情"
          >
            <StatusCard status={msg.status} />
          </div>
        )}
      </div>
    </div>
  );

  // Long press / context menu handler wrapper
  return bubbleContent;
};

/* ============================================
   SUB-COMPONENTS
   ============================================ */

const TransferBubble = ({ msg, isMe, onCopy, onEdit, onDelete, isMultiSelectMode }) => {
  return (
    <div
      className={`
        px-4 py-3 rounded-2xl text-sm shadow-sm min-w-[140px]
        ${
          isMe
            ? "bg-[var(--color-bubble-user-bg)] text-[var(--color-bubble-user-text)]"
            : "bg-white border border-gray-100 text-gray-800"
        }
      `}
      role="article"
      aria-label={`转账: ¥${msg.transfer?.amount || 0}${msg.transfer?.note ? `, 备注: ${msg.transfer.note}` : ""}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg font-bold">¥{msg.transfer?.amount || 0}</span>
        {msg.transfer?.status === "pending" && !isMe && (
          <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
            待确认
          </span>
        )}
        {msg.transfer?.status === "accepted" && (
          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
            已收款
          </span>
        )}
        {msg.transfer?.status === "rejected" && (
          <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
            已退还
          </span>
        )}
      </div>
      {msg.transfer?.note && (
        <p className="text-[10px] opacity-70">{msg.transfer.note}</p>
      )}
    </div>
  );
};

const VoiceMessageBubble = ({ msg, isMe }) => {
  return (
    <div
      className={`
        px-4 py-2.5 rounded-2xl text-sm flex items-center gap-2 shadow-sm min-w-[120px]
        ${
          isMe
            ? "bg-[var(--color-bubble-user-bg)] text-[var(--color-bubble-user-text)]"
            : "bg-white border border-gray-100 text-gray-800"
        }
      `}
      role="article"
      aria-label={`语音消息: ${msg.text?.replace("[语音消息] ", "")}`}
    >
      <span className="text-lg">🎤</span>
      <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--color-primary)] rounded-full"
          style={{ width: "40%" }}
        />
      </div>
      <span className="text-[10px] opacity-70">
        {msg.text?.replace("[语音消息] ", "").split(" ")[0] || "0:00"}
      </span>
    </div>
  );
};

const LocationBubble = ({ name, address }) => {
  return (
    <div
      className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm min-w-[180px]"
      role="article"
      aria-label={`位置: ${name}, ${address}`}
    >
      <div className="flex items-start gap-2">
        <span className="text-lg">📍</span>
        <div>
          <p className="text-sm font-medium text-gray-800">{name}</p>
          {address && (
            <p className="text-[10px] text-gray-500 mt-0.5">{address}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const StatusCard = ({ status }) => {
  if (!status) return null;

  return (
    <div className="space-y-2">
      {status.outfit && (
        <div className="flex items-start gap-2">
          <span className="text-[10px] mt-0.5 text-gray-400 shrink-0" aria-hidden="true">👕</span>
          <span className="text-[10px] text-gray-600 leading-tight">{status.outfit}</span>
        </div>
      )}
      {status.action && (
        <div className="flex items-start gap-2">
          <span className="text-[10px] mt-0.5 text-gray-400 shrink-0" aria-hidden="true">👁</span>
          <span className="text-[10px] text-gray-600 leading-tight">{status.action}</span>
        </div>
      )}
      {status.thought && (
        <div className="flex items-start gap-2">
          <span className="text-[10px] mt-0.5 text-blue-400 shrink-0" aria-hidden="true">💭</span>
          <span className="text-[10px] text-blue-800 italic leading-tight">"{status.thought}"</span>
        </div>
      )}
      {status.desire && (
        <div className="flex items-start gap-2">
          <span className="text-[10px] mt-0.5 text-red-400 shrink-0" aria-hidden="true">👻</span>
          <span className="text-[10px] text-red-800 italic leading-tight">"{status.desire}"</span>
        </div>
      )}
    </div>
  );
};

export default ChatBubble;
