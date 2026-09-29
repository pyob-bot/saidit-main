"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";

interface Member {
  id: string;
  role: string;
  joinedAt: string;
  user: { id: string; username: string; karma: number };
}

export default function ModDashboardPage() {
  const params = useParams();
  const { user } = useAuth();
  const name = params.name as string;
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMod, setIsMod] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/communities/${name}`);
      const data = await res.json();
      if (data.community) {
        setIsMod(data.community.isMod);
      }
    } catch (error) {
      console.error("Failed to fetch community:", error);
    } finally {
      setLoading(false);
    }
  }, [name]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-4">
        <div className="bg-white border border-[#ccc] rounded-sm p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-40 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-60" />
        </div>
      </div>
    );
  }

  if (!isMod) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-[#1a1a1b] mb-2">Access Denied</h1>
        <p className="text-[#878a8c]">You are not a moderator of this community.</p>
        <Link href={`/c/${name}`} className="text-[#0079d3] hover:underline text-sm mt-4 inline-block">
          Go to Community
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-4">
      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-[#ccc] rounded-sm">
            <div className="p-4 border-b border-[#ccc]">
              <h2 className="text-lg font-medium text-[#1a1a1b]">
                Mod Dashboard · c/{name}
              </h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#f8f9fa] rounded p-4 text-center">
                  <div className="text-2xl font-bold text-[#1a1a1b]">{members.length || 0}</div>
                  <div className="text-sm text-[#878a8c]">Members</div>
                </div>
                <div className="bg-[#f8f9fa] rounded p-4 text-center">
                  <div className="text-2xl font-bold text-[#1a1a1b]">0</div>
                  <div className="text-sm text-[#878a8c]">Pending Reports</div>
                </div>
                <div className="bg-[#f8f9fa] rounded p-4 text-center">
                  <div className="text-2xl font-bold text-[#1a1a1b]">0</div>
                  <div className="text-sm text-[#878a8c]">Removed Posts</div>
                </div>
              </div>

              <h3 className="text-sm font-bold text-[#1a1a1b] mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href={`/c/${name}`}
                  className="block p-3 border border-[#edeff1] rounded hover:bg-[#f8f9fa] text-sm text-[#0079d3]"
                >
                  View Community
                </Link>
                <Link
                  href={`/c/${name}/submit`}
                  className="block p-3 border border-[#edeff1] rounded hover:bg-[#f8f9fa] text-sm text-[#0079d3]"
                >
                  Create Post
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block w-[312px] shrink-0">
          <div className="sidebar-card">
            <div className="sidebar-card-header bg-[#46d160] text-black">
              Mod Tools
            </div>
            <div className="sidebar-card-body text-sm space-y-2">
              <p className="text-[#878a8c]">
                Full moderation tools coming soon. Currently you can:
              </p>
              <ul className="list-disc list-inside text-[#1a1a1b] space-y-1">
                <li>Remove posts and comments</li>
                <li>Lock posts</li>
                <li>Pin posts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
