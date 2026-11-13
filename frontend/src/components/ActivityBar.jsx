import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Files, Bot, SquareTerminal } from "lucide-react";

function ActivityIcon({ icon: Icon, label, active, onClick, activeColor = "text-[#E8FF3F]" }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={onClick}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg"
      >
        <AnimatePresence>
          {active && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 rounded-lg bg-white/[0.06] ring-1 ring-white/15"
            />
          )}
        </AnimatePresence>

        <Icon
          size={19}
          className={`relative z-10 transition-colors ${
            active ? activeColor : "text-zinc-500 hover:text-[#A78BFA]"
          }`}
        />

        {active && (
          <motion.div
            layoutId="activitybar-indicator"
            className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-gradient-to-b from-[#E8FF3F] to-[#FF9A22]"
            transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
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
            className="pointer-events-none absolute left-11 top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-md border border-[#E8FF3F]/30 bg-black px-2 py-1 font-['DM_Sans',sans-serif] text-[11px] font-semibold text-[#E8FF3F] shadow-lg shadow-black/60"
          >
            {label}
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
  return (
    <div className="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-white/10 bg-black py-3">
      <ActivityIcon
        icon={Files}
        label="Explorer"
        active={showExplorer}
        activeColor="text-[#E8FF3F]"
        onClick={() => setShowExplorer((v) => !v)}
      />

      <ActivityIcon
        icon={Bot}
        label="AI Chat"
        active={showAIChat}
        activeColor="text-[#A78BFA]"
        onClick={() => setShowAIChat((v) => !v)}
      />

      <div className="mt-auto flex flex-col items-center gap-2">
        <div className="mb-1 h-px w-6 bg-white/10" />

        <ActivityIcon
          icon={SquareTerminal}
          label="Terminal"
          active={showBottomPanel}
          activeColor="text-[#FF9A22]"
          onClick={() => setShowBottomPanel((v) => !v)}
        />
      </div>
    </div>
  );
}