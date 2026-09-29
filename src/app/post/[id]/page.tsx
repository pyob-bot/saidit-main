"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import VoteButtons from "@/components/VoteButtons";
import LinkEmbed from "@/components/LinkEmbed";
import ShareDialog from "@/components/ShareDialog";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });
import { useAuth } from "@/lib/AuthContext";
import { formatDistanceToNow } from "date-fns";

interface Author {
  id: string;
  username: string;
  avatar?: string;
  karma: number;
  role?: string;
}

interface CommentData {
  id: string;
  body: string;
  upvotes: number;
  downvotes: number;
  depth: number;
  createdAt: string;
  author: Author;
  replies: CommentData[];
  userVote?: number;
}

interface PostData {
  id: string;
  title: string;
  body?: string;
  url?: string;
  imageUrl?: string;
  type: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  isLocked: boolean;
  isPinned: boolean;
  createdAt: string;
  author: Author;
  community: { id: string; name: string; displayName: string; icon?: string };
  comments: CommentData[];
  userVote: number;
}

function CommentItem({
  comment,
  postId,
  depth = 0,
}: {
  comment: CommentData;
  postId: string;
  depth?: number;
}) {
  const { user } = useAuth();
  const [showReply, setShowReply] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [replies, setReplies] = useState<CommentData[]>(comment.replies || []);
  const [collapsed, setCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [showMenu, setShowMenu] = useState(false);

  const isAuthor = user?.id === comment.author.id;

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyBody, parentId: comment.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setReplies([...replies, data.comment]);
        setReplyBody("");
        setShowReply(false);
      }
    } catch (error) {
      console.error("Reply error:", error);
    }
  };

  const colors = ["border-[#0079d3]", "border-[#ff4500]", "border-[#46d160]", "border-[#ffd635]", "border-[#7193ff]", "border-[#ff585b]"];
  const borderColor = colors[depth % colors.length];

  return (
    <div className={`${depth > 0 ? `ml-2 pl-3 border-l-2 ${borderColor}` : ""}`}>
      <div className="py-2">
        <div className="flex items-center gap-1 text-xs mb-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-[#878a8c] hover:text-[#1a1a1b]"
          >
            {collapsed ? "[+]" : "[–]"}
          </button>
          <Link href={`/u/${comment.author.username}`} className="font-bold text-[#1a1a1b] hover:underline">
            {comment.author.username}
          </Link>
          {comment.author.role === "admin" && (
            <span className="px-1 text-[10px] bg-[#ff4500] text-white rounded font-bold">ADMIN</span>
          )}
          <span className="text-[#878a8c]">
            {comment.upvotes - comment.downvotes} points · {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>

        {!collapsed && (
          <>
            {isEditing ? (
              <div className="ml-5 mt-1">
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="input-field text-sm min-h-[80px]"
                />
                <div className="flex justify-end gap-2 mt-1">
                  <button
                    onClick={() => { setIsEditing(false); setEditBody(comment.body); }}
                    className="px-3 py-1 text-xs font-bold text-[#878a8c] hover:bg-[#f8f9fa] rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      const res = await fetch(`/api/comments/${comment.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ body: editBody }),
                      });
                      if (res.ok) {
                        comment.body = editBody;
                        setIsEditing(false);
                      }
                    }}
                    disabled={!editBody.trim()}
                    className="px-3 py-1 text-xs font-bold text-white bg-[#ff4500] rounded hover:bg-[#e03d00] disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-[#1a1a1b] whitespace-pre-wrap ml-5">
                {comment.body}
              </div>
            )}

            <div className="flex items-center gap-1 ml-5 mt-1">
              <VoteButtons
                id={comment.id}
                score={comment.upvotes - comment.downvotes}
                userVote={comment.userVote || 0}
                type="comment"
                horizontal
              />
              {user && !isEditing && (
                <button
                  onClick={() => setShowReply(!showReply)}
                  className="px-2 py-0.5 text-xs font-bold text-[#878a8c] hover:bg-[#f8f9fa] rounded"
                >
                  Reply
                </button>
              )}
              {isAuthor && !isEditing && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="px-1 py-0.5 text-xs text-[#878a8c] hover:bg-[#f8f9fa] rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
                    </svg>
                  </button>
                  {showMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                      <div className="absolute left-0 top-full mt-1 w-[140px] bg-white border border-[#ccc] rounded-md shadow-lg z-50">
                        <button
                          onClick={() => { setIsEditing(true); setShowMenu(false); }}
                          className="w-full text-left px-3 py-2 text-sm text-[#1a1a1b] hover:bg-[#f8f9fa]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm("Delete this comment?")) return;
                            await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
                            comment.body = "[deleted]";
                            setShowMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {showReply && (
              <form onSubmit={handleReply} className="ml-5 mt-2">
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="What are your thoughts?"
                  className="input-field text-sm min-h-[80px]"
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setShowReply(false)}
                    className="px-3 py-1 text-xs font-bold text-[#878a8c] hover:bg-[#f8f9fa] rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!replyBody.trim()}
                    className="btn-primary text-xs disabled:opacity-50 px-3 py-1"
                  >
                    Reply
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>

      {!collapsed &&
        replies.map((reply) => (
          <CommentItem key={reply.id} comment={reply} postId={postId} depth={depth + 1} />
        ))}
    </div>
  );
}

export default function PostDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const postId = params.id as string;
  const [post, setPost] = useState<PostData | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("new");
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [botMessage, setBotMessage] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${postId}`);
      const data = await res.json();
      setPost(data.post);
    } catch (error) {
      console.error("Failed to fetch post:", error);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim() || !post) return;

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentBody }),
      });
      const data = await res.json();

      if (data.botDeleted) {
        setBotMessage(data.botMessage);
        setCommentBody("");
        setTimeout(() => setBotMessage(null), 5000);
        return;
      }

      if (res.ok && data.comment) {
        setPost({
          ...post,
          comments: [data.comment, ...post.comments],
          commentCount: post.commentCount + 1,
        });
        setCommentBody("");
      }
    } catch (error) {
      console.error("Comment error:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (res.ok) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleSavePostEdit = async () => {
    if (!post) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, body: editBody }),
      });
      if (res.ok) {
        const data = await res.json();
        setPost({ ...post, title: data.post.title, body: data.post.body });
        setIsEditingPost(false);
      }
    } catch (error) {
      console.error("Edit error:", error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-4">
        <div className="bg-white border border-[#ccc] rounded-sm p-4 animate-pulse">
          <div className="h-3 bg-gray-200 rounded w-1/4 mb-3" />
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
          <div className="h-4 bg-gray-200 rounded w-full mb-2" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-[#1a1a1b] mb-2">Post not found</h1>
        <Link href="/" className="text-[#0079d3] hover:underline text-sm">Go Home</Link>
      </div>
    );
  }

  const sortedComments = [...post.comments].sort((a, b) => {
    if (sort === "top") return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-4">
      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-[#ccc] rounded-sm">
            <div className="flex">
              <div className="hidden sm:block py-2 px-2">
                <VoteButtons
                  id={post.id}
                  score={post.upvotes - post.downvotes}
                  userVote={post.userVote}
                  type="post"
                />
              </div>
              <div className="flex-1 p-3">
                <div className="flex items-center gap-1 text-xs text-[#787c7e] mb-1 flex-wrap">
                  <Link href={`/c/${post.community.name}`} className="font-bold text-[#1a1a1b] hover:underline">
                    c/{post.community.name}
                  </Link>
                  <span>·</span>
                  <span>Posted by</span>
                  <Link href={`/u/${post.author.username}`} className="hover:underline">
                    u/{post.author.username}
                  </Link>
                  <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                </div>

                {isEditingPost ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="input-field font-semibold text-lg"
                      maxLength={300}
                    />
                    <div className="text-right text-xs text-[#878a8c]">{editTitle.length}/300</div>
                    <RichTextEditor
                      value={editBody}
                      onChange={setEditBody}
                      placeholder="Post body (optional)"
                      minRows={6}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsEditingPost(false)}
                        className="px-4 py-1.5 text-sm font-bold text-[#878a8c] border border-[#878a8c] rounded-full hover:bg-[#f8f9fa]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSavePostEdit}
                        disabled={!editTitle.trim()}
                        className="px-4 py-1.5 text-sm font-bold text-white bg-[#ff4500] rounded-full hover:bg-[#e03d00] disabled:opacity-50"
                      >
                        Save Edits
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-xl font-semibold text-[#222] mb-2">{post.title}</h1>

                    {post.type === "link" && post.url && (
                      <LinkEmbed url={post.url} />
                    )}

                    {post.body && (
                      <div className="text-sm text-[#1a1a1b] whitespace-pre-wrap mt-2 leading-relaxed">
                        {post.body}
                      </div>
                    )}

                    {post.imageUrl && (
                      <div className="mt-3">
                        <img src={post.imageUrl} alt={post.title} className="max-h-[600px] object-contain rounded" />
                      </div>
                    )}
                  </>
                )}

                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#edeff1]">
                  <div className="sm:hidden">
                    <VoteButtons
                      id={post.id}
                      score={post.upvotes - post.downvotes}
                      userVote={post.userVote}
                      type="post"
                      horizontal
                    />
                  </div>
                  <span className="text-xs font-bold text-[#878a8c]">
                    {post.commentCount} {post.commentCount === 1 ? "Comment" : "Comments"}
                  </span>
                  <button className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-[#878a8c] hover:bg-[#f8f9fa] rounded">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </button>
                  <button className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-[#878a8c] hover:bg-[#f8f9fa] rounded">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    Save
                  </button>
                  {(user?.id === post.author.id || user?.role === "admin") && (
                    <div className="relative ml-auto">
                      <button
                        onClick={() => setShowPostMenu(!showPostMenu)}
                        className="p-1 text-[#878a8c] hover:bg-[#f8f9fa] rounded"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                        </svg>
                      </button>
                      {showPostMenu && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowPostMenu(false)} />
                          <div className="absolute right-0 top-full mt-1 w-[160px] bg-white border border-[#ccc] rounded-md shadow-lg z-50">
                            <button
                              onClick={() => {
                                setEditTitle(post.title);
                                setEditBody(post.body || "");
                                setIsEditingPost(true);
                                setShowPostMenu(false);
                              }}
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
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-[#ccc] p-4">
              {user ? (
                post.isLocked ? (
                  <div className="text-sm text-[#878a8c] italic text-center py-4">
                    This post has been locked. Comments are closed.
                  </div>
                ) : (
                  <>
                    {botMessage && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-center gap-2">
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {botMessage}
                      </div>
                    )}
                  <form onSubmit={handleComment}>
                    <div className="text-xs text-[#878a8c] mb-2">
                      Comment as <span className="text-[#0079d3]">{user.username}</span>
                    </div>
                    <textarea
                      value={commentBody}
                      onChange={(e) => setCommentBody(e.target.value)}
                      placeholder="What are your thoughts?"
                      className="input-field min-h-[120px] border-t-0 rounded-t-none"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        type="submit"
                        disabled={!commentBody.trim()}
                        className="btn-primary text-sm disabled:opacity-50"
                      >
                        Comment
                      </button>
                    </div>
                  </form>
                  </>
                )
              ) : (
                <div className="text-center py-4">
                  <Link href="/login" className="text-[#0079d3] text-sm hover:underline">
                    Log in or sign up to leave a comment
                  </Link>
                </div>
              )}
            </div>

            <div className="border-t border-[#ccc] px-4 py-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-[#878a8c]">Sort by:</span>
                {["best", "new", "top", "controversial"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className={`text-xs px-2 py-0.5 rounded ${
                      sort === s ? "text-[#0079d3] font-bold" : "text-[#878a8c] hover:text-[#1a1a1b]"
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>

              <div className="space-y-0">
                {sortedComments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} postId={postId} />
                ))}
              </div>

              {post.comments.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-[#878a8c]">No comments yet. Be the first to share what you think!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="hidden lg:block w-[312px] shrink-0">
          <div className="sidebar-card">
            <div className="sidebar-card-header bg-[#0079d3]">
              {post.community.displayName}
            </div>
            <div className="sidebar-card-body">
              <Link href={`/c/${post.community.name}`} className="text-sm text-[#0079d3] hover:underline">
                View Community
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
