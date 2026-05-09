"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const ANSI_LOGO = `██████╗  █████╗ ████████╗██╗ ██████╗ ██╗██████╗ 
██╔══██╗██╔══██╗╚══██╔══╝██║██╔═══██╗╚═╝██╔══██╗
██████╔╝███████║   ██║   ██║██║   ██║   ██║  ██║
██╔══██╗██╔══██║   ██║   ██║██║   ██║   ██║  ██║
██║  ██║██║  ██║   ██║   ██║╚██████╔╝   ██████╔╝
╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝    ╚═════╝ `;

const SCRAMBLE_CHARS = "█▓▒░│─┼╬╪╫╩╦╠╝╚╗╔═║▄▀■□▪▫";
const SKIP = new Set([" ", "\n"]);

function ElectricLogo() {
  const original = ANSI_LOGO.split("");
  const [chars, setChars] = useState<string[]>(original);
  const [hovered, setHovered] = useState(false);
  const scrambleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resolveRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAll = useCallback(() => {
    if (scrambleRef.current) clearInterval(scrambleRef.current);
    resolveRef.current.forEach(clearTimeout);
    resolveRef.current = [];
  }, []);

  const runScramble = useCallback(() => {
    clearAll();

    const indices = original
      .map((c, i) => (SKIP.has(c) ? -1 : i))
      .filter((i) => i !== -1);

    scrambleRef.current = setInterval(() => {
      setChars((prev) =>
        prev.map((c, i) => {
          if (SKIP.has(original[i])) return c;
          return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        })
      );
    }, 40);

    const shuffled = [...indices].sort(() => Math.random() - 0.5);
    shuffled.forEach((idx, order) => {
      const t = setTimeout(
        () => {
          setChars((prev) => {
            const next = [...prev];
            next[idx] = original[idx];
            return next;
          });
        },
        420 + (order / shuffled.length) * 600
      );
      resolveRef.current.push(t);
    });

    const stopT = setTimeout(() => {
      if (scrambleRef.current) clearInterval(scrambleRef.current);
    }, 1060);
    resolveRef.current.push(stopT);
  }, [clearAll, original]);

  const handleMouseEnter = () => {
    setHovered(true);
    runScramble();
  };

  const handleMouseLeave = () => {
    setHovered(false);
    clearAll();
    setChars(original);
  };

  useEffect(() => () => clearAll(), [clearAll]);

  return (
    <>
      <style>{`
        @keyframes electric-pulse {
          0%   { text-shadow: 0 0 6px #c87533, 0 0 18px rgba(200,117,51,0.6), 0 0 40px rgba(200,117,51,0.3); }
          25%  { text-shadow: 0 0 10px #fff5e0, 0 0 28px rgba(255,180,60,0.9), 0 0 60px rgba(255,140,0,0.5), 0 0 90px rgba(180,80,0,0.3); }
          50%  { text-shadow: 0 0 4px #c87533, 0 0 14px rgba(200,117,51,0.5), 0 0 35px rgba(200,117,51,0.25); }
          70%  { text-shadow: 0 0 12px #ffe0a0, 0 0 30px rgba(255,200,80,0.95), 0 0 65px rgba(255,160,30,0.6), 0 0 100px rgba(200,100,0,0.3); }
          100% { text-shadow: 0 0 6px #c87533, 0 0 18px rgba(200,117,51,0.6), 0 0 40px rgba(200,117,51,0.3); }
        }
        @keyframes glitch-shift {
          0%   { transform: translate(0, 0) skewX(0deg); }
          10%  { transform: translate(-2px, 0) skewX(-0.5deg); }
          20%  { transform: translate(2px, 0) skewX(0.5deg); }
          30%  { transform: translate(-1px, 1px); }
          40%  { transform: translate(1px, -1px) skewX(0.3deg); }
          50%  { transform: translate(0, 0); }
          60%  { transform: translate(-2px, 0); }
          70%  { transform: translate(2px, 1px) skewX(-0.4deg); }
          80%  { transform: translate(-1px, 0); }
          90%  { transform: translate(1px, 0); }
          100% { transform: translate(0, 0); }
        }
        @keyframes color-arc {
          0%   { color: #c87533; }
          20%  { color: #ffcc66; }
          40%  { color: #fff0c0; }
          55%  { color: #ffaa33; }
          70%  { color: #ffe080; }
          85%  { color: #d98040; }
          100% { color: #c87533; }
        }
        .logo-pre {
          color: #c87533;
          text-shadow:
            0 0 6px rgba(200,117,51,0.55),
            0 0 20px rgba(200,117,51,0.2);
          transition: text-shadow 0.15s ease;
          cursor: default;
          user-select: none;
        }
        .logo-pre.electric {
          animation:
            electric-pulse 0.35s ease-in-out infinite,
            glitch-shift 0.18s steps(1) infinite,
            color-arc 0.4s linear infinite;
        }
      `}</style>

      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ display: "inline-block", cursor: "default" }}
      >
        <pre
          aria-label="ratio'd"
          className={`logo-pre${hovered ? " electric" : ""}`}
          style={{
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: "clamp(6px, 1.4vw, 13px)",
            lineHeight: 1.2,
            margin: 0,
            padding: 0,
            whiteSpace: "pre",
            letterSpacing: "0",
          }}
        >
          {chars.join("")}
        </pre>
      </div>
    </>
  );
}

function CopyIcon({ copied }: { copied: boolean }) {
  if (copied) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c87533" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(237,237,237,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

const CMDS = {
  win: `irm https://cli.getratiod.lol/install.ps1 | iex`,
  unix: `curl -fsSL https://cli.getratiod.lol/install.sh | sh`,
};

export default function Home() {
  const [copied, setCopied] = useState(false);
  const [os, setOs] = useState<"win" | "unix">("unix");

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const plat = (navigator.platform ?? "").toLowerCase();
    if (
      ua.includes("win") ||
      plat.includes("win") ||
      ua.includes("windows")
    ) {
      setOs("win");
    }
  }, []);

  const cmd = CMDS[os];
  const osLabel = os === "win" ? "Windows PowerShell" : "Linux / macOS";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#080808",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1.5rem",
        fontFamily: "'Courier New', Courier, monospace",
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)",
      }}
    >
      <div style={{ marginBottom: "2rem", maxWidth: "100%" }}>
        <ElectricLogo />
      </div>

      <p
        style={{
          color: "rgba(237,237,237,0.45)",
          fontSize: "0.875rem",
          letterSpacing: "0.06em",
          marginBottom: "1.25rem",
          textAlign: "center",
        }}
      >
        academia, straight to the terminal.
      </p>

      <h1
        style={{
          color: "rgba(237,237,237,0.85)",
          fontSize: "clamp(1rem, 2vw, 1.25rem)",
          fontWeight: "normal",
          lineHeight: 1.7,
          textAlign: "center",
          maxWidth: "580px",
          marginBottom: "2.5rem",
          letterSpacing: "0.01em",
        }}
      >
        Attendance, marks, and timetable - all of SRM&apos;s academia portal,
        without opening a browser. Built for students who live in the terminal.
      </h1>

      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          marginBottom: "2.75rem",
        }}
      >
        <p
          style={{
            color: "rgba(200,117,51,0.45)",
            fontSize: "0.65rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "0.4rem",
            textAlign: "left",
          }}
        >
          {osLabel}
        </p>
        <button
          id="install-cmd"
          onClick={handleCopy}
          aria-label="Copy install command"
          style={{
            background: "none",
            border: "1px solid rgba(200,117,51,0.4)",
            padding: "0.9rem 1.4rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            cursor: "pointer",
            width: "100%",
            textAlign: "left",
            transition: "border-color 0.2s, background 0.2s",
            outline: "none",
            fontFamily: "'Courier New', Courier, monospace",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = "#c87533";
            el.style.background = "rgba(200,117,51,0.05)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = "rgba(200,117,51,0.4)";
            el.style.background = "none";
          }}
        >
          <span style={{ color: "rgba(200,117,51,0.55)", fontSize: "0.8rem", userSelect: "none", flexShrink: 0 }}>$</span>
          <span style={{ color: "rgba(237,237,237,0.88)", fontSize: "0.8rem", letterSpacing: "0.02em", flex: 1 }}>
            {cmd}
          </span>
          <span style={{ flexShrink: 0 }}>
            <CopyIcon copied={copied} />
          </span>
        </button>
      </div>

      <nav
        style={{
          display: "flex",
          gap: "2rem",
          marginBottom: "3.5rem",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {[
          { label: "GitHub", href: "https://github.com/projectakshith/ratio-d" },
          { label: "See Demo", href: "/demo" },
          { label: "Discord", href: "https://discord.gg/FxTKs69U65" },
          { label: "Main Page", href: "https://getratiod.lol" },
        ].map(({ label, href }) => (
          <a
            key={label}
            id={`nav-${label.toLowerCase().replace(/\s/g, "-")}`}
            href={href}
            style={{
              color: "rgba(237,237,237,0.5)",
              textDecoration: "none",
              fontSize: "0.875rem",
              letterSpacing: "0.07em",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(237,237,237,0.95)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(237,237,237,0.5)")
            }
          >
            [ {label} ]
          </a>
        ))}
      </nav>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "2rem",
          width: "100%",
          maxWidth: "700px",
          textAlign: "center",
        }}
      >
        {[
          {
            id: "feature-offline",
            title: "OFFLINE-FIRST",
            desc: "Schedule, marks, and attendance cached locally. Works without wifi.",
          },

          {
            id: "feature-terminal",
            title: "FULLY IN TERMINAL",
            desc: "Fully built inside your terminal. Customizable themes, keybinds, and layouts."
          },

          {
            id: "feature-private",
            title: "PRIVATE by DEFAULT",
            desc: "Credentials encrypted device-side. We never see your login. Ever.",
          },

        ].map(({ id, title, desc }) => (
          <div key={id} id={id}>
            <p
              style={{
                color: "#c87533",
                fontSize: "0.68rem",
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                marginBottom: "0.5rem",
              }}
            >
              {title}
            </p>
            <p
              style={{
                color: "rgba(237,237,237,0.38)",
                fontSize: "0.78rem",
                lineHeight: 1.7,
              }}
            >
              {desc}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}
