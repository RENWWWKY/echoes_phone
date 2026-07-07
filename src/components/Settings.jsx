import React, { useState, useEffect } from "react";
import {
  CloudFog,
  RefreshCw,
  ChevronDown,
  FileText,
  Smartphone,
  AlertCircle,
  CheckCircle2,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Upload,
  RotateCcw,
  Download,
  MapPin,
  Edit2,
  Sparkles,
} from "lucide-react";

const SettingsPanel = ({
  // --- 连接配置参数 ---
  apiConfig,
  setApiConfig,
  connectionStatus,

  isFetchingModels,
  fetchModels,
  availableModels,
  testConnection,
  close,

  // --- 上下文参数 ---
  contextLimit,
  setContextLimit,

  // --- 长记忆参数 ---
  memoryConfig,
  setMemoryConfig,
  longMemory,
  setLongMemory,
  triggerSummary,
  isSummarizing,
  onSimplify,
  isSimplifying,

  // --- 聊天设置参数 ---
  chatStyle,
  setChatStyle,
  interactionMode,
  setInteractionMode,
  realTimeEnabled,
  setRealTimeEnabled,
  onRealTimeToggle,
  stickersEnabled,
  setStickersEnabled,
  getGroups,
  toggleStickerGroup,
  stickers,
  setStickers,
  stickerInputRef,
  handleStickerUpload,
  setEditingSticker,

  // --- 指令参数 ---
  prompts,
  setPrompts,

  // --- 数据备份参数 ---
  onExportChat,
  onImportChat,

  addStickerGroup,
  deleteStickerGroup,
  renameStickerGroup,
  handleBulkImport,
  customPrompt,

  activeMsgEnabled,
  setActiveMsgEnabled,

  // --- 皮肤参数 ---
  skinCSS,

  // --- 字体参数 ---
  fontName, // 当前字体文件名
  handleResetFont, // 恢复默认函数
  handleFontUrlSubmit,
  inputUrl,
  setInputUrl,

  simpleMode = false,
}) => (
  <div className="flex flex-col h-full">
    <div className="space-y-10 overflow-y-auto custom-scrollbar flex-grow px-1 pb-10">
      {/* ---------------------------------------------------------
          连接配置
         --------------------------------------------------------- */}
      <section>
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-200/50 pb-2">
          连接配置
        </h3>
        <div className="glass-card p-4 rounded-xl space-y-4">
          {/* API Base URL */}
          <div>
            <label className="block text-[10px] uppercase text-gray-500 mb-1.5 font-bold">
              API 地址 (Base URL)
            </label>
            <input
              type="text"
              value={apiConfig.baseUrl}
              onChange={(e) =>
                setApiConfig((p) => ({ ...p, baseUrl: e.target.value }))
              }
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono outline-none focus:border-black transition-colors"
              placeholder="https://api.openai.com/v1"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="block text-[10px] uppercase text-gray-500 mb-1.5 font-bold">
              密钥 (API Key)
            </label>
            <input
              type="password"
              value={apiConfig.key}
              onChange={(e) =>
                setApiConfig((p) => ({ ...p, key: e.target.value }))
              }
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono outline-none focus:border-black transition-colors"
              placeholder="sk-..."
            />
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-[10px] uppercase text-gray-500 mb-1.5 font-bold">
              模型 (Model)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                {availableModels.length > 0 ? (
                  <select
                    value={apiConfig.model}
                    onChange={(e) =>
                      setApiConfig((p) => ({ ...p, model: e.target.value }))
                    }
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:border-black outline-none transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" disabled>
                      选择模型...
                    </option>
                    {availableModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="gpt-4o"
                    value={apiConfig.model}
                    onChange={(e) =>
                      setApiConfig((p) => ({ ...p, model: e.target.value }))
                    }
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:border-black outline-none transition-colors placeholder:text-gray-300"
                  />
                )}
                {availableModels.length > 0 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronDown size={14} />
                  </div>
                )}
              </div>
              <button
                onClick={fetchModels}
                disabled={
                  isFetchingModels || !apiConfig.baseUrl || !apiConfig.key
                }
                className="px-4 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl transition-colors flex items-center justify-center text-gray-600 disabled:opacity-50"
              >
                {isFetchingModels ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <CloudFog size={18} />
                )}
              </button>
            </div>
          </div>

          {/* 测试连接按钮 (紧跟连接配置) */}
          <div className="pt-2">
            <button
              onClick={testConnection}
              disabled={
                !apiConfig.baseUrl ||
                !apiConfig.key ||
                connectionStatus === "testing"
              }
              className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md ${
                connectionStatus === "success"
                  ? "bg-green-600 text-white"
                  : connectionStatus === "error"
                    ? "bg-red-600 text-white"
                    : "bg-[#1a1a1a] text-white hover:bg-[#333]"
              }`}
            >
              {connectionStatus === "testing" && (
                <RefreshCw size={14} className="animate-spin" />
              )}
              {connectionStatus === "success" && <CheckCircle2 size={14} />}
              {connectionStatus === "error" && <AlertCircle size={14} />}
              {connectionStatus === "testing"
                ? "连接中..."
                : connectionStatus === "success"
                  ? "连接成功"
                  : connectionStatus === "error"
                    ? "连接失败"
                    : "测试连接并保存"}
            </button>
          </div>
        </div>
      </section>

      {!simpleMode && (
        <>
          {/* ---------------------------------------------------------
          上下文记忆
         --------------------------------------------------------- */}
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-200/50 pb-2">
              上下文
            </h3>
            <div className="glass-card p-4 rounded-xl flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  上下文记忆 (轮数)
                </label>
                <p className="text-[10px] text-gray-400">
                  按对话轮次计算，同一人连续发送的多条消息仅计为 1 轮。
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={contextLimit}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      setContextLimit("");
                    } else {
                      const val = parseInt(raw);
                      if (!isNaN(val)) setContextLimit(val);
                    }
                  }}
                  onBlur={() => {
                    if (contextLimit === "" || contextLimit < 2) setContextLimit(10);
                  }}
                  className="w-16 p-2 bg-white border border-gray-200 rounded-lg text-center text-xs font-mono outline-none focus:border-black"
                />
                <span className="text-[10px] text-gray-400">轮</span>
              </div>
            </div>
          </section>

          {/* ---------------------------------------------------------
          长记忆配置
         --------------------------------------------------------- */}
          <section>
            <div className="flex justify-between items-center mb-4 border-b border-gray-200/50 pb-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                长记忆
              </h3>
              {/* 开关放在标题行 */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400">
                  {memoryConfig.enabled ? "已开启" : "已关闭"}
                </span>
                <button
                  onClick={() =>
                    setMemoryConfig((p) => ({ ...p, enabled: !p.enabled }))
                  }
                  className={`w-8 h-4 rounded-full relative transition-colors ${
                    memoryConfig.enabled ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${
                      memoryConfig.enabled ? "left-4.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl space-y-4">
              {/* 阈值 */}
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-600">
                  自动总结
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={memoryConfig.threshold}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        setMemoryConfig((p) => ({ ...p, threshold: "" }));
                      } else {
                        const val = parseInt(raw);
                        if (!isNaN(val)) setMemoryConfig((p) => ({ ...p, threshold: val }));
                      }
                    }}
                    onBlur={() => {
                      if (memoryConfig.threshold === "" || memoryConfig.threshold < 5) {
                        setMemoryConfig((p) => ({ ...p, threshold: 10 }));
                      }
                    }}
                    className="w-16 p-2 bg-white border border-gray-200 rounded-lg text-center text-xs font-mono outline-none focus:border-black"
                  />
                  <span className="text-[10px] text-gray-400">轮对话触发</span>
                </div>
              </div>

              {/* 记忆文本与手动按钮 */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="text-[10px] uppercase font-bold text-gray-400">
                    记忆详情 (Prompt)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={triggerSummary}
                      disabled={isSummarizing || !memoryConfig.enabled}
                      className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline disabled:opacity-50 disabled:no-underline disabled:text-gray-400 cursor-pointer"
                    >
                      {isSummarizing ? (
                        <RefreshCw size={10} className="animate-spin" />
                      ) : (
                        <FileText size={10} />
                      )}
                      手动总结
                    </button>
                    {longMemory?.length >= 1000 && (
                      <>
                        <span className="text-[10px] text-gray-300">|</span>
                        <button
                          onClick={onSimplify}
                          disabled={isSimplifying}
                          className="flex items-center gap-1 text-[10px] text-orange-600 hover:underline disabled:opacity-50 disabled:no-underline disabled:text-gray-400 cursor-pointer"
                          title="简化已有的长期记忆，去掉重复并压缩早期内容"
                        >
                          {isSimplifying ? (
                            <RefreshCw size={10} className="animate-spin" />
                          ) : (
                            <Sparkles size={10} />
                          )}
                          简化
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <textarea
                  value={longMemory}
                  onChange={(e) => setLongMemory(e.target.value)}
                  className="w-full h-32 p-3 bg-white/50 border border-gray-200 rounded-xl text-xs leading-relaxed resize-none focus:border-black outline-none custom-scrollbar transition-colors focus:bg-white"
                  placeholder="开启时，角色将自动在此处积累对你的长期记忆..."
                />
              </div>
            </div>
          </section>

          {/* ---------------------------------------------------------
          SECTION 3: 聊天设置 (独立区块)
         --------------------------------------------------------- */}
          {chatStyle && (
            <section>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-200/50 pb-2">
                聊天设置
              </h3>
              <div className="glass-card p-4 rounded-xl space-y-4">
                {/* 风格 */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2">
                    风格 (Style)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        id: "dialogue",
                        label: "短信",
                        desc: "拟真聊天体验",
                      },
                      {
                        id: "novel",
                        label: "小说",
                        desc: "大段文字描写",
                      },
                    ].map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setChatStyle(style.id)}
                        className={`flex flex-col items-center justify-center py-2 rounded-lg transition-all border ${
                          chatStyle === style.id
                            ? "bg-black border-black shadow-md"
                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                        }`}
                    style={chatStyle === style.id ? { color: '#fff' } : {}}
                      >
                        <span className="text-xs font-bold">{style.label}</span>
                        <span
                          className={`text-[8px] mt-0.5 ${
                            chatStyle === style.id
                              ? "text-gray-300"
                              : "text-gray-400"
                          }`}
                        >
                          {style.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 交互模式 */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2">
                    交互模式 (Mode)
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setInteractionMode("online")}
                      className={`flex-1 py-2 text-xs rounded-lg transition-colors flex items-center justify-center gap-1 ${
                        interactionMode === "online"
                          ? "bg-black text-white shadow-md"
                          : "bg-white/50 text-gray-500 hover:bg-white"
                      }`}
                    >
                      <Smartphone size={12} /> 线上 (Phone)
                    </button>
                    <button
                      onClick={() => setInteractionMode("offline")}
                      className={`flex-1 py-2 text-xs rounded-lg transition-colors flex items-center justify-center gap-1 ${
                        interactionMode === "offline"
                          ? "bg-black text-white shadow-md"
                          : "bg-white/50 text-gray-500 hover:bg-white"
                      }`}
                    >
                      <MapPin size={12} /> 现实 (Reality)
                    </button>
                  </div>
                </div>

                {/* 真实时间感知 */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500">
                      真实时间感知
                    </label>
                    <span className="text-[9px] text-gray-400">【线下】、【小说】模式下推荐关闭</span>
                  </div>
                  <button
                    onClick={() => {
                      const next = !realTimeEnabled;
                      setRealTimeEnabled(next);
                      if (next && onRealTimeToggle) onRealTimeToggle();
                    }}
                    className={`w-8 h-4 rounded-full relative transition-colors ${
                      realTimeEnabled ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${
                        realTimeEnabled ? "left-4.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* 主动消息 
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500">
                      主动消息
                    </label>
                    <span className="text-[9px] text-gray-400">角色有概率会主动发消息</span>
                  </div>
                  <button
                    onClick={() => setActiveMsgEnabled(!activeMsgEnabled)}
                    className={`w-8 h-4 rounded-full relative transition-colors ${
                      activeMsgEnabled ? "bg-[var(--skin-accent,#7A2A3A)]" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${
                        activeMsgEnabled ? "left-4.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
                */}

                {/* 表情包管理 (Inside SettingsPanel) */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <label className="text-[10px] font-bold uppercase text-gray-500 mr-auto">
                      角色表情包库
                    </label>
                    {/* Add Single Button */}
                    {/* 上传按钮 */}
                    <button
                      onClick={() => stickerInputRef.current.click()}
                      className="flex items-center justify-center gap-1 p-0 text-[10px] text-gray-400 hover:text-[#7A2A3A] transition-colors"
                      title="上传本地图片"
                    >
                      <Plus size={10} />
                      <span>上传</span>
                    </button>

                    {/* 批量导入按钮 */}
                    <button
                      onClick={async () => {
                        const input = await customPrompt("请输入表情包链接进行导入", "", "批量导入");
                        if (input) handleBulkImport(input, "char");
                      }}
                      className="flex items-center justify-center gap-1 pl-1 pr-3 text-[10px] text-gray-400 hover:text-blue-500 transition-colors"
                      title="链接一键导入"
                    >
                      <Download size={10} />
                      <span>批量</span>
                    </button>

                    <button
                      onClick={() => setStickersEnabled(!stickersEnabled)}
                      className={`w-8 h-4 rounded-full relative transition-colors ${
                        stickersEnabled ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${
                          stickersEnabled ? "left-4.5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  {stickersEnabled && (
                    <div className="space-y-4">
                      {/* [替换后] 使用 StickerGroup 组件 */}
                      {getGroups(stickers).map((group) => (
                        <StickerGroup
                          key={group}
                          group={group}
                          stickers={stickers}
                          toggleStickerGroup={toggleStickerGroup}
                          setEditingSticker={setEditingSticker}
                          handleBulkImport={handleBulkImport}
                          deleteStickerGroup={deleteStickerGroup}
                          renameStickerGroup={renameStickerGroup}
                          handleStickerUpload={handleStickerUpload}
                        />
                      ))}

                      {/* 上传区域 */}
                      <input
                        type="file"
                        ref={stickerInputRef}
                        className="hidden"
                        onChange={(e) => handleStickerUpload(e, "char")}
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-200/50 pb-2">
              数据管理
            </h3>
            <div className="glass-card p-4 rounded-xl space-y-3">
              <p className="text-[9px] text-gray-400 mb-2">
                导出全部数据（角色、记忆、聊天记录等）或从备份恢复。
              </p>
              <div className="flex gap-3">
                {/* 导出按钮 */}
                <button
                  onClick={onExportChat}
                  className="flex-1 py-3 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  <Download size={14} />
                  导出备份
                </button>

                {/* 导入按钮 (关联隐藏的 input) */}
                <label className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                  <Upload size={14} />
                  导入恢复
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={onImportChat}
                  />
                </label>
              </div>
            </div>
          </section>

          {/*<section>
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-200/50 pb-2">
          指令
        </h3>
        {prompts &&
          Object.keys(prompts).map((k) => (
            <div key={k} className="mb-4">
              <label
                className="text-[9px] uppercase font-bold text-gray-400 mb-1 block"
                htmlFor={`prompt-${k}`}
              >
                {k}
              </label>
              <textarea
                id={`prompt-${k}`}
                name={`prompt-${k}`}
                className="w-full h-20 p-2 text-[10px] font-mono bg-white/40 border border-gray-200 rounded-lg resize-y focus:bg-white transition-colors outline-none"
                value={prompts[k]}
                onChange={(e) =>
                  setPrompts((p) => ({ ...p, [k]: e.target.value }))
                }
              />
            </div>
          ))}
      </section>*/}
        </>
      )}
    </div>
  </div>
);

/* --- HELPER COMPONENTS --- */
const StickerEditorModal = ({ sticker, onSave, onDelete, onClose }) => {
  const [desc, setDesc] = useState(sticker.desc);

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-2xl flex flex-col gap-4">
        <h3 className="text-sm font-bold text-gray-700">编辑表情包</h3>
        <div className="aspect-square w-32 mx-auto bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
          <img src={sticker.url} className="w-full h-full object-cover" />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase text-gray-400">
            描述 (角色将根据此描述选用)
          </label>
          <textarea
            className="w-full h-20 p-2 text-xs border border-gray-200 rounded-lg mt-1 resize-none focus:border-black outline-none"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onDelete(sticker.id)}
            className="flex-1 py-2 bg-red-50 text-red-500 rounded-lg text-xs font-bold hover:bg-red-100"
          >
            删除
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold"
          >
            取消
          </button>
          <button
            onClick={() => onSave(sticker.id, desc)}
            className="flex-1 py-2 bg-black text-white rounded-lg text-xs font-bold"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

// 表情包分组组件 (功能增强 + 视觉优化)

const StickerGroup = ({
  group,
  stickers,
  toggleStickerGroup,
  setEditingSticker,
  deleteStickerGroup,
  renameStickerGroup,
  handleStickerUpload,
}) => {
  const [isExpanded, setIsExpanded] = useState(false); // 默认折叠

  // 过滤出当前组的表情，并排除掉占位符(isPlaceholder)
  const groupStickers = stickers.filter((s) => s.group === group);
  const visibleStickers = groupStickers.filter((s) => !s.isPlaceholder);

  const isGroupEnabled = groupStickers.every((s) => s.enabled !== false);

  return (
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 transition-all mb-3">
      {/* 标题头 */}
      <div className="flex justify-between items-center h-6">
        {/* 左侧：折叠 + 标题 */}
        <div
          className="flex items-center gap-2 cursor-pointer h-full"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div
            className={`transition-transform duration-300 text-gray-400 ${
              isExpanded ? "rotate-180" : "rotate-0"
            }`}
          >
            <ChevronDown size={14} />
          </div>
          <h4 className="text-xs font-bold text-gray-700 select-none">
            {group}
          </h4>
          <span className="text-[9px] text-gray-400">
            ({visibleStickers.length})
          </span>
        </div>

        {/* 右侧：操作按钮组 */}
        <div className="flex items-center gap-2">
          {/* 改名 */}
          <button
            onClick={() => renameStickerGroup(group)}
            className="text-gray-300 hover:text-blue-500 p-1 transition-colors"
            title="重命名库"
          >
            <Edit2 size={12} />
          </button>

          {/* 删除 */}
          <button
            onClick={() => deleteStickerGroup(group)}
            className="text-gray-300 hover:text-red-500 p-1 transition-colors"
            title="删除库"
          >
            <Trash2 size={12} />
          </button>

          {/* 分割线 */}
          <div className="w-px h-3 bg-gray-200 mx-1"></div>

          {/* 开关 */}
          <div
            className="flex items-center gap-1 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              toggleStickerGroup(group, !isGroupEnabled);
            }}
          >
            {isGroupEnabled ? (
              <ToggleRight
                size={18}
                className="text-[#7A2A3A] drop-shadow-sm"
              />
            ) : (
              <ToggleLeft size={18} className="text-gray-300" />
            )}
          </div>
        </div>
      </div>

      {/* 表情网格 (折叠区域) */}
      {isExpanded && (
        <div
          className={`pt-3 mt-2 border-t border-gray-200/50 transition-all animate-in slide-in-from-top-1 ${
            isGroupEnabled
              ? "opacity-100"
              : "opacity-40 grayscale pointer-events-none"
          }`}
        >
          {visibleStickers.length === 0 && (
            <div className="text-center py-4 text-[10px] text-gray-400 italic">
              暂无表情，请上传
            </div>
          )}

          <div className="grid grid-cols-4 gap-3">
            {visibleStickers.map((s) => (
              <div
                key={s.id}
                className="aspect-square bg-white rounded-xl overflow-hidden relative group cursor-pointer border border-gray-100"
                onClick={() => setEditingSticker({ ...s, source: "char" })}
              >
                <img src={s.url} className="w-full h-full object-cover" />

                {/* 选中/禁用遮罩 */}
                {!s.enabled && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px]" />
                )}
              </div>
            ))}

            {/* [修改] 组内上传按钮 - 对应当前分组 */}
            <label
              className="
                    aspect-square border border-dashed border-gray-300 rounded-xl 
                    flex flex-col items-center justify-center cursor-pointer 
                    text-gray-400 hover:text-[#7A2A3A] hover:border-[#7A2A3A] hover:bg-white
                    transition-all duration-300 relative
                "
            >
              <Plus size={16} />
              <input
                type="file"
                className="hidden"
                accept="image/*"
                // 关键点：调用 handleStickerUpload 时，传入当前的 group 名字
                onChange={(e) => handleStickerUpload(e, "char", group)}
                // 点击时清空，确保能连续上传同一张图
                onClick={(e) => (e.target.value = null)}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;
