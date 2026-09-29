"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface Game {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  url: string;
}

const GAMES: Game[] = [
  {
    id: "elden-earth",
    slug: "elden-earth",
    name: "Elden Earth",
    description: "Geo-land claim idle incremental game. Walk the real world, claim land, earn royalties.",
    icon: "🌍",
    color: "#ff4500",
    url: "/games/elden-earth",
  },
];

export default function GamesSidebar() {
  const [playerCounts, setPlayerCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    GAMES.forEach((game) => {
      fetch(`/api/games/players?game=${game.slug}`)
        .then((res) => res.json())
        .then((data) => {
          setPlayerCounts((prev) => ({ ...prev, [game.slug]: data.totalJoined || 0 }));
        })
        .catch(() => {});
    });
  }, []);

  return (
    <div className="sidebar-card">
      <div className="sidebar-card-header flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Saidit Games
      </div>
      <div className="sidebar-card-body">
        <div className="space-y-3">
          {GAMES.map((game) => (
            <Link
              key={game.id}
              href={game.url}
              className="block border border-[#edeff1] rounded-lg p-3 hover:border-[#ff4500] hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ backgroundColor: game.color + "15" }}
                >
                  {game.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[#1a1a1b] group-hover:text-[#ff4500] transition-colors">
                    {game.name}
                  </div>
                  <div className="text-xs text-[#878a8c] line-clamp-2">{game.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-[#46d160]">
                <div className="w-1.5 h-1.5 bg-[#46d160] rounded-full" />
                {playerCounts[game.slug] || 0} Saidit players
              </div>
            </Link>
          ))}
        </div>
        <Link
          href="/games"
          className="block text-center text-xs text-[#878a8c] hover:text-[#0079d3] mt-3 py-2 border-t border-[#edeff1]"
        >
          View All Games →
        </Link>
      </div>
    </div>
  );
}
