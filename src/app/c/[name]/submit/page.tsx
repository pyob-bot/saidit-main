"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });
import CommunitySidebar from "@/components/CommunitySidebar";

export default function SubmitPostPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const communityName = params.name as string;
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<"text" | "link" | "image">("text");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user && !loading) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/posts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body: type === "text" ? body : undefined,
          url: type === "link" ? url : undefined,
          type,
          communityName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setSubmitting(false);
        return;
      }

      router.push(`/post/${data.post.id}`);
    } catch {
      setError("Failed to create post");
      setSubmitting(false);
    }
  };

  if (!user || loading) return null;

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-4">
      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-[#ccc] rounded-sm">
            <div className="p-3 border-b border-[#ccc]">
              <h2 className="text-sm font-medium text-[#878a8c]">
                Create a post in <span className="text-[#1a1a1b] font-bold">c/{communityName}</span>
              </h2>
            </div>

            <div className="p-3">
              <div className="flex border-b border-[#edeff1] mb-4">
                {(["text", "link", "image"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${
                      type === t
                        ? "text-[#0079d3] border-b-2 border-[#0079d3]"
                        : "text-[#878a8c] hover:bg-[#f8f9fa]"
                    }`}
                  >
                    {t === "text" ? "Post" : t === "link" ? "Link" : "Image"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded p-3">
                    {error}
                  </div>
                )}

                <input
                  type="text"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field"
                  required
                  maxLength={300}
                />
                <div className="text-right text-xs text-[#878a8c]">{title.length}/300</div>

                {type === "text" && (
                  <RichTextEditor
                    value={body}
                    onChange={setBody}
                    placeholder="Write your post body..."
                    minRows={8}
                  />
                )}

                {type === "link" && (
                  <input
                    type="url"
                    placeholder="URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="input-field"
                    required
                  />
                )}

                {type === "image" && (
                  <div className="border-2 border-dashed border-[#ccc] rounded p-8 text-center">
                    <p className="text-sm text-[#878a8c]">Image upload coming soon. Use Link type for now.</p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-1.5 text-sm font-bold text-[#878a8c] border border-[#878a8c] rounded-full hover:bg-[#f8f9fa]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !title.trim()}
                    className="btn-primary text-sm disabled:opacity-50"
                  >
                    {submitting ? "Posting..." : "Post"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="hidden lg:block w-[312px] shrink-0">
          <div className="sidebar-card">
            <div className="sidebar-card-header bg-[#ff4500]">Posting to c/{communityName}</div>
            <div className="sidebar-card-body text-sm text-[#878a8c]">
              <ol className="space-y-2 list-decimal list-inside">
                <li>Be respectful to others</li>
                <li>No spam or excessive self-promotion</li>
                <li>Use appropriate post flairs</li>
                <li>Follow community rules</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
