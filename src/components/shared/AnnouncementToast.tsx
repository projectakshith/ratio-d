"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Megaphone, Download } from "lucide-react";

interface AnnouncementFile {
  name: string;
  url: string;
}

interface Announcement {
  id: string | null;
  text: string;
  image_url: string | null;
  files: AnnouncementFile[];
  created_at: string | null;
}

export default function AnnouncementToast() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const envUrls = (process.env.NEXT_PUBLIC_BACKEND_URLS || "").split(",").map(u => u.trim()).filter(Boolean);
        const baseUrl = envUrls[0] || "http://localhost:8000";
        const res = await fetch(`${baseUrl}/api/announcements`);
        if (!res.ok) return;
        const data: Announcement = await res.json();
        if (!data.id) return;

        const lastSeen = localStorage.getItem("ratio_last_announcement_id");
        if (lastSeen !== data.id) {
          setAnnouncement(data);
          setVisible(true);
        }
      } catch (err) {
      }
    };

    fetchAnnouncement();

    const handleFocus = () => {
      fetchAnnouncement();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const handleDismiss = () => {
    if (announcement?.id) {
      localStorage.setItem("ratio_last_announcement_id", announcement.id);
    }
    setVisible(false);
  };

  if (!visible || !announcement) return null;

  return (
    <AnimatePresence>
      {visible && announcement && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10004] pointer-events-auto"
            onClick={handleDismiss}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-[15%] md:left-auto md:right-8 md:top-20 max-w-md w-full mx-auto bg-theme-card border border-theme-border rounded-[32px] p-6 shadow-2xl z-[10005] overflow-hidden pointer-events-auto flex flex-col gap-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Megaphone size={16} className="text-theme-highlight" />
                  <h2
                    className="text-xl font-black lowercase tracking-tight text-theme-text"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    announcement
                  </h2>
                </div>
                <p
                  className="text-[9px] font-bold uppercase tracking-[0.3em] text-theme-muted mt-0.5"
                  style={{ fontFamily: "var(--font-afacad)" }}
                >
                  official update broadcast
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="w-9 h-9 rounded-full border border-theme-border flex items-center justify-center text-theme-muted hover:text-theme-text hover:bg-theme-surface transition-all active:scale-95 shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {announcement.text && (
              <p
                className="text-xs leading-relaxed text-theme-text font-medium whitespace-pre-wrap bg-theme-surface border border-theme-border rounded-2xl p-4"
                style={{ fontFamily: "var(--font-afacad)" }}
              >
                {announcement.text}
              </p>
            )}

            {announcement.image_url && (
              <div className="rounded-2xl overflow-hidden border border-theme-border bg-black/20 max-h-64 flex justify-center">
                <img
                  src={announcement.image_url}
                  alt="Announcement banner"
                  className="object-contain max-h-64 w-full"
                />
              </div>
            )}

            {announcement.files && announcement.files.length > 0 && (
              <div className="flex flex-col gap-2">
                <span
                  className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted pl-1"
                  style={{ fontFamily: "var(--font-montserrat)" }}
                >
                  attached files
                </span>
                {announcement.files.map((file, idx) => (
                  <a
                    key={idx}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-2xl bg-theme-surface border border-theme-border hover:bg-theme-surface/80 transition-all active:scale-[0.99]"
                  >
                    <span className="truncate text-xs font-mono text-theme-text flex items-center gap-2">
                      <Download size={14} className="text-theme-highlight shrink-0" />
                      {file.name}
                    </span>
                    <ExternalLink size={14} className="shrink-0 text-theme-muted ml-2" />
                  </a>
                ))}
              </div>
            )}

            <button
              onClick={handleDismiss}
              className="w-full py-3.5 bg-theme-emphasis text-theme-bg font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform text-[11px] mt-1"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              got it
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
