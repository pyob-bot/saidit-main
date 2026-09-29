"use client";

import { useState, useEffect } from "react";
import PostCard from "@/components/PostCard";
import HomeSidebar from "@/components/HomeSidebar";
import GamesSidebar from "@/components/GamesSidebar";

interface Post {
  id: string;
  title: string;
  body?: string;
  url?: string;
  imageUrl?: string;
  type: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  createdAt: string;
  author: { id: string; username: string; avatar?: string; karma: number };
  community: { id: string; name: string; displayName: string; icon?: string };
  userVote?: number;
}

interface Community {
  id: string;
  name: string;
  displayName: string;
  _count: { members: number };
}

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [topCommunities, setTopCommunities] = useState<Community[]>([]);
  const [sort, setSort] = useState("hot");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [postsRes, communitiesRes] = await Promise.all([
          fetch(`/api/posts/create?sort=${sort}`),
          fetch("/api/communities/create"),
        ]);
        const postsData = await postsRes.json();
        const communitiesData = await communitiesRes.json();
        setPosts(postsData.posts || []);
        setTopCommunities((communitiesData.communities || []).slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sort]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-4">
      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-[#ccc] rounded-sm p-3 mb-3">
            <div className="flex items-center gap-2">
              {["hot", "new", "top", "controversial"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`px-3 py-1.5 text-sm font-bold rounded-full transition-colors ${
                    sort === s
                      ? "bg-[#f0f0f0] text-[#1a1a1b]"
                      : "text-[#878a8c] hover:bg-[#f8f9fa]"
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white border border-[#ccc] rounded-sm p-4 animate-pulse">
                  <div className="h-3 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white border border-[#ccc] rounded-sm p-12 text-center">
              <div className="text-4xl mb-4">📭</div>
              <h3 className="text-lg font-medium text-[#1a1a1b] mb-2">No posts yet</h3>
              <p className="text-sm text-[#878a8c]">
                Be the first to post something! Create a community and start sharing.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>

        <div className="hidden lg:block w-[312px] shrink-0 space-y-3">
          <HomeSidebar topCommunities={topCommunities} />
          <GamesSidebar />
        </div>
      </div>
    </div>
  );
}
