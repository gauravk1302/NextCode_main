import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Folder as FolderIcon,
  FolderOpen,
  FilePlus2,
  FolderPlus,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  createFile,
  createFolder,
  getFile,
  renameFile,
  deleteFile,
} from "../features/file";
import { getFileIcon, getFolderColor } from "../utils/fileIcons";

export default function Folder({
  projectId,
  node,
  isChild = false,
  openFile,
  onNewFile,
  onNewFolder,
  creatingFolderIn,
  setCreatingFolderIn,
  creatingFileIn,
  setCreatingFileIn,
  reloadTree,
}) {
  const [open, setOpen] = useState(true);
  const [folderName, setFolderName] = useState("");
  const [fileName, setFileName] = useState("");
  const [menu, setMenu] = useState(null);

  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState("");
  const [renameError, setRenameError] = useState("");

  const isRoot = !isChild;

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    try {
      await createFolder({ projectId, parentId: node._id, name: folderName });
      setFolderName("");
      setCreatingFolderIn(null);
      await reloadTree();
    } catch (err) {
      console.log(err);
    }
  };

  const handleCreateFile = async () => {
    if (!fileName.trim()) return;
    try {
      const res = await createFile({ projectId, parentId: node._id, name: fileName });
      setFileName("");
      setCreatingFileIn(null);
      await reloadTree();
      if (res?.file) openFile(res.file);
    } catch (err) {
      console.log(err);
    }
  };

  const startRename = () => {
    setMenu(null);
    setNewName(node.name);
    setRenameError("");
    setRenaming(true);
  };

  const cancelRename = () => {
    setRenaming(false);
    setRenameError("");
  };

  const handleRename = async () => {
    const name = newName.trim();

    if (!name || name === node.name) {
      cancelRename();
      return;
    }

    if (/[\\/]/.test(name)) {
      setRenameError("Name cannot contain / or \\");
      return;
    }

    try {
      await renameFile(node._id, name);
      setRenaming(false);
      setRenameError("");
      await reloadTree();
    } catch (err) {
      setRenameError(err?.response?.data?.message || "Rename failed");
    }
  };

  const handleDelete = async () => {
    setMenu(null);

    const extra =
      node.type === "folder" ? "\nEverything inside it will be deleted too." : "";

    if (!window.confirm(`Delete "${node.name}"?${extra}`)) return;

    try {
      await deleteFile(node._id);
      await reloadTree();
    } catch (err) {
      console.log(err);
      window.alert(err?.response?.data?.message || "Delete failed");
    }
  };

  const renameInput = (
    <input
      autoFocus
      value={newName}
      onFocus={(e) => e.target.select()}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        setNewName(e.target.value);
        setRenameError("");
      }}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") handleRename();
        if (e.key === "Escape") cancelRename();
      }}
      onBlur={cancelRename}
      className="min-w-0 flex-1 rounded-md border border-brand-lime bg-white/[0.04] px-2 py-0.5 text-[13px] text-white outline-none ring-1 ring-brand-lime"
    />
  );

  if (node.type === "file") {
    const { icon: FileTypeIcon, color: fileColor } = getFileIcon(node.name);

    return (
      <div className="relative">
        <motion.div
          whileHover={{ x: 2 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="group flex cursor-pointer items-center justify-between rounded-lg px-3 py-1.5 transition-colors hover:bg-white/[0.05]"
          onClick={async () => {
            if (renaming) return;
            const data = await getFile(node._id);
            openFile(data.file);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setMenu({ x: e.clientX, y: e.clientY });
          }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <FileTypeIcon size={14} className={`shrink-0 ${fileColor}`} />

            {renaming ? (
              renameInput
            ) : (
              <span className="truncate text-[13px] text-white/60 transition-colors group-hover:text-white">
                {node.name}
              </span>
            )}
          </div>
        </motion.div>

        {renameError && (
          <p className="px-3 pb-1 text-[11px] text-brand-coral">{renameError}</p>
        )}

        <AnimatePresence>
          {menu && (
            <>
              <motion.div
                className="fixed inset-0 z-40"
                onClick={() => setMenu(null)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -6 }}
                transition={{ duration: 0.14, ease: "easeOut" }}
                className="fixed z-50 w-48 rounded-xl border border-white/10 bg-black py-1.5 shadow-2xl shadow-black/80"
                style={{ left: menu.x, top: menu.y }}
              >
                <button
                  className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  onClick={startRename}
                >
                  <Pencil size={13} />
                  Rename
                </button>
                <button
                  className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-brand-coral transition-colors hover:bg-brand-coral/10"
                  onClick={handleDelete}
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const folderColor = getFolderColor(node.name);

  return (
    <div className="relative">
      <motion.div
        whileHover={{ x: 2 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="group flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.05]"
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY });
        }}
      >
        <div
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5"
          onClick={() => {
            if (!renaming) setOpen(!open);
          }}
        >
          <motion.div
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="shrink-0"
          >
            <ChevronRight size={14} className="text-white/40" />
          </motion.div>

          {open ? (
            <FolderOpen size={16} className={`shrink-0 ${folderColor}`} />
          ) : (
            <FolderIcon size={16} className={`shrink-0 ${folderColor} opacity-80`} />
          )}

          {renaming ? (
            renameInput
          ) : (
            <span className="truncate text-[13px] text-white/80 transition-colors group-hover:text-white">
              {node.name}
            </span>
          )}
        </div>

        <div className="hidden items-center gap-0.5 group-hover:flex">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            className="rounded-md p-1 text-white/40 hover:bg-white/10 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
              onNewFile(node);
            }}
          >
            <FilePlus2 size={13} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            className="rounded-md p-1 text-white/40 hover:bg-white/10 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
              onNewFolder(node);
            }}
          >
            <FolderPlus size={13} />
          </motion.button>
        </div>
      </motion.div>

      {renameError && (
        <p className="px-3 pb-1 text-[11px] text-brand-coral">{renameError}</p>
      )}

      <AnimatePresence>
        {menu && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              onClick={() => setMenu(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -6 }}
              transition={{ duration: 0.14, ease: "easeOut" }}
              className="fixed z-50 w-52 rounded-xl border border-white/10 bg-black py-1.5 shadow-2xl shadow-black/80"
              style={{ left: menu.x, top: menu.y }}
            >
              <button
                className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                onClick={() => {
                  setMenu(null);
                  onNewFile(node);
                }}
              >
                <FilePlus2 size={13} />
                New File
              </button>

              <button
                className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                onClick={() => {
                  setMenu(null);
                  onNewFolder(node);
                }}
              >
                <FolderPlus size={13} />
                New Folder
              </button>

              {!isRoot && (
                <>
                  <div className="my-1 h-px bg-white/10" />

                  <button
                    className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                    onClick={startRename}
                  >
                    <Pencil size={13} />
                    Rename
                  </button>

                  <button
                    className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-brand-coral transition-colors hover:bg-brand-coral/10"
                    onClick={handleDelete}
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="ml-5 overflow-hidden border-l border-white/10 pl-1"
          >
            {node.children?.map((child) => (
              <Folder
                key={child._id}
                projectId={projectId}
                node={child}
                isChild
                openFile={openFile}
                onNewFile={onNewFile}
                onNewFolder={onNewFolder}
                creatingFolderIn={creatingFolderIn}
                setCreatingFolderIn={setCreatingFolderIn}
                creatingFileIn={creatingFileIn}
                setCreatingFileIn={setCreatingFileIn}
                reloadTree={reloadTree}
              />
            ))}

            {creatingFolderIn === node._id && (
              <div className="py-1 pl-1">
                <motion.input
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  autoFocus
                  value={folderName}
                  placeholder="Folder Name"
                  className="w-full rounded-lg border border-white/15 bg-white/[0.04] px-2.5 py-1.5 text-[13px] text-white placeholder-white/30 outline-none transition-colors focus:border-brand-lime/60 focus:bg-white/[0.06]"
                  onChange={(e) => setFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateFolder();
                    if (e.key === "Escape") {
                      setFolderName("");
                      setCreatingFolderIn(null);
                    }
                  }}
                />
              </div>
            )}

            {creatingFileIn === node._id && (
              <div className="py-1 pl-1">
                <motion.input
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  autoFocus
                  value={fileName}
                  placeholder="File Name"
                  className="w-full rounded-lg border border-white/15 bg-white/[0.04] px-2.5 py-1.5 text-[13px] text-white placeholder-white/30 outline-none transition-colors focus:border-brand-lime/60 focus:bg-white/[0.06]"
                  onChange={(e) => setFileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateFile();
                    if (e.key === "Escape") {
                      setFileName("");
                      setCreatingFileIn(null);
                    }
                  }}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}