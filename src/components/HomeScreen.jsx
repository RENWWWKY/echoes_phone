import React, { useState, useRef } from "react";
import { LogOut } from "lucide-react";

/* ============================================
   HOME SCREEN COMPONENT
   - Keyboard navigation
   - ARIA labels on interactive elements
   - Proper role attributes
   ============================================ */

const HomeScreen = ({
  apps,
  onOpenApp,
  isPlaying,
  currentCoverUrl,
  onLogout,
  useStickyState,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  // 存储每个图标的坐标 { app_id: {x, y} }
  const [positions, setPositions] = useStickyState({}, "echoes_icon_positions");
  const [draggingApp, setDraggingApp] = useState(null);
  const containerRef = useRef(null);

  // 处理拖拽开始
  const handleDragStart = (id, e) => {
    setDraggingApp(id);
    e.dataTransfer.setData("text/plain", id);
  };

  // 处理拖拽放置
  const handleDrop = (e) => {
    e.preventDefault();
    if (!draggingApp || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 30; // 居中修正
    const y = e.clientY - rect.top - 30;

    setPositions({
      ...positions,
      [draggingApp]: { x, y },
    });
    setDraggingApp(null);
  };

  // Keyboard navigation for apps
  const handleAppKeyDown = (e, appId) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpenApp(appId);
    }
  };

  return (
    <div
      ref={containerRef}
      className="h-full w-full relative overflow-hidden select-none"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      role="region"
      aria-label="主屏幕"
    >
      {/* Skip to apps link for accessibility */}
      <a
        href="#app-grid"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded-xl focus:text-sm focus:font-bold"
      >
        跳转到应用列表
      </a>

      {/* 页面 1：App 与 黑胶组件 */}
      {currentPage === 0 && (
        <div className="w-full h-full p-8" id="app-grid" role="grid" aria-label="应用网格">
          {/* 黑胶挂件 */}
          <div
            className="absolute z-20 group"
            style={{
              left: positions["music_widget"]?.x || 20,
              top: positions["music_widget"]?.y || 20,
            }}
            draggable
            onDragStart={(e) => handleDragStart("music_widget", e)}
          >
            <button
              onClick={() => onOpenApp("music")}
              className="w-32 h-32 bg-black/5 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center shadow-inner cursor-pointer hover:scale-105 transition-transform touch-target"
              aria-label="打开音乐播放器"
            >
              <div
                className={`w-24 h-24 rounded-full bg-[#121212] relative flex items-center justify-center border-4 border-black/80 ${isPlaying ? "animate-spin-slow" : ""}`}
              >
                <div
                  className="absolute inset-0 opacity-20 rounded-full"
                  style={{
                    background: `repeating-radial-gradient(circle, #444, #444 1px, #111 2px, #444 3px)`,
                  }}
                ></div>
                {currentCoverUrl ? (
                  <img
                    src={currentCoverUrl}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-2 h-2 bg-[#7A2A3A] rounded-full" aria-hidden="true" />
                )}
              </div>
            </button>
          </div>

          {/* 渲染 App 图标 */}
          <div
            className="grid grid-cols-4 gap-4 absolute bottom-20 left-8 right-8"
            role="row"
          >
            {apps.map((app, index) => (
              <div
                key={app.id}
                role="gridcell"
                className="flex flex-col items-center gap-1"
              >
                <button
                  draggable
                  onDragStart={(e) => handleDragStart(app.id, e)}
                  onClick={() => onOpenApp(app.id)}
                  onKeyDown={(e) => handleAppKeyDown(e, app.id)}
                  className="flex flex-col items-center gap-1 cursor-pointer group p-2 rounded-2xl hover:bg-gray-100/50 transition-default touch-target"
                  aria-label={`打开${app.name}`}
                >
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#7A2A3A] group-active:scale-90 transition-all">
                    {typeof app.icon === "function" ||
                    (typeof app.icon === "object" && app.icon.$$typeof) ? (
                      <app.icon size={24} aria-hidden="true" />
                    ) : (
                      app.icon
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {app.name}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 页面 2：系统操作 */}
      {currentPage === 1 && (
        <div
          className="w-full h-full flex flex-col items-center justify-center p-10 animate-in fade-in zoom-in duration-300"
          role="region"
          aria-label="系统操作"
        >
          <button
            onClick={onLogout}
            className="bg-white/80 backdrop-blur-md border border-red-100 text-red-500 px-10 py-4 rounded-3xl font-bold flex items-center gap-3 shadow-xl active:scale-95 transition-all touch-target"
            aria-label="登出系统"
          >
            <LogOut size={20} aria-hidden="true" />
            <span>登出系统</span>
          </button>
          <p className="mt-4 text-gray-300 text-[10px] font-mono tracking-widest uppercase">
            System Control
          </p>
        </div>
      )}

      {/* 底部页面指示器 */}
      <nav
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3"
        aria-label="页面导航"
        role="tablist"
      >
        {[0, 1].map((i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer touch-target ${
              currentPage === i ? "bg-black w-4" : "bg-black/20"
            }`}
            role="tab"
            aria-selected={currentPage === i}
            aria-label={`第${i + 1}页`}
          />
        ))}
      </nav>
    </div>
  );
};

export default HomeScreen;
