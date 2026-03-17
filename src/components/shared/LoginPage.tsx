"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { EncryptionUtils } from "@/utils/shared/Encryption";

interface LoginPageProps {
  onLogin: (data: any) => void;
}

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

      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: fullUsername,
          password: password,
          cookies: savedCookies,
        }),
      });

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
    <div className="h-screen w-full flex flex-col justify-between p-8 md:p-16 relative bg-[#0c30ff]">
      <header className="relative z-10">
        <h1
          className="text-5xl md:text-8xl lowercase leading-none tracking-tighter"
          style={{ fontFamily: "Urbanosta", color: "#ceff1c" }}
        >
          ratio'd
        </h1>
      </header>

      <main className="relative z-10 w-full max-w-2xl mt-auto pb-12">
        <form onSubmit={handleSubmit} className="flex flex-col gap-10">
          <div className="group relative">
            <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/60">
              Identification (NetID)
            </label>
            <div className="relative flex items-center border-b-2 border-white focus-within:border-[#ceff1c] transition-colors">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-transparent py-4 text-4xl md:text-6xl text-white outline-none placeholder:text-white/10"
                placeholder="username"
                style={{ fontFamily: "Aonic", color: 'white' }}
              />
              {!username.includes("@") && username.length > 0 && (
                <span
                  className="text-2xl md:text-4xl text-white/30 lowercase pointer-events-none pr-2 select-none"
                  style={{ fontFamily: "Aonic" }}
                >
                  @srmist.edu.in
                </span>
              )}
            </div>
          </div>

          <div className="group relative">
            <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/60">
              Passkey
            </label>
            <div className="relative flex items-center border-b-2 border-white focus-within:border-[#ceff1c] transition-colors">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent py-4 text-4xl md:text-6xl text-white outline-none placeholder:text-white/10"
                placeholder="••••••••"
                style={{ fontFamily: "Aonic", color: 'white' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-white/40 hover:text-[#ceff1c] pr-2"
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
            className="w-full flex items-center justify-between border-t border-white pt-6 group disabled:opacity-30"
          >
            <span
              className="text-4xl md:text-6xl lowercase text-white group-hover:text-[#ceff1c]"
              style={{ fontFamily: "aonic" }}
            >
              {loading ? "WAIT_" : "signin"}
            </span>
            {loading ? (
              <Loader2 className="animate-spin text-white" size={40} />
            ) : (
              <ArrowRight
                size={48}
                className="text-white group-hover:text-[#ceff1c] group-hover:translate-x-4 transition-all"
              />
            )}
          </button>
        </form>
      </main>
    </div>
  );
};

export default LoginPage;
