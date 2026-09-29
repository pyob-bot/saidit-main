"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import { formatDistanceToNow } from "date-fns";

interface UserData {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  karma: number;
  createdAt: string;
  _count: { posts: number; comments: number };
}

interface UserComment {
  id: string;
  body: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  author: { id: string; username: string; avatar?: string; karma: number };
  post: { id: string; title: string; community: { id: string; name: string; displayName: string } };
}

interface UserPost {
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

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [userData, setUserData] = useState<UserData | null>(null);
  const [recentPosts, setRecentPosts] = useState<UserPost[]>([]);
  const [recentComments, setRecentComments] = useState<UserComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "comments">("posts");

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${username}`);
      const data = await res.json();
      if (res.ok) {
        setUserData(data.user);
        setRecentPosts(data.recentPosts || []);
        setRecentComments(data.recentComments || []);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-4">
        <div className="bg-white border border-[#ccc] rounded-sm p-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full" />
            <div>
              <div className="h-6 bg-gray-200 rounded w-40 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-60" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-[#1a1a1b] mb-2">User not found</h1>
        <Link href="/" className="text-[#0079d3] hover:underline text-sm">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-4">
      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-[#ccc] rounded-sm">
            <div className="bg-[#0079d3] h-20 rounded-t" />
            <div className="px-4 pb-4">
              <div className="flex items-end gap-3 -mt-8">
                <div className="w-20 h-20 bg-[#ff4500] rounded-full border-4 border-white flex items-center justify-center text-3xl font-bold text-white">
                  {userData.username[0].toUpperCase()}
                </div>
                <div className="pb-1">
                  <h1 className="text-xl font-bold text-[#1a1a1b]">
                    {userData.displayName || userData.username}
                  </h1>
                  <div className="text-sm text-[#878a8c]">u/{userData.username}</div>
                </div>
              </div>

              {userData.bio && (
                <p className="text-sm text-[#1a1a1b] mt-3">{userData.bio}</p>
              )}

              <div className="flex items-center gap-6 mt-3 text-sm">
                <div>
                  <span className="font-bold text-[#1a1a1b]">{userData._count.posts}</span>{" "}
                  <span className="text-[#878a8c]">Posts</span>
                </div>
                <div>
                  <span className="font-bold text-[#1a1a1b]">{userData._count.comments}</span>{" "}
                  <span className="text-[#878a8c]">Comments</span>
                </div>
                <div>
                  <span className="font-bold text-[#ff4500]">{userData.karma}</span>{" "}
                  <span className="text-[#878a8c]">Karma</span>
                </div>
                <div>
                  <span className="text-[#878a8c]">
                    Joined {formatDistanceToNow(new Date(userData.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <div className="bg-white border border-[#ccc] rounded-sm">
              <div className="flex border-b border-[#ccc]">
                {(["posts", "comments"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${
                      activeTab === tab
                        ? "text-[#0079d3] border-b-2 border-[#0079d3]"
                        : "text-[#878a8c] hover:bg-[#f8f9fa]"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              <div className="p-3">
                {activeTab === "posts" && (
                  <>
                    {recentPosts.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-[#878a8c]">No posts yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentPosts.map((post) => (
                          <PostCard key={post.id} post={post} />
                        ))}
                      </div>
                    )}
                  </>
                )}
                {activeTab === "comments" && (
                  <>
                    {recentComments.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-[#878a8c]">No comments yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {recentComments.map((comment) => (
                          <Link
                            key={comment.id}
                            href={`/post/${comment.post.id}`}
                            className="block bg-white border border-[#ccc] rounded-sm p-3 hover:border-[#898989] transition-colors"
                          >
                            <div className="flex items-center gap-1 text-xs text-[#787c7e] mb-1">
                              <span>Comment on</span>
                              <span className="font-bold text-[#1a1a1b]">{comment.post.title}</span>
                              <span>in</span>
                              <span className="text-[#0079d3]">c/{comment.post.community.name}</span>
                            </div>
                            <div className="text-sm text-[#1a1a1b] line-clamp-2">{comment.body}</div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-[#878a8c]">
                              <span>{comment.upvotes - comment.downvotes} points</span>
                              <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block w-[312px] shrink-0">
          <div className="sidebar-card">
            <div className="sidebar-card-header bg-[#ff4500]">
              Karma
            </div>
            <div className="sidebar-card-body">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#ff4500]">{userData.karma}</div>
                <div className="text-sm text-[#878a8c]">Total Karma</div>
              </div>
              <div className="flex justify-center gap-6 mt-3 text-sm">
                <div className="text-center">
                  <div className="font-bold text-[#1a1a1b]">{userData._count.posts}</div>
                  <div className="text-xs text-[#878a8c]">Posts</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-[#1a1a1b]">{userData._count.comments}</div>
                  <div className="text-xs text-[#878a8c]">Comments</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
