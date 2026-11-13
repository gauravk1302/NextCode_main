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
      className="flex flex-col overflow-hidden border-r border-white/10 bg-black font-['DM_Sans',sans-serif]"
    >
      <div className="flex h-10 w-72 shrink-0 items-center justify-between border-b border-white/10 px-3">
        <span className="font-['Anton',sans-serif] text-[13px] font-normal uppercase tracking-wider text-white">
          Explorer
        </span>

        <motion.button
          whileHover={{ rotate: 60 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2 }}
          onClick={reloadTree}
          className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-[#E8FF3F]/10 hover:text-[#E8FF3F]"
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
          [&::-webkit-scrollbar-thumb]:bg-[#A78BFA]/30
          hover:[&::-webkit-scrollbar-thumb]:bg-[#A78BFA]/60
          [&::-webkit-scrollbar-thumb]:transition-colors
        "
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(167,139,250,0.4) transparent" }}
      >
        {tree.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-3 py-10 text-center">
            <FolderTree size={22} className="text-[#A78BFA]" />
            <span className="text-[12px] text-zinc-500">Empty workspace</span>
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