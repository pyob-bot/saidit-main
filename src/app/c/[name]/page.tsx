"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import CommunitySidebar from "@/components/CommunitySidebar";
import { useAuth } from "@/lib/AuthContext";

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
  description?: string;
  icon?: string;
  banner?: string;
  joinPolicy: string;
  isMember: boolean;
  isMod: boolean;
  createdAt: string;
  creator: { id: string; username: string; avatar?: string };
  moderators: { id: string; username: string; avatar?: string }[];
  rules: { id: string; title: string; description: string }[];
  _count: { members: number; posts: number };
}

export default function CommunityPage() {
  const params = useParams();
  const { user } = useAuth();
  const name = params.name as string;
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [sort, setSort] = useState("hot");
  const [loading, setLoading] = useState(true);
  const [joinRequested, setJoinRequested] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [commRes, postsRes] = await Promise.all([
        fetch(`/api/communities/${name}`),
        fetch(`/api/communities/${name}/posts?sort=${sort}`),
      ]);
      const commData = await commRes.json();
      const postsData = await postsRes.json();
      setCommunity(commData.community);
      setPosts(postsData.posts || []);
    } catch (error) {
      console.error("Failed to fetch community:", error);
    } finally {
      setLoading(false);
    }
  }, [name, sort]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleJoin = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/communities/join-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ communityName: name }),
      });
      const data = await res.json();
      if (data.joined && community) {
        setCommunity({
          ...community,
          isMember: true,
          _count: { ...community._count, members: community._count.members + 1 },
        });
      } else if (data.requested) {
        setJoinRequested(true);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error("Join error:", error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-4">
        <div className="h-24 bg-gray-200 rounded-t animate-pulse" />
        <div className="bg-white border border-t-0 border-[#ccc] rounded-b p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-6 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-[#1a1a1b] mb-2">Community not found</h1>
        <p className="text-[#878a8c]">c/{name} does not exist.</p>
        <Link href="/" className="text-[#0079d3] hover:underline text-sm mt-4 inline-block">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-[#0079d3] h-20" />
      <div className="bg-white border-b border-[#ccc]">
        <div className="max-w-[1200px] mx-auto px-4 py-2">
          <div className="flex items-center gap-3 -mt-4">
            <div className="w-16 h-16 bg-white rounded-full border-4 border-white flex items-center justify-center text-2xl font-bold text-[#ff4500] shadow-sm">
              {community.displayName[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[#1a1a1b]">{community.displayName}</h1>
                {user && (
                  <button
                    onClick={handleJoin}
                    className={`px-4 py-1 rounded-full text-sm font-bold transition-colors ${
                      community.isMember
                        ? "bg-white border border-[#878a8c] text-[#878a8c] hover:border-[#1a1a1b] hover:text-[#1a1a1b]"
                        : joinRequested
                        ? "bg-[#edeff1] border border-[#ccc] text-[#878a8c] cursor-default"
                        : "bg-[#ff4500] text-white hover:bg-[#e03d00]"
                    }`}
                  >
                    {community.isMember ? "Joined" : joinRequested ? "Requested" : community.joinPolicy === "invite_only" ? "Invite Only" : "Join"}
                  </button>
                )}
              </div>
              <div className="text-sm text-[#878a8c]">c/{community.name}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-4">
        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            {user && community.isMember && (
              <Link href={`/c/${name}/submit`} className="block bg-white border border-[#ccc] rounded-sm p-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#edeff1] rounded-full flex items-center justify-center text-[#878a8c] text-sm font-bold">
                    {user.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1 bg-[#f6f7f8] border border-[#edeff1] rounded px-4 py-2 text-sm text-[#878a8c] hover:border-[#0079d3] hover:bg-white transition-colors cursor-pointer">
                    Create Post
                  </div>
                </div>
              </Link>
            )}

            <div className="bg-white border border-[#ccc] rounded-sm p-3 mb-3">
              <div className="flex items-center gap-2">
                {["hot", "new", "top"].map((s) => (
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

            {posts.length === 0 ? (
              <div className="bg-white border border-[#ccc] rounded-sm p-12 text-center">
                <h3 className="text-lg font-medium text-[#1a1a1b] mb-2">No posts yet</h3>
                <p className="text-sm text-[#878a8c] mb-4">Be the first to post in this community!</p>
                {user && community.isMember && (
                  <Link
                    href={`/c/${name}/submit`}
                    className="btn-primary inline-block text-sm"
                  >
                    Create Post
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} showCommunity={false} />
                ))}
              </div>
            )}
          </div>

          <div className="hidden lg:block w-[312px] shrink-0">
            <CommunitySidebar community={community} onJoin={user ? handleJoin : undefined} />
          </div>
        </div>
      </div>
    </div>
  );
}
