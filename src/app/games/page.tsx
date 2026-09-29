"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";

const GAMES = [
  {
    id: "elden-earth",
    name: "Elden Earth",
    description: "Geo-land claim idle incremental game. Inspired by Pokemon Go and Atlas Earth. Walk the real world, claim land, earn real-time royalties. Players dominate leaderboards from around the world.",
    icon: "🌍",
    color: "#ff4500",
    gradient: "from-red-500 to-orange-500",
    players: 2847,
    url: "/games/elden-earth",
    developer: "VicSanity",
    tags: ["Idle", "Geo", "Incremental"],
  },
];

export default function GamesPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a1b]">Saidit Games</h1>
        <p className="text-sm text-[#878a8c] mt-1">
          Play games directly inside Saidit. No redirects, no new tabs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {GAMES.map((game) => (
          <Link
            key={game.id}
            href={game.url}
            className="bg-white border border-[#ccc] rounded-lg overflow-hidden hover:border-[#ff4500] hover:shadow-md transition-all group"
          >
            <div className={`h-32 bg-gradient-to-br ${game.gradient} flex items-center justify-center`}>
              <span className="text-6xl group-hover:scale-110 transition-transform">{game.icon}</span>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-[#1a1a1b] group-hover:text-[#ff4500] transition-colors">
                  {game.name}
                </h3>
                <div className="flex items-center gap-1 text-xs text-[#46d160]">
                  <div className="w-1.5 h-1.5 bg-[#46d160] rounded-full animate-pulse" />
                  {game.players.toLocaleString()}
                </div>
              </div>
              <p className="text-sm text-[#878a8c] mb-3 line-clamp-2">{game.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {game.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-[#f6f7f8] text-[#878a8c] px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-[#878a8c]">by {game.developer}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
