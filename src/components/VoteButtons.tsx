"use client";

import { useState } from "react";

interface VoteButtonsProps {
  id: string;
  score: number;
  userVote: number;
  type: "post" | "comment";
  horizontal?: boolean;
}

export default function VoteButtons({ id, score, userVote, type, horizontal = false }: VoteButtonsProps) {
  const [currentVote, setCurrentVote] = useState(userVote);
  const [currentScore, setCurrentScore] = useState(score);

  const handleVote = async (value: number) => {
    try {
      const endpoint = type === "post" ? `/api/posts/${id}/vote` : `/api/comments/${id}/vote`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentVote(data.vote);
        setCurrentScore(data.score);
      }
    } catch (error) {
      console.error("Vote error:", error);
    }
  };

  const formatScore = (n: number) => {
    if (n >= 1000) {
      return (n / 1000).toFixed(1) + "k";
    }
    return n.toString();
  };

  return (
    <div className={`flex items-center gap-1 ${horizontal ? "flex-row" : "flex-col"} bg-[#f8f9fa] rounded-sm`}>
      <button
        onClick={() => handleVote(1)}
        className={`p-1 hover:bg-[#f0f0f0] rounded transition-colors ${
          currentVote === 1 ? "text-[#ff4500]" : "text-[#878a8c] hover:text-[#ff4500]"
        }`}
        aria-label="Upvote"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4l-8 8h5v8h6v-8h5z" />
        </svg>
      </button>
      <span
        className={`text-xs font-semibold min-w-[20px] text-center ${
          currentVote === 1 ? "text-[#ff4500]" : currentVote === -1 ? "text-[#7193ff]" : "text-[#1a1a1b]"
        }`}
      >
        {formatScore(currentScore)}
      </span>
      <button
        onClick={() => handleVote(-1)}
        className={`p-1 hover:bg-[#f0f0f0] rounded transition-colors ${
          currentVote === -1 ? "text-[#7193ff]" : "text-[#878a8c] hover:text-[#7193ff]"
        }`}
        aria-label="Downvote"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 20l8-8h-5V4H9v8H4z" />
        </svg>
      </button>
    </div>
  );
}
