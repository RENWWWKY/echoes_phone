import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Play,
  Pause,
  RefreshCw,
  Music2,
  MessageCircle,
  X,
  Send,
  Sparkles,
  Upload,
  Repeat,
  Repeat1,
  Shuffle,
  Trash2,
  CheckCircle2,
} from "lucide-react";

// --- 1. 工具函数：解析 LRC ---
const parseLRC = (lrcText) => {
  if (!lrcText) return [];
  const lines = lrcText.split("\n");
  const result = [];
  const timeReg = /\[(\d+):(\d+\.\d+)\]/;
  lines.forEach((line) => {
    const match = timeReg.exec(line);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseFloat(match[2]);
      result.push({
        time: minutes * 60 + seconds,
        text: line.replace(timeReg, "").trim(),
      });
    }
  });
  return result.sort((a, b) => a.time - b.time);
};

// --- 2. 动态字号适配 ---
const getLyricTextSize = (text, isActive) => {
  const len = text?.length || 0;
  if (isActive) {
    if (len > 35) return "text-[10px] leading-tight";
    if (len > 22) return "text-xs";
    return "text-sm";
  }
  if (len > 35) return "text-[9px] opacity-40";
  return "text-[11px] opacity-75 text-gray-500";
};

// --- 3. 组件：黑胶唱片 ---
const VinylRecord = ({ isPlaying, coverUrl }) => (
  <div className="relative shrink-0 w-40 h-40 flex items-center justify-center">
    <div className="absolute w-36 h-36 rounded-full bg-black/10 shadow-[0_8px_25px_rgba(0,0,0,0.2)]"></div>
    <div
      className={`w-32 h-32 rounded-full bg-[#121212] relative flex items-center justify-center border-[4px] border-[#080808] overflow-hidden z-10 ${isPlaying ? "animate-spin-slow" : ""}`}
    >
      <div
        className="absolute inset-0 opacity-40 rounded-full"
        style={{
          background: `repeating-radial-gradient(circle, #444, #444 1px, #111 2px, #444 3px)`,
        }}
      ></div>
      <div
        className={`${coverUrl ? "w-20 h-20" : "w-10 h-10"} rounded-full border-2 border-black/20 flex items-center justify-center z-10 relative overflow-hidden bg-[#7A2A3A] transition-all duration-500`}
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            className="w-full h-full object-cover"
            alt="cover"
          />
        ) : (
          <div className="w-1.5 h-1.5 bg-black rounded-full shadow-inner"></div>
        )}
      </div>
    </div>
  </div>
);

// --- 4. 组件：连接状态 ---
const ConnectionHeader = ({
  isPlaying,
  userAvatar,
  charAvatar,
  charName,
  aiBubble,
  userBubble,
}) => (
  <div className="flex items-center justify-center mt-4 w-full max-w-[180px] mx-auto shrink-0 relative">
    <div className="relative flex flex-col items-center z-10">
      {userBubble && (
        <div className="absolute -top-14 left-0 min-w-[80px] max-w-[120px] bg-white text-[#7A2A3A] px-3 py-2 rounded-2xl rounded-bl-none shadow-2xl border border-black/5 text-[10px] font-bold animate-bounce-in z-50 line-clamp-3">
          {userBubble}
        </div>
      )}
      <div className="w-10 h-10 rounded-full border-2 border-white shadow-lg overflow-hidden bg-gray-100">
        {userAvatar ? (
          <img
            src={userAvatar}
            className="w-full h-full object-cover"
            alt="user"
          />
        ) : (
          <div className="w-full h-full bg-gray-200" />
        )}
      </div>
    </div>
    <div className="flex-grow h-10 flex items-center relative -mx-4">
      <svg
        className="w-full h-full"
        viewBox="0 0 100 20"
        preserveAspectRatio="none"
      >
        <path
          d="M0,10 L30,10 L32,8 L35,12 L38,10 L45,10 L47,2 L50,18 L53,10 L60,10 L63,12 L66,8 L68,10 L100,10"
          stroke="#7A2A3A"
          strokeWidth="0.6"
          fill="none"
          className={isPlaying ? "animate-heartbeat-fine" : "opacity-0"}
          style={{ strokeDasharray: "20, 80" }}
        />
      </svg>
    </div>
    <div className="relative flex flex-col items-center z-10">
      {aiBubble && (
        <div className="absolute -top-14 right-0 min-w-[80px] max-w-[140px] bg-[#7A2A3A] text-white px-3 py-2 rounded-2xl rounded-br-none shadow-2xl text-[10px] font-bold animate-bounce-in z-50 line-clamp-3">
          {aiBubble}
        </div>
      )}
      <div className="w-10 h-10 rounded-full border-2 border-white shadow-lg overflow-hidden bg-gray-200 flex items-center justify-center">
        {charAvatar ? (
          <img
            src={charAvatar}
            className="w-full h-full object-cover"
            alt="char"
          />
        ) : (
          <span className="text-gray-500 text-sm font-bold">
            {charName?.[0] || "?"}
          </span>
        )}
      </div>
    </div>
  </div>
);

