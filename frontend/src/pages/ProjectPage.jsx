import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { Code2, Eye, Maximize2, Minimize2, Files, Bot, TerminalSquare } from "lucide-react";

import Explorer from "../components/Explorer";
import Editor from "../components/Editor";
import Preview from "../components/Preview";
import TopBar from "../components/TopBar";
import ActivityBar from "../components/ActivityBar";
import AiChat from "../components/AiChat";
import BottomPanel from "../components/BottomPanel";

import { getTree } from "../features/file";
import { getProjectById } from "../features/project";
import { setCurrentProject } from "../redux/projectSlice";

export default function ProjectPage() {
  const { id } = useParams();
  const dispatch = useDispatch();

  // =================================================
  // STATE
  // =================================================
  const [showPreview, setShowPreview] = useState(false);
  const [tree, setTree] = useState([]);
  const [terminalSocketId, setTerminalSocketId] = useState(null);
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [creatingFolderIn, setCreatingFolderIn] = useState(null);
  const [creatingFileIn, setCreatingFileIn] = useState(null);
  const [showExplorer, setShowExplorer] = useState(true);
  const [showAIChat, setShowAIChat] = useState(true);
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);

  // Mobile only: decides which single pane is visible below `md`
  const [mobilePane, setMobilePane] = useState("editor"); // "explorer" | "editor" | "chat"

  // Escape key exits preview fullscreen
  useEffect(() => {
    if (!isPreviewFullscreen) return;

    const handler = (e) => {
      if (e.key === "Escape") setIsPreviewFullscreen(false);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isPreviewFullscreen]);

  // =================================================
  // LOAD PROJECT
  // =================================================
  useEffect(() => {
    if (!id) return;
    loadProject();
  }, [id]);

  const loadTree = async () => {
    try {
      const data = await getTree(id);
      const nextTree = Array.isArray(data?.tree) ? data.tree : [];
      setTree(nextTree);
    } catch (error) {
      console.error("Tree loading error:", error);
    }
  };

  const loadProject = async () => {
    try {
      await loadTree();
      const data = await getProjectById(id);
      if (data?.project) dispatch(setCurrentProject(data.project));
    } catch (error) {
      console.error("Project loading error:", error);
    }
  };

  // =================================================
  // HANDLERS
  // =================================================
  const openFile = (file) => {
    const exists = openTabs.find((tab) => tab._id === file._id);
    if (!exists) setOpenTabs((prev) => [...prev, file]);
    setActiveTab(file);
    setShowPreview(false);
    setMobilePane("editor");
  };

  const handleNewFolder = (folder) => {
    setCreatingFolderIn(folder._id);
    setCreatingFileIn(null);
  };

  const handleNewFile = (folder) => {
    setCreatingFileIn(folder._id);
    setCreatingFolderIn(null);
  };

  const handleTerminalSocket = (socketId) => setTerminalSocketId(socketId);

  // =================================================
  // RENDER
  // =================================================
  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-black font-['DM_Sans',sans-serif]">
      {/* BACKGROUND GLOW */}
      <div className="pointer-events-none absolute -top-40 left-1/3 hidden h-96 w-96 rounded-full bg-[#A78BFA]/[0.12] blur-[140px] md:block" />
      <div className="pointer-events-none absolute -top-20 right-1/4 hidden h-80 w-80 rounded-full bg-[#FF9A22]/[0.08] blur-[140px] md:block" />

      {/* TOP BAR */}
      <TopBar
        showBottomPanel={showBottomPanel}
        setShowBottomPanel={setShowBottomPanel}
        showPreview={showPreview}
        setShowPreview={setShowPreview}
      />

      {/* MAIN */}
      <div className="flex flex-1 overflow-hidden">
        {/* ACTIVITY BAR */}
        <div className="hidden md:block">
          <ActivityBar
            showExplorer={showExplorer}
            setShowExplorer={setShowExplorer}
            showAIChat={showAIChat}
            setShowAIChat={setShowAIChat}
            showBottomPanel={showBottomPanel}
            setShowBottomPanel={setShowBottomPanel}
          />
        </div>

        {/* EXPLORER */}
        <div className={`${mobilePane === "explorer" ? "flex" : "hidden"} w-full md:flex md:w-auto`}>
          <AnimatePresence initial={false}>
            {showExplorer && (
              <Explorer
                key="explorer"
                projectId={id}
                tree={tree}
                openFile={openFile}
                onNewFolder={handleNewFolder}
                onNewFile={handleNewFile}
                creatingFolderIn={creatingFolderIn}
                setCreatingFolderIn={setCreatingFolderIn}
                creatingFileIn={creatingFileIn}
                setCreatingFileIn={setCreatingFileIn}
                reloadTree={loadTree}
              />
            )}
          </AnimatePresence>
        </div>

        {/* CENTER: EDITOR / PREVIEW + TERMINAL */}
        <div
          className={`${
            mobilePane === "editor" ? "flex" : "hidden"
          } relative w-full min-w-0 flex-1 flex-col overflow-hidden border-x border-white/10 md:flex`}
        >
          {/* EDITOR / PREVIEW SWITCH */}
          <div className="pointer-events-none absolute right-2 top-2 z-40 flex items-center gap-1.5 sm:right-4 sm:top-3 sm:gap-2">
            {showPreview && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                type="button"
                onClick={() => setIsPreviewFullscreen((v) => !v)}
                title={isPreviewFullscreen ? "Exit fullscreen" : "Fullscreen preview"}
                className="pointer-events-auto flex items-center justify-center rounded-lg border border-white/10 bg-black/90 p-1.5 text-zinc-400 shadow-lg shadow-black/60 backdrop-blur transition-colors hover:border-[#E8FF3F]/50 hover:text-[#E8FF3F] sm:p-2"
              >
                {isPreviewFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </motion.button>
            )}

            <div className="pointer-events-auto flex items-center gap-0.5 rounded-lg border border-white/10 bg-black/90 p-1 shadow-lg shadow-black/60 backdrop-blur">
              <button
                type="button"
                onClick={() => {
                  setShowPreview(false);
                  setIsPreviewFullscreen(false);
                }}
                className={`relative flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors sm:px-3 sm:py-1.5 sm:text-xs ${
                  !showPreview ? "text-black" : "text-zinc-500 hover:text-[#A78BFA]"
                }`}
              >
                {!showPreview && (
                  <motion.div
                    layoutId="editor-preview-pill"
                    className="absolute inset-0 rounded-md bg-[#E8FF3F]"
                    transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                  />
                )}
                <Code2 size={13} className="relative" />
                <span className="relative hidden sm:inline">Editor</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className={`relative flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors sm:px-3 sm:py-1.5 sm:text-xs ${
                  showPreview ? "text-black" : "text-zinc-500 hover:text-[#A78BFA]"
                }`}
              >
                {showPreview && (
                  <motion.div
                    layoutId="editor-preview-pill"
                    className="absolute inset-0 rounded-md bg-[#E8FF3F]"
                    transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                  />
                )}
                <Eye size={13} className="relative" />
                <span className="relative hidden sm:inline">Preview</span>
              </button>
            </div>
          </div>

          {/* EDITOR / PREVIEW BODY */}
          <div className="flex min-h-0 flex-1 overflow-hidden">
            {showPreview ? (
              <Preview tree={tree} />
            ) : (
              <Editor
                activeTab={activeTab}
                openTabs={openTabs}
                setOpenTabs={setOpenTabs}
                setActiveTab={setActiveTab}
              />
            )}
          </div>

          {/* FULLSCREEN PREVIEW OVERLAY */}
          <AnimatePresence>
            {showPreview && isPreviewFullscreen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="fixed inset-0 z-[100] bg-white"
              >
                <Preview tree={tree} />
                <button
                  onClick={() => setIsPreviewFullscreen(false)}
                  title="Exit fullscreen (Esc)"
                  className="absolute right-2 top-2 z-[110] flex items-center gap-1.5 rounded-lg bg-[#E8FF3F] px-2.5 py-1.5 text-[11px] font-bold text-black shadow-lg shadow-black/40 transition-colors hover:bg-[#FF9A22] sm:right-4 sm:top-3 sm:px-3 sm:text-xs"
                >
                  <Minimize2 size={13} />
                  <span className="hidden xs:inline">Exit Fullscreen</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* BOTTOM PANEL (TERMINAL) */}
          <AnimatePresence initial={false}>
            {showBottomPanel && (
              <div className="max-h-[45vh] md:max-h-none">
                <BottomPanel
                  key="bottom-panel"
                  projectId={id}
                  onTerminalSocket={handleTerminalSocket}
                  onClose={() => setShowBottomPanel(false)}
                />
              </div>
            )}
          </AnimatePresence>

          {/* REOPEN TERMINAL PILL (shown when panel is closed) */}
          <AnimatePresence>
            {!showBottomPanel && (
              <motion.button
                key="reopen-terminal"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                onClick={() => setShowBottomPanel(true)}
                className="absolute bottom-3 left-3 z-30 flex items-center gap-1.5 rounded-lg border border-[#A78BFA]/40 bg-black/90 px-3 py-1.5 text-xs font-medium text-[#A78BFA] shadow-lg shadow-black/60 backdrop-blur transition-colors hover:border-[#E8FF3F] hover:text-[#E8FF3F]"
              >
                Show Terminal
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* AI CHAT */}
        <div className={`${mobilePane === "chat" ? "flex" : "hidden"} w-full md:flex md:w-auto`}>
          <AnimatePresence initial={false}>
            {showAIChat && (
              <AiChat
                key="ai-chat"
                projectId={id}
                terminalSocketId={terminalSocketId}
                onFilesChanged={loadTree}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* MOBILE BOTTOM TAB BAR */}
      <div className="flex items-center justify-around border-t border-white/10 bg-black py-2 md:hidden">
        <button
          onClick={() => setMobilePane("explorer")}
          className={`flex flex-col items-center gap-1 px-4 py-1 text-[11px] font-semibold transition-colors ${
            mobilePane === "explorer" ? "text-[#E8FF3F]" : "text-zinc-500"
          }`}
        >
          <Files size={18} />
          Files
        </button>

        <button
          onClick={() => setMobilePane("editor")}
          className={`flex flex-col items-center gap-1 px-4 py-1 text-[11px] font-semibold transition-colors ${
            mobilePane === "editor" ? "text-[#E8FF3F]" : "text-zinc-500"
          }`}
        >
          <Code2 size={18} />
          Code
        </button>

        <button
          onClick={() => setMobilePane("chat")}
          className={`flex flex-col items-center gap-1 px-4 py-1 text-[11px] font-semibold transition-colors ${
            mobilePane === "chat" ? "text-[#A78BFA]" : "text-zinc-500"
          }`}
        >
          <Bot size={18} />
          AI Chat
        </button>

        <button
          onClick={() => setShowBottomPanel((v) => !v)}
          className={`flex flex-col items-center gap-1 px-4 py-1 text-[11px] font-semibold transition-colors ${
            showBottomPanel ? "text-[#FF9A22]" : "text-zinc-500"
          }`}
        >
          <TerminalSquare size={18} />
          Terminal
        </button>
      </div>
    </div>
  );
}