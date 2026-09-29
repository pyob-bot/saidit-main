"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";

export default function EldenEarthPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!user) {
      setShowAuth(true);
    } else {
      fetch("/api/games/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameSlug: "elden-earth" }),
      }).catch(() => {});
    }
  }, [user]);

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const GAME_URL = "https://vicsanity623.github.io/Elden-Earth-v0-1-10-90b/";

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-4">
      <div className="mb-4">
        <Link href="/games" className="text-sm text-[#878a8c] hover:text-[#0079d3] flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Games
        </Link>
      </div>

      <div className="bg-white border border-[#ccc] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#ccc] bg-[#f6f7f8]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌍</span>
            <div>
              <h1 className="text-lg font-bold text-[#1a1a1b]">Elden Earth</h1>
              <p className="text-xs text-[#878a8c]">by VicSanity · Idle · Geo · Incremental</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-[#46d160] mr-2">
              <div className="w-1.5 h-1.5 bg-[#46d160] rounded-full animate-pulse" />
              2,847 playing
            </div>
            <button
              onClick={() => {
                if (iframeRef.current) {
                  iframeRef.current.src = iframeRef.current.src;
                }
              }}
              className="px-3 py-1 text-xs font-bold text-[#878a8c] border border-[#878a8c] rounded hover:bg-[#f0f0f0] transition-colors"
              title="Refresh game"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={handleFullscreen}
              className="px-3 py-1 text-xs font-bold text-[#878a8c] border border-[#878a8c] rounded hover:bg-[#f0f0f0] transition-colors"
              title="Fullscreen"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </div>

        <div ref={containerRef} className="relative bg-black" style={{ minHeight: "600px" }}>
          {showAuth && !user ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1a1a1b] to-[#343536]">
              <div className="text-center max-w-md px-6">
                <div className="text-6xl mb-4">🌍</div>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to Elden Earth</h2>
                <p className="text-[#878a8c] mb-6">
                  Sign in with your Saidit account to play. Your game progress is linked to your Saidit profile.
                </p>
                <div className="space-y-3">
                  <Link
                    href="/login"
                    className="block w-full py-3 bg-[#ff4500] text-white font-bold rounded-lg hover:bg-[#e03d00] transition-colors"
                  >
                    Sign In with Saidit
                  </Link>
                  <Link
                    href="/register"
                    className="block w-full py-3 border border-[#878a8c] text-[#878a8c] font-bold rounded-lg hover:bg-[#f8f9fa] transition-colors"
                  >
                    Create Saidit Account
                  </Link>
                  <button
                    onClick={() => setShowAuth(false)}
                    className="block w-full py-3 text-[#878a8c] text-sm hover:text-white transition-colors"
                  >
                    Play as Guest
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1b]">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#ff4500] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[#878a8c] text-sm">Loading Elden Earth...</p>
                  </div>
                </div>
              )}
              <iframe
                ref={iframeRef}
                src={GAME_URL}
                className="w-full border-0"
                style={{ minHeight: "600px", height: "calc(100vh - 200px)" }}
                onLoad={() => setIsLoading(false)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; geolocation; microphone"
                allowFullScreen
                title="Elden Earth"
              />
            </>
          )}
        </div>

        <div className="px-4 py-3 border-t border-[#ccc] bg-[#f6f7f8]">
          <div className="flex items-center justify-between text-xs text-[#878a8c]">
            <div className="flex items-center gap-4">
              <span>🌍 Geo-land claim idle game</span>
              <span>·</span>
              <span>Walk the real world, claim land, earn royalties</span>
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <span className="text-[#46d160]">Signed in as {user.username}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
