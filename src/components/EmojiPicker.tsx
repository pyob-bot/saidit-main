"use client";

import { useState, useRef, useEffect } from "react";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = [
  { name: "Smileys", emojis: ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👽","👾","🤖"] },
  { name: "Gestures", emojis: ["👍","👎","👊","✊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","✌️","🤞","🤟","🤘","👌","🤌","🤏","👈","👉","👆","👇","☝️","✋","🤚","🖐️","🖖","👋","🤙","💪","🦾","🖕","✍️","🤳","💅","🖖"] },
  { name: "Hearts", emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","♥️","💋","🫂"] },
  { name: "Objects", emojis: ["🔥","⭐","🌟","✨","💫","🎉","🎊","🎈","🎁","🏆","🥇","🎯","🚀","💎","🔔","📌","💡","📝","✏️","📎","🔗","💰","💳","📦","🏷️","🔍","🔒","🔓","⚙️","🛠️"] },
  { name: "Nature", emojis: ["🌍","🌎","🌏","🌙","☀️","🌈","☁️","🌧️","⚡","❄️","🌸","🌺","🌻","🌹","🍀","🌿","🌵","🌲","🌳","🐾","🦋","🐝"] },
];

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute bottom-full left-0 mb-2 w-[320px] bg-white border border-[#ccc] rounded-lg shadow-lg z-50">
      <div className="p-2 border-b border-[#edeff1]">
        <input
          type="text"
          placeholder="Search emoji..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-[#edeff1] rounded-full outline-none focus:border-[#0079d3]"
        />
      </div>
      <div className="flex gap-1 px-2 pt-2 overflow-x-auto">
        {EMOJI_CATEGORIES.map((cat, i) => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(i)}
            className={`px-2 py-1 text-xs rounded whitespace-nowrap ${activeCategory === i ? "bg-[#ff4500] text-white" : "bg-[#f6f7f8] text-[#878a8c] hover:bg-[#edeff1]"}`}
          >
            {cat.name}
          </button>
        ))}
      </div>
      <div className="p-2 h-[200px] overflow-y-auto">
        <div className="grid grid-cols-8 gap-0.5">
          {EMOJI_CATEGORIES[activeCategory].emojis
            .filter((e) => !search || e.includes(search))
            .map((emoji, i) => (
              <button
                key={`${emoji}-${i}`}
                onClick={() => { onSelect(emoji); onClose(); }}
                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-[#f6f7f8] rounded transition-colors"
              >
                {emoji}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
