"use client";

export default function AboutPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="max-w-[800px]">
        <h1 className="text-3xl font-bold text-[#1a1a1b] mb-6">About Saidit</h1>
        <div className="bg-white border border-[#ccc] rounded-sm p-6 space-y-4">
          <p className="text-sm text-[#1a1a1b]">Saidit is a community-driven platform for open discussion. Built with a commitment to free expression and fair moderation.</p>
          <div>
            <h2 className="text-xl font-bold text-[#1a1a1b] mb-2">Our Mission</h2>
            <p className="text-sm text-[#878a8c]">We believe in open conversation with responsible moderation. Content that violates the law is removed, but users are never silenced — they receive warnings and karma adjustments instead of bans.</p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1a1a1b] mb-2">How Saidit is Different</h2>
            <ul className="list-disc list-inside text-sm text-[#878a8c] space-y-1">
              <li>No permanent bans — content is moderated, not users</li>
              <li>AI-powered content filtering catches harmful content instantly</li>
              <li>Karma system rewards positive contributions</li>
              <li>Invite-only registration keeps quality high</li>
              <li>Built-in games and entertainment</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
