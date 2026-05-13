"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { fetchWithLoadBalancer } from "@/utils/backendProxy";

export default function FeedbackPopup() {
  const { userData, customDisplayName } = useApp();
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    if (localStorage.getItem("ratiod_feedback_seen")) return;
    if (!localStorage.getItem("ratio_data")) return;
    const t = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    localStorage.setItem("ratiod_feedback_seen", "true");
    setVisible(false);
  };

  const submit = async () => {
    if (!rating || status === "sending") return;
    setStatus("sending");
    const name = customDisplayName || userData?.profile?.name || "anon";
    try {
      const res = await fetchWithLoadBalancer("/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [{
            title: "feedback drop",
            description: message.trim() || "no message",
            color: 0x85a818,
            fields: [
              { name: "rating", value: `${"★".repeat(rating)}${"☆".repeat(5 - rating)} ${rating}/5`, inline: true },
              { name: "from", value: name, inline: true },
            ],
            footer: { text: `ratio'd · ${new Date().toLocaleString("en-IN")}` },
          }],
        }),
      });
      if (res.ok) {
        setStatus("sent");
        localStorage.setItem("ratiod_feedback_seen", "true");
        const count = parseInt(localStorage.getItem("ratiod_feedback_count") || "0");
        localStorage.setItem("ratiod_feedback_count", String(count + 1));
        setTimeout(() => setVisible(false), 2200);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
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
            {status === "sent" ? (
              <div className="p-7 flex flex-col gap-2">
                <span
                  className="text-[2.2rem] font-black tracking-tighter lowercase leading-none"
                  style={{ fontFamily: "var(--font-montserrat)" }}
                >
                  dropped.
                </span>
                <p className="text-[11px] text-theme-muted" style={{ fontFamily: "var(--font-afacad)" }}>
                  we got it. thanks gng.
                </p>
              </div>
            ) : (
              <div className="p-7 space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3
                      className="text-[1.3rem] font-black tracking-tighter lowercase leading-tight"
                      style={{ fontFamily: "var(--font-montserrat)" }}
                    >
                      give sum feedback gng
                    </h3>
                    <p className="text-[10px] text-theme-muted mt-0.5" style={{ fontFamily: "var(--font-afacad)" }}>
                      we'll grab your name with this
                    </p>
                  </div>
                  <button
                    onClick={dismiss}
                    className="p-1.5 rounded-xl text-theme-muted hover:text-theme-text hover:bg-theme-text/10 transition-all shrink-0 -mr-1 -mt-1"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="flex gap-0.5" onMouseLeave={() => setHover(0)}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onMouseEnter={() => setHover(s)}
                      onClick={() => setRating(s)}
                      className="p-1 transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        size={24}
                        strokeWidth={1.5}
                        style={{
                          color: s <= (hover || rating) ? "var(--theme-highlight)" : "var(--theme-border)",
                          fill: s <= (hover || rating) ? "var(--theme-highlight)" : "transparent",
                          transition: "color 0.12s, fill 0.12s",
                        }}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  placeholder="show some love or roast us"
                  className="w-full bg-theme-bg/60 border border-theme-border rounded-xl px-3.5 py-2.5 text-[12px] focus:outline-none focus:border-theme-text/40 transition-colors resize-none"
                  style={{ fontFamily: "var(--font-afacad)" }}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />

                {status === "error" && (
                  <p className="text-[10px] text-theme-secondary" style={{ fontFamily: "var(--font-afacad)" }}>
                    something went cooked. try again.
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={submit}
                    disabled={!rating || status === "sending"}
                    className="flex-[2] py-2.5 rounded-xl bg-theme-emphasis text-theme-bg font-black text-[10px] uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {status === "sending" ? "dropping..." : "drop it"}
                  </button>
                  <button
                    onClick={dismiss}
                    className="flex-1 py-2.5 rounded-xl bg-theme-text/5 border border-theme-border text-theme-muted font-black text-[10px] uppercase tracking-widest hover:bg-theme-text/10 transition-all"
                  >
                    skip
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
