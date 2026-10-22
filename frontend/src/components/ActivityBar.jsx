import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Files, Bot, SquareTerminal } from "lucide-react";

const TONES = {
  lavender: {
    tile: "bg-brand-lavender text-night",
    idle: "hover:text-brand-lavender",
    bar: "bg-brand-lavender",
  },
  orange: {
    tile: "bg-brand-orange text-night",
    idle: "hover:text-brand-orange",
    bar: "bg-brand-orange",
  },
  green: {
    tile: "bg-brand-green text-night",
    idle: "hover:text-brand-green",
    bar: "bg-brand-green",
  },
};

function ActivityIcon({ icon: Icon, label, active, onClick, tone }) {
  const [hovered, setHovered] = useState(false);
  const colors = TONES[tone];

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.button
        type="button"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.93 }}
        onClick={onClick}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        aria-label={label}
        aria-pressed={active}
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none ${
          active ? colors.tile : `bg-white/[0.04] text-white/50 ${colors.idle}`
        }`}
      >
        <Icon size={19} strokeWidth={active ? 2.4 : 2} />

        {active && (
          <motion.span
            layoutId={`activity-bar-${tone}`}
            className={`absolute -left-[9px] top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full ${colors.bar}`}
            transition={{ type: "spring", duration: 0.3, bounce: 0.15 }}
          />
        )}
      </motion.button>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.12 }}
            className="pointer-events-none absolute left-[52px] top-1/2 z-50 flex -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-lg border border-white/10 bg-black px-2.5 py-1.5 text-[12px] font-semibold text-white shadow-xl shadow-black/60"
          >
            {label}
            <span
              className={`rounded-full px-1.5 py-px text-[10px] font-bold uppercase ${
                active ? `${colors.tile}` : "bg-white/10 text-white/50"
              }`}
            >
              {active ? "on" : "off"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ActivityBar({
  showExplorer,
  setShowExplorer,
  showAIChat,
  setShowAIChat,
  showBottomPanel,
  setShowBottomPanel,
}) {
  const navigate = useNavigate();

  return (
    <div className="flex w-14 shrink-0 flex-col items-center gap-2.5 border-r border-white/10 bg-black py-3">

      <ActivityIcon
        icon={Files}
        label="Explorer"
        tone="lavender"
        active={showExplorer}
        onClick={() => setShowExplorer((v) => !v)}
      />

      <ActivityIcon
        icon={Bot}
        label="AI Chat"
        tone="orange"
        active={showAIChat}
        onClick={() => setShowAIChat((v) => !v)}
      />

      <div className="mt-auto flex flex-col items-center gap-2.5">
        <div className="h-px w-6 bg-white/10" />

        <ActivityIcon
          icon={SquareTerminal}
          label="Terminal"
          tone="green"
          active={showBottomPanel}
          onClick={() => setShowBottomPanel((v) => !v)}
        />
      </div>
    </div>
  );
}