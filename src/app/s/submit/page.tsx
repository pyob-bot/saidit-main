"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });
import Link from "next/link";

interface Community {
  id: string;
  name: string;
  displayName: string;
}

export default function SubmitPostPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<"text" | "link" | "image">("text");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user && !loading) {
      router.push("/login");
      return;
    }
    if (!user) return;
    fetch("/api/communities/create")
      .then((res) => res.json())
      .then((data) => setCommunities(data.communities || []));
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
          communityName: selectedCommunity,
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
      <div className="max-w-[740px]">
        <div className="bg-white border border-[#ccc] rounded-sm">
          <div className="p-3 border-b border-[#ccc]">
            <h2 className="text-lg font-medium text-[#1a1a1b]">Create a post</h2>
          </div>

          <div className="p-4">
            <div className="mb-4">
              <select
                value={selectedCommunity}
                onChange={(e) => setSelectedCommunity(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Choose a community</option>
                {communities.map((c) => (
                  <option key={c.id} value={c.name}>
                    c/{c.name}
                  </option>
                ))}
              </select>
            </div>

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
                  {t === "text" ? "Post" : t === "link" ? "Link" : "Image & Video"}
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
                  <p className="text-sm text-[#878a8c]">Drag and drop image or</p>
                  <button type="button" className="text-sm text-[#0079d3] mt-1 hover:underline">
                    Upload
                  </button>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[#edeff1]">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-1.5 text-sm font-bold text-[#878a8c] border border-[#878a8c] rounded-full hover:bg-[#f8f9fa]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title.trim() || !selectedCommunity}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {submitting ? "Posting..." : "Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
