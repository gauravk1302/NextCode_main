import { useState } from "react";
import { Star, Trash2, ArrowUpRight } from "lucide-react";
import { timeAgo } from "../utils/TimeAgo";

const TONES = {
  orange: "bg-brand-orange",
  lavender: "bg-brand-lavender",
  coral: "bg-brand-coral",
  green: "bg-brand-green",
  lime: "bg-brand-lime",
};

export function ProjectCard({
  project,
  accent = "orange",
  onOpen,
  onToggleStar,
  onDelete,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loadingStar, setLoadingStar] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const handleStar = async (e) => {
    e.stopPropagation();
    if (loadingStar) return;

    setLoadingStar(true);
    try {
      await onToggleStar?.(project);
    } finally {
      setLoadingStar(false);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (loadingDelete) return;

    setLoadingDelete(true);
    try {
      await onDelete?.(project);
      setConfirmDelete(false);
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <div
      onClick={() => onOpen?.(project)}
      className={`cut group relative flex min-h-[176px] cursor-pointer flex-col rounded-2xl p-4 text-night transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none ${
        TONES[accent] || TONES.orange
      }`}
    >
      <button
        aria-label={project.starred ? "Unstar project" : "Star project"}
        aria-pressed={!!project.starred}
        disabled={loadingStar}
        onClick={handleStar}
        className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-night/15 focus-visible:outline-2 focus-visible:outline-night disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
      >
        <Star size={17} fill={project.starred ? "currentColor" : "none"} />
      </button>

      <h3 className="min-w-0 pr-10 font-display text-[26px] uppercase leading-tight">
        <button className="block w-full truncate text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-night">
          {project.name}
        </button>
      </h3>

      <p className="mt-2 line-clamp-2 min-h-10 text-[13px] opacity-75">
        {project.description || "No description"}
      </p>

      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        {confirmDelete ? (
          <>
            <span className="text-[12.5px] font-medium">Delete this project?</span>

            <div
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                disabled={loadingDelete}
                onClick={handleDelete}
                className="rounded-full bg-night px-3 py-1 text-[12px] font-semibold text-white disabled:cursor-wait disabled:opacity-60"
              >
                {loadingDelete ? "Deleting..." : "Yes"}
              </button>

              <button
                disabled={loadingDelete}
                onClick={() => setConfirmDelete(false)}
                className="rounded-full px-3 py-1 text-[12px] font-semibold transition-colors hover:bg-night/15 disabled:opacity-60 motion-reduce:transition-none"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="text-[12.5px] font-medium opacity-75">
              Updated {timeAgo(project.updatedAt || project.createdAt)}
            </span>

            <div className="flex items-center gap-2">
              <button
                aria-label="Delete project"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(true);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-night/15 focus-visible:outline-2 focus-visible:outline-night motion-reduce:transition-none"
              >
                <Trash2 size={16} />
              </button>

              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-night text-white">
                <ArrowUpRight
                  size={16}
                  className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                />
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ProjectCard;