import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Zap } from "lucide-react";

export default function Navbar({ user, onLogout, credits }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const name = user?.name || "Guest";
  const email = user?.email || "";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const showCredits = credits !== undefined;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-xl">
      {/* max-w hata diya — ab full width */}
      <div className="flex h-14 w-full items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-5 lg:px-8">
        <button
          onClick={() => navigate("/")}
          className="shrink-0 font-display text-[20px] uppercase leading-none tracking-wide text-white transition-colors hover:text-brand-lime focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none sm:text-[24px]"
        >
          nextCode
        </button>

        <div className="flex-1" />

        {showCredits && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-lime px-2.5 py-1 text-[11.5px] font-bold text-night sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-[12.5px]">
            <Zap size={12} fill="currentColor" className="sm:hidden" />
            <Zap size={13} fill="currentColor" className="hidden sm:block" />
            {credits}
            <span className="hidden font-medium sm:inline">credits</span>
          </span>
        )}

        {showCredits && (
          <button
            onClick={() => navigate("/plans")}
            className="hidden shrink-0 rounded-full border border-white/20 px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:border-brand-lime hover:bg-brand-lime hover:text-night focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none md:block"
          >
            Upgrade
          </button>
        )}

        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="flex h-9 items-center gap-1.5 rounded-full pl-1 pr-2 text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white motion-reduce:transition-none sm:h-10 sm:gap-2 sm:pr-2.5"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-orange text-[11px] font-bold text-night sm:h-8 sm:w-8 sm:text-[12px]">
              {initials}
            </span>
            <span className="hidden max-w-[120px] truncate text-[13.5px] font-medium md:inline">
              {name}
            </span>
            <ChevronDown
              size={14}
              className={`shrink-0 text-white/50 transition-transform duration-150 ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1rem)] rounded-2xl border border-white/10 bg-black p-1.5 shadow-2xl shadow-black"
            >
              <div className="border-b border-white/10 px-3 py-2.5">
                <p className="truncate text-[13px] font-medium text-white">{name}</p>
                {email && (
                  <p className="truncate text-[11.5px] text-white/50">{email}</p>
                )}
              </div>

              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout?.();
                }}
                className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-brand-coral transition-colors hover:bg-brand-coral/10 motion-reduce:transition-none"
              >
                <LogOut size={15} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}