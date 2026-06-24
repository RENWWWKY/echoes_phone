import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  // 1. 【核心修改】这里必须设置仓库名，前后都要有斜杠
  base: "/echoes_phone/",

  plugins: [
    react(),
    VitePWA({
      // 2. 自动更新模式
      registerType: "autoUpdate",

      // 3. 包含图标和 favicon
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon_v3.png",
        "mask-icon.svg",
      ],

      // 4. Manifest 配置（手机安装后显示的信息）
      manifest: {
        name: "Echoes OS", // 安装后显示的完整名称
        short_name: "Echoes", // 桌面图标显示的短名称
        description: "A React-based OS simulation",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone", // 设为 standalone 才能全屏运行

        // 【关键】配置图标，Vite 会自动根据 base 路径处理
        icons: [
          {
            src: "pwa-192x192_v3.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512_v3.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
