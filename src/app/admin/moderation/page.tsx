"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ScreeningLog {
  id: string;
  contentType: string;
  contentId: string;
  action: string;
  reason: string;
  trustBefore: number;
  trustAfter: number;
  autoMod: boolean;
  createdAt: string;
  user: { id: string; username: string; trustScore: number; flaggedCount: number };
}

interface ContentFilter {
  id: string;
  pattern: string;
  type: string;
  action: string;
  severity: number;
  description?: string;
  isActive: boolean;
}

interface LowTrustUser {
  id: string;
  username: string;
  trustScore: number;
  flaggedCount: number;
  cooldownUntil?: string;
}

interface Stats {
  action: string;
  _count: number;
}

export default function ModerationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [screenings, setScreenings] = useState<ScreeningLog[]>([]);
  const [filters, setFilters] = useState<ContentFilter[]>([]);
  const [lowTrustUsers, setLowTrustUsers] = useState<LowTrustUser[]>([]);
  const [stats, setStats] = useState<Stats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "screenings" | "filters" | "users">("overview");

  const [newFilter, setNewFilter] = useState({ pattern: "", type: "keyword", action: "flag", severity: 1, description: "" });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/moderation");
      const data = await res.json();
      setScreenings(data.screenings || []);
      setFilters(data.filters || []);
      setLowTrustUsers(data.lowTrustUsers || []);
      setStats(data.stats || []);
    } catch (error) {
      console.error("Failed to fetch moderation data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }
    fetchData();
  }, [user, router, fetchData]);

  const handleAction = async (action: string, targetId: string, targetType: string) => {
    await fetch("/api/admin/moderation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, targetId, targetType }),
    });
    fetchData();
  };

  const handleTrustAdjust = async (userId: string, newScore: number) => {
    await fetch("/api/admin/moderation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "adjust_trust", targetId: userId, trustScore: newScore }),
    });
    fetchData();
  };

  const handleAddFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    const { action: _orig, ...filterData } = newFilter;
    await fetch("/api/admin/moderation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_filter", ...filterData }),
    });
    setNewFilter({ pattern: "", type: "keyword", action: "flag", severity: 1, description: "" });
    fetchData();
  };

  const handleRemoveFilter = async (filterId: string) => {
    await fetch("/api/admin/moderation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove_filter", targetId: filterId }),
    });
    fetchData();
  };

  if (!user || user.role !== "admin") return null;

  const totalDelayed = stats.find(s => s.action === "delayed")?._count || 0;
  const totalRemoved = stats.find(s => s.action === "removed")?._count || 0;

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#1a1a1b]">Moderation Dashboard</h1>
        <p className="text-sm text-[#878a8c]">Soft moderation — content gets deleted, users never get banned.</p>
      </div>

      <div className="flex border-b border-[#ccc] mb-4">
        {(["overview", "screenings", "filters", "users"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-bold transition-colors ${
              activeTab === tab
                ? "text-[#0079d3] border-b-2 border-[#0079d3]"
                : "text-[#878a8c] hover:bg-[#f8f9fa]"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-[#ccc] rounded p-4 text-center">
            <div className="text-3xl font-bold text-[#ff4500]">{totalDelayed}</div>
            <div className="text-sm text-[#878a8c]">Delayed</div>
          </div>
          <div className="bg-white border border-[#ccc] rounded p-4 text-center">
            <div className="text-3xl font-bold text-red-500">{totalRemoved}</div>
            <div className="text-sm text-[#878a8c]">Removed</div>
          </div>
          <div className="bg-white border border-[#ccc] rounded p-4 text-center">
            <div className="text-3xl font-bold text-[#878a8c]">{lowTrustUsers.length}</div>
            <div className="text-sm text-[#878a8c]">Low Trust Users</div>
          </div>
          <div className="bg-white border border-[#ccc] rounded p-4 text-center">
            <div className="text-3xl font-bold text-[#46d160]">{filters.length}</div>
            <div className="text-sm text-[#878a8c]">Active Filters</div>
          </div>
        </div>
      )}

      {activeTab === "screenings" && (
        <div className="bg-white border border-[#ccc] rounded">
          <div className="p-3 border-b border-[#ccc]">
            <h3 className="font-bold text-[#1a1a1b]">Recent Screening Activity</h3>
          </div>
          <div className="divide-y divide-[#edeff1]">
            {screenings.length === 0 ? (
              <div className="p-6 text-center text-sm text-[#878a8c]">No screening activity yet.</div>
            ) : (
              screenings.map((s) => (
                <div key={s.id} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        s.action === "removed" ? "bg-red-100 text-red-700" :
                        s.action === "delayed" ? "bg-yellow-100 text-yellow-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {s.action.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-[#1a1a1b]">{s.contentType}</span>
                      <span className="text-xs text-[#878a8c]">
                        by u/{s.user.username} (trust: {s.trustBefore} → {s.trustAfter})
                      </span>
                    </div>
                    <div className="text-xs text-[#878a8c] mt-0.5">{s.reason}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.action === "delayed" && (
                      <button
                        onClick={() => handleAction("approve", s.contentId, s.contentType)}
                        className="text-xs px-2 py-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => handleAction("remove", s.contentId, s.contentType)}
                      className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "filters" && (
        <div>
          <div className="bg-white border border-[#ccc] rounded mb-4">
            <div className="p-3 border-b border-[#ccc]">
              <h3 className="font-bold text-[#1a1a1b]">Add Content Filter</h3>
            </div>
            <div className="p-3">
              <form onSubmit={handleAddFilter} className="flex flex-wrap gap-2 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs text-[#878a8c] mb-1">Pattern (keyword or regex)</label>
                  <input
                    type="text"
                    value={newFilter.pattern}
                    onChange={(e) => setNewFilter({ ...newFilter, pattern: e.target.value })}
                    className="input-field text-sm"
                    placeholder="spam keyword or /regex/"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#878a8c] mb-1">Type</label>
                  <select
                    value={newFilter.type}
                    onChange={(e) => setNewFilter({ ...newFilter, type: e.target.value })}
                    className="input-field text-sm"
                  >
                    <option value="keyword">Keyword</option>
                    <option value="regex">Regex</option>
                    <option value="domain">Domain</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#878a8c] mb-1">Action</label>
                  <select
                    value={newFilter.action}
                    onChange={(e) => setNewFilter({ ...newFilter, action: e.target.value })}
                    className="input-field text-sm"
                  >
                    <option value="flag">Flag + Delay</option>
                    <option value="remove">Remove</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#878a8c] mb-1">Severity</label>
                  <select
                    value={newFilter.severity}
                    onChange={(e) => setNewFilter({ ...newFilter, severity: parseInt(e.target.value) })}
                    className="input-field text-sm"
                  >
                    <option value={1}>Low</option>
                    <option value={2}>Medium</option>
                    <option value={3}>High</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary text-sm">Add</button>
              </form>
            </div>
          </div>

          <div className="bg-white border border-[#ccc] rounded">
            <div className="p-3 border-b border-[#ccc]">
              <h3 className="font-bold text-[#1a1a1b]">Active Filters</h3>
            </div>
            <div className="divide-y divide-[#edeff1]">
              {filters.map((f) => (
                <div key={f.id} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm text-[#1a1a1b] bg-[#f6f7f8] px-2 py-0.5 rounded">{f.pattern}</code>
                      <span className="text-xs text-[#878a8c]">{f.type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        f.action === "remove" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {f.action}
                      </span>
                      <span className="text-xs text-[#878a8c]">severity: {f.severity}</span>
                    </div>
                    {f.description && <div className="text-xs text-[#878a8c] mt-1">{f.description}</div>}
                  </div>
                  <button
                    onClick={() => handleRemoveFilter(f.id)}
                    className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {filters.length === 0 && (
                <div className="p-6 text-center text-sm text-[#878a8c]">No custom filters yet. Default filters are active.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="bg-white border border-[#ccc] rounded">
          <div className="p-3 border-b border-[#ccc]">
            <h3 className="font-bold text-[#1a1a1b]">Low Trust Users</h3>
            <p className="text-xs text-[#878a8c]">These users have reduced trust and may experience delays.</p>
          </div>
          <div className="divide-y divide-[#edeff1]">
            {lowTrustUsers.length === 0 ? (
              <div className="p-6 text-center text-sm text-[#878a8c]">No low trust users.</div>
            ) : (
              lowTrustUsers.map((u) => (
                <div key={u.id} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/u/${u.username}`} className="text-sm font-medium text-[#1a1a1b] hover:underline">
                        u/{u.username}
                      </Link>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        u.trustScore < 15 ? "bg-red-100 text-red-700" :
                        u.trustScore < 30 ? "bg-yellow-100 text-yellow-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        trust: {u.trustScore}
                      </span>
                      <span className="text-xs text-[#878a8c]">flagged: {u.flaggedCount}x</span>
                    </div>
                    {u.cooldownUntil && (
                      <div className="text-xs text-[#878a8c] mt-0.5">
                        Cooldown until: {new Date(u.cooldownUntil).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTrustAdjust(u.id, u.trustScore + 10)}
                      className="text-xs px-2 py-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      +10 Trust
                    </button>
                    <button
                      onClick={() => handleTrustAdjust(u.id, u.trustScore - 10)}
                      className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      -10 Trust
                    </button>
                    <button
                      onClick={() => handleTrustAdjust(u.id, 50)}
                      className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      Reset to 50
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
