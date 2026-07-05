# Echoes Phone 主题创作指南

Echoes Phone 使用 CSS 注入机制实现界面换肤。所有主题 CSS 通过 `<style id="echoes-skin-style">` 动态注入到 DOM 中。

## 架构原理

```
App.jsx
  └── <div id="echoes-chat">          ← 皮肤 CSS 的作用域根节点（涵盖锁屏/加载/主界面）
        ├── 锁屏界面 (isLocked)
        │     ├── 发光装饰圆
        │     ├── 时间文字
        │     └── 解锁/导入按钮
        ├── 主界面 (unlocked)
        │     ├── <header>             ← 顶部状态栏
        │     ├── <main id="main-content"> ← 主内容区
        │     │     ├── 玻璃面板 (.glass-panel / .glass-card)
        │     │     ├── 输入框 / 按钮 / 文字
        │     │     └── 各类子组件
        │     └── 底部导航栏
        └── 加载屏幕 (数据未就绪)
```

**核心规则**：所有自定义 CSS 选择器必须以 `#echoes-chat` 为前缀，确保样式只影响 Echoes 界面本身。

## CSS 自定义属性（CSS Variables）

每个主题建议先定义一组 CSS 变量，方便后续规则引用：

```css
#echoes-chat {
  --skin-bg: #1a1a2e;          /* 主背景色 */
  --skin-surface: #1e1e38;     /* 次级表面色 */
  --skin-card: #252540;        /* 卡片背景色 */
  --skin-text: #d0d0e8;       /* 主文字色 */
  --skin-sub: #8888aa;         /* 辅助文字色 */
  --skin-accent: #7788dd;      /* 强调色（按钮等） */
  --skin-accent-hover: #99aaff; /* 强调色 hover */
}
```

---

## 选择器参考：需要覆盖的关键 UI 元素

### 1. 主背景

| 选择器 | 说明 | Tailwind 原始值 |
|--------|------|----------------|
| `.bg-\[\\#F2F2F7\]` | 手机框架内背景 | `#F2F2F7` |
| `.bg-\[\\#EBEBF0\]` | 外部背景 | `#EBEBF0` |

```css
#echoes-chat .bg-\[\\#F2F2F7\] { background: var(--skin-bg) !important; }
#echoes-chat .bg-\[\\#EBEBF0\] { background: #080808 !important; }
```

