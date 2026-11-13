import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Trash2,
  FolderOpen,
} from "lucide-react";

import {
  toggleProjectStar,
  deleteProject,
} from "../features/project";


// =====================================================
// PROJECT CARD
// =====================================================

export function ProjectCard({
  project: p,
  onOpen,
  onProjectDeleted,
  onProjectStarred,
}) {

  const [confirmDelete, setConfirmDelete] =
    useState(false);

  const [loadingStar, setLoadingStar] =
    useState(false);

  const [loadingDelete, setLoadingDelete] =
    useState(false);


  // ===================================================
  // STAR
  // ===================================================

  const handleToggleStar = async (e) => {

    e.stopPropagation();

    if (loadingStar) return;

    setLoadingStar(true);

    try {

      const data =
        await toggleProjectStar(p._id);

      if (!data?.success) {
        return;
      }

      onProjectStarred?.(
        data.project
      );

    } catch (error) {

      console.error(
        "Star project error:",
        error
      );

    } finally {

      setLoadingStar(false);

    }
  };


  // ===================================================
  // DELETE
  // ===================================================

  const handleDelete = async () => {

    if (loadingDelete) return;

    setLoadingDelete(true);

    try {

      const data =
        await deleteProject(p._id);

      if (!data?.success) {
        return;
      }

      onProjectDeleted?.(
        p._id
      );

      setConfirmDelete(false);

    } catch (error) {

      console.error(
        "Delete project error:",
        error
      );

    } finally {

      setLoadingDelete(false);

    }
  };


  return (
    <motion.div
      layout

      initial={{
        opacity: 0,
        y: 8,
      }}

      animate={{
        opacity: 1,
        y: 0,
      }}

      exit={{
        opacity: 0,
        scale: 0.97,
      }}

      whileHover={{
        y: -3,
      }}

      transition={{
        duration: 0.18,
        ease: "easeOut",
      }}

      onClick={() =>
        onOpen?.(p)
      }

      className="
        group
        relative
        cursor-pointer
        rounded-2xl
        border
        border-white/10
        bg-black
        p-5
        font-['DM_Sans',sans-serif]
        shadow-none
        transition-all
        duration-200
        hover:border-[#A78BFA]/40
        hover:bg-white/[0.02]
        hover:shadow-[0_8px_24px_rgba(167,139,250,0.08)]
      "
    >

      {/* =================================================
          STAR
      ================================================= */}

      <motion.button
        whileTap={{
          scale: 0.9,
        }}

        disabled={loadingStar}

        onClick={
          handleToggleStar
        }

        className={`
          absolute
          right-4
          top-4
          rounded-md
          p-1
          transition-opacity

          ${
            p.starred
              ? "opacity-100 text-[#E8FF3F]"
              : "opacity-0 text-zinc-600 group-hover:opacity-100 hover:text-[#FF9A22]"
          }

          ${
            loadingStar
              ? "cursor-wait opacity-60"
              : ""
          }
        `}

        aria-label={
          p.starred
            ? "Unstar project"
            : "Star project"
        }
      >

        <Star
          size={15}
          className={
            p.starred
              ? "fill-[#E8FF3F] text-[#E8FF3F]"
              : ""
          }
        />

      </motion.button>


      {/* =================================================
          NAME (Anton — headings ke liye)
      ================================================= */}

      <h3
        className="
          mb-1.5
          truncate
          pr-6
          font-['Anton',sans-serif]
          text-[15px]
          font-normal
          uppercase
          tracking-wide
          text-white
        "
      >
        {p.name}
      </h3>


      {/* =================================================
          DESCRIPTION
      ================================================= */}

      <p
        className="
          line-clamp-2
          min-h-[2.5em]
          text-[12.5px]
          leading-snug
          text-zinc-500
        "
      >
        {p.description ||
          "No description"}
      </p>


      {/* =================================================
          DELETE
      ================================================= */}

      <div
        className="
          mt-4
          flex
          items-center
          justify-end
          border-t
          border-white/10
          pt-3
        "
      >

        <AnimatePresence
          mode="wait"
        >

          {confirmDelete ? (

            <motion.div
              key="confirm"

              initial={{
                opacity: 0,
              }}

              animate={{
                opacity: 1,
              }}

              exit={{
                opacity: 0,
              }}

              onClick={(e) =>
                e.stopPropagation()
              }

              className="
                flex
                items-center
                gap-2
              "
            >

              <span
                className="
                  text-[11px]
                  text-zinc-500
                "
              >
                Delete?
              </span>


              <button
                disabled={
                  loadingDelete
                }

                onClick={
                  handleDelete
                }

                className="
                  rounded-md
                  bg-[#FF9A22]/10
                  px-2
                  py-1
                  text-[11px]
                  font-medium
                  text-[#FF9A22]
                  hover:bg-[#FF9A22]/20
                  disabled:cursor-wait
                  disabled:opacity-50
                "
              >
                {loadingDelete
                  ? "Deleting..."
                  : "Yes"}
              </button>


              <button
                disabled={
                  loadingDelete
                }

                onClick={() =>
                  setConfirmDelete(
                    false
                  )
                }

                className="
                  rounded-md
                  px-2
                  py-1
                  text-[11px]
                  text-zinc-500
                  hover:text-zinc-300
                "
              >
                Cancel
              </button>

            </motion.div>

          ) : (

            <motion.button
              key="trigger"

              initial={{
                opacity: 0,
              }}

              animate={{
                opacity: 1,
              }}

              exit={{
                opacity: 0,
              }}

              whileTap={{
                scale: 0.92,
              }}

              onClick={(e) => {

                e.stopPropagation();

                setConfirmDelete(
                  true
                );

              }}

              className="
                flex
                items-center
                gap-1
                rounded-md
                px-1.5
                py-1
                text-[11px]
                text-zinc-600
                opacity-0
                transition-opacity
                hover:text-[#FF9A22]
                group-hover:opacity-100
              "

              aria-label="Delete project"
            >

              <Trash2
                size={13}
              />

            </motion.button>

          )}

        </AnimatePresence>

      </div>

    </motion.div>
  );
}


// =====================================================
// PROJECT GRID
// =====================================================

export function ProjectGrid({
  projects,
  onOpen,
  onProjectDeleted,
  onProjectStarred,
}) {

  if (!projects?.length) {

    return (
      <div
        className="
          flex
          flex-col
          items-center
          justify-center
          gap-2
          rounded-2xl
          border
          border-dashed
          border-white/10
          bg-black
          py-20
          text-center
          font-['DM_Sans',sans-serif]
        "
      >

        <FolderOpen
          size={26}
          className="
            text-[#A78BFA]
          "
        />

        <p
          className="
            text-sm
            text-zinc-500
          "
        >
          No projects yet
        </p>

      </div>
    );
  }


  return (
    <div
      className="
        grid
        grid-cols-1
        gap-4
        sm:grid-cols-2
        lg:grid-cols-3
        xl:grid-cols-4
      "
    >

      <AnimatePresence>

        {projects.map((p) => (

          <ProjectCard
            key={
              p._id || p.name
            }

            project={p}

            onOpen={
              onOpen
            }

            onProjectDeleted={
              onProjectDeleted
            }

            onProjectStarred={
              onProjectStarred
            }
          />

        ))}

      </AnimatePresence>

    </div>
  );
}