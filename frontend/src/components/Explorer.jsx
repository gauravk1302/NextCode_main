import { motion } from "framer-motion";
import { RefreshCw, FolderTree } from "lucide-react";
import Folder from "./Folder";

export default function Explorer({
  projectId,
  tree,
  openFile,
  onNewFile,
  onNewFolder,
  creatingFolderIn,
  setCreatingFolderIn,
  creatingFileIn,
  setCreatingFileIn,
  reloadTree,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16, width: 0 }}
      animate={{ opacity: 1, x: 0, width: 288 }}
      exit={{ opacity: 0, x: -16, width: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex flex-col overflow-hidden border-r border-white/10 bg-black"
    >
      <div className="flex h-10 w-72 shrink-0 items-center justify-between border-b border-white/10 px-3">
        <span className="text-[11px] font-semibold tracking-wider text-white/50">
          EXPLORER
        </span>

        <motion.button
          whileHover={{ rotate: 60 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2 }}
          onClick={reloadTree}
          className="rounded-md p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          title="Refresh"
        >
          <RefreshCw size={14} />
        </motion.button>
      </div>

      <div
        className="
          w-72 flex-1 overflow-y-auto px-1 py-2
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-white/10
          hover:[&::-webkit-scrollbar-thumb]:bg-white/20
          [&::-webkit-scrollbar-thumb]:transition-colors
        "
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
      >
        {tree.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-3 py-10 text-center">
            <FolderTree size={22} className="text-white/20" />
            <span className="text-[12px] text-white/40">Empty workspace</span>
          </div>
        ) : (
          tree.map((node) => (
            <Folder
              key={node._id}
              projectId={projectId}
              node={node}
              openFile={openFile}
              onNewFile={onNewFile}
              onNewFolder={onNewFolder}
              creatingFolderIn={creatingFolderIn}
              setCreatingFolderIn={setCreatingFolderIn}
              creatingFileIn={creatingFileIn}
              setCreatingFileIn={setCreatingFileIn}
              reloadTree={reloadTree}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}