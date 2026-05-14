"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const WhatsappIcon = ({ size = 22 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default function CommunityPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("ratiod_community_seen")) return;
    if (!localStorage.getItem("ratio_data")) return;
    if (!localStorage.getItem("ratiod_feedback_seen")) return;
    const t = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    localStorage.setItem("ratiod_community_seen", "true");
    setVisible(false);
  };

  const join = () => {
    localStorage.setItem("ratiod_community_seen", "true");
    window.open("https://chat.whatsapp.com/D7wymoQ1zrQKqf4Qs4gw91", "_blank");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
          onClick={dismiss}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[360px] rounded-[24px] border border-theme-border shadow-2xl overflow-hidden"
            style={{ backgroundColor: "var(--theme-bg)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-7 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "#25D36615", color: "#25D366" }}
                  >
                    <WhatsappIcon size={20} />
                  </div>
                  <div>
                    <h3
                      className="text-[1.3rem] font-black tracking-tighter lowercase leading-tight"
                      style={{ fontFamily: "var(--font-montserrat)" }}
                    >
                      join the gng
                    </h3>
                    <p className="text-[10px] text-theme-muted mt-0.5" style={{ fontFamily: "var(--font-afacad)" }}>
                      fun · studies · feature drops · bug reports
                    </p>
                  </div>
                </div>
                <button
                  onClick={dismiss}
                  className="p-1.5 rounded-xl text-theme-muted hover:text-theme-text hover:bg-theme-text/10 transition-all shrink-0 -mr-1 -mt-1"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="flex flex-col gap-1 text-[13px] text-theme-muted leading-snug text-center" style={{ fontFamily: "var(--font-afacad)" }}>
                <p>ratio'd has a chill community with really cool ppl.</p>
                <p>drop feedback, suggest features, report bugs, or just connect with ppl.</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={join}
                  className="flex-[2] py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all"
                  style={{ backgroundColor: "#25D366", color: "#fff" }}
                >
                  join
                </button>
                <button
                  onClick={dismiss}
                  className="flex-1 py-2.5 rounded-xl bg-theme-text/5 border border-theme-border text-theme-muted font-black text-[10px] uppercase tracking-widest hover:bg-theme-text/10 transition-all"
                >
                  skip
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
