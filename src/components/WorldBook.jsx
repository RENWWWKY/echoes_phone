import React, { useState, useRef } from "react";
import {
  Upload,
  Plus,
  ChevronDown,
  Edit2,
  Trash2,
  Book,
  BookOpen,
  ArrowRightToLine,
  ToggleRight,
  ToggleLeft,
  SlidersHorizontal,
} from "lucide-react";
import AppWindow from "./AppWindow";
import useStickyState from "../hooks/useStickyState";

// --- 辅助函数：获取所有分组 ---
const getGroups = (data) => {
  const groups = Array.from(
    new Set(data.map((item) => item.group || "未分组")),
  );
  return groups.sort((a, b) =>
    a === "未分组" ? 1 : b === "未分组" ? -1 : a.localeCompare(b),
  );
};

const WorldBook = ({
  isOpen,
  onClose,
  showToast,
  customPrompt,
  customConfirm,
  worldBook, // 新增接收
  setWorldBook,
}) => {
  // --- 逻辑处理函数 ---
  const handleWorldBookUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const json = JSON.parse(ev.target.result);
          let newEntries = [];

          if (json.entries) {
            if (Array.isArray(json.entries)) {
              newEntries = json.entries;
            } else {
              newEntries = Object.values(json.entries);
            }
          } else if (Array.isArray(json)) {
            newEntries = json;
          } else {
            newEntries = Object.values(json).filter(
              (item) => typeof item === "object",
            );
          }

          const baseTime = Date.now();
          const defaultGroupName =
            file.name.replace(".json", "") ||
            `导入-${new Date().toLocaleDateString()}`;

          const formattedEntries = newEntries
            .map((entry, index) => {
              let name = entry.comment || entry.name || "未命名词条";

              if (!name || name === "未命名词条") {
                const k = entry.key || entry.keys;
                if (Array.isArray(k) && k.length > 0) name = k[0];
                else if (typeof k === "string") name = k;
              }

              const isEnabled =
                entry.disable !== undefined
                  ? !entry.disable
                  : entry.enabled !== false;

              return {
                id: `wb_${baseTime}_${index}_${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
                name: name,
                content: entry.content || "",
                enabled: isEnabled,
                group: entry.group || defaultGroupName,
              };
            })
            .filter((e) => e.content);

          if (formattedEntries.length > 0) {
            setWorldBook((prev) => [...prev, ...formattedEntries]);
            showToast(
              "success",
              `已导入 ${formattedEntries.length} 条至 "${defaultGroupName}"`,
            );
          } else {
            showToast("error", "未找到有效的世界书词条");
          }
        } catch (err) {
          console.error(err);
          showToast("error", "JSON 解析失败");
        }
      };
      reader.readAsText(file);
    }
  };

  const moveWorldBookEntry = async (entryId, targetGroup) => {
    let finalGroup = targetGroup;
    if (targetGroup === "NEW_GROUP_TRIGGER") {
      const name = await customPrompt("请输入新分组名称:");
      if (!name) return;
      finalGroup = name;
    }
    setWorldBook((prev) =>
      prev.map((w) => (w.id === entryId ? { ...w, group: finalGroup } : w)),
    );
  };

  const renameWorldBookGroup = async (oldName) => {
    const newName = await customPrompt(`重命名分组 "${oldName}" 为:`, oldName);
    if (newName && newName !== oldName) {
      setWorldBook((prev) =>
        prev.map((w) => (w.group === oldName ? { ...w, group: newName } : w)),
      );
    }
  };

  const deleteWorldBookGroup = async (groupName) => {
    if (await customConfirm(`确定删除分组 "${groupName}" 及其下的所有条目吗？`, "删除分组")) {
      setWorldBook((prev) => prev.filter((w) => w.group !== groupName));
    }
  };

  const toggleWorldBookEntry = (id) => {
    setWorldBook((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w)),
    );
  };

  return (
    <AppWindow isOpen={isOpen} title="世界书" onClose={onClose}>
      <div className="space-y-6 pt-4 pb-20">
        {/* 操作栏 */}
        <div className="grid grid-cols-2 gap-3">
          <label className="py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95">
            <Upload size={14} />
            导入JSON
            <input
              type="file"
              className="hidden"
              accept=".json"
              onChange={handleWorldBookUpload}
            />
          </label>
          <button
            onClick={async () => {
              const name = await customPrompt(
                "请输入新分组名称 (将创建一个空条目):",
              );
              if (name) {
                setWorldBook([
                  {
                    id: `wb_${Date.now()}`,
                    name: "新条目",
                    content: "",
                    group: name,
                    enabled: true,
                  },
                  ...worldBook,
                ]);
              }
            }}
            className="py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-black transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
          >
            <Plus size={14} />
            新建分组
          </button>
        </div>

        {/* 分组列表 */}
        {getGroups(worldBook).map((group) => (
          <WorldBookGroup
            key={group}
            group={group}
            worldBook={worldBook}
            setWorldBook={setWorldBook}
            moveWorldBookEntry={moveWorldBookEntry}
            renameWorldBookGroup={renameWorldBookGroup}
            deleteWorldBookGroup={deleteWorldBookGroup}
            toggleWorldBookEntry={toggleWorldBookEntry}
          />
        ))}
        {worldBook.length === 0 && (
          <div className="text-center py-20 text-gray-300 text-xs">
            世界书空空如也，请点击上方按钮创建
          </div>
        )}
      </div>
    </AppWindow>
  );
};

// --- 分组组件 ---
const WorldBookGroup = ({
  group,
  worldBook,
  setWorldBook,
  moveWorldBookEntry,
  renameWorldBookGroup,
  deleteWorldBookGroup,
  toggleWorldBookEntry,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const groupEntries = worldBook.filter((w) => w.group === group);

  const handleReorder = (fromIdx, toIdx) => {
    if (fromIdx === toIdx) return;
    setWorldBook((prev) => {
      const newList = [...prev];
      const fromEntry = groupEntries[fromIdx];
      const toEntry = groupEntries[toIdx];
      const globalFrom = newList.findIndex((e) => e.id === fromEntry.id);
      const globalTo = newList.findIndex((e) => e.id === toEntry.id);
      const [movedItem] = newList.splice(globalFrom, 1);
      newList.splice(globalTo, 0, movedItem);
      return newList;
    });
  };

  return (
    <div className="bg-white/50 border border-gray-100 rounded-xl overflow-hidden mb-4 shadow-sm">
      <div
        className="bg-gray-100/50 p-3 flex justify-between items-center border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <ChevronDown
            size={14}
            className={`text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
          <h3 className="text-xs font-bold text-gray-700">{group}</h3>
          <span className="text-[9px] bg-gray-200 text-gray-500 px-1.5 rounded-md">
            {groupEntries.length}
          </span>
        </div>

        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setWorldBook((prev) => [
                {
                  id: `wb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                  name: "新条目",
                  content: "",
                  group: group,
                  enabled: true,
                },
                ...prev,
              ]);
              setIsExpanded(true);
            }}
            className="p-1.5 text-gray-400 hover:text-green-600"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => renameWorldBookGroup(group)}
            className="p-1.5 text-gray-400 hover:text-blue-500"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={() => deleteWorldBookGroup(group)}
            className="p-1.5 text-gray-400 hover:text-red-500"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
          {groupEntries.map((entry, idx) => (
            <WorldBookEntryItem
              key={entry.id}
              index={idx}
              entry={entry}
              worldBook={worldBook}
              setWorldBook={setWorldBook}
              moveWorldBookEntry={moveWorldBookEntry}
              toggleWorldBookEntry={toggleWorldBookEntry}
              onDragStart={() => setDraggedIdx(idx)}
              onDragOver={() => {
                if (draggedIdx !== null && draggedIdx !== idx) {
                  handleReorder(draggedIdx, idx);
                  setDraggedIdx(idx);
                }
              }}
              onDragEnd={() => setDraggedIdx(null)}
              isDragging={draggedIdx === idx}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- 条目组件 ---
const WorldBookEntryItem = ({
  entry,
  worldBook,
  setWorldBook,
  moveWorldBookEntry,
  toggleWorldBookEntry,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
}) => {
  const [showContent, setShowContent] = useState(false);
  const [draggable, setDraggable] = useState(false);
  const timer = useRef(null);

  const handlePointerDown = () => {
    timer.current = setTimeout(() => {
      setDraggable(true);
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    }, 500);
  };

  const handlePointerUp = () => clearTimeout(timer.current);

  const allGroups = Array.from(
    new Set(worldBook.map((i) => i.group || "未分组")),
  );

  return (
    <div
      draggable={draggable}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDragStart={onDragStart}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDragEnd={() => {
        setDraggable(false);
        onDragEnd();
      }}
      className={`glass-card p-3 rounded-lg flex flex-col gap-2 transition-all duration-200 ${
        isDragging ? "opacity-30 scale-95 border-red-200" : "opacity-100"
      } ${draggable ? "shadow-lg ring-1 ring-red-500/30 cursor-grab" : "cursor-default"}`}
    >
      <div className="flex justify-between items-center">
        <div
          className="flex items-center gap-2 flex-1 cursor-pointer group/book"
          onClick={() => setShowContent(!showContent)}
        >
          <div className="text-gray-400 group-hover/book:text-red-700 transition-colors">
            {showContent ? <BookOpen size={14} /> : <Book size={14} />}
          </div>
          <input
            className="text-xs font-bold bg-transparent border-none outline-none text-gray-700 w-full"
            value={entry.name}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) =>
              setWorldBook((prev) =>
                prev.map((w) =>
                  w.id === entry.id ? { ...w, name: e.target.value } : w,
                ),
              )
            }
          />
        </div>

        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {draggable && (
            <SlidersHorizontal
              size={12}
              className="text-red-700 animate-pulse"
            />
          )}

          <div className="relative group/move">
            <ArrowRightToLine
              size={12}
              className="text-gray-300 hover:text-blue-500 cursor-pointer"
            />
            <select
              className="absolute inset-0 opacity-0 cursor-pointer"
              value={entry.group}
              onChange={(e) => moveWorldBookEntry(entry.id, e.target.value)}
            >
              {allGroups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
              <option value="NEW_GROUP_TRIGGER">+ 新建分组...</option>
            </select>
          </div>

          <button
            onClick={() => toggleWorldBookEntry(entry.id)}
            className={entry.enabled ? "text-red-800" : "text-gray-300"}
          >
            {entry.enabled ? (
              <ToggleRight size={18} />
            ) : (
              <ToggleLeft size={18} />
            )}
          </button>

          <Trash2
            size={12}
            className="text-gray-300 hover:text-red-500 cursor-pointer"
            onClick={() =>
              setWorldBook((prev) => prev.filter((w) => w.id !== entry.id))
            }
          />
        </div>
      </div>

      {showContent && (
        <textarea
          className="w-full text-[10px] text-gray-500 bg-white/60 p-2 rounded-md resize-none h-24 outline-none border border-transparent focus:border-gray-100 animate-in fade-in"
          value={entry.content}
          placeholder="输入世界书条目内容..."
          onChange={(e) =>
            setWorldBook((prev) =>
              prev.map((w) =>
                w.id === entry.id ? { ...w, content: e.target.value } : w,
              ),
            )
          }
        />
      )}
    </div>
  );
};

export default WorldBook;
