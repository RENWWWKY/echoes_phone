import React, { useState } from "react";
import {
  RefreshCw,
  ScanLine,
  MapPin,
  Upload,
  X,
  Trash2,
  Video,
  ChevronUp,
  ChevronDown,
  Filter,
  RotateCcw,
} from "lucide-react";
import AppWindow from "./AppWindow";
import useStickyState from "../hooks/useStickyState";
import { PRESET_LOCATION_IMAGES } from "../constants/assets";
import { compressImage, formatTime, getCurrentTimeObj } from "../utils/helpers";

// --- 子组件：心声折叠面板 ---
const CollapsibleThought = ({ text, label }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!text) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-[10px] uppercase font-bold text-gray-400 hover:text-blue-500 transition-colors"
      >
        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {isExpanded ? "收起心声" : label}
      </button>
      {isExpanded && (
        <div className="mt-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-[11px] italic text-gray-600 leading-relaxed animate-in fade-in slide-in-from-top-1">
          “ {text} ”
        </div>
      )}
    </div>
  );
};

// --- 地图布局常量 ---
const MAP_LAYOUTS = {
  4: [
    { top: "25%", side: "left", arm: 12 },
    { top: "47%", side: "right", arm: 12 },
    { top: "69%", side: "left", arm: 12 },
    { top: "91%", side: "right", arm: 12 },
  ],
  5: [
    { top: "22%", side: "left", arm: 25 },
    { top: "39%", side: "right", arm: 25 },
    { top: "56%", side: "left", arm: 25 },
    { top: "73%", side: "right", arm: 25 },
    { top: "90%", side: "left", arm: 25 },
  ],
  6: [
    { top: "20%", side: "left", arm: 8 },
    { top: "32%", side: "right", arm: 12 },
    { top: "44%", side: "left", arm: 12 },
    { top: "56%", side: "right", arm: 12 },
    { top: "68%", side: "left", arm: 12 },
    { top: "80%", side: "right", arm: 8 },
  ],
};

