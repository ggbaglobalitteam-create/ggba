"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Bell, MessageSquare, Paperclip, Send, UploadCloud } from "lucide-react";

import { Card } from "@/components/portal/Card";
import { Button } from "@/components/portal/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { applicationService } from "@/lib/services/applicationService";
import { documentService } from "@/lib/services/documentService";

type PortalRole = "applicant" | "agent";

type ApplicationListItem = {
  id: string;
  destinationCountry?: string | null;
  purpose?: string | null;
  createdAt?: string;
};

type MessageItem = {
  id: string;
  content: string;
  createdAt: string;
  isRead?: boolean;
  senderUserId?: string | null;
};

type NotificationItem = {
  id: string;
  title: string;
  body?: string | null;
  isRead: boolean;
  createdAt: string;
  applicationId?: string | null;
};

type FeedItem = {
  id: string;
  kind: "message" | "notification";
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ApplicationNotificationsPanel({ role }: { role: PortalRole }) {
  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [draft, setDraft] = useState("");
  const [docLabel, setDocLabel] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadApps() {
      const list = await applicationService.listApplications().catch(() => []);
      const items = Array.isArray(list) ? list : [];
      setApplications(items);
      const currentId = applicationService.getCurrentApplicationId();
      const selected =
        (currentId && items.some((item) => item.id === currentId) ? currentId : null) ||
        items[0]?.id ||
        null;
      setSelectedApplicationId(selected);
      if (selected) applicationService.setCurrentApplicationId(selected);
    }

    void loadApps();
  }, []);

  const currentAppId = selectedApplicationId || applications[0]?.id || null;

  useEffect(() => {
    async function loadFeed() {
      if (!currentAppId) return;
      setLoadError(null);

      const [messageRes, notificationRes] = await Promise.all([
        fetch(`/api/applications/${encodeURIComponent(currentAppId)}/messages`).catch(() => null),
        fetch(`/api/notifications?limit=50`).catch(() => null),
      ]);

      const messageJson = await messageRes?.json().catch(() => ({}));
      const notificationJson = await notificationRes?.json().catch(() => ({}));

      const nextMessages = Array.isArray(messageJson?.items) ? messageJson.items : [];
      const allNotifications = Array.isArray(notificationJson?.items) ? notificationJson.items : [];
      const nextNotifications = allNotifications.filter(
        (item: NotificationItem) => !item?.applicationId || item.applicationId === currentAppId
      );

      setMessages(nextMessages);
      setNotifications(nextNotifications);
    }

    if (!currentAppId) {
      setMessages([]);
      setNotifications([]);
      return;
    }

    void loadFeed();
  }, [currentAppId]);

  useEffect(() => {
    if (!currentAppId) return;

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`${role}-notifications-${currentAppId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Message", filter: `applicationId=eq.${currentAppId}` },
        async () => {
          const res = await fetch(`/api/applications/${encodeURIComponent(currentAppId)}/messages`).catch(() => null);
          const data = await res?.json().catch(() => ({}));
          setMessages(Array.isArray(data?.items) ? data.items : []);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Notification" },
        () => {}
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentAppId, role]);

  const feed = useMemo<FeedItem[]>(() => {
    const messageItems: FeedItem[] = messages.map((item) => ({
      id: `message-${item.id}`,
      kind: "message",
      title: "Conversation",
      message: item.content,
      createdAt: item.createdAt,
      isRead: Boolean(item.isRead),
    }));

    const notificationItems: FeedItem[] = notifications.map((item) => ({
      id: `notification-${item.id}`,
      kind: "notification",
      title: item.title || "Notification",
      message: item.body || item.title || "Notification",
      createdAt: item.createdAt,
      isRead: Boolean(item.isRead),
    }));

    return [...messageItems, ...notificationItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [messages, notifications]);

  const handleSubmit = async () => {
    if (!currentAppId) return;
    const trimmedDraft = draft.trim();
    const trimmedLabel = docLabel.trim();

    if (!trimmedDraft && !selectedFile) return;
    if (selectedFile && !trimmedLabel) {
      alert("Please provide a name for the uploaded document.");
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedDocName = "";
      if (selectedFile) {
        const baseSlug = slugify(trimmedLabel) || "additional-document";
        const docId = `other-${baseSlug}-${Date.now()}`;
        await documentService.uploadDocument(
          docId,
          {
            fileName: selectedFile.name,
            fileSize: selectedFile.size,
            file: selectedFile,
          },
          currentAppId,
          trimmedLabel
        );
        uploadedDocName = trimmedLabel;
      }

      const composedMessage = [trimmedDraft, uploadedDocName ? `Uploaded additional document: ${uploadedDocName}.` : ""]
        .filter(Boolean)
        .join("\n\n");

      if (composedMessage) {
        const res = await fetch(`/api/applications/${encodeURIComponent(currentAppId)}/messages`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content: composedMessage }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || "Failed to send reply");
        }
      }

      setDraft("");
      setDocLabel("");
      setSelectedFile(null);

      const messageRes = await fetch(`/api/applications/${encodeURIComponent(currentAppId)}/messages`).catch(() => null);
      const messageJson = await messageRes?.json().catch(() => ({}));
      setMessages(Array.isArray(messageJson?.items) ? messageJson.items : []);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to send notification reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Notifications</h1>
        <p className="text-gray-500">
          Review system alerts and conversation updates, then reply or upload requested documents from one place.
        </p>
        {applications.length > 1 && (
          <div className="mt-4 max-w-sm">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Select Application</label>
            <select
              value={currentAppId || ""}
              onChange={(e) => {
                const next = e.target.value;
                setSelectedApplicationId(next);
                applicationService.setCurrentApplicationId(next);
              }}
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.destinationCountry || "-"} - {app.purpose || "-"} ({app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "N/A"})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
        <Card className="p-0 border-0 shadow-sm overflow-hidden min-h-[560px] bg-white ring-1 ring-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 bg-[#F6F8FB] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-[#C6A96A] flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 leading-none">Notification Feed</h2>
              <p className="text-xs text-gray-500 mt-1">System alerts and direct conversation updates are merged here.</p>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {feed.map((item) => (
              <div key={item.id} className={`p-5 transition-colors hover:bg-[#F6F8FB] ${item.isRead ? "bg-white" : "bg-amber-50/30"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        item.kind === "notification"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-blue-200 bg-blue-50 text-blue-700"
                      }`}>
                        {item.kind === "notification" ? "Alert" : "Reply"}
                      </span>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed mt-2 whitespace-pre-wrap">{item.message}</p>
                  </div>
                  <span className="text-[11px] text-gray-400 whitespace-nowrap">{new Date(item.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {feed.length === 0 && (
              <div className="p-6 text-sm text-gray-500 font-medium">No notifications yet.</div>
            )}
            {loadError && <div className="p-6 text-sm text-rose-600">{loadError}</div>}
          </div>
        </Card>

        <Card className="p-5 border-0 shadow-sm ring-1 ring-gray-200 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-[#C6A96A]" />
            <h2 className="font-semibold text-gray-900">Reply / Upload</h2>
          </div>
          <div className="space-y-4">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={6}
              placeholder="Reply to the request or add additional information..."
              className="w-full rounded-xl border border-gray-200 bg-[#F6F8FB] px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-[#C6A96A] focus:ring-[3px] focus:ring-[#C6A96A]/20 resize-none"
            />
            <input
              type="text"
              value={docLabel}
              onChange={(e) => setDocLabel(e.target.value)}
              placeholder="Optional document name for Others section"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-[#C6A96A] focus:ring-[3px] focus:ring-[#C6A96A]/20"
            />
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-gray-300 bg-[#F6F8FB] px-4 py-3 text-sm text-gray-600 hover:border-[#C6A96A] hover:bg-amber-50/30">
              <span className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-[#C6A96A]" />
                {selectedFile ? selectedFile.name : "Attach requested document"}
              </span>
              <span className="font-semibold text-[#C6A96A] inline-flex items-center gap-2">
                <UploadCloud className="w-4 h-4" />
                Browse
              </span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </label>
            {selectedFile && (
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-xs font-semibold text-gray-500 hover:text-rose-600"
              >
                Remove attached file
              </button>
            )}
            <Button
              onClick={() => void handleSubmit()}
              isLoading={isSubmitting}
              disabled={!currentAppId || (!draft.trim() && !selectedFile)}
              className="w-full flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send Notification Reply
            </Button>
            <p className="text-xs text-gray-500">
              Uploaded files are saved into the application documents area under <span className="font-semibold">Other Documents</span>.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
