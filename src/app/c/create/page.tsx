"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function CreateCommunityPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [joinPolicy, setJoinPolicy] = useState<"public" | "request" | "invite_only">("public");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user && !loading) router.push("/login");
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/communities/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, displayName, description, isPrivate, joinPolicy }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setSubmitting(false);
        return;
      }
      router.push(`/c/${data.community.name}`);
    } catch {
      setError("Failed to create community");
      setSubmitting(false);
    }
  };

  if (!user || loading) return null;

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-4">
      <div className="max-w-[740px]">
        <div className="bg-white border border-[#ccc] rounded-sm">
          <div className="p-4 border-b border-[#ccc]">
            <h2 className="text-lg font-medium text-[#1a1a1b]">Create a community</h2>
          </div>
          <div className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded p-3">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#1a1a1b] mb-1">
                  Name
                </label>
                <p className="text-xs text-[#878a8c] mb-2">
                  Community names cannot be changed after creation.
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#878a8c]">c/</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    className="input-field pl-8"
                    required
                    minLength={3}
                    maxLength={21}
                    placeholder="communityname"
                  />
                </div>
                <p className="text-xs text-[#878a8c] mt-1">
                  {21 - name.length} characters remaining. 3-21 characters. Letters, numbers, underscores.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a1a1b] mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input-field"
                  required
                  maxLength={100}
                  placeholder="My Community"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a1a1b] mb-1">
                  Description <span className="text-[#878a8c]">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field"
                  placeholder="What is this community about?"
                  maxLength={500}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a1a1b] mb-2">Join Policy</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: "public", label: "Public", desc: "Anyone can join" },
                    { value: "request", label: "Request", desc: "Ask to join" },
                    { value: "invite_only", label: "Invite Only", desc: "Need invite code" },
                  ] as const).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setJoinPolicy(option.value)}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        joinPolicy === option.value
                          ? "border-[#ff4500] bg-[#fff5f2]"
                          : "border-[#ccc] hover:border-[#878a8c]"
                      }`}
                    >
                      <div className={`text-sm font-bold ${joinPolicy === option.value ? "text-[#ff4500]" : "text-[#1a1a1b]"}`}>
                        {option.label}
                      </div>
                      <div className="text-xs text-[#878a8c]">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

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
                  disabled={submitting || name.length < 3 || !displayName.trim()}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Community"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
