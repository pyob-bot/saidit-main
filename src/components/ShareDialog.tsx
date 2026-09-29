"use client";

import { useState } from "react";

interface ShareDialogProps {
  url: string;
  title: string;
  onClose: () => void;
}

export default function ShareDialog({ url, title, onClose }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {}
    }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
          <div className="flex items-center justify-between p-4 border-b border-[#ccc]">
            <h3 className="font-bold text-[#1a1a1b]">Share</h3>
            <button onClick={onClose} className="text-[#878a8c] hover:text-[#1a1a1b]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={url}
                readOnly
                className="flex-1 input-field text-sm"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                  copied ? "bg-green-100 text-green-700" : "bg-[#ff4500] text-white hover:bg-[#e03d00]"
                }`}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="flex gap-2">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center py-2 text-sm font-bold border border-[#ccc] rounded-lg hover:bg-[#f8f9fa] transition-colors"
              >
                Twitter
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center py-2 text-sm font-bold border border-[#ccc] rounded-lg hover:bg-[#f8f9fa] transition-colors"
              >
                Facebook
              </a>
              <a
                href={`https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center py-2 text-sm font-bold border border-[#ccc] rounded-lg hover:bg-[#f8f9fa] transition-colors"
              >
                Reddit
              </a>
            </div>
            {"share" in navigator && (
              <button
                onClick={handleNativeShare}
                className="w-full py-2 text-sm font-bold text-[#0079d3] border border-[#0079d3] rounded-lg hover:bg-[#f0f7ff] transition-colors"
              >
                More sharing options...
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
