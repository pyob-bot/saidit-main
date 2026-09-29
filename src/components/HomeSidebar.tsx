"use client";

import Link from "next/link";

interface SidebarCommunity {
  id: string;
  name: string;
  displayName: string;
  _count: { members: number };
}

export default function HomeSidebar({ topCommunities }: { topCommunities: SidebarCommunity[] }) {
  return (
    <div className="w-full space-y-3">
      <div className="sidebar-card">
        <div className="h-8 bg-[#ff4500]" />
        <div className="sidebar-card-body -mt-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-[#ff4500] rounded-full flex items-center justify-center border-2 border-white">
              <svg viewBox="0 0 20 20" className="w-6 h-6 text-white fill-current">
                <circle cx="10" cy="7" r="3" />
                <ellipse cx="10" cy="14" rx="6" ry="4" />
              </svg>
            </div>
            <span className="font-bold text-[#1a1a1b]">Home</span>
          </div>
          <p className="text-sm text-[#1a1a1b] mb-3">
            Your personal Saidit frontpage. Come here to check in with your favorite communities.
          </p>
          <div className="space-y-2">
            <Link
              href="/s/submit"
              className="block w-full text-center btn-primary text-sm"
            >
              Create Post
            </Link>
            <Link
              href="/c/create"
              className="block w-full text-center btn-secondary text-sm"
            >
              Create Community
            </Link>
          </div>
        </div>
      </div>

      <div className="sidebar-card">
        <div className="sidebar-card-header">Top Communities</div>
        <div className="sidebar-card-body">
          <div className="space-y-1">
            {topCommunities.map((c, i) => (
              <Link
                key={c.id}
                href={`/c/${c.name}`}
                className="flex items-center gap-2 py-1.5 text-sm hover:bg-[#f8f9fa] px-1 rounded"
              >
                <span className="text-xs text-[#878a8c] w-4">{i + 1}</span>
                <div className="w-6 h-6 bg-[#ff4500] rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                  {c.name[0].toUpperCase()}
                </div>
                <span className="text-[#1a1a1b] font-medium">c/{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="sidebar-card">
        <div className="sidebar-card-body text-xs text-[#878a8c]">
          <div className="flex flex-wrap gap-x-2 gap-y-1 mb-2">
            <Link href="/help" className="hover:underline">Help</Link>
            <Link href="/about" className="hover:underline">About</Link>
            <Link href="/careers" className="hover:underline">Careers</Link>
            <Link href="/press" className="hover:underline">Press</Link>
            <Link href="/blog" className="hover:underline">Blog</Link>
            <Link href="/terms" className="hover:underline">Terms</Link>
            <Link href="/privacy" className="hover:underline">Privacy</Link>
          </div>
          <div>Saidit, Inc. &copy; 2026. All rights reserved.</div>
        </div>
      </div>
    </div>
  );
}
