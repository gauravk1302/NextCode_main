import { motion } from "framer-motion";
import { Folder, Star, Zap, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Sidebar({
  activeSection,
  setActiveSection,
  credits = 0,
}) {
  const mainNav = [
    { label: "Projects", icon: Folder },
    { label: "Starred", icon: Star },
  ];
  const navigate = useNavigate();

  return (
    <aside
      className="
        flex h-full w-64 shrink-0 flex-col
        border-r border-white/[0.06]
        bg-black
        px-4 py-6
        font-sans
      "
    >
      {/* ===== SECTION LABEL (Anton) ===== */}
      <p
        className="
          mb-3 px-3
          font-display
          text-[11px] font-normal uppercase tracking-[0.18em]
          text-zinc-600
        "
      >
        Main
      </p>

      {/* ===== NAV ===== */}
      <nav className="flex flex-col gap-0.5">
        {mainNav.map(({ label, icon: Icon }) => {
          const isActive = activeSection === label;

          return (
            <motion.button
              key={label}
              onClick={() => setActiveSection(label)}
              whileTap={{ scale: 0.98 }}
              className={`
                group relative flex items-center gap-3 rounded-xl px-3 py-2.5
                text-[13.5px] font-medium transition-colors duration-150
                ${
                  isActive
                    ? "bg-white/[0.05] text-white"
                    : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-200"
                }
              `}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active-dot"
                  className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#E8FF3F]"
                  transition={{
                    type: "spring",
                    duration: 0.4,
                    bounce: 0.15,
                  }}
                />
              )}

              <Icon
                size={16}
                strokeWidth={2}
                className={`
                  transition-colors
                  ${isActive ? "text-[#E8FF3F]" : "text-zinc-600 group-hover:text-[#A78BFA]"}
                `}
              />

              <span>{label}</span>

              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#E8FF3F]" />
              )}
            </motion.button>
          );
        })}
      </nav>

      <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* ===== CREDITS CARD ===== */}
      <div className="mb-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#A78BFA]/10">
              <Coins size={15} className="text-[#A78BFA]" />
            </div>
            <span className="text-[12.5px] font-medium text-zinc-400">
              AI Credits
            </span>
          </div>

          <span className="font-display text-[20px] font-normal tracking-wide text-white">
            {credits}
          </span>
        </div>

        <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${credits}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-[#E8FF3F] to-[#A78BFA]"
          />
        </div>

        <p className="mt-2.5 text-[10.5px] text-zinc-600">
          {credits > 0
            ? `${credits} credits remaining`
            : "No credits remaining"}
        </p>
      </div>

      {/* ===== UPGRADE CARD ===== */}
      <div
        className="
          relative overflow-hidden rounded-2xl border border-[#A78BFA]/15
          bg-gradient-to-br from-[#A78BFA]/[0.06] to-transparent p-4
        "
      >
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#A78BFA]/10 blur-2xl" />

        <p className="mb-1 flex items-center gap-1.5 text-[13px] font-semibold text-white">
          <Zap size={13} className="text-[#FF9A22]" fill="currentColor" />
          Upgrade Plan
        </p>

        <p className="mb-4 text-[11.5px] leading-relaxed text-zinc-500">
          Get more credits &amp; unlock Pro features.
        </p>

        <motion.button
          onClick={() => navigate("/plans")}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="
            flex w-full items-center justify-center gap-1.5 rounded-xl
            bg-[#E8FF3F] py-2.5 text-[12.5px] font-bold text-black
            transition-colors duration-150 hover:bg-[#FF9A22]
          "
        >
          Upgrade Now
        </motion.button>
      </div>

      {/* ===== FOOTER ===== */}
      <div className="mt-auto pt-6">
        <p className="px-3 text-center text-[10px] tracking-wide text-zinc-700">
          NEXTCODE v1.0
        </p>
      </div>
    </aside>
  );
}