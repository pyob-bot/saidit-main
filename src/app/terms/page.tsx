"use client";

export default function TermsPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="max-w-[800px]">
        <h1 className="text-3xl font-bold text-[#1a1a1b] mb-6">Terms of Service</h1>
        <div className="bg-white border border-[#ccc] rounded-sm p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[#1a1a1b] mb-2">1. Acceptance of Terms</h2>
            <p className="text-sm text-[#878a8c]">By using Saidit, you agree to these Terms of Service.</p>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1a1a1b] mb-2">2. User Conduct</h2>
            <p className="text-sm text-[#878a8c]">Users must not post illegal content, threaten others, dox individuals, or engage in hate speech. Violations result in content removal and karma penalties.</p>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1a1a1b] mb-2">3. Content Moderation</h2>
            <p className="text-sm text-[#878a8c]">SaiditBot automatically detects and removes prohibited content. Users are never permanently banned — moderation focuses on content, not users.</p>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1a1a1b] mb-2">4. Privacy</h2>
            <p className="text-sm text-[#878a8c]">We respect your privacy. We do not sell your data to third parties.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
