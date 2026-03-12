import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw, Maximize2 } from "lucide-react";
import { getGameById } from "../data/games";

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export default function Game() {
  const nav = useNavigate();
  const { id } = useParams();
  const game = useMemo(() => getGameById(id), [id]);

  const iframeSrc = useMemo(() => {
    if (!game) return "";
    // 在 dev 下，/games/foo/ 会被当成 SPA 路由；
    // 这里显式指向静态 index.html，保证小游戏总是加载到。
    return game.url.endsWith("/") ? `${game.url}index.html` : game.url;
  }, [game]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const containerRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (game) localStorage.setItem("grandma_last_game", game.id);
  }, [game]);

  const formatTime = (date) =>
    date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });

  const reloadIframe = () => {
    const iframe = containerRef.current?.querySelector("iframe");
    if (!iframe) return;
    // 只刷新 iframe（不会重载整个 React 页面）
    iframe.src = iframe.src;
  };

  const goFullscreen = async () => {
    // iOS Safari 很多情况下不支持 requestFullscreen，做降级提示
    if (isIOS()) {
      alert("iPad 上建议用“添加到主屏幕”获得更接近全屏的体验 🙂");
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen?.();
      }
    } catch {
      // 忽略：有些浏览器策略会阻止
    }
  };

  if (!game) {
    return (
      <div className="min-h-[100dvh] bg-white flex flex-col items-center justify-center p-10 text-slate-800">
        <div className="text-6xl font-black mb-6">找不到这个游戏</div>
        <button
          onClick={() => nav("/")}
          className="text-4xl font-black bg-pink-500 text-white px-10 py-6 rounded-[40px]"
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div
      className="game-shell min-h-[100dvh] bg-white flex flex-col overflow-hidden select-none"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Top bar */}
      <div
        className="topbar bg-pink-500 px-4 md:px-6 flex items-center justify-between shadow-xl z-50"
        style={{
          height: "clamp(64px, 9vh, 100px)",
        }}
      >
        <button
          onClick={() => nav("/")}
          className="back-btn flex items-center gap-3 bg-red-500 active:bg-red-700 text-white font-black border-b-[8px] border-red-800 shadow-lg"
          style={{
            fontSize: "clamp(22px, 2.8vw, 40px)",
            padding: "clamp(10px, 1.6vh, 16px) clamp(16px, 2.2vw, 28px)",
            borderRadius: "clamp(22px, 3vw, 40px)",
          }}
          aria-label="返回首页"
        >
          <ArrowLeft strokeWidth={8} className="w-8 h-8 md:w-10 md:h-10" />
          返回
        </button>

        <h2 className="title text-white font-black hidden lg:block drop-shadow-md"
            style={{ fontSize: "clamp(22px, 2.6vw, 44px)" }}>
          正在玩：{game.title}
        </h2>

        <div className="flex items-center gap-3 md:gap-4">
          <span
            className="time text-pink-100 font-bold hidden md:block"
            style={{ fontSize: "clamp(18px, 2vw, 34px)" }}
          >
            {formatTime(currentTime)}
          </span>

          <button
            onClick={goFullscreen}
            className="icon-btn bg-pink-400 text-white active:bg-pink-300 border-4 border-pink-200 shadow-lg"
            style={{
              width: "clamp(48px, 6vh, 72px)",
              height: "clamp(48px, 6vh, 72px)",
              borderRadius: "9999px",
            }}
            aria-label="全屏/退出全屏"
            title="全屏"
          >
            <Maximize2 className="mx-auto" strokeWidth={6} />
          </button>

          <button
            onClick={reloadIframe}
            className="icon-btn bg-pink-400 text-white active:bg-pink-300 border-4 border-pink-200 shadow-lg"
            style={{
              width: "clamp(48px, 6vh, 72px)",
              height: "clamp(48px, 6vh, 72px)",
              borderRadius: "9999px",
            }}
            aria-label="刷新游戏"
            title="刷新"
          >
            <RefreshCw className="mx-auto" strokeWidth={6} />
          </button>
        </div>
      </div>

      {/* Game area */}
      <div ref={containerRef} className="game-area flex-1 relative bg-slate-100">
        <iframe
          src={iframeSrc}
          className="absolute inset-0 w-full h-full border-none"
          title={game.title}
          allow="fullscreen; autoplay; gamepad"
        />

        {/* Exit hint bubble: auto-hide on landscape or short height */}
        <div className="exit-bubble absolute top-4 left-4 md:top-6 md:left-6 pointer-events-none opacity-90">
          <div
            className="bg-yellow-400 text-slate-900 font-black shadow-2xl border-[6px] border-white flex items-center gap-3"
            style={{
              padding: "clamp(10px, 1.6vh, 18px) clamp(14px, 2vw, 28px)",
              borderRadius: "clamp(18px, 2.6vw, 40px)",
              fontSize: "clamp(16px, 2vw, 28px)",
            }}
          >
            ⬅️ 累了点这里返回
          </div>
        </div>
      </div>

      {/* Auto responsive rules */}
      <style>{`
        @media (orientation: landscape), (max-height: 720px) {
          .exit-bubble { display: none !important; }
        }
      `}</style>
    </div>
  );
}
