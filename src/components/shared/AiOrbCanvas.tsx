"use client";
import React, { useEffect, useRef } from "react";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

interface AiOrbCanvasProps {
  state?: OrbState;
  size?: number;
  className?: string;
  onClick?: () => void;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
  baseRadius: number;
  phase: number;
  speed: number;
}

export default function AiOrbCanvas({
  state = "idle",
  size = 280,
  className = "",
  onClick,
}: AiOrbCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const numPoints = 480;
    const sphereRadius = size * 0.36;
    const points: Point3D[] = [];

    // Distribute points on sphere using Fibonacci spiral
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
    for (let i = 0; i < numPoints; i++) {
      const y = 1 - (i / (numPoints - 1)) * 2; // -1 to 1
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      points.push({
        x: x * sphereRadius,
        y: y * sphereRadius,
        z: z * sphereRadius,
        baseRadius: sphereRadius,
        phase: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.03,
      });
    }

    let angleX = 0;
    let angleY = 0;
    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, size, size);

      const centerX = size / 2;
      const centerY = size / 2;

      // Adjust rotation speed depending on state
      const rotSpeedY = state === "thinking" ? 0.04 : state === "speaking" ? 0.025 : 0.012;
      const rotSpeedX = state === "thinking" ? 0.025 : 0.008;

      angleY += rotSpeedY;
      angleX += rotSpeedX;

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      // Pulse multiplier based on state
      let pulse = 1;
      if (state === "listening") {
        pulse = 1 + 0.12 * Math.sin(time * 5) + 0.05 * Math.sin(time * 11);
      } else if (state === "speaking") {
        pulse = 1 + 0.16 * Math.sin(time * 6) + 0.08 * Math.cos(time * 9);
      } else if (state === "thinking") {
        pulse = 1 + 0.08 * Math.sin(time * 10);
      } else {
        pulse = 1 + 0.04 * Math.sin(time * 2);
      }

      // Draw subtle inner core glow
      const coreGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        sphereRadius * 0.9 * pulse
      );
      if (state === "listening") {
        coreGradient.addColorStop(0, "rgba(206, 255, 28, 0.35)");
        coreGradient.addColorStop(0.5, "rgba(52, 211, 153, 0.15)");
        coreGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else if (state === "speaking") {
        coreGradient.addColorStop(0, "rgba(56, 189, 248, 0.4)");
        coreGradient.addColorStop(0.6, "rgba(206, 255, 28, 0.2)");
        coreGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else if (state === "thinking") {
        coreGradient.addColorStop(0, "rgba(168, 85, 247, 0.4)");
        coreGradient.addColorStop(0.6, "rgba(206, 255, 28, 0.2)");
        coreGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else {
        coreGradient.addColorStop(0, "rgba(206, 255, 28, 0.2)");
        coreGradient.addColorStop(0.7, "rgba(206, 255, 28, 0.05)");
        coreGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      }

      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, sphereRadius * 0.9 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Outer animated dashed orbital ring
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-angleY * 0.6);
      ctx.strokeStyle =
        state === "listening"
          ? "rgba(206, 255, 28, 0.45)"
          : state === "speaking"
          ? "rgba(56, 189, 248, 0.5)"
          : "rgba(206, 255, 28, 0.25)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.ellipse(0, 0, sphereRadius * 1.35 * pulse, sphereRadius * 0.5 * pulse, 0.4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Second inclined dashed orbital ring
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angleY * 0.8 + Math.PI / 4);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 7]);
      ctx.beginPath();
      ctx.ellipse(0, 0, sphereRadius * 1.25 * pulse, sphereRadius * 0.4 * pulse, -0.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Project & sort points by Z depth so front dots draw on top of back dots
      interface ProjectedPoint {
        x: number;
        y: number;
        z: number;
        dotRadius: number;
        alpha: number;
      }

      const projected: ProjectedPoint[] = [];
      const fov = 350;

      for (let i = 0; i < points.length; i++) {
        const p = points[i];

        // Wave distortion per point
        let displacement = 0;
        if (state === "speaking") {
          displacement = Math.sin(p.phase + time * 6) * 12;
        } else if (state === "listening") {
          displacement = Math.sin(p.phase + time * 4) * 8;
        } else if (state === "thinking") {
          displacement = Math.cos(p.phase + time * 8) * 10;
        } else {
          displacement = Math.sin(p.phase + time * 2) * 3;
        }

        const currentRadius = (p.baseRadius + displacement) * pulse;

        // Normalize initial position to current radius
        const norm = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z) || 1;
        const px = (p.x / norm) * currentRadius;
        const py = (p.y / norm) * currentRadius;
        const pz = (p.z / norm) * currentRadius;

        // 3D rotation
        // Rotate around Y
        const x1 = px * cosY - pz * sinY;
        const z1 = px * sinY + pz * cosY;

        // Rotate around X
        const y2 = py * cosX - z1 * sinX;
        const z2 = py * sinX + z1 * cosX;

        // Perspective
        const scale = fov / (fov + z2);
        const projX = centerX + x1 * scale;
        const projY = centerY + y2 * scale;

        // Depth-based sizing & opacity
        const depthFactor = (z2 + sphereRadius) / (sphereRadius * 2); // 0 (back) to 1 (front)
        const dotRadius = Math.max(0.7, 1.2 * scale * (0.8 + depthFactor * 0.9));
        const alpha = Math.min(1, Math.max(0.15, 0.25 + depthFactor * 0.75));

        projected.push({
          x: projX,
          y: projY,
          z: z2,
          dotRadius,
          alpha,
        });
      }

      // Sort points back to front
      projected.sort((a, b) => a.z - b.z);

      // Render dots
      for (let i = 0; i < projected.length; i++) {
        const pt = projected[i];

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.dotRadius, 0, Math.PI * 2);

        // Color palette based on state
        if (state === "listening") {
          ctx.fillStyle = `rgba(206, 255, 28, ${pt.alpha})`;
        } else if (state === "speaking") {
          ctx.fillStyle = `rgba(56, 189, 248, ${pt.alpha})`;
        } else if (state === "thinking") {
          ctx.fillStyle = `rgba(192, 132, 252, ${pt.alpha})`;
        } else {
          // Idle lime/white
          if (pt.alpha > 0.6) {
            ctx.fillStyle = `rgba(206, 255, 28, ${pt.alpha})`;
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${pt.alpha * 0.7})`;
          }
        }

        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [state, size]);

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center justify-center cursor-pointer select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="transition-transform duration-300 active:scale-95"
      />
    </div>
  );
}
