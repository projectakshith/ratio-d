"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertCircle, Eye, EyeOff, RefreshCw, Zap } from "lucide-react";
import { EncryptionUtils } from "@/utils/shared/Encryption";
import { fetchWithLoadBalancer } from "@/utils/backendProxy";
import { useApp } from "@/context/AppContext";

const PORTAL_MESSAGES = [
  "academia's being dramatic, logging into the portal instead",
  "student portal has the real answers, hold on",
  "portal > academia, obviously",
  "bypassing the dino, going straight to the source",
  "academia down? second entry unlocked.",
];

interface PortalLoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  captchaOnly?: boolean;
}

export default function PortalLoginModal({ open, onClose, onSuccess, captchaOnly = false }: PortalLoginModalProps) {
  const { userData, setUserData } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const [captchaImage, setCaptchaImage] = useState<string | null>(null);
  const [cdigest, setCdigest] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);
  const [loadingOcr, setLoadingOcr] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);
  const [ocrExhausted, setOcrExhausted] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setCaptcha("");
    setPassword("");
    setOcrStatus(null);
    setOcrExhausted(false);
    const texts = PORTAL_MESSAGES;
    setMessage(texts[Math.floor(Math.random() * texts.length)]);
    (async () => {
      const portalCreds = await EncryptionUtils.loadDecrypted("portal_credentials") as any;
      const acadCreds = await EncryptionUtils.loadDecrypted("ratio_credentials") as any;
      if (portalCreds?.username) {
        setUsername(portalCreds.username.replace(/@srmist\.edu\.in$/i, ""));
        if (portalCreds?.password) setPassword(portalCreds.password);
      } else if (acadCreds?.username) {
        setUsername(acadCreds.username.replace(/@srmist\.edu\.in$/i, ""));
      }
      fetchCaptcha();
    })();
  }, [open]);

  const fetchCaptcha = async () => {
    setLoadingCaptcha(true);
    setError("");
    setOcrStatus(null);
    try {
      const res = await fetchWithLoadBalancer("/portal/captcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.detail || "couldn't fetch captcha");
        return;
      }
      const data = await res.json();
      setCaptchaImage(data.captcha_image);
      setCdigest(data.session);
      setCaptcha("");
    } catch (err: any) {
      setError(err.message || "portal unreachable right now");
    } finally {
      setLoadingCaptcha(false);
    }
  };

  /** Test and debug TinyOCR model prediction directly on current captcha */
  const solveWithOcr = async () => {
    if (!captchaImage) return;
    setLoadingOcr(true);
    setOcrStatus("running tinyocr...");
    setError("");
    try {
      const res = await fetchWithLoadBalancer("/captcha/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: captchaImage }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.text) {
        setCaptcha(data.text);
        setOcrStatus(`predicted: "${data.text}"`);
      } else {
        const errMsg = data.error || data.detail || "OCR prediction failed";
        setOcrStatus("ocr failed");
        setError(`OCR: ${errMsg}`);
      }
    } catch (err: any) {
      setOcrStatus("ocr failed");
      setError(err.message || "Failed to reach TinyOCR solver");
    } finally {
      setLoadingOcr(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !cdigest) return;
    if ((isCaptchaView || ocrExhausted) && !captcha) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetchWithLoadBalancer("/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          captcha: captcha || undefined,
          cdigest,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOcrExhausted(true);
        if (typeof data.detail === "object" && data.detail !== null) {
          setError(data.detail.message || "invalid credentials");
        } else {
          setError(data.detail || "login failed");
        }
        await fetchCaptcha();
        return;
      }
      if (data.cookies) {
        await EncryptionUtils.saveEncrypted("portal_cookies", data.cookies);
        await EncryptionUtils.saveEncrypted("portal_credentials", { username, password });
        delete data.cookies;
      }
      if (data.attendance?.length) {
        const next = userData
          ? { ...userData, attendance: data.attendance, isPortal: true }
          : { attendance: data.attendance, isPortal: true };
        if (data.monthly) (next as any).monthly = data.monthly;
        (next as any).isPortal = true;
        setUserData({ ...next } as any);
        localStorage.setItem("ratio_data", JSON.stringify(next));
        window.dispatchEvent(new Event("storage"));
      }
      onSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message || "something broke, try again");
      await fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const isCaptchaView = captchaOnly && username && password;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md max-h-[90vh] overflow-y-auto no-scrollbar relative bg-theme-card border border-theme-border rounded-[32px] p-6 shadow-2xl"
          >
            <div className="absolute top-6 right-6 z-10">
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full border border-theme-border flex items-center justify-center text-theme-muted hover:text-theme-text hover:bg-theme-surface transition-all active:scale-95"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-6 mt-1">
              <div>
                <h2 className="text-xl font-black lowercase tracking-tight text-theme-text" style={{ fontFamily: "var(--font-montserrat)" }}>
                  student portal
                </h2>
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-theme-muted mt-0.5" style={{ fontFamily: "var(--font-afacad)" }}>
                  {isCaptchaView ? "session expired • enter captcha" : "backup source authentication"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {!isCaptchaView ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted pl-1" style={{ fontFamily: "var(--font-montserrat)" }}>
                      NetID / Register No
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-theme-surface border border-theme-border rounded-2xl px-4 py-3.5 text-sm text-theme-text outline-none focus:border-theme-text transition-all placeholder:text-theme-muted/40"
                      style={{ fontFamily: "var(--font-afacad)" }}
                      placeholder="ab1234 or RA211100..."
                      autoComplete="username"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted pl-1" style={{ fontFamily: "var(--font-montserrat)" }}>
                      password (student portal)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-theme-surface border border-theme-border rounded-2xl px-4 py-3.5 pr-11 text-sm text-theme-text outline-none focus:border-theme-text transition-all placeholder:text-theme-muted/40"
                        style={{ fontFamily: "var(--font-afacad)" }}
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-text transition-colors p-1"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between px-4 py-3 bg-theme-surface border border-theme-border rounded-2xl">
                  <span className="text-xs font-mono text-theme-muted">
                    user: <strong className="text-theme-text font-bold">{username}</strong>
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-theme-text px-2.5 py-0.5 rounded-full bg-theme-surface border border-theme-border">
                    creds saved
                  </span>
                </div>
              )}

              {(isCaptchaView || ocrExhausted) && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between pl-1">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted" style={{ fontFamily: "var(--font-montserrat)" }}>
                      captcha verification
                    </label>
                    {ocrStatus && (
                      <span className="text-[9px] font-mono text-theme-highlight">
                        {ocrStatus}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={captcha}
                      onChange={(e) => setCaptcha(e.target.value)}
                      className="flex-1 min-w-0 bg-theme-surface border border-theme-border rounded-2xl px-3.5 py-3.5 text-sm text-theme-text outline-none focus:border-theme-text transition-all tracking-widest font-mono placeholder:normal-case placeholder:font-sans placeholder:tracking-normal placeholder:text-theme-muted/40"
                      style={{ fontFamily: "var(--font-afacad)" }}
                      placeholder="type captcha"
                      maxLength={8}
                      autoComplete="off"
                    />
                    <div className="w-[125px] h-[52px] shrink-0 rounded-2xl overflow-hidden bg-white flex items-center justify-center relative border border-theme-border shadow-inner">
                      {loadingCaptcha ? (
                        <Loader2 size={16} className="animate-spin text-neutral-500" />
                      ) : captchaImage ? (
                        <img src={captchaImage} alt="captcha" className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="text-[8px] font-bold uppercase tracking-widest text-neutral-400" style={{ fontFamily: "var(--font-montserrat)" }}>loading</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={fetchCaptcha}
                      title="refresh captcha"
                      className="w-10 h-[52px] shrink-0 rounded-2xl bg-theme-surface border border-theme-border flex items-center justify-center text-theme-muted hover:text-theme-text hover:bg-theme-card active:scale-95 transition-all"
                    >
                      <RefreshCw size={14} className={loadingCaptcha ? "animate-spin" : ""} />
                    </button>
                    <button
                      type="button"
                      onClick={solveWithOcr}
                      disabled={loadingCaptcha || loadingOcr || !captchaImage}
                      title="solve with tinyocr"
                      className="h-[52px] px-3 shrink-0 rounded-2xl bg-theme-surface border border-theme-border flex items-center justify-center gap-1 text-theme-highlight hover:bg-theme-card hover:border-theme-highlight active:scale-95 transition-all disabled:opacity-40"
                    >
                      {loadingOcr ? (
                        <Loader2 size={13} className="animate-spin text-theme-highlight" />
                      ) : (
                        <Zap size={13} className="text-theme-highlight fill-theme-highlight/20" />
                      )}
                      <span className="text-[9px] font-black uppercase tracking-wider hidden sm:inline" style={{ fontFamily: "var(--font-montserrat)" }}>
                        ocr
                      </span>
                    </button>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-[#FF4D4D] text-[11px] font-bold lowercase px-1"
                    style={{ fontFamily: "var(--font-afacad)" }}
                  >
                    <AlertCircle size={14} className="shrink-0" /> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading || loadingCaptcha || !username || !password || ((isCaptchaView || ocrExhausted) && !captcha)}
                className="w-full py-4 mt-2 rounded-2xl bg-theme-highlight text-black font-black uppercase tracking-[0.2em] text-xs hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-30 flex items-center justify-center gap-2.5 shadow-xl shadow-theme-highlight/20"
                style={{ fontFamily: "var(--font-montserrat)" }}
              >
                {loading ? <Loader2 size={16} className="animate-spin text-black" /> : null}
                {loading ? "verifying..." : "login to portal"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}