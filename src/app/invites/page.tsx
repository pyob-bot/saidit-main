"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

interface Invite {
  id: string;
  code: string;
  isUsed: boolean;
  usedAt?: string;
  createdAt: string;
}

export default function InvitesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [fetching, setFetching] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user && !loading) {
      router.push("/login");
      return;
    }
    if (!user) return;
    fetchInvites();
  }, [user, loading, router]);

  const fetchInvites = async () => {
    try {
      const res = await fetch("/api/invite");
      const data = await res.json();
      setInvites(data.invites || []);
    } catch (error) {
      console.error("Failed to fetch invites:", error);
    } finally {
      setFetching(false);
    }
  };

  const createInvite = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/invite", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setInvites([data.invite, ...invites]);
      }
    } catch (error) {
      console.error("Failed to create invite:", error);
    } finally {
      setCreating(false);
    }
  };

  const copyInvite = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/register?invite=${code}`);
  };

  if (!user || loading) return null;

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-4">
      <div className="max-w-[740px]">
        <div className="bg-white border border-[#ccc] rounded-sm">
          <div className="p-4 border-b border-[#ccc]">
            <h2 className="text-lg font-medium text-[#1a1a1b]">Your Invites</h2>
            <p className="text-sm text-[#878a8c] mt-1">
              Invite friends to join Saidit. Each invite code can only be used once.
            </p>
          </div>
          <div className="p-4">
            <button
              onClick={createInvite}
              disabled={creating}
              className="btn-primary text-sm mb-4 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Generate New Invite"}
            </button>

            {fetching ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : invites.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-[#878a8c]">No invites yet. Generate one to get started!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-3 border border-[#edeff1] rounded hover:bg-[#f8f9fa]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-[#1a1a1b]">{invite.code}</code>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            invite.isUsed
                              ? "bg-[#edeff1] text-[#878a8c]"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {invite.isUsed ? "Used" : "Available"}
                        </span>
                      </div>
                      <div className="text-xs text-[#878a8c] mt-1">
                        Created {formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true })}
                        {invite.usedAt && ` · Used ${formatDistanceToNow(new Date(invite.usedAt), { addSuffix: true })}`}
                      </div>
                    </div>
                    {!invite.isUsed && (
                      <button
                        onClick={() => copyInvite(invite.code)}
                        className="px-3 py-1 text-xs font-bold text-[#0079d3] hover:bg-[#edeff1] rounded"
                      >
                        Copy Link
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
