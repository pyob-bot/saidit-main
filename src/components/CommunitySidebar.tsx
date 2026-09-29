"use client";

import Link from "next/link";

interface Community {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  _count: {
    members: number;
    posts: number;
  };
  creator: {
    id: string;
    username: string;
    avatar?: string;
  };
}

interface CommunitySidebarProps {
  community: Community & { isMember?: boolean; isMod?: boolean; rules?: { id: string; title: string; description: string }[] };
  onJoin?: () => void;
}

export default function CommunitySidebar({ community, onJoin }: CommunitySidebarProps) {
  return (
    <div className="w-full">
      <div className="sidebar-card">
        <div className="sidebar-card-header bg-[#ff4500]">
          {community.displayName}
        </div>
        <div className="sidebar-card-body">
          {community.description && (
            <p className="text-sm text-[#1a1a1b] mb-3">{community.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm mb-3">
            <div>
              <div className="font-bold text-[#1a1a1b]">{community._count.members}</div>
              <div className="text-xs text-[#878a8c]">Members</div>
            </div>
            <div>
              <div className="font-bold text-[#1a1a1b]">{community._count.posts}</div>
              <div className="text-xs text-[#878a8c]">Posts</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#878a8c] mb-3">
            <div className="w-2 h-2 bg-[#46d160] rounded-full" />
            Created by u/{community.creator.username}
          </div>
          {onJoin && (
            <button
              onClick={onJoin}
              className={`w-full py-1.5 rounded-full text-sm font-bold transition-colors ${
                community.isMember
                  ? "bg-white border border-[#878a8c] text-[#878a8c] hover:border-[#1a1a1b] hover:text-[#1a1a1b]"
                  : "bg-[#ff4500] text-white hover:bg-[#e03d00]"
              }`}
            >
              {community.isMember ? "Joined" : "Join"}
            </button>
          )}
        </div>
      </div>

      {community.rules && community.rules.length > 0 && (
        <div className="sidebar-card mt-3">
          <div className="sidebar-card-header bg-[#ff4500]">
            Community Rules
          </div>
          <div className="sidebar-card-body">
            <ol className="space-y-2">
              {community.rules.map((rule, i) => (
                <li key={rule.id} className="text-sm">
                  <span className="font-bold text-[#1a1a1b]">{i + 1}.</span>{" "}
                  <span className="text-[#1a1a1b]">{rule.title}</span>
                  {rule.description && (
                    <p className="text-xs text-[#878a8c] ml-4 mt-0.5">{rule.description}</p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {community.isMod && (
        <div className="sidebar-card mt-3">
          <div className="sidebar-card-header bg-[#46d160] text-black">
            Mod Tools
          </div>
          <div className="sidebar-card-body">
            <Link
              href={`/c/${community.name}/mod`}
              className="block text-sm text-[#0079d3] hover:underline"
            >
              Mod Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
