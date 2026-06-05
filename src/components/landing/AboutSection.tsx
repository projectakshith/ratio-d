import { motion } from "framer-motion";

const BEZIER = [0.16, 1, 0.3, 1] as const;

interface AboutSectionProps {
  visible: boolean;
}

export default function AboutSection({ visible }: AboutSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ 
        opacity: visible ? 1 : 0,
        y: visible ? 0 : 50,
        pointerEvents: visible ? "auto" : "none"
      }}
      transition={{ duration: 1, delay: visible ? 0.2 : 0, ease: BEZIER }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 pointer-events-none selection:bg-[#ceff1c] selection:text-[#0c30ff]"
    >
      <div className="pointer-events-auto flex flex-col items-center">
        <h1 className="text-4xl md:text-6xl font-bold text-[#ceff1c] lowercase tracking-tight" style={{ fontFamily: "var(--font-afacad)" }}>
          about ratio'd
        </h1>
        <p className="mt-4 text-[#ceff1c]/80 text-lg md:text-xl text-center max-w-2xl lowercase font-mono">
          we are building a cool looking academia wrapper. it's fast, secure, and built for everyone.
        </p>
      </div>
    </motion.div>
  );
}
