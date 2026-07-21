"use client";

import { useState, useEffect, useRef } from "react";

const ART = `               _                            
 ___ ___ _____|_|___ ___    ___ ___ ___ ___ 
|  _| . |     | |   | . |  |_ -| . | . |   |
|___|___|_|_|_|_|_|_|_  |  |___|___|___|_|_|
                    |___|                   `;

const POOL = "!@#%^&*-+=|;',.?/`~░▒▓█─│┼╬╪╗╔═║";
const ROWS = ART.split("\n");
const ROW_STARTS: number[] = [];
let _acc = 0;
ROWS.forEach((r) => { ROW_STARTS.push(_acc); _acc += r.length; });

interface P {
  ch: string; disp: string;
  x: number; y: number;
  vx: number; vy: number;
  rot: number; rotV: number;
  settled: boolean;
}

function FallLogo() {
  const [mode, setMode] = useState<"idle" | "falling">("idle");
  const spanRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef(0);
  const parts = useRef<P[]>([]);
  const frame = useRef(0);
  const fontSize = useRef(13);

  useEffect(() => {
    fontSize.current = Math.min(15, Math.max(8, window.innerWidth * 0.015));
  }, []);

  function launch() {
    if (mode !== "idle") return;
    const ps: P[] = [];
    spanRefs.current.forEach((el) => {
      if (!el) return;
      const ch = el.dataset.ch ?? "";
      if (ch === " ") return;
      const r = el.getBoundingClientRect();
      ps.push({
        ch, disp: ch,
        x: r.left + r.width / 2,
        y: r.top + r.height / 2,
        vx: (Math.random() - 0.5) * 8,
        vy: -(Math.random() * 4 + 1),
        rot: 0,
        rotV: (Math.random() - 0.5) * 20,
        settled: false,
      });
    });
    parts.current = ps;
    frame.current = 0;
    setMode("falling");
  }

  useEffect(() => {
    if (mode !== "falling") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d")!;
    const fs = fontSize.current;
    const FLOOR = window.innerHeight - 20;

    function tick() {
      frame.current++;
      const f = frame.current;
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      let anyActive = false;

      parts.current = parts.current.map((p) => {
        if (p.settled) {
          ctx.save();
          ctx.font = `${fs}px "Courier New", monospace`;
          ctx.fillStyle = "#c87533";
          ctx.shadowColor = "rgba(200,117,51,0.6)";
          ctx.shadowBlur = 8;
          ctx.fillText(p.ch, p.x, p.y);
          ctx.restore();
          return p;
        }

        let { x, y, vx, vy, rot, rotV } = p;
        vy += 0.6;
        x += vx; y += vy; rot += rotV;

        const disp = f % 3 === 0
          ? POOL[Math.floor(Math.random() * POOL.length)]
          : p.disp;

        let settled = false;
        if (y >= FLOOR) {
          y = FLOOR;
          vy = -vy * 0.38;
          vx *= 0.78;
          rotV *= 0.75;
          if (Math.abs(vy) < 1.5 && Math.abs(vx) < 0.5) {
            settled = true;
            vx = 0; vy = 0; rotV = 0;
          }
        } else {
          anyActive = true;
        }

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((rot * Math.PI) / 180);
        ctx.font = `${fs}px "Courier New", monospace`;
        ctx.fillStyle = "#c87533";
        ctx.shadowColor = "rgba(200,117,51,0.9)";
        ctx.shadowBlur = settled ? 8 : 16;
        ctx.fillText(settled ? p.ch : disp, 0, 0);
        ctx.restore();

        return { ...p, x, y, vx, vy, rot, rotV, disp, settled };
      });

      if (anyActive || f < 30) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [mode]);

  function reset() {
    cancelAnimationFrame(rafRef.current);
    parts.current = [];
    setMode("idle");
  }

  return (
    <>
      <div
        onMouseEnter={launch}
        style={{
          display: "inline-block",
          cursor: "default",
          visibility: mode === "idle" ? "visible" : "hidden",
        }}
      >
        {ROWS.map((row, ri) => (
          <div key={ri} style={{ display: "block", lineHeight: 1.3, whiteSpace: "pre" }}>
            {row.split("").map((ch, ci) => (
              <span
                key={ci}
                data-ch={ch}
                ref={(el) => { spanRefs.current[ROW_STARTS[ri] + ci] = el; }}
                style={{
                  display: "inline",
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: "clamp(8px, 1.5vw, 15px)",
                  color: "#c87533",
                  textShadow: "0 0 8px rgba(200,117,51,0.5)",
                }}
              >
                {ch}
              </span>
            ))}
          </div>
        ))}
      </div>

      {mode === "falling" && (
        <canvas
          ref={canvasRef}
          onClick={reset}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            cursor: "pointer",
            pointerEvents: "all",
          }}
        />
      )}
    </>
  );
}

export default function Demo() {
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
        textAlign: "center",
      }}
    >
      <div style={{ marginBottom: "2.5rem" }}>
        <FallLogo />
      </div>

      <p style={{ color: "rgba(237,237,237,0.35)", fontSize: "0.82rem", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
        the demo is still being built.
      </p>
      <p style={{ color: "rgba(237,237,237,0.18)", fontSize: "0.72rem", letterSpacing: "0.04em", marginBottom: "3rem", fontStyle: "italic" }}>
        $ git log --oneline demo &nbsp;# nothing here yet. check back later.
      </p>

      <a
        href="/"
        style={{
          color: "rgba(200,117,51,0.55)",
          textDecoration: "none",
          fontSize: "0.8rem",
          letterSpacing: "0.07em",
          transition: "color 0.2s",
          border: "1px solid rgba(200,117,51,0.2)",
          padding: "0.6rem 1.2rem",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#c87533")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(200,117,51,0.55)")}
      >
        ← back
      </a>
    </div>
  );
}
