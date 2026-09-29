"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";

interface Community {
  id: string;
  name: string;
  displayName: string;
  _count: { members: number };
}

interface SavedPost {
  id: string;
  createdAt: string;
  post: {
    id: string;
    title: string;
    community: { name: string };
  };
}

export default function HamburgerMenu() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [topCommunities, setTopCommunities] = useState<Community[]>([]);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);

  useEffect(() => {
    if (isOpen && user) {
      fetch("/api/communities/create")
        .then((res) => res.json())
        .then((data) => {
          setTopCommunities((data.communities || []).slice(0, 10));
        })
        .catch(() => {});

      fetch("/api/saved")
        .then((res) => res.json())
        .then((data) => {
          setSavedPosts(data.savedPosts || []);
        })
        .catch(() => {});
    }
  }, [isOpen, user]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 text-[#878a8c] hover:bg-[#f8f9fa] rounded transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-[300px] bg-white z-50 shadow-xl overflow-y-auto">
            <div className="p-4 border-b border-[#ccc] bg-[#ff4500]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <svg viewBox="0 0 20 20" className="w-5 h-5 text-[#ff4500] fill-current">
                      <circle cx="10" cy="7" r="3" />
                      <ellipse cx="10" cy="14" rx="6" ry="4" />
                    </svg>
                  </div>
                  <span className="text-white font-bold">saidit</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {user ? (
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-bold text-[#878a8c] uppercase">My Stuff</div>
                <Link href={`/u/${user.username}`} onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1a1a1b] hover:bg-[#f8f9fa]">
                  <svg className="w-5 h-5 text-[#878a8c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </Link>
                <Link href={`/u/${user.username}?tab=saved`} onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1a1a1b] hover:bg-[#f8f9fa]">
                  <svg className="w-5 h-5 text-[#878a8c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  Saved ({savedPosts.length})
                </Link>
                <Link href="/settings" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1a1a1b] hover:bg-[#f8f9fa]">
                  <svg className="w-5 h-5 text-[#878a8c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </Link>
                <Link href="/invites" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1a1a1b] hover:bg-[#f8f9fa]">
                  <svg className="w-5 h-5 text-[#878a8c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Invites
                </Link>
                <Link href="/games" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1a1a1b] hover:bg-[#f8f9fa]">
                  <svg className="w-5 h-5 text-[#878a8c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Games
                </Link>

                <div className="px-4 py-2 mt-2 text-xs font-bold text-[#878a8c] uppercase">Quick Actions</div>
                <Link href="/s/submit" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1a1a1b] hover:bg-[#f8f9fa]">
                  <svg className="w-5 h-5 text-[#878a8c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Post
                </Link>
                <Link href="/c/create" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1a1a1b] hover:bg-[#f8f9fa]">
                  <svg className="w-5 h-5 text-[#878a8c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Create Community
                </Link>

                {savedPosts.length > 0 && (
                  <>
                    <div className="px-4 py-2 mt-2 text-xs font-bold text-[#878a8c] uppercase">Saved Posts</div>
                    {savedPosts.slice(0, 5).map((sp) => (
                      <Link
                        key={sp.id}
                        href={`/post/${sp.post.id}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-[#1a1a1b] hover:bg-[#f8f9fa]"
                      >
                        <svg className="w-4 h-4 text-[#878a8c] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        <span className="truncate">{sp.post.title}</span>
                      </Link>
                    ))}
                  </>
                )}

                <div className="px-4 py-2 mt-2 text-xs font-bold text-[#878a8c] uppercase">Top Communities</div>
                {topCommunities.map((c) => (
                  <Link
                    key={c.id}
                    href={`/c/${c.name}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-[#1a1a1b] hover:bg-[#f8f9fa]"
                  >
                    <div className="w-6 h-6 bg-[#ff4500] rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                      {c.name[0].toUpperCase()}
                    </div>
                    <span className="flex-1 truncate">c/{c.name}</span>
                    <span className="text-xs text-[#878a8c]">{c._count.members}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-4">
                <p className="text-sm text-[#878a8c] mb-4">Log in to see your communities, saved posts, and more.</p>
                <Link href="/login" onClick={() => setIsOpen(false)} className="block w-full text-center btn-primary text-sm mb-2">
                  Log In
                </Link>
                <Link href="/register" onClick={() => setIsOpen(false)} className="block w-full text-center btn-secondary text-sm">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