// --- 5. 主组件 ---
const MusicApp = ({
  persona,
  userAvatar,
  charAvatar,
  userName,
  chatHistory,
  triggerAIResponse,
  useStickyState,
  showToast,
  audioRef,
  apiConfig,
}) => {
  const [musicTab, setMusicTab] = useState("together");
  const [playlistName, setPlaylistName] = useStickyState(
    "我的共鸣旋律",
    "echoes_pl_name",
  );
  const [playlistCoverFile, setPlaylistCoverFile] = useStickyState(
    null,
    "echoes_pl_cover_file",
  );
  const [playlistTracks, setPlaylistTracks] = useStickyState(
    [],
    "echoes_pl_tracks",
  );
  const [playMode, setPlayMode] = useStickyState("list", "echoes_play_mode");

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeLrcIndex, setActiveLrcIndex] = useState(-1);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [aiBubble, setAiBubble] = useState(null);
  const [userBubble, setUserBubble] = useState(null);
  const [showQuickReply, setShowQuickReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");

  const lrcScrollRef = useRef(null);
  const lastCommentTime = useRef(0);
  const lastTriggeredLrc = useRef("");

  // --- 关键顺序：先定义数据，再定义 Effect ---
  const currentTrack = useMemo(
    () => playlistTracks[currentTrackIndex] || null,
    [playlistTracks, currentTrackIndex],
  );
  const currentLrc = useMemo(
    () => parseLRC(currentTrack?.lrcText),
    [currentTrack?.lrcText],
  );

  // 1. 播放进度监听与 AI 点评触发
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(time);

      if (currentLrc && currentLrc.length > 0) {
        const index = currentLrc.findIndex((l, i) => {
          const next = currentLrc[i + 1];
          return time >= l.time && (!next || time < next.time);
        });

        if (index !== -1 && index !== activeLrcIndex) {
          setActiveLrcIndex(index);
          handleAiMusicInsight(index);
        }
      }
    };

    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => handleNextTrack();

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentLrc, activeLrcIndex, audioRef]);

  // 2. 歌词居中滚动
  useEffect(() => {
    if (activeLrcIndex <= 0) return;
    const container = lrcScrollRef.current;
    if (!container) return;

    const t = setTimeout(() => {
      const line = container.children[activeLrcIndex];
      if (!line) return;
      const target = line.offsetTop - container.clientHeight / 2 + line.offsetHeight / 2;
      container.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
    }, 80);

    return () => clearTimeout(t);
  }, [activeLrcIndex]);

  // 3. 气泡同步
  useEffect(() => {
    if (chatHistory?.length > 0) {
      const last = chatHistory[chatHistory.length - 1];
      if (last.sender === "char") {
        setAiBubble(last.text);
        const t = setTimeout(() => setAiBubble(null), 8000);
        return () => clearTimeout(t);
      } else if (last.sender === "me") {
        setUserBubble(last.text);
        const t = setTimeout(() => setUserBubble(null), 6000);
        return () => clearTimeout(t);
      }
    }
  }, [chatHistory]);

  const currentAudioUrl = useMemo(
    () =>
      currentTrack?.audioFile
        ? URL.createObjectURL(currentTrack.audioFile)
        : null,
    [currentTrack?.audioFile],
  );
  const currentCoverUrl = useMemo(
    () =>
      currentTrack?.coverFile
        ? URL.createObjectURL(currentTrack.coverFile)
        : null,
    [currentTrack?.coverFile],
  );
  const playlistCoverUrl = useMemo(
    () => (playlistCoverFile ? URL.createObjectURL(playlistCoverFile) : null),
    [playlistCoverFile],
  );

  useEffect(() => {
    if (audioRef?.current && currentAudioUrl) {
      audioRef.current.src = currentAudioUrl;
      if (isPlaying)
        audioRef.current.play().catch((e) => console.log("Play blocked", e));
    }
  }, [currentAudioUrl, isPlaying, audioRef]);

  const handleNextTrack = () => {
    if (playlistTracks.length === 0) return;
    let nextIndex =
      playMode === "shuffle"
        ? Math.floor(Math.random() * playlistTracks.length)
        : (currentTrackIndex + 1) % playlistTracks.length;
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
  };

  const handleAiMusicInsight = (index) => {
    const now = Date.now();
    if (now - lastCommentTime.current < 80000) return;
    const start = Math.max(0, index - 1);
    const end = Math.min(currentLrc.length, index + 2);
    const contextLines = currentLrc
      .slice(start, end)
      .map((l) => l.text)
      .join(" / ");
    if (!contextLines || contextLines === lastTriggeredLrc.current) return;
    lastCommentTime.current = now;
    lastTriggeredLrc.current = contextLines;
    const musicPrompt = `[SYSTEM_NOTE: {{char}}和{{user}}正在一起听一首叫做《${currentTrack?.title}》的歌曲。当前歌词：“${contextLines}”。请遵循以下尺度：1.审美优先，点评意境或旋律氛围。2.严禁强行将歌曲映射为 \${user} 的过往经历或内心秘密，如“这首歌像你”“你就是这样”“你为什么喜欢这种歌，是不是因为你也想...”“你听这首歌是因为在歌词里看到了自己吧”等言论，需要避免。3.适度表达 \${char} 自己的听感。4.不一定非要谈论歌曲本身，也可根据情况保持自然的日常交流。5.不超过 30 字。]`;
    triggerAIResponse(null, musicPrompt);
  };

  const handleUserReply = () => {
    const content = replyContent.trim();
    if (!content) return;
    const musicContext = `[{{char}}和{{user}}正在一起听一首叫做《${currentTrack?.title}》的歌曲。当前歌词：${currentLrc[activeLrcIndex]?.text || "..."}]`;
    triggerAIResponse(content, "", musicContext, { source: "music_app" });
    setReplyContent("");
    setShowQuickReply(false);
  };

  const handleFileUpload = (trackId, type, file) => {
    if (!file) return;
    const updated = playlistTracks.map((t) => {
      if (t.id === trackId) {
        if (type === "audio")
          return {
            ...t,
            audioFile: file,
            title: file.name.replace(/\.[^/.]+$/, ""),
          };
        if (type === "cover") return { ...t, coverFile: file };
        if (type === "lrc") {
          const reader = new FileReader();
          reader.onload = (e) =>
            setPlaylistTracks((prev) =>
              prev.map((nt) =>
                nt.id === trackId ? { ...nt, lrcText: e.target.result } : nt,
              ),
            );
          reader.readAsText(file);
          return t;
        }
      }
      return t;
    });
    if (type !== "lrc") setPlaylistTracks(updated);
    showToast("success", "存储成功");
  };

  return (
    <div className="flex flex-col h-full bg-[#FBFBFC] relative overflow-hidden font-sans">
      <div className="flex p-1 bg-gray-200/50 rounded-xl mx-4 mt-4 shrink-0 z-10 border border-black/5">
        <button
          onClick={() => setMusicTab("together")}
          className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${musicTab === "together" ? "bg-white shadow-sm text-[#7A2A3A]" : "text-gray-400"}`}
        >
          一起听
        </button>
        <button
          onClick={() => setMusicTab("playlist")}
          className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${musicTab === "playlist" ? "bg-white shadow-sm text-[#7A2A3A]" : "text-gray-400"}`}
        >
          歌单
        </button>
      </div>
      <div className="flex-grow overflow-hidden">
        {musicTab === "together" ? (
          <div className="h-full flex flex-col p-4 overflow-hidden">
            <div className="flex flex-col items-center shrink-0">
              <VinylRecord isPlaying={isPlaying} coverUrl={currentCoverUrl} />
              <ConnectionHeader
                isPlaying={isPlaying}
                userAvatar={userAvatar}
                charAvatar={charAvatar}
                charName={persona?.name}
                aiBubble={aiBubble}
                userBubble={userBubble}
              />
              <h3 className="text-xs font-bold text-gray-800 truncate mt-3 w-full text-center px-4">
                {currentTrack?.title || "等待选择歌曲"}
              </h3>
            </div>
            <div
              ref={lrcScrollRef}
              style={{ maxHeight: "45vh", position: "relative" }}
              className="w-full overflow-y-auto overflow-x-hidden space-y-5 text-center py-8 my-3 border-t border-b border-black/5 custom-scrollbar"
            >
              {currentLrc && currentLrc.length > 0 ? (
                currentLrc.map((line, idx) => (
                  <p
                    key={idx}
                    className={`${getLyricTextSize(line.text, activeLrcIndex === idx)} transition-all duration-700 px-8 break-words leading-relaxed ${activeLrcIndex === idx ? "text-[#7A2A3A] font-bold scale-110" : ""}`}
                  >
                    {line.text}
                  </p>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-30 text-[10px]">
                  请上传音频和歌词
                </div>
              )}
            </div>
            <div className="shrink-0 flex items-center justify-between px-2 h-14">
              <span className="text-[9px] font-mono text-gray-400 w-8">
                {Math.floor(currentTime / 60)}:
                {Math.floor(currentTime % 60)
                  .toString()
                  .padStart(2, "0")}
              </span>
              <div className="flex items-center gap-6">
                <button
                  onClick={() => {
                    const m = ["list", "single", "shuffle"];
                    setPlayMode(m[(m.indexOf(playMode) + 1) % m.length]);
                  }}
                  className="p-2 text-[#7A2A3A]"
                >
                  {playMode === "list" ? (
                    <Repeat size={18} />
                  ) : playMode === "single" ? (
                    <Repeat1 size={18} />
                  ) : (
                    <Shuffle size={18} />
                  )}
                </button>
                <button
                  disabled={playlistTracks.length === 0 || !apiConfig?.baseUrl || !apiConfig?.key}
                  onClick={() => {
                    if (playlistTracks.length === 0) { showToast("error", "歌单为空，请先添加音乐"); return; }
                    if (!apiConfig?.baseUrl || !apiConfig?.key) { showToast("error", "未配置 API 信息，请在设置中输入 Base URL 和 Key"); return; }
                    isPlaying
                      ? audioRef.current.pause()
                      : audioRef.current.play();
                    setIsPlaying(!isPlaying);
                  }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${
                    playlistTracks.length === 0 || !apiConfig?.baseUrl || !apiConfig?.key
                      ? "bg-gray-300 text-gray-400 cursor-not-allowed"
                      : "bg-black text-white"
                  }`}
                >
                  {isPlaying ? (
                    <Pause size={20} fill="white" />
                  ) : (
                    <Play size={20} fill="white" className="ml-0.5" />
                  )}
                </button>
                <button
                  onClick={() => setShowQuickReply(!showQuickReply)}
                  className={`p-2.5 rounded-full ${showQuickReply ? "bg-[#7A2A3A] text-white" : "bg-white text-[#7A2A3A] border border-black/5"}`}
                >
                  <MessageCircle size={18} />
                </button>
              </div>
              <span className="text-[9px] font-mono text-gray-400 w-8 text-right">
                {Math.floor(duration / 60)}:
                {Math.floor(duration % 60)
                  .toString()
                  .padStart(2, "0")}
              </span>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-4 space-y-4 flex flex-col">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase">
                Library
              </span>
              <button
                onClick={() => {
                  setIsEditing(!isEditing);
                  setSelectedIds(new Set());
                }}
                className={`text-[10px] px-3 py-1 rounded-full font-bold ${isEditing ? "bg-black text-white" : "bg-gray-100 text-gray-500"}`}
              >
                {isEditing ? "完成" : "编辑"}
              </button>
            </div>
            <label className="block w-full h-32 bg-gray-200 rounded-xl relative overflow-hidden cursor-pointer shrink-0">
              {playlistCoverUrl ? (
                <img
                  src={playlistCoverUrl}
                  className="w-full h-full object-cover"
                  alt="cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-sm">
                  歌单封面（可上传）
                </div>
              )}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => setPlaylistCoverFile(e.target.files[0])}
              />
            </label>
            <input
              className="bg-transparent text-center font-bold text-gray-700 outline-none w-full py-2 border-b border-black/5"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
            />
            <div className="space-y-2 pb-24">
              {playlistTracks.map((track, index) => (
                <div
                  key={track.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${isEditing ? "bg-white border-2 border-[#7A2A3A]/10" : "bg-gray-100"}`}
                >
                  <div
                    className="flex items-center gap-3 flex-grow cursor-pointer"
                    onClick={() => {
                      if (isEditing) {
                        const newSet = new Set(selectedIds);
                        if (newSet.has(track.id)) newSet.delete(track.id);
                        else newSet.add(track.id);
                        setSelectedIds(newSet);
                      } else if (track.audioFile) {
                        setCurrentTrackIndex(index);
                        setMusicTab("together");
                        setTimeout(() => {
                          audioRef.current?.play();
                          setIsPlaying(true);
                        }, 100);
                      } else showToast("error", "请上传音乐");
                    }}
                  >
                    {isEditing ? (
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedIds.has(track.id) ? "bg-[#7A2A3A] border-[#7A2A3A]" : "border-gray-300"}`}
                      >
                        {selectedIds.has(track.id) && (
                          <CheckCircle2 size={12} className="text-white" />
                        )}
                      </div>
                    ) : (
                      <div className="w-4 h-4 flex items-center justify-center shrink-0">
                        {isPlaying && currentTrackIndex === index ? (
                          <div className="flex items-end gap-0.5 h-3.5 pb-0.5">
                            <div className="w-0.5 bg-[#7A2A3A] animate-music-bar delay-1" />
                            <div className="w-0.5 bg-[#7A2A3A] animate-music-bar delay-2" />
                            <div className="w-0.5 bg-[#7A2A3A] animate-music-bar delay-3" />
                          </div>
                        ) : (
                          <Play
                            size={10}
                            className="text-gray-400 fill-current opacity-60"
                          />
                        )}
                      </div>
                    )}
                    <span
                      className={`text-xs font-medium truncate max-w-[120px] ${selectedIds.has(track.id) ? "text-[#7A2A3A]" : "text-gray-600"}`}
                    >
                      {track.title}
                    </span>
                  </div>
                  {!isEditing && (
                    <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold">
                      <label className="cursor-pointer hover:text-[#7A2A3A] flex items-center gap-0.5">
                        <Upload size={10} />
                        封面
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(e) =>
                            handleFileUpload(
                              track.id,
                              "cover",
                              e.target.files[0],
                            )
                          }
                        />
                      </label>
                      <label className="cursor-pointer hover:text-[#7A2A3A] flex items-center gap-0.5">
                        <Upload size={10} />
                        音乐
                        <input
                          type="file"
                          hidden
                          accept="audio/*"
                          onChange={(e) =>
                            handleFileUpload(
                              track.id,
                              "audio",
                              e.target.files[0],
                            )
                          }
                        />
                      </label>
                      <label className="cursor-pointer hover:text-[#7A2A3A] flex items-center gap-0.5">
                        <Upload size={10} />
                        歌词
                        <input
                          type="file"
                          hidden
                          accept=".lrc"
                          onChange={(e) =>
                            handleFileUpload(track.id, "lrc", e.target.files[0])
                          }
                        />
                      </label>
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={() =>
                  setPlaylistTracks([
                    ...playlistTracks,
                    {
                      id: Date.now(),
                      title: "新歌曲",
                      audioFile: null,
                      coverFile: null,
                      lrcText: "",
                    },
                  ])
                }
                className="w-full py-3 border border-dashed border-gray-300 rounded-lg text-gray-300 text-[10px] transition-all"
              >
                + 添加歌曲
              </button>
            </div>
          </div>
        )}
      </div>
      {showQuickReply && (
        <div className="absolute inset-x-4 bottom-20 bg-white p-2.5 rounded-2xl shadow-2xl border border-[#7A2A3A]/10 z-[100] flex gap-2 animate-slide-up">
          <input
            autoFocus
            className="flex-grow bg-gray-50 rounded-xl px-4 py-2 text-xs outline-none"
            placeholder={`对 ${persona?.name || "TA"} 说...`}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUserReply()}
          />
          <button
            onClick={handleUserReply}
            className="p-2 bg-[#7A2A3A] text-white rounded-xl"
          >
            <Send size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default MusicApp;
