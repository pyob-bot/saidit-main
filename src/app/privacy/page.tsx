"use client";

export default function PrivacyPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="max-w-[800px]">
        <h1 className="text-3xl font-bold text-[#1a1a1b] mb-6">Privacy Policy</h1>
        <div className="bg-white border border-[#ccc] rounded-sm p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[#1a1a1b] mb-2">Data Collection</h2>
            <p className="text-sm text-[#878a8c]">We collect only the data necessary to operate the platform: username, email, and content you post.</p>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1a1a1b] mb-2">Data Usage</h2>
            <p className="text-sm text-[#878a8c]">Your data is used to provide the Saidit service. We do not sell your data to advertisers or third parties.</p>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1a1a1b] mb-2">Cookies</h2>
            <p className="text-sm text-[#878a8c]">We use essential cookies for authentication and session management.</p>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1a1a1b] mb-2">Data Deletion</h2>
            <p className="text-sm text-[#878a8c]">You can request deletion of your account and all associated data from Settings.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
