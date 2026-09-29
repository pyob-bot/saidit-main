"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

type SettingsTab = "profile" | "account" | "password" | "notifications" | "theme" | "personalization";

export default function SettingsPage() {
  const { user, loading, refreshUser } = useAuth();
  const { applyTheme: applyLiveTheme } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");

  const [notifications, setNotifications] = useState({
    replies: true,
    mentions: true,
    upvotes: false,
    messages: true,
    communityUpdates: false,
    gameNotifications: true,
  });

  const [theme, setTheme] = useState({
    mode: "light" as "light" | "dark" | "auto",
    accentColor: "#ff4500",
    compactMode: false,
    showThumbnails: true,
    autoplayMedia: true,
  });

  const [personalization, setPersonalization] = useState({
    showOnlineStatus: true,
    showKarma: true,
    showPostHistory: true,
    allowFollowers: true,
    safeBrowsing: false,
  });

  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoverySent, setRecoverySent] = useState(false);

  useEffect(() => {
    if (!user && !loading) {
      router.push("/login");
      return;
    }
    if (!user) return;
    setDisplayName(user.displayName || "");
    setBio(user.bio || "");
    setAvatar(user.avatar || "");
    setEmail(user.email || "");

    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setNotifications({
            replies: data.settings.notifReplies,
            mentions: data.settings.notifMentions,
            upvotes: data.settings.notifUpvotes,
            messages: data.settings.notifMessages,
            communityUpdates: data.settings.notifCommunity,
            gameNotifications: data.settings.notifGames,
          });
          setTheme({
            mode: data.settings.themeMode,
            accentColor: data.settings.accentColor,
            compactMode: data.settings.compactMode,
            showThumbnails: data.settings.showThumbnails,
            autoplayMedia: data.settings.autoplayMedia,
          });
          setPersonalization({
            showOnlineStatus: data.settings.showOnlineStatus,
            showKarma: data.settings.showKarma,
            showPostHistory: data.settings.showPostHistory,
            allowFollowers: data.settings.allowFollowers,
            safeBrowsing: data.settings.safeBrowsing,
          });
        }
      })
      .catch(() => {});
  }, [user, loading, router]);

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio, avatar }),
      });
      if (res.ok) {
        await refreshUser();
        showMessage("success", "Profile updated successfully");
      } else {
        const data = await res.json();
        showMessage("error", data.error || "Failed to update profile");
      }
    } catch {
      showMessage("error", "Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showMessage("error", "Passwords do not match");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        showMessage("success", "Password changed successfully");
      } else {
        const data = await res.json();
        showMessage("error", data.error || "Failed to change password");
      }
    } catch {
      showMessage("error", "Network error");
    } finally {
      setSaving(false);
    }
  };

  if (!user || loading) return null;

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
    { id: "account", label: "Account", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { id: "password", label: "Password", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> },
    { id: "notifications", label: "Notifications", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
    { id: "theme", label: "Theme", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg> },
    { id: "personalization", label: "Personalization", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg> },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-4">
      <div className="flex gap-6">
        <div className="w-[220px] shrink-0 hidden md:block">
          <div className="bg-white border border-[#ccc] rounded-sm overflow-hidden sticky top-16">
            <div className="p-3 border-b border-[#ccc]">
              <h2 className="text-sm font-bold text-[#1a1a1b]">User Settings</h2>
            </div>
            <div className="py-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors ${
                    activeTab === tab.id
                      ? "bg-[#f0f0f0] text-[#1a1a1b] font-bold border-r-2 border-[#ff4500]"
                      : "text-[#878a8c] hover:bg-[#f8f9fa]"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="md:hidden mb-4">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as SettingsTab)}
              className="input-field"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>{tab.label}</option>
              ))}
            </select>
          </div>

          {message.text && (
            <div className={`mb-4 p-3 rounded text-sm font-medium ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-600"
            }`}>
              {message.text}
            </div>
          )}

          <div className="bg-white border border-[#ccc] rounded-sm">
            {activeTab === "profile" && (
              <div>
                <div className="p-4 border-b border-[#ccc]">
                  <h3 className="text-lg font-bold text-[#1a1a1b]">Profile Settings</h3>
                  <p className="text-sm text-[#878a8c] mt-1">Customize how others see your profile</p>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1b] mb-1">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="input-field"
                      placeholder="Your display name"
                      maxLength={50}
                    />
                    <p className="text-xs text-[#878a8c] mt-1">Shown on your profile instead of your username</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1b] mb-1">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="input-field min-h-[100px]"
                      placeholder="Tell us about yourself..."
                      maxLength={500}
                    />
                    <p className="text-xs text-[#878a8c] mt-1">{bio.length}/500 characters</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1b] mb-1">Avatar URL</label>
                    <input
                      type="url"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      className="input-field"
                      placeholder="https://example.com/avatar.jpg"
                    />
                    <div className="mt-2 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#ff4500] flex items-center justify-center text-white text-lg font-bold overflow-hidden">
                        {avatar ? (
                          <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          user.username[0].toUpperCase()
                        )}
                      </div>
                      <span className="text-xs text-[#878a8c]">Preview</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button onClick={handleSaveProfile} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
                      {saving ? "Saving..." : "Save Profile"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "account" && (
              <div>
                <div className="p-4 border-b border-[#ccc]">
                  <h3 className="text-lg font-bold text-[#1a1a1b]">Account Settings</h3>
                  <p className="text-sm text-[#878a8c] mt-1">Manage your account details</p>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-[#edeff1]">
                    <div>
                      <div className="text-sm font-medium text-[#1a1a1b]">Username</div>
                      <div className="text-sm text-[#878a8c]">u/{user.username}</div>
                    </div>
                    <span className="text-xs text-[#878a8c] bg-[#f6f7f8] px-3 py-1 rounded">Cannot be changed</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-[#edeff1]">
                    <div>
                      <div className="text-sm font-medium text-[#1a1a1b]">Email</div>
                      <div className="text-sm text-[#878a8c]">{email}</div>
                    </div>
                    <button className="text-xs font-bold text-[#0079d3] hover:underline">Change Email</button>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-[#edeff1]">
                    <div>
                      <div className="text-sm font-medium text-[#1a1a1b]">Account Created</div>
                      <div className="text-sm text-[#878a8c]">
                        {user.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) : "Unknown"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-[#edeff1]">
                    <div>
                      <div className="text-sm font-medium text-[#1a1a1b]">Karma</div>
                      <div className="text-sm text-[#878a8c]">{user.karma} karma points</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-sm font-medium text-[#1a1a1b]">Account Recovery</div>
                      <div className="text-sm text-[#878a8c]">Set up email recovery for your account</div>
                    </div>
                    <button onClick={() => { setRecoveryEmail(email); setShowRecoveryModal(true); }} className="text-xs font-bold text-[#0079d3] hover:underline">Setup Recovery</button>
                  </div>
                  <div className="pt-2 border-t border-[#edeff1]">
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <div className="text-sm font-medium text-red-500">Danger Zone</div>
                        <div className="text-sm text-[#878a8c]">Permanently delete your account and all data</div>
                      </div>
                      <button className="text-xs font-bold text-red-500 border border-red-500 px-3 py-1 rounded hover:bg-red-50">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "password" && (
              <div>
                <div className="p-4 border-b border-[#ccc]">
                  <h3 className="text-lg font-bold text-[#1a1a1b]">Change Password</h3>
                  <p className="text-sm text-[#878a8c] mt-1">Ensure your account stays secure</p>
                </div>
                <div className="p-4 space-y-4 max-w-[400px]">
                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1b] mb-1">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1b] mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-field"
                    />
                    <p className="text-xs text-[#878a8c] mt-1">At least 6 characters</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1b] mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <button
                    onClick={handleChangePassword}
                    disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                    className="btn-primary text-sm disabled:opacity-50"
                  >
                    {saving ? "Changing..." : "Change Password"}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div>
                <div className="p-4 border-b border-[#ccc]">
                  <h3 className="text-lg font-bold text-[#1a1a1b]">Notification Settings</h3>
                  <p className="text-sm text-[#878a8c] mt-1">Choose what you want to be notified about</p>
                </div>
                <div className="p-4">
                  <div className="space-y-1">
                    {Object.entries({
                      replies: { label: "Replies to my posts and comments", desc: "Get notified when someone replies to you" },
                      mentions: { label: "Mentions (u/username)", desc: "Get notified when someone mentions you" },
                      upvotes: { label: "Upvotes on my posts", desc: "Get notified when your content is upvoted" },
                      messages: { label: "Direct messages", desc: "Get notified about new private messages" },
                      communityUpdates: { label: "Community updates", desc: "Get notified about changes in your communities" },
                      gameNotifications: { label: "Game notifications", desc: "Get notified about game updates and events" },
                    }).map(([key, { label, desc }]) => (
                      <div key={key} className="flex items-center justify-between py-3 border-b border-[#edeff1] last:border-0">
                        <div>
                          <div className="text-sm font-medium text-[#1a1a1b]">{label}</div>
                          <div className="text-xs text-[#878a8c]">{desc}</div>
                        </div>
                        <button
                          onClick={() => setNotifications({ ...notifications, [key]: !notifications[key as keyof typeof notifications] })}
                          className={`relative w-10 h-5 rounded-full transition-colors ${
                            notifications[key as keyof typeof notifications] ? "bg-[#46d160]" : "bg-[#ccc]"
                          }`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                            notifications[key as keyof typeof notifications] ? "translate-x-5" : "translate-x-0.5"
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4">
                    <button onClick={async () => {
                      await fetch("/api/settings", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          notifReplies: notifications.replies,
                          notifMentions: notifications.mentions,
                          notifUpvotes: notifications.upvotes,
                          notifMessages: notifications.messages,
                          notifCommunity: notifications.communityUpdates,
                          notifGames: notifications.gameNotifications,
                        }),
                      });
                      showMessage("success", "Notification settings saved");
                    }} className="btn-primary text-sm">
                      Save Notification Settings
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "theme" && (
              <div>
                <div className="p-4 border-b border-[#ccc]">
                  <h3 className="text-lg font-bold text-[#1a1a1b]">Theme Settings</h3>
                  <p className="text-sm text-[#878a8c] mt-1">Customize the look and feel of Saidit</p>
                </div>
                <div className="p-4 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1b] mb-2">Color Mode</label>
                    <div className="flex gap-3">
                      {(["light", "dark", "auto"] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => { const t = { ...theme, mode }; setTheme(t); applyLiveTheme(t.mode, t.accentColor, t.compactMode); }}
                          className={`flex-1 py-3 px-4 border rounded-lg text-sm font-medium transition-colors ${
                            theme.mode === mode
                              ? "border-[#ff4500] bg-[#fff5f2] text-[#ff4500]"
                              : "border-[#ccc] hover:border-[#878a8c]"
                          }`}
                        >
                          {mode === "light" && "☀️ Light"}
                          {mode === "dark" && "🌙 Dark"}
                          {mode === "auto" && "🔄 Auto"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1b] mb-2">Accent Color</label>
                    <div className="flex gap-3">
                      {["#ff4500", "#0079d3", "#46d160", "#ffd635", "#7193ff", "#ff585b", "#00a6a5", "#9b59b6"].map((color) => (
                        <button
                          key={color}
                          onClick={() => { const t = { ...theme, accentColor: color }; setTheme(t); applyLiveTheme(t.mode, t.accentColor, t.compactMode); }}
                          className={`w-8 h-8 rounded-full border-2 transition-transform ${
                            theme.accentColor === color ? "border-[#1a1a1b] scale-110" : "border-transparent"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <div className="text-sm font-medium text-[#1a1a1b]">Compact Mode</div>
                        <div className="text-xs text-[#878a8c]">Show more posts on screen</div>
                      </div>
                      <button
                        onClick={() => setTheme({ ...theme, compactMode: !theme.compactMode })}
                        className={`relative w-10 h-5 rounded-full transition-colors ${theme.compactMode ? "bg-[#46d160]" : "bg-[#ccc]"}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${theme.compactMode ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <div className="text-sm font-medium text-[#1a1a1b]">Show Thumbnails</div>
                        <div className="text-xs text-[#878a8c]">Display image previews in feeds</div>
                      </div>
                      <button
                        onClick={() => setTheme({ ...theme, showThumbnails: !theme.showThumbnails })}
                        className={`relative w-10 h-5 rounded-full transition-colors ${theme.showThumbnails ? "bg-[#46d160]" : "bg-[#ccc]"}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${theme.showThumbnails ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <div className="text-sm font-medium text-[#1a1a1b]">Autoplay Media</div>
                        <div className="text-xs text-[#878a8c]">Automatically play videos in feeds</div>
                      </div>
                      <button
                        onClick={() => setTheme({ ...theme, autoplayMedia: !theme.autoplayMedia })}
                        className={`relative w-10 h-5 rounded-full transition-colors ${theme.autoplayMedia ? "bg-[#46d160]" : "bg-[#ccc]"}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${theme.autoplayMedia ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <button onClick={async () => {
                      await fetch("/api/settings", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          themeMode: theme.mode,
                          accentColor: theme.accentColor,
                          compactMode: theme.compactMode,
                          showThumbnails: theme.showThumbnails,
                          autoplayMedia: theme.autoplayMedia,
                        }),
                      });
                      applyLiveTheme(theme.mode, theme.accentColor, theme.compactMode);
                      showMessage("success", "Theme settings saved");
                    }} className="btn-primary text-sm">
                      Save Theme Settings
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "personalization" && (
              <div>
                <div className="p-4 border-b border-[#ccc]">
                  <h3 className="text-lg font-bold text-[#1a1a1b]">Personalization</h3>
                  <p className="text-sm text-[#878a8c] mt-1">Control your privacy and experience</p>
                </div>
                <div className="p-4">
                  <div className="space-y-1">
                    {Object.entries({
                      showOnlineStatus: { label: "Show online status", desc: "Let others see when you are online" },
                      showKarma: { label: "Show karma on profile", desc: "Display your karma points publicly" },
                      showPostHistory: { label: "Show post history", desc: "Allow others to see your past posts" },
                      allowFollowers: { label: "Allow followers", desc: "Let other users follow your activity" },
                      safeBrowsing: { label: "Safe browsing mode", desc: "Filter out potentially sensitive content" },
                    }).map(([key, { label, desc }]) => (
                      <div key={key} className="flex items-center justify-between py-3 border-b border-[#edeff1] last:border-0">
                        <div>
                          <div className="text-sm font-medium text-[#1a1a1b]">{label}</div>
                          <div className="text-xs text-[#878a8c]">{desc}</div>
                        </div>
                        <button
                          onClick={() => setPersonalization({ ...personalization, [key]: !personalization[key as keyof typeof personalization] })}
                          className={`relative w-10 h-5 rounded-full transition-colors ${
                            personalization[key as keyof typeof personalization] ? "bg-[#46d160]" : "bg-[#ccc]"
                          }`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                            personalization[key as keyof typeof personalization] ? "translate-x-5" : "translate-x-0.5"
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4">
                    <button onClick={async () => {
                      await fetch("/api/settings", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          showOnlineStatus: personalization.showOnlineStatus,
                          showKarma: personalization.showKarma,
                          showPostHistory: personalization.showPostHistory,
                          allowFollowers: personalization.allowFollowers,
                          safeBrowsing: personalization.safeBrowsing,
                        }),
                      });
                      showMessage("success", "Personalization settings saved");
                    }} className="btn-primary text-sm">
                      Save Personalization Settings
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showRecoveryModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowRecoveryModal(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-4 border-b border-[#ccc]">
                <h3 className="text-lg font-bold text-[#1a1a1b]">Set Up Account Recovery</h3>
              </div>
              <div className="p-4">
                {recoverySent ? (
                  <div className="text-center py-4">
                    <div className="text-4xl mb-3">📧</div>
                    <p className="text-sm text-[#1a1a1b] mb-2">Recovery link sent to <strong>{recoveryEmail}</strong></p>
                    <p className="text-xs text-[#878a8c]">Check your inbox and click the link to set up account recovery.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-[#878a8c] mb-4">
                      We&apos;ll send a recovery link to your email. Use this to regain access if you forget your password.
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-[#1a1a1b] mb-1">Recovery Email</label>
                      <input
                        type="email"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        className="input-field"
                        placeholder="your@email.com"
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="p-4 border-t border-[#ccc] flex justify-end gap-2">
                <button
                  onClick={() => { setShowRecoveryModal(false); setRecoverySent(false); }}
                  className="px-4 py-1.5 text-sm font-bold text-[#878a8c] border border-[#878a8c] rounded-full hover:bg-[#f8f9fa]"
                >
                  {recoverySent ? "Close" : "Cancel"}
                </button>
                {!recoverySent && (
                  <button
                    onClick={() => {
                      if (!recoveryEmail) return;
                      setRecoverySent(true);
                    }}
                    disabled={!recoveryEmail}
                    className="btn-primary text-sm disabled:opacity-50"
                  >
                    Send Recovery Link
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
