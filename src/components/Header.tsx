"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import HamburgerMenu from "./HamburgerMenu";

export default function Header() {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; isRead: boolean; createdAt: string; link?: string }[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetch("/api/notifications")
        .then((res) => res.json())
        .then((data) => {
          setUnreadCount(data.unreadCount || 0);
          setNotifications(data.notifications || []);
        })
        .catch(() => {});
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#ccc] h-12">
      <div className="max-w-[1200px] mx-auto h-full flex items-center px-4 gap-4">
        <HamburgerMenu />
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-[#ff4500] rounded-full flex items-center justify-center">
            <svg viewBox="0 0 20 20" className="w-5 h-5 text-white fill-current">
              <circle cx="10" cy="7" r="3" />
              <ellipse cx="10" cy="14" rx="6" ry="4" />
            </svg>
          </div>
          <span className="text-xl font-bold text-[#1a1a1b] hidden sm:block">saidit</span>
        </Link>

        <div className="flex-1 max-w-[690px]">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Saidit"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              className="w-full h-9 bg-[#f6f7f8] border border-[#edeff1] rounded-full px-4 pr-10 text-sm outline-none focus:border-[#0079d3] transition-colors"
            />
            <button
              onClick={() => {
                if (searchQuery.trim()) {
                  router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <svg className="w-4 h-4 text-[#878a8c] hover:text-[#1a1a1b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/s/submit"
                className="hidden sm:flex items-center gap-1 px-3 py-1 text-sm font-medium text-[#1a1a1b] border border-[#878a8c] rounded-full hover:bg-[#f8f9fa] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Post
              </Link>
              <Link
                href="/c/create"
                className="hidden sm:flex items-center gap-1 px-3 py-1 text-sm font-medium text-[#878a8c] border border-[#878a8c] rounded-full hover:bg-[#f8f9fa] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Create Community
              </Link>
              <Link
                href="/games"
                className="hidden sm:flex items-center gap-1 px-3 py-1 text-sm font-medium text-[#878a8c] border border-[#878a8c] rounded-full hover:bg-[#f8f9fa] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Games
              </Link>
              <div className="relative">
                <button
                  onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
                  className="relative p-1.5 text-[#878a8c] hover:bg-[#f8f9fa] rounded transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#ff4500] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <div className="absolute right-0 top-full mt-1 w-[360px] bg-white border border-[#ccc] rounded-md shadow-lg z-50">
                      <div className="flex items-center justify-between p-3 border-b border-[#ccc]">
                        <h3 className="font-bold text-[#1a1a1b]">Notifications</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={async () => {
                              await fetch("/api/notifications", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ markAllRead: true }),
                              });
                              setUnreadCount(0);
                              setNotifications(notifications.map(n => ({ ...n, isRead: true })));
                            }}
                            className="text-xs text-[#0079d3] hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-sm text-[#878a8c]">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <Link
                              key={n.id}
                              href={n.link || "#"}
                              onClick={() => setShowNotifications(false)}
                              className={`block px-3 py-2.5 border-b border-[#edeff1] hover:bg-[#f8f9fa] ${!n.isRead ? "bg-[#f0f7ff]" : ""}`}
                            >
                              <div className="flex items-start gap-2">
                                {!n.isRead && <div className="w-2 h-2 bg-[#0079d3] rounded-full mt-1.5 shrink-0" />}
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-[#1a1a1b] truncate">{n.title}</div>
                                  <div className="text-xs text-[#878a8c] truncate">{n.message}</div>
                                </div>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                      <div className="p-2 border-t border-[#ccc]">
                        <Link
                          href="/notifications"
                          onClick={() => setShowNotifications(false)}
                          className="block text-center text-xs text-[#0079d3] hover:underline py-1"
                        >
                          View All Notifications
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#f8f9fa] transition-colors"
                >
                  <div className="w-6 h-6 bg-[#ff4500] rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user.username[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-[#1a1a1b] hidden md:block max-w-[80px] truncate">{user.username}</span>
                  <svg className="w-3 h-3 text-[#878a8c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 w-[200px] bg-white border border-[#ccc] rounded-md shadow-lg z-50 overflow-hidden">
                      <div className="p-3 border-b border-[#edeff1]">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-[#ff4500] rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {user.username[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-[#1a1a1b]">{user.username}</div>
                            <div className="text-xs text-[#878a8c]">{user.karma} karma</div>
                          </div>
                        </div>
                      </div>
                      <div className="py-1">
                        <Link
                          href={`/u/${user.username}`}
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-[#1a1a1b] hover:bg-[#f8f9fa]"
                        >
                          <svg className="w-4 h-4 text-[#878a8c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-[#1a1a1b] hover:bg-[#f8f9fa]"
                        >
                          <svg className="w-4 h-4 text-[#878a8c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Settings
                        </Link>
                        <Link
                          href="/s/submit"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-[#1a1a1b] hover:bg-[#f8f9fa] sm:hidden"
                        >
                          <svg className="w-4 h-4 text-[#878a8c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Create Post
                        </Link>
                        <Link
                          href="/c/create"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-[#1a1a1b] hover:bg-[#f8f9fa] sm:hidden"
                        >
                          <svg className="w-4 h-4 text-[#878a8c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          Create Community
                        </Link>
                        <Link
                          href="/games"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-[#1a1a1b] hover:bg-[#f8f9fa]"
                        >
                          <svg className="w-4 h-4 text-[#878a8c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Games
                        </Link>
                        <Link
                          href="/invites"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-[#1a1a1b] hover:bg-[#f8f9fa]"
                        >
                          <svg className="w-4 h-4 text-[#878a8c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Invites
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1a1a1b] hover:bg-[#f8f9fa]"
                        >
                          <svg className="w-4 h-4 text-[#878a8c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Log Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-5 py-1.5 text-sm font-bold text-[#ff4500] border border-[#ff4500] rounded-full hover:bg-[#fff5f2] transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="px-5 py-1.5 text-sm font-bold text-white bg-[#ff4500] rounded-full hover:bg-[#e03d00] transition-colors hidden sm:block"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
