"use client";

import { useState, useRef } from "react";
import EmojiPicker from "./EmojiPicker";

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minRows?: number;
}

export default function RichTextEditor({ value, onChange, placeholder = "Write something...", minRows = 4 }: RichTextEditorProps) {
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const newText = value.substring(0, start) + before + selected + after + value.substring(end);
    onChange(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = start + before.length + selected.length;
    }, 0);
  };

  const toolbarButtons = [
    { label: "B", title: "Bold", action: () => insertText("**", "**") },
    { label: "I", title: "Italic", action: () => insertText("*", "*") },
    { label: "S", title: "Strikethrough", action: () => insertText("~~", "~~") },
    { label: "~", title: "Code", action: () => insertText("`", "`") },
    { label: "—", title: "Spoiler", action: () => insertText(">!", "!<") },
    { label: "🔗", title: "Link", action: () => insertText("[", "](url)") },
    { label: "📎", title: "Image URL", action: () => insertText("![alt](", ")") },
    { label: "━", title: "Quote", action: () => insertText("> ") },
    { label: "•", title: "Bullet List", action: () => insertText("- ") },
    { label: "1.", title: "Numbered List", action: () => insertText("1. ") },
  ];

  return (
    <div className="border border-[#ccc] rounded-lg overflow-hidden focus-within:border-[#0079d3] transition-colors">
      <div className="flex items-center gap-0.5 px-2 py-1 bg-[#f6f7f8] border-b border-[#edeff1] flex-wrap">
        {toolbarButtons.map((btn) => (
          <button
            key={btn.title}
            type="button"
            onClick={btn.action}
            title={btn.title}
            className="w-7 h-7 flex items-center justify-center text-xs font-bold text-[#878a8c] hover:bg-[#edeff1] rounded transition-colors"
          >
            {btn.label}
          </button>
        ))}
        <div className="w-px h-5 bg-[#ccc] mx-1" />
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            title="Emoji"
            className="w-7 h-7 flex items-center justify-center text-lg hover:bg-[#edeff1] rounded transition-colors"
          >
            😊
          </button>
          {showEmoji && (
            <EmojiPicker
              onSelect={(emoji) => {
                const textarea = textareaRef.current;
                if (textarea) {
                  const pos = textarea.selectionStart;
                  const newText = value.substring(0, pos) + emoji + value.substring(pos);
                  onChange(newText);
                } else {
                  onChange(value + emoji);
                }
              }}
              onClose={() => setShowEmoji(false)}
            />
          )}
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm text-[#1a1a1b] bg-white resize-y outline-none min-h-[120px]"
        style={{ minHeight: `${minRows * 24}px` }}
      />
      <div className="px-3 py-1 bg-[#f6f7f8] border-t border-[#edeff1] text-xs text-[#878a8c]">
        Supports **bold**, *italic*, ~~strikethrough~~, `code`, [links](url), &gt; quotes
      </div>
    </div>
  );
}
