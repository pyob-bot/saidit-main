"use client";

export default function HelpPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="max-w-[800px]">
        <h1 className="text-3xl font-bold text-[#1a1a1b] mb-6">Help Center</h1>
        <div className="bg-white border border-[#ccc] rounded-sm p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#1a1a1b] mb-2">Getting Started</h2>
            <p className="text-sm text-[#878a8c]">Welcome to Saidit! Here you can find answers to common questions.</p>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1a1a1b] mb-2">How do I create a post?</h3>
            <p className="text-sm text-[#878a8c]">Click &quot;Create Post&quot; in the header, choose a community, and start writing.</p>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1a1a1b] mb-2">How do I earn karma?</h3>
            <p className="text-sm text-[#878a8c]">Post quality content that gets upvoted. You also earn karma by logging in daily.</p>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1a1a1b] mb-2">Why was my content removed?</h3>
            <p className="text-sm text-[#878a8c]">SaiditBot automatically removes content that violates our rules. Check your notifications for details.</p>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1a1a1b] mb-2">How do I create a community?</h3>
            <p className="text-sm text-[#878a8c]">Click &quot;Create Community&quot; in the header. Choose a unique name and description.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
