import MonacoEditor from "@monaco-editor/react";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Circle, X } from "lucide-react";
import { updateFile } from "../features/file";
import { getFileIcon as getFileMeta } from "../utils/fileIcons";

// Plain theme: black bg, no syntax colors - sab text ek hi color ka
const definePlainTheme = (monaco) => {
  monaco.editor.defineTheme("nextcode-plain", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: "E5E7EB" }, // sab kuch ek hi plain color
    ],
    colors: {
      "editor.background": "#000000",
      "editor.foreground": "#E5E7EB",
      "editorLineNumber.foreground": "#4B5563",
      "editorLineNumber.activeForeground": "#E8FF3F",
      "editorCursor.foreground": "#E8FF3F",
      "editor.selectionBackground": "#A78BFA55",
      "editor.inactiveSelectionBackground": "#A78BFA22",
      "editor.lineHighlightBackground": "#FFFFFF08",
      "editorIndentGuide.background1": "#FFFFFF10",
      "editorIndentGuide.activeBackground1": "#A78BFA66",
      "editorWidget.background": "#0A0A0A",
      "editorSuggestWidget.background": "#0A0A0A",
      "editorSuggestWidget.selectedBackground": "#A78BFA33",
      "scrollbarSlider.background": "#A78BFA33",
      "scrollbarSlider.hoverBackground": "#A78BFA66",
    },
  });
};

export default function Editor({ activeTab, openTabs, setOpenTabs, setActiveTab }) {
  const [code, setCode] = useState("");

  useEffect(() => {
    setCode(activeTab?.content || "");
  }, [activeTab]);

  const isDirty = useMemo(
    () => activeTab && code !== (activeTab.content || ""),
    [code, activeTab]
  );

  // Silent save (Ctrl+S) - button nahi dikhega
  const save = async () => {
    if (!activeTab || !isDirty) return;

    try {
      await updateFile(activeTab._id, code);

      setActiveTab({ ...activeTab, content: code });
      setOpenTabs((tabs) =>
        tabs.map((tab) => (tab._id === activeTab._id ? { ...tab, content: code } : tab))
      );
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [code, activeTab]);

  const closeTab = (e, tab) => {
    e.stopPropagation();
    const tabs = openTabs.filter((t) => t._id !== tab._id);
    setOpenTabs(tabs);

    if (activeTab?._id === tab._id) {
      setActiveTab(tabs.length ? tabs[tabs.length - 1] : null);
    }
  };

  if (!activeTab) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-black font-['DM_Sans',sans-serif] text-zinc-600">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#A78BFA]/30 bg-[#A78BFA]/10">
          <Circle size={22} className="text-[#A78BFA]" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="font-['Anton',sans-serif] text-lg font-normal uppercase tracking-wide text-white">
            No file open
          </span>
          <span className="text-xs text-zinc-500">Select a file from Explorer to start editing</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-black font-['DM_Sans',sans-serif]">
      {/* TAB BAR */}
      <div className="flex h-10 shrink-0 items-center overflow-x-auto border-b border-white/10 bg-black">
        <AnimatePresence initial={false}>
          {openTabs.map((tab) => {
            const active = activeTab._id === tab._id;
            const { icon: Icon, color } = getFileMeta(tab.name);
            const dirty = active ? isDirty : false;

            return (
              <motion.div
                key={tab._id}
                layout
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setActiveTab(tab)}
                className={`group relative flex h-full cursor-pointer items-center gap-2 whitespace-nowrap border-r border-white/10 px-3.5 transition-colors ${
                  active
                    ? "bg-white/[0.06] text-white"
                    : "text-zinc-500 hover:bg-white/[0.03] hover:text-[#A78BFA]"
                }`}
              >
                <Icon size={14} className={color} />
                <span className="text-[13px]">{tab.name}</span>

                {dirty ? (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#E8FF3F]" />
                ) : (
                  <button
                    onClick={(e) => closeTab(e, tab)}
                    className="rounded p-0.5 text-zinc-500 opacity-0 hover:bg-white/10 hover:text-[#E8FF3F] group-hover:opacity-100"
                  >
                    <X size={13} />
                  </button>
                )}

                {active && (
                  <motion.div
                    layoutId="active-tab-indicator"
                    className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-[#E8FF3F] to-[#FF9A22]"
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* TOOLBAR REMOVED - ab file name aur Save button nahi dikhega */}

      {/* MONACO */}
      <div className="min-h-0 flex-1">
        <MonacoEditor
          height="100%"
          theme="nextcode-plain"
          beforeMount={definePlainTheme}
          language={activeTab.language || "plaintext"}
          value={code}
          onChange={(value) => setCode(value || "")}
          options={{
            fontSize: 14,
            automaticLayout: true,
            minimap: { enabled: false },
            wordWrap: "on",
            scrollBeyondLastLine: false,
            padding: { top: 12 },
          }}
        />
      </div>
    </div>
  );
}