⚠️ Tailwind 的方括号任意值生成的是带 `\` 转义的 CSS 类名。例如 `bg-[#F2F2F7]` 编译为 `.bg-\[\#F2F2F7\]`，CSS 中需要双反斜杠 `\\` 来匹配。

### 2. 文字颜色

| 选择器 | 说明 |
|--------|------|
| `.text-\[\\#1a1a1a\]` | 最深色文字（时间、标题） |
| `.text-\[\\#2C2C2C\]` | 次深色文字 |
| `.text-gray-800` | 正文 |
| `.text-gray-700` | 正文偏浅 |
| `.text-gray-600` | 中等灰 |
| `.text-gray-500` | 辅助文字 |
| `.text-gray-400` | 更浅 |
| `.text-gray-300` | 占位符级别 |

### 3. 玻璃面板

| 选择器 | 说明 |
|--------|------|
| `.glass-panel` | 半透明玻璃面板（首页 AppIcon 背景、底部导航栏等） |
| `.glass-card` | 玻璃卡片（设置页各处、个性化面板等） |

```css
#echoes-chat .glass-panel {
  background: rgba(30,30,60,0.75) !important;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
  border-color: rgba(255,255,255,0.08) !important;
}
```

### 4. 按钮

应用中主要使用两类按钮背景色：

| 选择器 | 说明 | 示例场景 |
|--------|------|---------|
| `.bg-black` / `[class*="bg-black"]` | 主按钮黑色背景 | "发送"、"应用"、"测试连接并保存" |
| `.[class*="bg-\[\\#2C2C2C\\]"]` | 深灰按钮 | 麦克风按钮、底部操作栏 |
| `.bg-gray-800` | 深灰变体 | 某些图标按钮 |

```css
/* 将黑色按钮变成主题色 */
#echoes-chat [class*="bg-black"] { background: var(--skin-accent) !important; }
#echoes-chat [class*="bg-\[\\#2C2C2C\\]"] { background: #3a3a70 !important; }
```

### 5. 输入框

```css
#echoes-chat input, #echoes-chat textarea {
  background: #1e1e38 !important;
  color: #d0d0e8 !important;
  border-color: rgba(255,255,255,0.1) !important;
}
#echoes-chat input::placeholder, #echoes-chat textarea::placeholder {
  color: #555588 !important;
}
```

### 6. 边框

| 选择器 | 说明 |
|--------|------|
| `.border-gray-200` | 标准边框 |
| `.border-gray-200\/50` | 半透明边框 |
| `.border-white\/50` | 白色半透明边框（玻璃面板用） |
| `.border-white\/60` | 白色半透明边框（AppIcon 用） |
| `.ring-black\/5` | 阴影环 |

### 7. 首页图标网格

AppIcon 组件使用 `glass-panel` 作为背景，内含 SVG 图标。

```css
/* AppIcon 图标 SVG 颜色 */
#echoes-chat .glass-panel svg { stroke: #aabbdd; }

/* AppIcon 下方文字颜色 */
#echoes-chat .text-gray-700.group-hover\:text-black { color: #aabbdd !important; }
#echoes-chat .text-gray-700.group-hover\:text-black:hover { color: #ccddff !important; }
```

⚠️ Tailwind 的 group-hover 变体在选择器中需要反斜杠转义冒号。

### 8. 底部操作栏

首页下方半透明操作栏（论坛、浏览器等快捷入口）：

```css
#echoes-chat [class*="rounded-\[24px\]"].glass-panel {
  background: rgba(30,30,60,0.75) !important;
}
#echoes-chat [class*="rounded-\[24px\]"].glass-panel svg,
#echoes-chat .flex.justify-around svg { stroke: #aaa; }
```

### 9. 聊天消息气泡

```css
/* 暗色气泡 */
#echoes-chat [class*="bg-\[\\#1a1a1a\]"] {
  background: #252540 !important;
  color: #d0d0e8 !important;
}
```

### 10. 头部导航

```css
#echoes-chat header { color: #07C160 !important; }
```

### 11. 白色背景元素

应用中大量使用 `bg-white`、`bg-gray-50`、`bg-gray-100` 等类名：

```css
#echoes-chat [class*="bg-white"] { background: #1a1a1a !important; }
#echoes-chat [class*="bg-gray-50"] { background: #151515 !important; }
#echoes-chat [class*="bg-gray-100"] { background: rgba(255,255,255,0.04) !important; }
```

⚠️ 使用 `[class*="..."]` 属性选择器匹配包含指定字符串的 class，这样能覆盖所有变体。

### 12. 绿色切换开关

```css
#echoes-chat .bg-green-500 { background: #07C160 !important; }
```

---

## 关键注意事项

1. **必须使用 `!important`** — 皮肤 CSS 通过 `<style>` 标签注入，可能晚于 Tailwind 的 `<style>` 加载。`!important` 保证覆盖。

2. **Tailwind 任意值类名需要转义** — 如 `bg-[#F2F2F7]` 在 CSS 中写作 `.bg-\[\#F2F2F7\]`（双反斜杠，因为它在 JS 字符串模板中）。

3. **`[class*="..."]` 比精确类名更可靠** — Taliwind 的 JIT 模式可能生成多个变体，属性选择器能一网打尽。

4. **SVG 图标通过 `stroke` 染色** — Lucide 图标使用 `stroke` 而非 `fill` 或 `color` 设置颜色。

5. **不要在皮肤 CSS 中修改布局** — 只修改颜色、圆角、阴影等视觉属性。修改 `display`、`position`、`width` 等可能导致布局错乱。

6. **兼容性** — `backdrop-filter` 需要 `-webkit-backdrop-filter` 兼容 iOS Safari。

7. **DOM 变更风险** — 如果应用代码重构了 DOM 结构或更换了 CSS 类名，现有主题可能会失效。建议在 CHANGELOG 中跟进 DOM 变更。

---

## 给社区创作者的速查卡片

```css
#echoes-chat {
  /* ← 在这里定义你的主题变量 */
}

/* 背景 */
#echoes-chat .bg-\[\#F2F2F7\] { /* 手机内背景 */ }
#echoes-chat .bg-\[\#EBEBF0\] { /* 外部背景 */ }

/* 文字 */
#echoes-chat .text-gray-800 { /* 正文 */ }
#echoes-chat .text-gray-600 { /* 中等 */ }
#echoes-chat .text-gray-500 { /* 辅助 */ }

/* 玻璃 */
#echoes-chat .glass-panel { }
#echoes-chat .glass-card { }

/* 按钮 */
#echoes-chat [class*="bg-black"] { /* 主按钮 */ }
#echoes-chat [class*="bg-\[\#2C2C2C\]"] { /* 次级按钮 */ }

/* 输入 */
#echoes-chat input, #echoes-chat textarea { }
#echoes-chat input::placeholder { }

/* 图标 */
#echoes-chat .glass-panel svg { }

/* 边框 */
#echoes-chat .border-gray-200 { }

/* 头部 */
#echoes-chat header { }
```

---

## 主题安装方式

1. 在「个性化 → 界面样式」点击预设皮肤即可一键应用
2. 或在「自定义样式」文本框中粘贴你的 CSS，实时生效
3. CSS 保存在浏览器的 localStorage 中（key: `echoes_skin_css`），刷新不会丢失
