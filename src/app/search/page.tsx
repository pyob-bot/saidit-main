"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import { formatDistanceToNow } from "date-fns";

interface Post {
  id: string;
  title: string;
  body?: string;
  type: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  createdAt: string;
  author: { id: string; username: string; avatar?: string; karma: number };
  community: { id: string; name: string; displayName: string };
  userVote?: number;
  _count?: { comments: number };
}

interface Community {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  creator: { id: string; username: string; avatar?: string };
  _count: { members: number; posts: number };
}

interface User {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  karma: number;
  createdAt: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const [posts, setPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "communities" | "users">("posts");

  const fetchSearch = useCallback(async () => {
    if (!q) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setPosts(data.posts || []);
      setCommunities(data.communities || []);
      setUsers(data.users || []);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    fetchSearch();
  }, [fetchSearch]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[#1a1a1b]">
          Search results for &ldquo;{q}&rdquo;
        </h1>
        <p className="text-sm text-[#878a8c]">
          {posts.length + communities.length + users.length} results found
        </p>
      </div>

      <div className="flex border-b border-[#ccc] mb-4">
        {(["posts", "communities", "users"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-bold transition-colors ${
              activeTab === tab
                ? "text-[#0079d3] border-b-2 border-[#0079d3]"
                : "text-[#878a8c] hover:bg-[#f8f9fa]"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tab === "posts" ? posts.length : tab === "communities" ? communities.length : users.length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-[#ccc] rounded-sm p-4 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-1/4 mb-2" />
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {activeTab === "posts" && (
            <div className="space-y-3">
              {posts.length === 0 ? (
                <div className="bg-white border border-[#ccc] rounded-sm p-8 text-center">
                  <p className="text-sm text-[#878a8c]">No posts found.</p>
                </div>
              ) : (
                posts.map((post) => <PostCard key={post.id} post={post} />)
              )}
            </div>
          )}

          {activeTab === "communities" && (
            <div className="space-y-2">
              {communities.length === 0 ? (
                <div className="bg-white border border-[#ccc] rounded-sm p-8 text-center">
                  <p className="text-sm text-[#878a8c]">No communities found.</p>
                </div>
              ) : (
                communities.map((c) => (
                  <Link
                    key={c.id}
                    href={`/c/${c.name}`}
                    className="block bg-white border border-[#ccc] rounded-sm p-4 hover:border-[#898989] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#ff4500] rounded-full flex items-center justify-center text-white text-lg font-bold">
                        {c.displayName[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-[#1a1a1b]">c/{c.name}</div>
                        <div className="text-sm text-[#878a8c]">{c.displayName}</div>
                        {c.description && <div className="text-xs text-[#878a8c] line-clamp-1">{c.description}</div>}
                        <div className="text-xs text-[#878a8c]">{c._count.members} members · {c._count.posts} posts</div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-2">
              {users.length === 0 ? (
                <div className="bg-white border border-[#ccc] rounded-sm p-8 text-center">
                  <p className="text-sm text-[#878a8c]">No users found.</p>
                </div>
              ) : (
                users.map((u) => (
                  <Link
                    key={u.id}
                    href={`/u/${u.username}`}
                    className="block bg-white border border-[#ccc] rounded-sm p-4 hover:border-[#898989] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#ff4500] rounded-full flex items-center justify-center text-white text-lg font-bold">
                        {u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-[#1a1a1b]">u/{u.username}</div>
                        {u.displayName && <div className="text-sm text-[#878a8c]">{u.displayName}</div>}
                        <div className="text-xs text-[#878a8c]">{u.karma} karma · Joined {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}</div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-[1200px] mx-auto px-4 py-4"><div className="animate-pulse text-center text-[#878a8c]">Loading...</div></div>}>
      <SearchContent />
    </Suspense>
  );
}
