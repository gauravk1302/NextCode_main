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
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("/")}
          className="font-display text-[24px] uppercase leading-none tracking-wide text-white transition-colors hover:text-brand-lime focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none"
        >
          nextCode
        </button>

        <div className="flex-1" />

        {showCredits && (
          <span className="flex items-center gap-1.5 rounded-full bg-brand-lime px-3 py-1.5 text-[12.5px] font-bold text-night">
            <Zap size={13} fill="currentColor" />
            {credits}
            <span className="hidden font-medium sm:inline">credits</span>
          </span>
        )}

        {showCredits && (
          <button
            onClick={() => navigate("/plans")}
            className="hidden rounded-full border border-white/20 px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:border-brand-lime hover:bg-brand-lime hover:text-night focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none sm:block"
          >
            Upgrade
          </button>
        )}

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="flex h-10 items-center gap-2 rounded-full pl-1 pr-2.5 text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white motion-reduce:transition-none"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-orange text-[12px] font-bold text-night">
              {initials}
            </span>
            <span className="hidden text-[13.5px] font-medium sm:inline">
              {name}
            </span>
            <ChevronDown
              size={14}
              className={`text-white/50 transition-transform duration-150 ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-black p-1.5 shadow-2xl shadow-black"
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