"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import VoteButtons from "./VoteButtons";
import LinkEmbed from "./LinkEmbed";
import ShareDialog from "./ShareDialog";
import { useAuth } from "@/lib/AuthContext";
import { formatDistanceToNow } from "date-fns";

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
  isPinned?: boolean;
  isRemoved?: boolean;
  createdAt: string;
  author: { id: string; username: string; avatar?: string; karma: number };
  community: { id: string; name: string; displayName: string; icon?: string };
  userVote?: number;
  _count?: { comments: number };
}

interface PostCardProps {
  post: Post;
  showCommunity?: boolean;
  compact?: boolean;
  onUpdate?: (updatedPost: Partial<Post>) => void;
}

export default function PostCard({ post, showCommunity = true, compact = false, onUpdate }: PostCardProps) {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editBody, setEditBody] = useState(post.body || "");
  const [saving, setSaving] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isAuthor = user?.id === post.author.id;
  const score = post.upvotes - post.downvotes;
  const comments = post.commentCount || post._count?.comments || 0;
  const postUrl = typeof window !== "undefined" ? `${window.location.origin}/post/${post.id}` : `/post/${post.id}`;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, body: editBody }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsEditing(false);
        setShowMenu(false);
        onUpdate?.(data.post);
      }
    } catch (error) {
      console.error("Edit error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (res.ok) {
        onUpdate?.({ ...post, isRemoved: true });
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
    setShowMenu(false);
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      const data = await res.json();
      setIsSaved(data.saved);
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white border border-[#0079d3] rounded-sm p-4">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="input-field mb-2 font-medium"
          maxLength={300}
        />
        <div className="text-right text-xs text-[#878a8c] mb-2">{editTitle.length}/300</div>
        <textarea
          value={editBody}
          onChange={(e) => setEditBody(e.target.value)}
          className="input-field min-h-[120px] mb-3"
          placeholder="Post body (optional)"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => { setIsEditing(false); setEditTitle(post.title); setEditBody(post.body || ""); }}
            className="px-4 py-1.5 text-sm font-bold text-[#878a8c] border border-[#878a8c] rounded-full hover:bg-[#f8f9fa]"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveEdit}
            disabled={saving || !editTitle.trim()}
            className="px-4 py-1.5 text-sm font-bold text-white bg-[#ff4500] rounded-full hover:bg-[#e03d00] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Edits"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="post-card flex bg-white border border-[#ccc] rounded-sm hover:border-[#898989] transition-colors">
        <div className="hidden sm:block py-2 px-1">
          <VoteButtons id={post.id} score={score} userVote={post.userVote || 0} type="post" />
        </div>

        <div className="flex-1 py-2 px-2 sm:px-3 min-w-0">
          <div className="flex items-center gap-1 text-xs text-[#787c7e] mb-1 flex-wrap">
            {showCommunity && (
              <>
                <Link href={`/c/${post.community.name}`} className="font-bold text-[#1a1a1b] hover:underline">
                  c/{post.community.name}
                </Link>
                <span>•</span>
              </>
            )}
            <span>Posted by</span>
            <Link href={`/u/${post.author.username}`} className="hover:underline">
              u/{post.author.username}
            </Link>
            <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
          </div>

          <Link href={`/post/${post.id}`} className="block group">
            <h3 className="text-lg font-medium text-[#222] leading-snug group-hover:text-[#0079d3] transition-colors">
              {post.isPinned && (
                <span className="inline-block mr-1 text-xs text-[#46d160] font-bold">PINNED</span>
              )}
              {post.title}
            </h3>
          </Link>

          {post.type === "link" && post.url && <LinkEmbed url={post.url} />}

          {!compact && post.body && (
            <div className="mt-2 text-sm text-[#4a4a4a] line-clamp-3 whitespace-pre-wrap">
              {post.body}
            </div>
          )}

          {!compact && post.imageUrl && (
            <div className="mt-2">
              <img src={post.imageUrl} alt={post.title} className="max-h-[512px] object-contain rounded" loading="lazy" />
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <div className="sm:hidden">
              <VoteButtons id={post.id} score={score} userVote={post.userVote || 0} type="post" horizontal />
            </div>
            <Link
              href={`/post/${post.id}`}
              className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-[#878a8c] hover:bg-[#f8f9fa] rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {comments} {comments === 1 ? "Comment" : "Comments"}
            </Link>
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-[#878a8c] hover:bg-[#f8f9fa] rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
            {user && (
              <button
                onClick={handleSave}
                className={`flex items-center gap-1 px-2 py-1 text-xs font-bold rounded transition-colors ${
                  isSaved ? "text-[#ff4500] bg-[#fff5f2]" : "text-[#878a8c] hover:bg-[#f8f9fa]"
                }`}
              >
                <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                {isSaved ? "Saved" : "Save"}
              </button>
            )}

            <div className="relative ml-auto" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-[#878a8c] hover:bg-[#f8f9fa] rounded transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-[180px] bg-white border border-[#ccc] rounded-md shadow-lg z-50 overflow-hidden">
                    <button
                      onClick={() => { navigator.clipboard.writeText(postUrl); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1a1a1b] hover:bg-[#f8f9fa]"
                    >
                      <svg className="w-4 h-4 text-[#878a8c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Copy Link
                    </button>
                    <Link
                      href={`/c/${post.community.name}`}
                      onClick={() => setShowMenu(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1a1a1b] hover:bg-[#f8f9fa]"
                    >
                      <svg className="w-4 h-4 text-[#878a8c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      View Community
                    </Link>
                    {user && (
                      <button
                        onClick={() => {
                          const target = prompt("Enter community names to cross-post to (comma-separated):");
                          if (target) {
                            const names = target.split(",").map((n) => n.trim()).filter(Boolean);
                            fetch("/api/posts/crosspost", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ postId: post.id, communityNames: names }),
                            }).then(() => alert("Cross-posted!"));
                          }
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1a1a1b] hover:bg-[#f8f9fa]"
                      >
                        <svg className="w-4 h-4 text-[#878a8c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        Cross-post
                      </button>
                    )}
                    {isAuthor && (
                      <>
                        <button
                          onClick={() => { setEditTitle(post.title); setEditBody(post.body || ""); setIsEditing(true); setShowMenu(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1a1a1b] hover:bg-[#f8f9fa]"
                        >
                          <svg className="w-4 h-4 text-[#878a8c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit Post
                        </button>
                        <button
                          onClick={handleDelete}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Post
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {showShare && <ShareDialog url={postUrl} title={post.title} onClose={() => setShowShare(false)} />}
    </>
  );
}
