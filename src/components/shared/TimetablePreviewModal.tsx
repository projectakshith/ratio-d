"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share2, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import ExportTimetable from "@/components/desktop/timetable/ExportTimetable";

interface TimetablePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const base64ToBlob = (base64DataUrl: string, contentType = 'image/png') => {
  const parts = base64DataUrl.split(',');
  const byteCharacters = atob(parts[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
};

export default function TimetablePreviewModal({ isOpen, onClose }: TimetablePreviewModalProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setImageUrl(null);
      setIsGenerating(true);
      return;
    }

    let isSubscribed = true;

    const captureCard = async () => {
      setIsGenerating(true);
      await new Promise(r => setTimeout(r, 600));
      if (!containerRef.current || !isSubscribed) return;

      try {
        await toPng(containerRef.current, { cacheBust: true, pixelRatio: 1 });
        
        const dataUrl = await toPng(containerRef.current, {
          cacheBust: true,
          backgroundColor: 'var(--theme-bg)',
          pixelRatio: 3,
        });

        if (isSubscribed) {
          setImageUrl(dataUrl);
          setIsGenerating(false);
        }
      } catch (err) {
        console.error("Failed to generate timetable image preview", err);
        if (isSubscribed) setIsGenerating(false);
      }
    };

    captureCard();

    return () => {
      isSubscribed = false;
    };
  }, [isOpen]);

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.download = `ratio-d-timetable-${Date.now()}.png`;
    link.href = imageUrl;
    link.click();
  };

  const handleShare = async () => {
    if (!imageUrl) return;
    if (navigator.share) {
      try {
        const blob = base64ToBlob(imageUrl);
        const file = new File([blob], `ratio-d-timetable-${Date.now()}.png`, { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "My Timetable",
          });
          return;
        }
      } catch (err) {
        console.error("Share failed", err);
      }
    }
    handleDownload();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1001]"
            onClick={onClose}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[1002] p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-xl bg-theme-bg border border-theme-border rounded-[32px] overflow-hidden shadow-2xl pointer-events-auto flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-theme-border flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-lg font-black tracking-tighter text-theme-text" style={{ fontFamily: 'var(--font-montserrat)' }}>
                    timetable preview
                  </span>
                  <span className="text-xs font-bold text-theme-muted" style={{ fontFamily: 'var(--font-afacad)' }}>
                    your weekly grind, perfectly captured.
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-theme-surface text-theme-muted hover:text-theme-text transition-colors border border-theme-border"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 flex-1 flex flex-col items-center justify-center overflow-auto min-h-[260px] bg-theme-surface/30">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-12">
                    <Loader2 size={32} className="animate-spin text-theme-emphasis" />
                    <span className="text-xs font-bold text-theme-muted uppercase tracking-widest" style={{ fontFamily: 'var(--font-montserrat)' }}>
                      generating high-res preview...
                    </span>
                  </div>
                ) : imageUrl ? (
                  <div className="w-full flex items-center justify-center rounded-2xl overflow-hidden border border-theme-border shadow-md">
                    <img 
                      src={imageUrl} 
                      alt="Timetable Preview" 
                      className="w-full h-auto object-contain max-h-[60vh] rounded-2xl" 
                    />
                  </div>
                ) : (
                  <span className="text-sm font-bold text-red-400">Failed to render preview.</span>
                )}
              </div>

              <div className="p-3 border-t border-theme-border flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={isGenerating || !imageUrl}
                  className="flex-1 py-3 rounded-xl bg-theme-emphasis text-theme-bg font-black uppercase tracking-widest text-[11px] transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-md"
                  style={{ fontFamily: 'var(--font-montserrat)' }}
                >
                  <Download size={14} />
                  download
                </button>
                <button
                  onClick={handleShare}
                  disabled={isGenerating || !imageUrl}
                  className="flex-1 py-3 rounded-xl bg-theme-surface border border-theme-border text-theme-text font-black uppercase tracking-widest text-[11px] transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-sm hover:bg-theme-surface/80"
                  style={{ fontFamily: 'var(--font-montserrat)' }}
                >
                  <Share2 size={14} />
                  share
                </button>
              </div>
            </motion.div>
          </div>

          {/* Off-screen container positioned behind viewport but fully opaque for html-to-image */}
          <div 
            ref={containerRef}
            className="fixed top-0 left-0 -z-50 pointer-events-none opacity-100 w-[1200px] h-[800px] overflow-hidden bg-theme-bg"
            style={{ WebkitTextSizeAdjust: 'none' }}
          >
            <ExportTimetable />
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
