import React, { useState, useEffect, useRef } from "react";
import {
  RefreshCw,
  Hash,
  Share,
  Trash2,
  Sparkle,
  RefreshCcw,
  Send,
  ChevronDown,
  UserRound,
  Plus,
  X,
  User,
  Ghost,
  MessageSquare as CommentIcon,
} from "lucide-react";
import AppWindow from "./AppWindow";
import useStickyState from "../hooks/useStickyState";
// 假设这些工具函数在 utils/helpers.js，请根据实际情况调整引用
import { replacePlaceholders, formatTime, formatSmartTime, getTimeBasedGuidance } from "../utils/helpers";

const Forum = ({
  isOpen,
  onClose,
  persona,
  userName,
  getFinalSystemPrompt,
  apiConfig,
  prompts,
  generateContent,
  showToast,
  worldInfoString, // [关键修改] 直接接收字符串，不再调用 getWorldInfoString()
  getCurrentTimeObj,
  getContextString, // 获取聊天记录上下文
  customConfirm,
  customRules,
  userPersona,
  charTrackerContext, // 角色追踪上下文
  trackerContext, // 用户追踪上下文
  setChatHistory, // 用于转发消息
  setMsgCountSinceSummary,
  setForwardContext,
  setActiveApp, // 用于跳转到 Chat
  onChatEventPost, // 聊天事件触发发帖的回调
}) => {
  // --- 内部状态管理 ---
  const [forumData, setForumData] = useStickyState(
    { name: "", posts: [], isInitialized: false },
    "echoes_forum_data",
  );

  const [forumSettings, setForumSettings] = useStickyState(
    { userNick: "", charNick: "", smurfNick: "" },
    "echoes_forum_settings",
  );

  const [activeThreadId, setActiveThreadId] = useState(null);
  const [showForumSettings, setShowForumSettings] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postTab, setPostTab] = useState("me"); // 'me' or 'char'

  // 聊天事件触发发帖的弹窗状态
  const [showChatEventModal, setShowChatEventModal] = useState(false);
  const [chatEventPostData, setChatEventPostData] = useState(null); // 存储 AI 生成的发帖内容
  const [replyIdentity, setReplyIdentity] = useState("me"); // 'me' or 'smurf'
  const [forumGuidance, setForumGuidance] = useState("");

  // Loading 状态集合
  const [loading, setLoading] = useState({
    forum: false,
    forum_new: false,
    forum_reply: false,
    forum_char_reply: false,
    forum_char: false,
    forum_refresh_all: false,
    chat_event_post: false,
  });

  // 草稿箱 (不需要持久化，或者可以用 useStickyState 如果你想保存草稿)
  const [postDrafts, setPostDrafts] = useState({
    me: { title: "", content: "", topic: "" },
    char: { title: "", content: "", topic: "" },
  });

  // --- 辅助逻辑 ---
  const getForumName = (type) => {
    if (type === "me") return forumSettings.userNick || userName || "User本U";
    if (type === "char")
      return forumSettings.charNick || persona?.name || "匿名用户";
    return "匿名网友";
  };

  const getFormattedSystemPrompt = () => {
    const currentUserName = userName || "User";
    const cleanWorldInfo = worldInfoString || "";

    return getFinalSystemPrompt()
      .replaceAll("{{char}}", persona?.name || "")
      .replaceAll(
        "{{CHAR_DESCRIPTION}}",
        (userPersona || "") + "\n" + (charTrackerContext || ""),
      )
      .replaceAll("{{user}}", currentUserName)
      .replaceAll(
        "{{USER_PERSONA}}",
        (userPersona || "") + "\n" + (trackerContext || ""),
      )
      .replaceAll("{{CUSTOM_RULES}}", customRules || "")
      .replaceAll("{{WORLD_INFO}}", cleanWorldInfo);
  };

  // --- 统一生成前置检查 ---
  const checkCanGenerate = () => {
    if (!apiConfig?.baseUrl || !apiConfig?.key) {
      showToast("error", "未配置 API 信息，请在设置中输入 Base URL 和 Key");
      return false;
    }
    if (!userPersona) {
      showToast("error", "角色设定为空，请先完善设定");
      return false;
    }
    return true;
  };

  // --- 核心业务逻辑 (已修复 WorldInfo 引用) ---

  const initForum = async () => {
    if (!persona) return;
    if (!checkCanGenerate()) return;
    setLoading((prev) => ({ ...prev, forum: true }));

    const prompt = prompts.forum_init
      .replaceAll("{{char}}", persona.name)
      .replaceAll("{{CHAR_DESCRIPTION}}", userPersona)
      .replaceAll("{{WORLD_INFO}}", worldInfoString || "");

    try {
      const data = await generateContent(
        // 【修改处】使用格式化后的系统提示词
        { prompt, systemInstruction: getFormattedSystemPrompt() },
        apiConfig,
        (err) => showToast("error", err),
      );
      if (data && data.posts) {
        // 假时间戳：过去 3~30 天随机分布
        const now = Date.now();
        const randPast = (minDays, maxDays) => now - (minDays + Math.random() * (maxDays - minDays)) * 86400000;
        setForumData({
          name: data.forumName || "本地社区",
          posts: data.posts.map((p) => ({
            ...p,
            replies: (p.replies || []).map((r) => ({
              ...r,
              createdAt: randPast(3, 30),
            })),
            createdAt: randPast(3, 30),
            replyCount: (p.replies || []).length,
          })),
          isInitialized: true,
        });
        showToast("success", "生活圈已初始化");
      }
    } finally {
      setLoading((prev) => ({ ...prev, forum: false }));
    }
  };

  const generateForumPosts = async () => {
    if (!persona) return;
    if (!checkCanGenerate()) return;
    setLoading((prev) => ({ ...prev, forum_new: true }));
    const currentUserName = userName || "User";

    // [辅助] 简单的占位符替换 (如果 helpers.js 没导这个函数，就在这里简写)
    // 假设 props 里的 worldInfoString 已经是处理好的，或者这里做简单的 replace
    const cleanWorldInfo = worldInfoString || "";

    const dateObj = getCurrentTimeObj();
    const timeGuidance = getTimeBasedGuidance(dateObj);
    const finalGuidance = forumGuidance ? forumGuidance : timeGuidance;

    const prompt = prompts.forum_gen_posts
      .replaceAll(
        "{{CHAR_DESCRIPTION}}",
        userPersona + "\n" + charTrackerContext,
      )
      .replaceAll("{{GUIDANCE}}", finalGuidance)
      .replaceAll("{{FORUM_NAME}}", forumData.name)
      .replaceAll("{{char}}", persona.name)
      .replaceAll("{{user}}", currentUserName)
      .replaceAll("{{WORLD_INFO}}", cleanWorldInfo);

    try {
      const data = await generateContent(
        {
          prompt,
          systemInstruction:
            "You are a creative writer helping to generate background world content. You are NOT playing the character.",
        },
        apiConfig,
        (err) => showToast("error", err),
      );
      if (data && data.posts) {
        setForumData((prev) => ({
          ...prev,
          posts: [
            ...data.posts.map((p) => ({
              ...p,
              id: `gen_${Date.now()}_${Math.random()}`,
              replies: (p.replies || []).map((r) => ({
                ...r,
                createdAt: Date.now() - (1 + Math.random() * 7) * 86400000,
              })),
              createdAt: Date.now() - (1 + Math.random() * 7) * 86400000,
              replyCount: (p.replies || []).length,
            })),
            ...prev.posts,
          ],
        }));
        showToast("success", "已生成新帖");
      }
    } finally {
      setLoading((prev) => ({ ...prev, forum_new: false }));
    }
  };

  const generateForumReplies = async (threadId, mode = "Auto") => {
    if (!checkCanGenerate()) return;
    const thread = forumData.posts.find((p) => p.id === threadId);
    if (!thread) return;

    const loadingKey = mode === "Manual" ? "forum_char_reply" : "forum_reply";
    setLoading((prev) => ({ ...prev, [loadingKey]: true }));

    const allReplies = thread.replies || [];
    const userLastReplyIndex = allReplies
      .map((r) => r.isUser || r.authorType === "me" || r.authorType === "smurf")
      .lastIndexOf(true);

    const userLastReply =
      userLastReplyIndex !== -1 ? allReplies[userLastReplyIndex] : null;
    const isSmurfReply = userLastReply && userLastReply.authorType === "smurf";

    let contextList = allReplies.slice(-5);
    if (userLastReply && !contextList.find((r) => r.id === userLastReply.id)) {
      contextList = [userLastReply, ...contextList];
    }

    const existingRepliesStr = contextList
      .map((r) => `${r.author}: ${r.content}`)
      .join("\n");

    let charHasRepliedToUser = false;
    if (userLastReplyIndex !== -1) {
      const subsequentReplies = allReplies.slice(userLastReplyIndex + 1);
      charHasRepliedToUser = subsequentReplies.some(
        (r) => r.isCharacter || r.authorType === "char",
      );
    }

    const isCharThread = thread.authorType === "char";
    const isUserThread = thread.authorType === "me";
    const hasMainUserReplied = userLastReplyIndex !== -1 && !isSmurfReply;

    const needsDeepContext =
      (isCharThread ||
        isUserThread ||
        hasMainUserReplied ||
        mode === "Manual") &&
      !isSmurfReply;
    const aiPromptMode = isCharThread || mode === "Manual" ? "Manual" : "Auto";
    const currentUserName = userName || "User";
    const userNick = forumSettings.userNick || userName || "User本U";
    const charNick = forumSettings.charNick || persona.name || "匿名用户";

    let targetInstruction = "";
    if (isSmurfReply) {
      targetInstruction = `
        - **Context**: A netizen named "${userLastReply.author}" just commented.
        - **Action**: Decide naturally whether to reply to "${userLastReply.author}" or others based on content interest.
       `;
    } else if (userLastReplyIndex === -1) {
      targetInstruction = `
        - **Targeting Constraint**: The user "${userNick}" has NOT commented in this thread yet.
        - **Action**: Do NOT reply to "${userNick} or ${charNick}". Interact with other netizens instead.
        `;
    } else if (!charHasRepliedToUser) {
      targetInstruction = `
        - **Targeting Priority**: "${userNick}" just commented and is waiting for a reply.
        - **Action**: ${persona.name} MUST prioritize replying to "${userNick}"'s latest comment.
        `;
    } else {
      targetInstruction = `
        - **Targeting Constraint**: You have ALREADY replied to "${userNick}". 
        - **Action**: DO NOT reply to "${userNick}" again immediately. Reply to others or post a general comment.
        `;
    }

    const cleanWorldInfo = worldInfoString || "";

    let relationshipContextBlock = "";
    if (needsDeepContext) {
      const recentHistory = getContextString(10);
      
      // [新增] 检测用户是否使用真实姓名作为大号ID
      const isUsingRealName = !isSmurfReply && userNick === currentUserName && currentUserName && currentUserName !== "User";
      const realNameContext = isUsingRealName ? `
- **REAL NAME USAGE**: The user is using their real name "${currentUserName}" as their forum nickname. Consider whether "${currentUserName}" might be a well-known or high-status person in the community (e.g., a university, city, or country) related to this forum topic. If yes, netizens' replies might indicate they recognize who the user is (e.g., showing respect, familiarity, or mentioning their reputation). If not, they might treat them as an ordinary participant.` : "";
      
      relationshipContextBlock = `
[DATA SOURCE 2: PRIVATE CHAT MEMORY]:
"""
${recentHistory}
"""
[USER IDENTITY INFO - CRITICAL]:
- Real User Name: "${currentUserName}"
- User's Current Forum Nickname: "${userNick}"
${isUserThread ? `- **CRITICAL**: "${userNick}" IS the author (OP) of this thread. char and the NPCs will treat them as one identity.` : ""}
- **ABSOLUTE RULE**: "${persona.name}" KNOWS that "${userNick}" is "${currentUserName}".
- **Netizen Logic**: Random NPCs should react to "${userNick}" if they comment.
${realNameContext}
- **Character Logic**: 
  1. Tone must reflect the relationship in [DATA SOURCE 2].
  ${targetInstruction} 
`;
    } else {
      relationshipContextBlock = `
[SCENARIO CONSTRAINT]:
- This is a random background thread.
- **Netizen Logic**: Normal internet users discussing the topic "{{TITLE}}".
- **Character Logic**: ${persona.name} should ONLY reply if the topic is extremely interesting.
`;
    }

    const finalSystemPrompt = getFinalSystemPrompt()
      .replaceAll("{{char}}", persona.name)
      .replaceAll(
        "{{CHAR_DESCRIPTION}}",
        userPersona + "\n" + charTrackerContext,
      )
      .replaceAll("{{user}}", currentUserName)
      .replaceAll("{{USER_PERSONA}}", userPersona + "\n" + trackerContext)
      .replaceAll("{{CUSTOM_RULES}}", customRules)
      .replaceAll("{{WORLD_INFO}}", cleanWorldInfo);

    let prompt = prompts.forum_gen_replies
      .replaceAll("{{TITLE}}", thread.title)
      .replaceAll("{{CONTENT}}", thread.content)
      .replaceAll("{{AUTHOR}}", thread.author)
      .replaceAll("{{EXISTING_REPLIES}}", existingRepliesStr || "None")
      .replaceAll("{{RELATIONSHIP_CONTEXT}}", relationshipContextBlock)
      .replaceAll("{{char}}", persona.name)
      .replaceAll("{{CHAR_NICK}}", charNick)
      .replaceAll("{{USER_NICK}}", userNick)
      .replaceAll(
        "{{CHAR_DESCRIPTION}}",
        userPersona + "\n" + charTrackerContext,
      )
      .replaceAll("{{WORLD_INFO}}", cleanWorldInfo)
      .replaceAll("{{MODE}}", aiPromptMode);

    try {
      const data = await generateContent(
        { prompt, systemInstruction: finalSystemPrompt },
        apiConfig,
        (err) => showToast("error", err),
      );

      if (data && data.replies) {
        const newReplies = data.replies.map((r) => ({
          id: `r_${Date.now()}_${Math.random()}`,
          author: r.isCharacter
            ? forumSettings.charNick || "匿名用户"
            : r.author,
          content: r.content,
          createdAt: Date.now() - (0.5 + Math.random() * 3) * 86400000,
          isCharacter: r.isCharacter || false,
          isUser: false,
        }));

        setForumData((prev) => ({
          ...prev,
          posts: prev.posts.map((p) =>
            p.id === threadId
              ? {
                  ...p,
                  replies: [...(p.replies || []), ...newReplies],
                  replyCount: (p.replyCount || 0) + newReplies.length,
                }
              : p,
          ),
        }));
        if (mode === "Manual") showToast("success", "已刷新评论");
      }
    } finally {
      setLoading((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  const refreshAllForumReplies = async () => {
    const recentPosts = forumData.posts.slice(0, 5);
    if (recentPosts.length === 0) return;
    setLoading((prev) => ({ ...prev, forum_refresh_all: true }));
    showToast("info", "正在更新首页动态...");
    for (const post of recentPosts) {
      await generateForumReplies(post.id, "Auto");
    }
    setLoading((prev) => ({ ...prev, forum_refresh_all: false }));
    showToast("success", "动态更新完毕");
  };

  const generateCharacterPost = async () => {
    if (!checkCanGenerate()) return;
    if (!postDrafts.char.topic) {
      showToast("error", "请输入提示词");
      return;
    }
    setLoading((prev) => ({ ...prev, forum_char: true }));
    const currentUserName = userName || "User";
    const cleanWorldInfo = worldInfoString || "";

    const prompt = prompts.forum_char_post
      .replaceAll("{{char}}", persona.name)
      .replaceAll(
        "{{CHAR_DESCRIPTION}}",
        userPersona + "\n" + charTrackerContext,
      )
      .replaceAll("{{WORLD_INFO}}", cleanWorldInfo)
      .replaceAll("{{TOPIC}}", postDrafts.char.topic)
      .replaceAll("{{HISTORY}}", getContextString(10))
      .replaceAll("{{user}}", currentUserName);

    try {
      const data = await generateContent(
        { prompt, systemInstruction: getFormattedSystemPrompt() }, // 【修改处】
        apiConfig,
        (err) => showToast("error", err),
      );
      if (data) {
        setPostDrafts((prev) => ({
          ...prev,
          char: { ...prev.char, title: data.title, content: data.content },
        }));
      }
    } finally {
      setLoading((prev) => ({ ...prev, forum_char: false }));
    }
  };

  // 聊天事件触发发帖：AI 分析聊天历史后自动发帖
  const generateChatEventPost = async (showModal = true) => {
    if (!persona) return;
    if (!checkCanGenerate()) return;
    setLoading((prev) => ({ ...prev, chat_event_post: true }));

    const currentUserName = userName || "User";
    const charNick = forumSettings.charNick || persona.name || "匿名用户";
    const cleanWorldInfo = worldInfoString || "";

    const prompt = prompts.forum_chat_event
      .replaceAll("{{char}}", persona.name)
      .replaceAll(
        "{{CHAR_DESCRIPTION}}",
        userPersona + "\n" + charTrackerContext,
      )
      .replaceAll("{{WORLD_INFO}}", cleanWorldInfo)
      .replaceAll("{{HISTORY}}", getContextString(15))
      .replaceAll("{{user}}", currentUserName);

    try {
      const data = await generateContent(
        { prompt, systemInstruction: getFormattedSystemPrompt() },
        apiConfig,
        (err) => showToast("error", err),
      );

      if (data && data.shouldPost && data.title && data.content) {
        const newPost = {
          id: `char_${Date.now()}`,
          author: charNick,
          authorType: "char",
          title: data.title,
          content: data.content,
          time: "刚刚",
          createdAt: Date.now(),
          replyCount: (data.replies || []).length,
          views: Math.floor(Math.random() * 100) + 50,
          isUserCreated: false,
          replies: (data.replies || []).map((r, idx) => ({
            id: `r_${Date.now()}_${idx}`,
            author: r.author,
            content: r.content,
            isCharacter: r.isCharacter || false,
            isUser: false,
          })),
        };

        // 添加新帖子到论坛数据
        setForumData((prev) => ({
          ...prev,
          posts: [newPost, ...prev.posts],
        }));

        // 设置弹窗数据并通知 App
        setChatEventPostData(newPost);
        if (showModal) {
          setShowChatEventModal(true);
        }
        if (onChatEventPost) {
          onChatEventPost(newPost);
        }
        if (typeof showToast === "function") showToast("info", `${charNick}在生活圈发布了一条帖子`);
      }
    } finally {
      setLoading((prev) => ({ ...prev, chat_event_post: false }));
    }
  };

  // 暴露 generateChatEventPost 给外部调用（通过稳定 ref）
  const genPostRef = useRef(generateChatEventPost);
  genPostRef.current = generateChatEventPost;
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__forumGenerateChatEventPost = (...args) => genPostRef.current(...args);
    }
    return () => {
      if (typeof window !== "undefined") {
        delete window.__forumGenerateChatEventPost;
      }
    };
  }, []);

  // --- UI 事件处理 ---

  const handleCreatePost = () => {
    const draft = postTab === "me" ? postDrafts.me : postDrafts.char;
    if (!draft.title || !draft.content) return;

    const newPost = {
      id: `${postTab}_${Date.now()}`,
      author: getForumName(postTab),
      authorType: postTab,
      title: draft.title,
      content: draft.content,
      time: "刚刚",
      createdAt: Date.now(),
      replyCount: 0,
      views: 0,
      isUserCreated: true,
      replies: [],
    };

    setForumData((prev) => ({ ...prev, posts: [newPost, ...prev.posts] }));
    setShowPostModal(false);
    setPostDrafts((prev) => ({
      ...prev,
      [postTab]: { title: "", content: "", topic: "" },
    }));
    setTimeout(() => generateForumReplies(newPost.id), 500);
  };

  const handleUserReply = (threadId, content, type = "me") => {
    if (!content.trim()) return;
    const replyAuthor =
      type === "smurf"
        ? forumSettings.smurfNick || "马甲用户"
        : getForumName("me");
    const newReply = {
      id: `ur_${Date.now()}`,
      author: replyAuthor,
      authorType: type,
      content: content,
      isUser: true,
    };
    setForumData((prev) => ({
      ...prev,
      posts: prev.posts.map((p) =>
        p.id === threadId
          ? {
              ...p,
              replies: [...(p.replies || []), newReply],
              replyCount: (p.replyCount || 0) + 1,
            }
          : p,
      ),
    }));
  };

  const handleDeletePost = async (postId) => {
    if (await customConfirm("确定彻底删除这篇帖子吗？", "删除帖子")) {
      setForumData((prev) => ({
        ...prev,
        posts: prev.posts.filter((p) => p.id !== postId),
      }));
      if (activeThreadId === postId) setActiveThreadId(null);
      showToast("success", "帖子已删除");
    }
  };

  const handleDeleteReply = async (threadId, replyId) => {
    if (await customConfirm("确定删除这条评论？")) {
      setForumData((prev) => ({
        ...prev,
        posts: prev.posts.map((p) => {
          if (p.id !== threadId) return p;
          const newReplies = (p.replies || []).filter((r) => r.id !== replyId);
          return { ...p, replies: newReplies, replyCount: newReplies.length };
        }),
      }));
      showToast("success", "评论已删除");
    }
  };

  const handleForwardToChat = (item, type = "post", parentTitle = "") => {
    const content =
      type === "post"
        ? `【转发帖子】\n标题：${item.title}\n作者：${item.author}\n内容：${item.content}`
        : `【转发评论】\n来源帖子：${parentTitle}\n评论人：${item.author}\n内容：${item.content}`;

    const newMsg = {
      sender: "me",
      text: content,
      isForward: true,
      forwardData: { ...item, type, parentTitle },
      time: formatTime(getCurrentTimeObj()),
    };

    setChatHistory((prev) => [...prev, newMsg]);
    setMsgCountSinceSummary((prev) => prev + 1);

    const isUserAuthor =
      item.author === getForumName("me") || item.authorType === "me";
    const isCharAuthor =
      item.author === getForumName("char") ||
      item.authorType === "char" ||
      item.isCharacter;

    let contextStr = "";
    if (isUserAuthor) {
      contextStr = `User forwarded their own ${type}. Character should react to User's online activity.`;
    } else if (isCharAuthor) {
      contextStr = `User forwarded Character's own ${type} back to them. Character might feel exposed, shy, or proud.`;
    } else {
      contextStr = `User forwarded a random netizen's ${type}. Discuss the content.`;
    }
    setForwardContext(contextStr);
    setActiveApp("chat");
  };

  const updateForumSettings = (newSettings) => {
    setForumSettings(newSettings);
    setShowForumSettings(false);
    setForumData((prev) => {
      const newPosts = prev.posts.map((p) => {
        let newAuthor = p.author;
        if (p.authorType === "me")
          newAuthor = newSettings.userNick || "User本U";
        else if (p.authorType === "char" || p.author === persona.name)
          newAuthor = newSettings.charNick || "匿名用户";

        const newReplies = (p.replies || []).map((r) => {
          let rAuthor = r.author;
          if (r.authorType === "me" || r.isUser)
            rAuthor = newSettings.userNick || "User本U";
          else if (r.authorType === "smurf")
            rAuthor = newSettings.smurfNick || "不是小号";
          else if (r.isCharacter) rAuthor = newSettings.charNick || "匿名用户";
          return { ...r, author: rAuthor };
        });
        return { ...p, author: newAuthor, replies: newReplies };
      });
      return { ...prev, posts: newPosts };
    });
    showToast("success", "ID已更新，历史记录已同步");
  };

  return (
    <AppWindow
      isOpen={isOpen}
      title={activeThreadId ? "帖子详情" : forumData.name || "本地论坛"}
      onClose={() => {
        if (activeThreadId) setActiveThreadId(null);
        else onClose();
      }}
      actions={
        forumData.isInitialized &&
        !activeThreadId && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowForumSettings(true)}
              className="bg-gray-200 text-gray-600 p-1.5 rounded-full hover:bg-gray-300"
            >
              <UserRound size={16} />
            </button>
            <button
              onClick={() => setShowPostModal(true)}
              className="bg-black text-white p-1.5 rounded-full hover:scale-105 shadow-md"
            >
              <Plus size={16} />
            </button>
          </div>
        )
      }
    >
      {/* 状态 0: 未初始化 */}
      {!forumData.isInitialized ? (
        <div className="flex flex-col items-center justify-center h-full pb-20 px-6 animate-in fade-in">
          <h2 className="text-xl font-bold text-gray-800 mb-2">本地生活圈</h2>
          <p className="text-xs text-gray-500 text-center mb-8 leading-relaxed max-w-[240px]">
            连接城市脉搏，发现角色身边的真实世界。
            <br />
            初始化将生成随机的本地话题和网友讨论。
          </p>
          <button
            onClick={initForum}
            disabled={loading.forum}
            className="w-full max-w-xs py-4 bg-black text-white rounded-2xl text-sm font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
          >
            {loading.forum ? (
              <RefreshCw className="animate-spin" size={16} />
            ) : (
              <Hash size={16} />
            )}
            {loading.forum ? "生活圈加载中..." : "初始化生活圈"}
          </button>
        </div>
      ) : activeThreadId ? (
        // 状态 1: 帖子详情页
        (() => {
          const thread = forumData.posts.find((p) => p.id === activeThreadId);
          if (!thread) return <div>帖子不存在</div>;
          return (
            <div className="pb-20 pt-2 animate-in slide-in-from-right-4">
              <div className="bg-white p-5 rounded-xl shadow-sm mb-4 relative group">
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => handleForwardToChat(thread, "post")}
                    className="p-1.5 bg-gray-100 rounded-full text-gray-400 hover:text-black hover:bg-gray-200"
                    title="转发给角色"
                  >
                    <Share size={14} />
                  </button>
                </div>
                <h2 className="text-lg font-bold mb-2 text-gray-900 leading-snug pr-8">
                  {thread.title}
                </h2>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-4 border-b border-gray-100 pb-3">
                  <div
                    className={`font-bold ${thread.authorType === "char" || thread.author === persona?.name ? "text-[#7A2A3A]" : "text-gray-600"}`}
                  >
                    {thread.author}
                  </div>
                  <span>·</span>
                  <span>{thread.createdAt ? formatSmartTime(thread.createdAt) : thread.time}</span>
                  {(thread.isUserCreated || thread.authorType === "char") && (
                    <button
                      onClick={() => handleDeletePost(thread.id)}
                      className="ml-auto text-gray-300 hover:text-red-400 flex items-center gap-1"
                    >
                      <Trash2 size={12} /> 删除
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {thread.content}
                </p>
              </div>

              <div className="space-y-3 px-1">
                <div className="flex justify-between items-center px-1 mb-2">
                  <span className="text-xs font-bold text-gray-400">
                    回复 ({thread.replyCount || 0})
                  </span>
                  <div className="flex gap-2">
                    {!(
                      thread.authorType === "char" ||
                      thread.author === persona?.name
                    ) && (
                      <button
                        onClick={() =>
                          generateForumReplies(thread.id, "Manual")
                        }
                        disabled={loading.forum_char_reply}
                        className="text-[10px] bg-[#7A2A3A] text-white px-2 py-1 rounded-lg flex items-center gap-1 disabled:opacity-50 shadow-sm"
                      >
                        {loading.forum_char_reply ? (
                          <RefreshCw size={10} className="animate-spin" />
                        ) : (
                          <Sparkle size={12} />
                        )}
                        {loading.forum_char_reply ? "正在输入" : "让TA回"}
                      </button>
                    )}
                    <button
                      onClick={() => generateForumReplies(thread.id, "Auto")}
                      disabled={loading.forum_reply}
                      className="text-[10px] bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded-lg flex items-center gap-1 disabled:opacity-50 shadow-sm"
                    >
                      <RefreshCcw
                        size={10}
                        className={loading.forum_reply ? "animate-spin" : ""}
                      />{" "}
                      刷新
                    </button>
                  </div>
                </div>

                {(thread.replies || []).map((reply, idx) => (
                  <div
                    key={reply.id || idx}
                    className={`p-3 rounded-xl text-sm relative group ${reply.isUser ? "bg-blue-50 ml-8" : reply.isCharacter ? "bg-[#7A2A3A]/5 border border-[#7A2A3A]/20" : "bg-white/60"}`}
                  >
                    <div className="flex justify-between items-center mb-1 min-h-[18px]">
                      <span
                        className={`text-xs font-bold flex items-center gap-1 ${reply.isCharacter ? "text-[#7A2A3A]" : "text-gray-600"}`}
                      >
                        {reply.author}
                        {reply.author === thread.author && (
                          <span className="px-1.5 py-0.5 bg-gray-200 text-gray-500 text-[8px] rounded-md scale-90 origin-left">
                            楼主
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteReply(thread.id, reply.id);
                            }}
                            className="p-1 text-gray-300 hover:text-red-500"
                            title="删除此楼"
                          >
                            <Trash2 size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleForwardToChat(
                                reply,
                                "comment",
                                thread.title,
                              );
                            }}
                            className="p-1 text-gray-300 hover:text-black"
                            title="转发这条评论"
                          >
                            <Share size={12} />
                          </button>
                        </div>
                        <span className="text-[9px] text-gray-300 min-w-[20px] text-right">
                          #{idx + 1}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-800 leading-relaxed break-words">
                      {reply.content}
                    </p>
                  </div>
                ))}

                <div className="mt-6 flex flex-col gap-2 sticky bottom-4 z-20">
                  <div className="flex justify-end px-2">
                    <div className="bg-black/80 backdrop-blur-md text-white text-[10px] p-1 pl-1 pr-1 rounded-lg flex items-center gap-1 shadow-lg">
                      <span className="opacity-60 ml-1">身份:</span>
                      <select
                        value={replyIdentity}
                        onChange={(e) => setReplyIdentity(e.target.value)}
                        className="bg-transparent font-bold outline-none text-white appearance-none cursor-pointer text-center min-w-[60px]"
                      >
                        <option value="me" className="text-black">
                          大号 ({forumSettings.userNick || "我"})
                        </option>
                        <option value="smurf" className="text-black">
                          小号 ({forumSettings.smurfNick || "马甲"})
                        </option>
                      </select>
                      <ChevronDown size={10} className="opacity-60 mr-1" />
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      id="forum-reply-input"
                      type="text"
                      placeholder={
                        replyIdentity === "me"
                          ? `以 ${forumSettings.userNick} 回复`
                          : `以 ${forumSettings.smurfNick} 回复`
                      }
                      className={`flex-grow backdrop-blur shadow-lg p-3 rounded-full text-sm border outline-none transition-all ${replyIdentity === "me" ? "bg-white/90 border-gray-200 focus:border-black" : "bg-gray-100/90 border-gray-200 focus:border-gray-400 text-gray-600"}`}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleUserReply(
                            thread.id,
                            e.target.value,
                            replyIdentity,
                          );
                          e.target.value = "";
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input =
                          document.getElementById("forum-reply-input");
                        if (input && input.value) {
                          handleUserReply(
                            thread.id,
                            input.value,
                            replyIdentity,
                          );
                          input.value = "";
                        }
                      }}
                      className={`p-3 rounded-full shadow-lg text-white transition-all active:scale-95 ${replyIdentity === "me" ? "bg-black hover:bg-gray-800" : "bg-gray-500 hover:bg-gray-600"}`}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      ) : (
        // 状态 2: 帖子列表页
        <div className="space-y-4 pt-2 pb-20 animate-in fade-in">
          <div className="glass-card p-3 rounded-xl space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={forumGuidance}
                onChange={(e) => setForumGuidance(e.target.value)}
                placeholder="讨论方向（例如：讨论最近的都市传说）"
                className="flex-grow bg-white/50 text-xs p-2 rounded-lg outline-none border border-transparent focus:bg-white focus:border-gray-200 transition-colors"
              />
              {forumGuidance && (
                <button
                  onClick={() => setForumGuidance("")}
                  className="text-gray-400 hover:text-black"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={generateForumPosts}
                disabled={loading.forum_new}
                className="bg-black text-white py-2.5 rounded-lg text-xs font-bold hover:bg-gray-800 disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
              >
                {loading.forum_new ? (
                  <RefreshCw className="animate-spin" size={12} />
                ) : (
                  <Plus size={12} />
                )}{" "}
                生成新帖
              </button>
              <button
                onClick={refreshAllForumReplies}
                disabled={loading.forum_refresh_all}
                className="bg-white text-gray-700 border border-gray-200 py-2.5 rounded-lg text-xs font-bold hover:bg-gray-50 disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
              >
                {loading.forum_refresh_all ? (
                  <RefreshCw className="animate-spin" size={12} />
                ) : (
                  <RefreshCcw size={12} />
                )}{" "}
                更新回复
              </button>
            </div>
          </div>
          {forumData.posts.map((post) => (
            <div
              key={post.id}
              onClick={() => {
                if (
                  (!post.replies || post.replies.length === 0) &&
                  !post.isUserCreated
                ) {
                  generateForumReplies(post.id);
                }
                setActiveThreadId(post.id);
              }}
              className="bg-white p-4 rounded-xl shadow-sm active:scale-98 transition-transform cursor-pointer border border-gray-100 hover:border-gray-300 relative group"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-sm text-gray-900 line-clamp-1 pr-4">
                  {post.title}
                </h3>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2 mb-3 h-8 leading-relaxed">
                {post.content}
              </p>
              <div className="flex justify-between items-center text-[10px] text-gray-400">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold max-w-[100px] truncate ${post.authorType === "char" || post.author === persona?.name ? "text-[#7A2A3A]" : ""}`}
                  >
                    {post.author}
                  </span>
                  <span>{post.createdAt ? formatSmartTime(post.createdAt) : post.time}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <CommentIcon size={12} /> {post.replyCount || 0}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePost(post.id);
                    }}
                    className="text-gray-300 hover:text-red-400 p-1"
                    title="删除帖子"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              {post.authorType === "char" && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-[#7A2A3A] rounded-full"></div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 弹窗：设置 ID */}
      {showForumSettings && (
        <div className="absolute inset-0 z-[60] bg-black/50 flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <User size={16} /> 设置ID
            </h3>
            <p className="text-[10px] text-gray-400">
              修改ID将同步更新历史发帖记录。
            </p>
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">
                我的网名
              </label>
              <input
                value={forumSettings.userNick}
                onChange={(e) =>
                  setForumSettings((p) => ({ ...p, userNick: e.target.value }))
                }
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-black mb-3"
                placeholder="User本U"
              />
              <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">
                我的马甲 (小号)
              </label>
              <input
                value={forumSettings.smurfNick}
                onChange={(e) =>
                  setForumSettings((p) => ({ ...p, smurfNick: e.target.value }))
                }
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-gray-400"
                placeholder="不是小号"
              />
              <p className="text-[9px] text-gray-400 mt-1 mb-2">
                *用小号回复时，角色不会知道是你。
              </p>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-[#7A2A3A] mb-1 block">
                角色网名
              </label>
              <input
                value={forumSettings.charNick}
                onChange={(e) =>
                  setForumSettings((p) => ({ ...p, charNick: e.target.value }))
                }
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#7A2A3A]"
                placeholder="匿名用户"
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setShowForumSettings(false)}
                className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold"
              >
                取消
              </button>
              <button
                onClick={() => updateForumSettings(forumSettings)}
                className="flex-1 py-2 bg-black text-white rounded-lg text-xs font-bold"
              >
                保存并更新
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 弹窗：发帖 */}
      {showPostModal && (
        <div className="absolute inset-0 z-50 bg-[#F2F2F7] flex flex-col animate-in slide-in-from-bottom-10">
          <div className="h-14 px-4 flex items-center justify-between bg-white border-b border-gray-200/50">
            <button
              onClick={() => setShowPostModal(false)}
              className="text-gray-500 font-bold text-xs"
            >
              取消
            </button>
            <h3 className="font-bold text-sm">发布新帖</h3>
            <button
              onClick={handleCreatePost}
              disabled={
                !postDrafts[postTab].title || !postDrafts[postTab].content
              }
              className="bg-black text-white px-4 py-1.5 rounded-full font-bold text-xs disabled:opacity-50"
            >
              发布
            </button>
          </div>
          <div className="p-4 space-y-4">
            <div className="bg-gray-200/50 p-1 rounded-xl flex">
              <button
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${postTab === "me" ? "bg-white shadow-sm text-black" : "text-gray-400"}`}
                onClick={() => setPostTab("me")}
              >
                我的身份 ({getForumName("me")})
              </button>
              <button
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${postTab === "char" ? "bg-[#7A2A3A] text-white shadow-sm" : "text-gray-400"}`}
                onClick={() => setPostTab("char")}
              >
                角色身份 ({getForumName("char")})
              </button>
            </div>
            <div className="space-y-4">
              {postTab === "char" && (
                <div className="bg-[#7A2A3A]/5 p-3 rounded-xl border border-[#7A2A3A]/10 animate-in fade-in">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-bold text-[#7A2A3A] uppercase flex items-center gap-1">
                      <Ghost size={10} /> AI 代写 (角色视角)
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={postDrafts.char.topic}
                      onChange={(e) =>
                        setPostDrafts((p) => ({
                          ...p,
                          char: { ...p.char, topic: e.target.value },
                        }))
                      }
                      placeholder="输入主题，例如: 吐槽加班..."
                      className="flex-grow bg-white text-xs p-2.5 rounded-lg outline-none border border-transparent focus:border-[#7A2A3A]/30"
                    />
                    <button
                      onClick={generateCharacterPost}
                      disabled={loading.forum_char}
                      className="px-4 bg-[#7A2A3A] text-white rounded-lg text-xs font-bold disabled:opacity-50 whitespace-nowrap shadow-sm"
                    >
                      {loading.forum_char ? "..." : "生成"}
                    </button>
                  </div>
                </div>
              )}
              <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
                <input
                  type="text"
                  value={postDrafts[postTab].title}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPostDrafts((p) => ({
                      ...p,
                      [postTab]: { ...p[postTab], title: val },
                    }));
                  }}
                  placeholder="添加标题"
                  className="w-full text-base font-bold outline-none bg-transparent placeholder:text-gray-300"
                />
                <div className="h-[1px] bg-gray-100 w-full"></div>
                <textarea
                  value={postDrafts[postTab].content}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPostDrafts((p) => ({
                      ...p,
                      [postTab]: { ...p[postTab], content: val },
                    }));
                  }}
                  placeholder="分享你的新鲜事..."
                  className="w-full h-48 text-sm resize-none outline-none bg-transparent custom-scrollbar leading-relaxed placeholder:text-gray-300"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 弹窗：聊天事件自动发帖提醒 */}
      {showChatEventModal && chatEventPostData && (
        <div className="absolute inset-0 z-[70] bg-black/60 flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4">
            {/* 头部 */}
            <div className="bg-gradient-to-r from-[#7A2A3A] to-[#963448] px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkle size={16} className="text-white/80" />
                <span className="text-white font-bold text-sm">角色发帖啦</span>
              </div>
              <button
                onClick={() => setShowChatEventModal(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* 帖子内容预览 */}
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-[#7A2A3A]/10 flex items-center justify-center">
                  <span className="text-[#7A2A3A] font-bold text-sm">
                    {chatEventPostData.author?.charAt(0) || "匿"}
                  </span>
                </div>
                <div>
                  <div className="font-bold text-sm text-gray-900">
                    {chatEventPostData.author}
                  </div>
                  <div className="text-xs text-gray-400">刚刚</div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-base text-gray-900 mb-2">
                  {chatEventPostData.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                  {chatEventPostData.content}
                </p>
              </div>

              {/* 初始评论预览 */}
              {chatEventPostData.replies && chatEventPostData.replies.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <div className="text-xs text-gray-400 font-bold mb-2">
                    网友热评
                  </div>
                  {chatEventPostData.replies.slice(0, 2).map((reply, idx) => (
                    <div key={reply.id || idx} className="flex gap-2">
                      <span className="text-xs font-bold text-[#7A2A3A] shrink-0">
                        {reply.author}:
                      </span>
                      <span className="text-xs text-gray-600 line-clamp-1">
                        {reply.content}
                      </span>
                    </div>
                  ))}
                  {chatEventPostData.replies.length > 2 && (
                    <div className="text-xs text-gray-400">
                      还有 {chatEventPostData.replies.length - 2} 条评论...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 底部按钮 */}
            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={() => {
                  setShowChatEventModal(false);
                  setActiveApp("forum");
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
              >
                去看看
              </button>
              <button
                onClick={() => setShowChatEventModal(false)}
                className="flex-1 py-3 bg-[#7A2A3A] text-white rounded-xl text-sm font-bold hover:bg-[#963448] transition-colors shadow-md"
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </AppWindow>
  );
};

export default Forum;
