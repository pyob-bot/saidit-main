"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [fetching, setFetching] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!user && !loading) {
      router.push("/login");
      return;
    }
    if (!user) return;
    fetchNotifications();
  }, [user, loading, router, fetchNotifications]);

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  if (!user || loading) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "reply":
        return <svg className="w-5 h-5 text-[#0079d3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>;
      case "upvote":
        return <svg className="w-5 h-5 text-[#ff4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>;
      case "mod_action":
        return <svg className="w-5 h-5 text-[#ffd635]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
      default:
        return <svg className="w-5 h-5 text-[#878a8c]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
    }
  };

  return (
    <div className="max-w-[800px] mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[#1a1a1b]">Notifications</h1>
        {notifications.some((n) => !n.isRead) && (
          <button onClick={markAllRead} className="text-sm text-[#0079d3] hover:underline">
            Mark all as read
          </button>
        )}
      </div>

      {fetching ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-[#ccc] rounded-sm p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white border border-[#ccc] rounded-sm p-12 text-center">
          <svg className="w-12 h-12 text-[#878a8c] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <h3 className="text-lg font-medium text-[#1a1a1b] mb-2">No notifications yet</h3>
          <p className="text-sm text-[#878a8c]">When someone interacts with your posts or comments, you&apos;ll see it here.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={n.link || "#"}
              className={`flex items-start gap-3 p-4 border rounded-sm transition-colors ${
                n.isRead
                  ? "bg-white border-[#ccc] hover:border-[#898989]"
                  : "bg-[#f0f7ff] border-[#0079d3]/30 hover:border-[#0079d3]"
              }`}
            >
              <div className="mt-0.5 shrink-0">{getTypeIcon(n.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`text-sm font-medium ${n.isRead ? "text-[#1a1a1b]" : "text-[#1a1a1b] font-bold"}`}>
                    {n.title}
                  </h3>
                  {!n.isRead && <div className="w-2 h-2 bg-[#0079d3] rounded-full shrink-0" />}
                </div>
                <p className="text-sm text-[#878a8c] mt-0.5 whitespace-pre-wrap">{n.message}</p>
                <p className="text-xs text-[#878a8c] mt-1">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
