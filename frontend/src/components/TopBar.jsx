import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { SquareTerminal, Eye, Code2 } from "lucide-react";

function ToggleButton({ active, onClick, label, activeClass, children }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none sm:h-8 sm:w-8 ${
        active
          ? `border-transparent text-night ${activeClass}`
          : "border-white/15 text-white/60 hover:border-white/30 hover:text-white"
      }`}
    >
      {children}
    </motion.button>
  );
}

export default function TopBar({
  showBottomPanel,
  setShowBottomPanel,
  showPreview,
  setShowPreview,
}) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const { currentProject, loading } = useSelector((state) => state.project || {});
  const { userData } = useSelector((state) => state.user || {});

  const projectName = currentProject?.name || "Untitled Project";
  const visibility = currentProject?.visibility;

  const userName = userData?.name || "Guest";
  const userEmail = userData?.email || "";
  const userAvatar = userData?.avatar;
  const initials = userName
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const goTo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <header className="flex h-12 w-full shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-black px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="shrink-0 font-display text-[22px] uppercase leading-none tracking-wide text-white transition-colors hover:text-brand-lime focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none"
        >
          nextCode
        </button>

        <span className="shrink-0 text-[18px] font-light text-white/25">/</span>

        {loading ? (
          <div className="h-5 w-28 animate-pulse rounded-full bg-white/10" />
        ) : (
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[14px] font-semibold text-white/85">
              {projectName}
            </span>

            {visibility && (
              <span className="hidden shrink-0 rounded-full border border-white/15 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-white/50 sm:inline">
                {visibility}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <ToggleButton
          active={showPreview}
          onClick={() => setShowPreview?.((v) => !v)}
          label={showPreview ? "Show editor" : "Show preview"}
          activeClass="bg-brand-lime"
        >
          {showPreview ? <Eye size={16} /> : <Code2 size={16} />}
        </ToggleButton>

        <ToggleButton
          active={showBottomPanel}
          onClick={() => setShowBottomPanel?.((v) => !v)}
          label={showBottomPanel ? "Hide terminal" : "Show terminal"}
          activeClass="bg-brand-green"
        >
          <SquareTerminal size={16} />
        </ToggleButton>

        <div className="mx-1 h-5 w-px bg-white/10" />

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Account menu"
            aria-expanded={menuOpen}
            className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-brand-orange text-[12px] font-bold text-night">
                {initials}
              </span>
            )}
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-[100]"
                  onClick={() => setMenuOpen(false)}
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.97, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: -6 }}
                  transition={{ duration: 0.14, ease: "easeOut" }}
                  className="absolute right-0 top-11 z-[101] w-[min(16rem,calc(100vw-1.5rem))] rounded-2xl border border-white/10 bg-black p-2 shadow-2xl shadow-black"
                >
                  <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-2.5">
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={userName}
                        referrerPolicy="no-referrer"
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-orange text-[13px] font-bold text-night">
                        {initials}
                      </span>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-white">
                        {userName}
                      </p>
                      <p className="truncate text-[12px] text-white/50">
                        {userEmail}
                      </p>
                    </div>
                  </div>

                  <div className="mt-1.5 flex flex-col">
                    <button
                      type="button"
                      onClick={() => goTo("/")}
                      className="rounded-lg px-3 py-2 text-left text-[13px] font-medium text-white/75 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                      Dashboard
                    </button>

                    <button
                      type="button"
                      onClick={() => goTo("/plans")}
                      className="rounded-lg px-3 py-2 text-left text-[13px] font-medium text-white/75 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                      Plans
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}