const SmartWatch = ({
  isOpen,
  onClose,
  persona,
  worldBook,
  userName,
  apiConfig,
  prompts,
  generateContent,
  charTrackerContext,
  userPersona,
  longMemory,
  chatHistory,
  getWorldInfoString,
  getContextString,
  showToast,
}) => {
  // --- 持久化状态 ---
  const [smartWatchLocations, setSmartWatchLocations] = useStickyState(
    [],
    "echoes_sw_locations",
  );
  const [smartWatchLogs, setSmartWatchLogs] = useStickyState(
    [],
    "echoes_sw_logs",
  );

  // --- UI 交互状态 ---
  const [swFilter, setSwFilter] = useState("all");
  const [isEditingMap, setIsEditingMap] = useState(false);
  const [loading, setLoading] = useState({
    smartwatch: false,
    sw_update: false,
  });

  return (
    <AppWindow isOpen={isOpen} title="智能家" onClose={onClose}>
      <div className="pb-20">
        {/* Header Actions */}
        <div className="flex justify-between items-center px-4 pt-4 mb-4">
          <button
            onClick={() => setIsEditingMap(!isEditingMap)}
            className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all ${
              isEditingMap
                ? "bg-black text-white border-black"
                : "text-gray-400 border-gray-200"
            }`}
          >
            {isEditingMap ? "完成编辑" : "编辑地图"}
          </button>
          <button
            onClick={() => generateSmartWatchUpdate()}
            disabled={loading.sw_update || smartWatchLocations.length === 0}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-[#2C2C2C] text-white px-3 py-1.5 rounded-full shadow-lg hover:bg-black transition-colors disabled:opacity-50"
          >
            {loading.sw_update ? (
              <RefreshCw className="animate-spin" size={10} />
            ) : (
              <ScanLine size={10} />
            )}
            更新行踪
          </button>
        </div>

        {/* MAP AREA */}
        <div className="relative w-full h-[550px] bg-[#F5F5F7] border-y border-gray-200 overflow-y-auto custom-scrollbar mb-6">
          {smartWatchLocations.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
              <p className="text-xs text-gray-400">暂无监控数据</p>
              <p className="text-[10px] text-gray-300">
                请确认已开启世界书，然后初始化系统
              </p>
              <button
                onClick={initSmartWatch}
                disabled={loading.smartwatch}
                className="px-6 py-2 bg-black text-white text-xs rounded-lg active:scale-95 transition-transform disabled:bg-gray-400"
              >
                {loading.smartwatch ? "初始化中..." : "初始化监控系统"}
              </button>
            </div>
          ) : (
            <>
              <div className="map-line"></div>
              {smartWatchLocations.map((loc, idx) => {
                const isActive = smartWatchLogs[0]?.locationId === loc.id;
                const count = Math.min(
                  Math.max(smartWatchLocations.length, 4),
                  6,
                );
                const layout = MAP_LAYOUTS[count][idx] || MAP_LAYOUTS[4][idx];
                const isLeft = layout.side === "left";

                return (
                  <div
                    key={loc.id}
                    className="map-node-container"
                    style={{ top: layout.top }}
                  >
                    {/* Dot */}
                    <div
                      className={`map-node-dot ${isActive ? "active" : ""}`}
                      onClick={() =>
                        setSwFilter(swFilter === loc.id ? "all" : loc.id)
                      }
                    ></div>

                    {/* Connector */}
                    <div
                      className="map-connector"
                      style={{
                        width: `${layout.arm}px`,
                        left: isLeft
                          ? `calc(50% - ${layout.arm}px - 8px)`
                          : `calc(50% + 8px)`,
                      }}
                    ></div>

                    {/* Card */}
                    <div
                      className="map-card shadow-sm group"
                      style={{
                        left: isLeft
                          ? `calc(50% - ${layout.arm}px - 118px)`
                          : `calc(50% + ${layout.arm}px + 7px)`,
                        transform: `translateY(-50%)`,
                        border: isActive
                          ? "1px solid #22c55e"
                          : "1px solid #d1d5db",
                      }}
                    >
                      <div className="relative w-full h-[50px] bg-gray-200 mb-2 overflow-hidden flex items-center justify-center rounded-sm">
                        {loc.img ? (
                          <img
                            src={loc.img}
                            alt={loc.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <MapPin size={16} className="text-gray-400" />
                        )}
                        {isEditingMap && (
                          <div
                            className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer"
                            onClick={() =>
                              document
                                .getElementById(`loc-img-${loc.id}`)
                                .click()
                            }
                          >
                            <Upload size={14} className="text-white" />
                            <input
                              type="file"
                              id={`loc-img-${loc.id}`}
                              className="hidden"
                              accept="image/*"
                              onChange={async (e) => {
                                if (e.target.files[0]) {
                                  const base64 = await compressImage(
                                    e.target.files[0],
                                  );
                                  const newLocs = [...smartWatchLocations];
                                  newLocs[idx].img = base64;
                                  setSmartWatchLocations(newLocs);
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {isEditingMap ? (
                        <input
                          className="w-full text-[10px] font-bold bg-white border border-gray-300 px-1 outline-none focus:border-blue-500"
                          value={loc.name}
                          onChange={(e) => {
                            const newLocs = [...smartWatchLocations];
                            newLocs[idx].name = e.target.value;
                            setSmartWatchLocations(newLocs);
                          }}
                        />
                      ) : (
                        <div className="font-bold truncate text-[10px]">
                          {loc.name}
                        </div>
                      )}

                      {isEditingMap ? (
                        <input
                          className="w-full text-[8px] bg-white border border-gray-300 px-1 outline-none focus:border-blue-500 mt-1"
                          value={loc.desc}
                          onChange={(e) => {
                            const newLocs = [...smartWatchLocations];
                            newLocs[idx].desc = e.target.value;
                            setSmartWatchLocations(newLocs);
                          }}
                        />
                      ) : (
                        <div className="text-[8px] text-gray-500 leading-tight mt-1 truncate">
                          {loc.desc}
                        </div>
                      )}

                      {isEditingMap && (
                        <button
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                          onClick={() => {
                            if (smartWatchLocations.length > 4) {
                              setSmartWatchLocations(
                                smartWatchLocations.filter((_, i) => i !== idx),
                              );
                            } else {
                              showToast("error", "最少保留4个地点");
                            }
                          }}
                        >
                          <X size={8} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {!smartWatchLogs[0]?.locationId && smartWatchLogs.length > 0 && (
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="bg-black/70 backdrop-blur text-white text-[10px] px-3 py-1 rounded-full">
                    📍 当前位于: {smartWatchLogs[0].locationName}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Logs Section */}
        <div className="px-4">
          <div className="flex justify-between items-end mb-4 border-b border-gray-200 pb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                监控日志
              </h3>
              {swFilter !== "all" ? (
                <button
                  onClick={() => setSwFilter("all")}
                  className="flex items-center gap-1 text-[9px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full hover:bg-red-100 transition-colors"
                >
                  <RotateCcw size={10} /> 重置
                </button>
              ) : smartWatchLocations.length > 0 ? (
                <button
                  onClick={() => {
                    // 依次循环: all -> loc1 -> loc2 -> ... -> all
                    const locIds = smartWatchLocations.map(l => l.id);
                    if (swFilter === "all") {
                      setSwFilter(locIds[0]);
                    } else {
                      const curIdx = locIds.indexOf(swFilter);
                      if (curIdx >= 0 && curIdx < locIds.length - 1) {
                        setSwFilter(locIds[curIdx + 1]);
                      } else {
                        setSwFilter("all");
                      }
                    }
                  }}
                  className="flex items-center gap-1 text-[9px] text-gray-400 hover:text-blue-500 transition-colors"
                >
                  <Filter size={10} /> 筛选
                </button>
              ) : null}
              {swFilter !== "all" && (
                <span className="text-[9px] text-gray-400">
                  {smartWatchLocations.find(l => l.id === swFilter)?.name}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {smartWatchLogs
              .filter(
                (log) => swFilter === "all" || log.locationId === swFilter,
              )
              .map((log, i) => (
                <div
                  key={log.id}
                  className="glass-card p-4 rounded-xl relative group border border-gray-100 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${i === 0 ? "bg-green-500 animate-pulse" : "bg-gray-300"}`}
                      ></div>
                      <span className="text-xs font-bold text-gray-800">
                        {log.locationName}
                      </span>
                    </div>
                    <span className="text-[9px] text-gray-400 font-mono">
                      {log.displayTime}
                    </span>
                  </div>

                  <div className="text-xs text-gray-600 mb-3 bg-white/60 p-2 rounded-lg border border-white/50">
                    <span className="font-bold mr-1 text-gray-400">状态:</span>{" "}
                    {log.action}
                  </div>

                  <div className="space-y-2">
                    <CollapsibleThought text={log.thought} label="查看心声" />
                    {log.avData && (
                      <details className="group/details">
                        <summary className="list-none cursor-pointer flex items-center gap-1 text-[10px] uppercase font-bold text-gray-400 hover:text-red-500 transition-colors mt-2">
                          <Video
                            size={12}
                            className="group-open/details:hidden"
                          />
                          <ChevronUp
                            size={12}
                            className="hidden group-open/details:block"
                          />
                          <span>{log.avData ? "音视频数据" : "无信号"}</span>
                        </summary>
                        <div className="mt-2 p-3 bg-black/5 rounded-lg border border-black/10 text-[10px] leading-relaxed text-gray-600 animate-in slide-in-from-top-1">
                          <div className="flex items-center gap-1 text-red-500 mb-1 font-bold animate-pulse">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>{" "}
                            REC
                          </div>
                          {log.avData}
                        </div>
                      </details>
                    )}
                  </div>

                  <button
                    onClick={() =>
                      setSmartWatchLogs((prev) =>
                        prev.filter((l) => l.id !== log.id),
                      )
                    }
                    className="absolute top-3 right-3 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            {smartWatchLogs.length === 0 && (
              <div className="text-center text-gray-400 text-xs py-8">
                暂无日志记录
              </div>
            )}
          </div>
        </div>
      </div>
    </AppWindow>
  );
};

export default SmartWatch;
