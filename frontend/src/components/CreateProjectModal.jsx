import { useState } from "react";
import { X } from "lucide-react";

export default function CreateProjectModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  if (!open) return null;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submit = () => {
    if (!form.name.trim()) return;
    onCreate?.(form);
    setForm({ name: "", description: "" });
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-['DM_Sans',sans-serif]">
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes overlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .modal-card { animation: modalIn 0.28s cubic-bezier(0.16, 1, 0.3, 1); }
        .modal-overlay { animation: overlayIn 0.2s ease-out; }
      `}</style>

      {/* Overlay */}
      <div
        onClick={onClose}
        className="modal-overlay fixed inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute -z-10 h-[460px] w-[460px] rounded-full bg-[#A78BFA]/15 blur-[130px]" />
      <div className="pointer-events-none absolute -z-10 h-[300px] w-[300px] translate-x-40 translate-y-32 rounded-full bg-[#FF9A22]/10 blur-[120px]" />

      {/* Card */}
      <div className="modal-card relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_20px_70px_-15px_rgba(0,0,0,0.9)]">
        {/* top highlight line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#E8FF3F]/70 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-7 py-6">
          <div>
            <h2 className="font-['Anton',sans-serif] text-2xl font-normal uppercase tracking-wide text-white">
              Create <span className="text-[#E8FF3F]">project</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Set up a new workspace in seconds
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-[#E8FF3F]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 px-7 py-6">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#A78BFA]">
              Project name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="My Awesome Project"
              autoFocus
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[15px] text-white placeholder-zinc-500 outline-none transition-all focus:border-[#E8FF3F]/70 focus:bg-white/[0.06] focus:ring-4 focus:ring-[#E8FF3F]/10"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#A78BFA]">
              Description
            </label>
            <textarea
              rows={3}
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="What is this project about?"
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[15px] text-white placeholder-zinc-500 outline-none transition-all focus:border-[#E8FF3F]/70 focus:bg-white/[0.06] focus:ring-4 focus:ring-[#E8FF3F]/10"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-white/10 px-7 py-5">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={submit}
            disabled={!form.name.trim()}
            className="rounded-xl bg-[#E8FF3F] px-5 py-2.5 text-sm font-bold text-black shadow-[0_8px_24px_-8px_rgba(232,255,63,0.4)] transition-all hover:bg-[#FF9A22] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-zinc-500 disabled:shadow-none"
          >
            Create project
          </button>
        </div>
      </div>
    </div>
  );
}