"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { EncryptionUtils } from "@/utils/shared/Encryption";

interface LoginPageProps {
  onLogin: (data: any) => void;
}

const API_URL = `/api/login`;

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const formatUsername = (val: string) => {
    const cleanVal = val.trim();
    return cleanVal.includes("@") ? cleanVal : `${cleanVal}@srmist.edu.in`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setError("");
    const fullUsername = formatUsername(username);

    try {
      EncryptionUtils.cleanOldKeys();
      const savedCookies = EncryptionUtils.loadDecrypted("academia_cookies");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: fullUsername,
          password: password,
          cookies: savedCookies,
        }),
      });

      const ct = response.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) {
        throw new Error("Unable to reach server. Check your connection or API URL.");
      }
      const data = await response.json();

      if (!response.ok) throw new Error(data.detail || "Login failed");

      if (data.success) {
        if (data.cookies) {
          EncryptionUtils.saveEncrypted("academia_cookies", data.cookies);
          delete data.cookies;
        }

        EncryptionUtils.saveEncrypted("ratio_credentials", {
          username: fullUsername,
          password: password,
        });

        localStorage.setItem("ratio_data", JSON.stringify(data));

        setTimeout(() => {
          onLogin(data);
        }, 800);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col justify-between p-8 md:p-16 relative bg-theme-primary">
      <header className="relative z-10">
        <h1
          className="text-5xl md:text-8xl lowercase leading-none tracking-tighter text-theme-highlight"
          style={{ fontFamily: "Urbanosta" }}
        >
          ratio'd
        </h1>
      </header>

      <main className="relative z-10 w-full max-w-2xl mt-auto pb-12">
        <form onSubmit={handleSubmit} className="flex flex-col gap-10">
          <div className="group relative">
            <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-theme-bg/60">
              Identification (NetID)
            </label>
            <div className="relative flex items-center border-b-2 border-theme-bg focus-within:border-theme-highlight transition-colors">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-transparent py-4 text-4xl md:text-6xl text-theme-bg outline-none placeholder:text-theme-bg/10"
                placeholder="username"
                style={{ fontFamily: "Aonic" }}
              />
              {!username.includes("@") && username.length > 0 && (
                <span
                  className="text-2xl md:text-4xl text-theme-bg/30 lowercase pointer-events-none pr-2 select-none"
                  style={{ fontFamily: "Aonic" }}
                >
                  @srmist.edu.in
                </span>
              )}
            </div>
          </div>

          <div className="group relative">
            <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-theme-bg/60">
              Passkey
            </label>
            <div className="relative flex items-center border-b-2 border-theme-bg focus-within:border-theme-highlight transition-colors">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent py-4 text-4xl md:text-6xl text-theme-bg outline-none placeholder:text-theme-bg/10"
                placeholder="••••••••"
                style={{ fontFamily: "Aonic" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-theme-bg/40 hover:text-theme-highlight pr-2"
              >
                {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-red-400 font-mono text-xs uppercase flex items-center gap-2"
              >
                <AlertCircle size={14} /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-between border-t border-theme-bg pt-6 group disabled:opacity-30"
          >
            <span
              className="text-4xl md:text-6xl lowercase text-theme-bg group-hover:text-theme-highlight"
              style={{ fontFamily: "aonic" }}
            >
              {loading ? "WAIT_" : "signin"}
            </span>
            {loading ? (
              <Loader2 className="animate-spin text-theme-bg" size={40} />
            ) : (
              <ArrowRight
                size={48}
                className="text-theme-bg group-hover:text-theme-highlight group-hover:translate-x-4 transition-all"
              />
            )}
          </button>
        </form>
      </main>
    </div>
  );
};

export default LoginPage;
