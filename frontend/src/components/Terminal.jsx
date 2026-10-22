import { useEffect, useRef, useState } from "react";
import { Terminal as XTerminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import { SearchAddon } from "xterm-addon-search";
import { io } from "socket.io-client";
import { Eraser, Search, X, ChevronUp, ChevronDown } from "lucide-react";
import "xterm/css/xterm.css";
import "./Terminal.css";

const DEFAULT_FONT_SIZE = 13;
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 32;

export default function Terminal({
  projectId,
  userId,
  onSocketReady,
  onFilesChanged,
}) {
  const containerRef = useRef(null);
  const socketRef = useRef(null);
  const terminalRef = useRef(null);
  const fitAddonRef = useRef(null);
  const searchAddonRef = useRef(null);
  const searchInputRef = useRef(null);
  const callbackRef = useRef(onSocketReady);
  const filesChangedRef = useRef(onFilesChanged);

  const [connected, setConnected] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    callbackRef.current = onSocketReady;
  }, [onSocketReady]);

  useEffect(() => {
    filesChangedRef.current = onFilesChanged;
  }, [onFilesChanged]);

  useEffect(() => {
    if (
      !containerRef.current ||
      !projectId ||
      !userId
    ) {
      return;
    }

    const container = containerRef.current;

    const terminal = new XTerminal({
      cursorBlink: true,
      cursorStyle: "block",
      fontSize: DEFAULT_FONT_SIZE,
      fontFamily: "Menlo, Monaco, Consolas, monospace",
      scrollback: 5000,
      rightClickSelectsWord: false,
      allowProposedApi: true,
      theme: {
        background: "#000000",
        foreground: "#d4d4d4",
        cursor: "#E2F952",
        selectionBackground: "rgba(226, 249, 82, 0.25)",
      },
    });

    const fitAddon = new FitAddon();
    const searchAddon = new SearchAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(searchAddon);

    terminal.loadAddon(
      new WebLinksAddon((event, uri) => {
        if (event.ctrlKey || event.metaKey) {
          window.open(uri, "_blank", "noopener,noreferrer");
        }
      })
    );

    terminal.open(container);

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;
    searchAddonRef.current = searchAddon;

    const fitTerminal = () => {
      try {
        if (!containerRef.current) {
          return;
        }

        fitAddon.fit();
      } catch (error) {
        console.error("Terminal fit error:", error);
      }
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fitTerminal();
      });
    });

    const copySelection = async () => {
      const text = terminal.getSelection();

      if (!text) return false;

      try {
        await navigator.clipboard.writeText(text);
      } catch (err) {
        try {
          const area = document.createElement("textarea");
          area.value = text;
          area.style.position = "fixed";
          area.style.opacity = "0";
          document.body.appendChild(area);
          area.select();
          document.execCommand("copy");
          document.body.removeChild(area);
        } catch (fallbackErr) {
          console.error("Copy failed:", fallbackErr);
        }
      }

      return true;
    };

    const pasteClipboard = async () => {
      try {
        const text = await navigator.clipboard.readText();

        if (text) {
          terminal.paste(text);
        }
      } catch (err) {
        console.error("Paste failed:", err);
      }
    };

    const setFontSize = (size) => {
      const next = Math.max(
        MIN_FONT_SIZE,
        Math.min(MAX_FONT_SIZE, size)
      );

      terminal.options.fontSize = next;

      requestAnimationFrame(() => {
        resizeTerminal();
      });
    };

    const zoomIn = () =>
      setFontSize((terminal.options.fontSize || DEFAULT_FONT_SIZE) + 1);

    const zoomOut = () =>
      setFontSize((terminal.options.fontSize || DEFAULT_FONT_SIZE) - 1);

    const zoomReset = () => setFontSize(DEFAULT_FONT_SIZE);

    const clearScreen = () => {
      terminal.clear();
      terminal.write("\x1b[2J\x1b[H");
      terminal.focus();
    };

    terminal.attachCustomKeyEventHandler((e) => {
      if (e.type !== "keydown") return true;

      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && !e.shiftKey && key === "c" && terminal.hasSelection()) {
        e.preventDefault();
        copySelection();
        terminal.clearSelection();
        return false;
      }

      if (ctrl && e.shiftKey && key === "c") {
        e.preventDefault();
        copySelection();
        return false;
      }

      if (ctrl && key === "v") {
        e.preventDefault();
        pasteClipboard();
        return false;
      }

      if (e.ctrlKey && e.key === "Insert") {
        e.preventDefault();
        copySelection();
        return false;
      }

      if (e.shiftKey && e.key === "Insert") {
        e.preventDefault();
        pasteClipboard();
        return false;
      }

      if (ctrl && e.shiftKey && key === "a") {
        e.preventDefault();
        terminal.selectAll();
        return false;
      }

      if (ctrl && !e.shiftKey && key === "k") {
        e.preventDefault();
        clearScreen();
        return false;
      }

      if (ctrl && !e.shiftKey && key === "f") {
        e.preventDefault();
        setSearchOpen(true);

        setTimeout(() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }, 0);

        return false;
      }

      if (ctrl && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        zoomIn();
        return false;
      }

      if (ctrl && (e.key === "-" || e.key === "_")) {
        e.preventDefault();
        zoomOut();
        return false;
      }

      if (ctrl && e.key === "0") {
        e.preventDefault();
        zoomReset();
        return false;
      }

      if (ctrl && e.key === "Home") {
        e.preventDefault();
        terminal.scrollToTop();
        return false;
      }

      if (ctrl && e.key === "End") {
        e.preventDefault();
        terminal.scrollToBottom();
        return false;
      }

      if (ctrl && e.key === "ArrowUp") {
        e.preventDefault();
        terminal.scrollLines(-1);
        return false;
      }

      if (ctrl && e.key === "ArrowDown") {
        e.preventDefault();
        terminal.scrollLines(1);
        return false;
      }

      if (e.shiftKey && e.key === "PageUp") {
        e.preventDefault();
        terminal.scrollPages(-1);
        return false;
      }

      if (e.shiftKey && e.key === "PageDown") {
        e.preventDefault();
        terminal.scrollPages(1);
        return false;
      }

      return true;
    });

    const terminalUrl = import.meta.env.VITE_TERMINAL_URL;

    if (!terminalUrl) {
      terminal.write("\r\n\x1b[31mVITE_TERMINAL_URL missing\x1b[0m\r\n");

      return () => {
        terminal.dispose();
      };
    }

    const socket = io(terminalUrl, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    function resizeTerminal() {
      try {
        if (!containerRef.current) {
          return;
        }

        fitAddon.fit();

        const cols = terminal.cols;
        const rows = terminal.rows;

        if (
          !socket.connected ||
          cols <= 0 ||
          rows <= 0
        ) {
          return;
        }

        socket.emit("terminal:resize", { cols, rows });
      } catch (error) {
        console.error("Terminal resize error:", error);
      }
    }

    socket.on("connect", () => {
      setConnected(true);

      callbackRef.current?.(socket.id);

      fitTerminal();

      socket.emit("terminal:init", {
        projectId,
        userId,
        cols: terminal.cols,
        rows: terminal.rows,
      });
    });

    socket.on("terminal:ready", ({ cols, rows }) => {
      console.log("TERMINAL READY:", { cols, rows });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resizeTerminal();
          terminal.focus();
        });
      });
    });

    socket.on("terminal:data", (data) => {
      if (data === undefined || data === null) {
        return;
      }

      terminal.write(String(data));
    });

    socket.on("terminal:files-changed", () => {
      filesChangedRef.current?.();
    });

    socket.on("terminal:clear", () => {
      clearScreen();
    });

    socket.on("connect_error", (error) => {
      setConnected(false);
      terminal.write(`\r\n\x1b[31m${error.message}\x1b[0m\r\n`);
    });

    socket.on("disconnect", () => {
      setConnected(false);
      callbackRef.current?.(null);
    });

    const disposable = terminal.onData((data) => {
      if (!socket.connected) {
        return;
      }

      socket.emit("terminal:write", data);
    });

    const handleWindowResize = () => {
      resizeTerminal();
    };

    window.addEventListener("resize", handleWindowResize);

    const resizeObserver = new ResizeObserver(() => {
      resizeTerminal();
    });

    resizeObserver.observe(container);

    const focusTerminal = () => {
      terminal.focus();
    };

    container.addEventListener("click", focusTerminal);

    const handleContextMenu = (e) => {
      e.preventDefault();

      if (terminal.hasSelection()) {
        copySelection();
        terminal.clearSelection();
      } else {
        pasteClipboard();
      }
    };

    container.addEventListener("contextmenu", handleContextMenu);

    const handleWheel = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;

      e.preventDefault();

      if (e.deltaY < 0) {
        zoomIn();
      } else {
        zoomOut();
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("resize", handleWindowResize);
      resizeObserver.disconnect();
      container.removeEventListener("click", focusTerminal);
      container.removeEventListener("contextmenu", handleContextMenu);
      container.removeEventListener("wheel", handleWheel);
      disposable.dispose();
      callbackRef.current?.(null);
      socket.disconnect();
      terminal.dispose();
      socketRef.current = null;
      terminalRef.current = null;
      fitAddonRef.current = null;
      searchAddonRef.current = null;
    };
  }, [projectId, userId]);

  const clearTerminal = () => {
    const terminal = terminalRef.current;
    if (!terminal) return;

    terminal.clear();
    terminal.write("\x1b[2J\x1b[H");
    terminal.focus();
  };

  const findNext = (text = searchText) => {
    if (!text) return;
    searchAddonRef.current?.findNext(text, { caseSensitive: false });
  };

  const findPrevious = (text = searchText) => {
    if (!text) return;
    searchAddonRef.current?.findPrevious(text, { caseSensitive: false });
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchText("");
    searchAddonRef.current?.clearDecorations?.();
    terminalRef.current?.clearSelection();
    terminalRef.current?.focus();
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        findPrevious();
      } else {
        findNext();
      }
    }

    if (e.key === "Escape") {
      e.preventDefault();
      closeSearch();
    }
  };

  return (
    <div className="relative flex h-full flex-col bg-black">
      <div className="flex h-7 shrink-0 items-center justify-between border-b border-white/10 px-3">
        <div className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              connected ? "bg-brand-green" : "bg-white/20"
            }`}
          />
          <span className="text-[11px] text-white/50">
            {connected ? "powershell — connected" : "powershell — disconnected"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setSearchOpen(true);
              setTimeout(() => {
                searchInputRef.current?.focus();
                searchInputRef.current?.select();
              }, 0);
            }}
            title="Find (Ctrl+F)"
            className="rounded p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Search size={12} />
          </button>

          <button
            type="button"
            onClick={clearTerminal}
            title="Clear terminal (Ctrl+K)"
            className="rounded p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Eraser size={12} />
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="absolute right-4 top-9 z-10 flex items-center gap-1 rounded-xl border border-white/10 bg-black/95 px-2.5 py-1.5 shadow-2xl backdrop-blur-md">
          <input
            ref={searchInputRef}
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              findNext(e.target.value);
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Find"
            className="w-44 bg-transparent px-1 text-[12px] text-white outline-none placeholder:text-white/30"
          />

          <button
            type="button"
            onClick={() => findPrevious()}
            title="Previous (Shift+Enter)"
            className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-white"
          >
            <ChevronUp size={13} />
          </button>

          <button
            type="button"
            onClick={() => findNext()}
            title="Next (Enter)"
            className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-white"
          >
            <ChevronDown size={13} />
          </button>

          <button
            type="button"
            onClick={closeSearch}
            title="Close (Esc)"
            className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-white"
          >
            <X size={13} />
          </button>
        </div>
      )}

      <div
        ref={containerRef}
        className="min-h-0 flex-1 cursor-text overflow-hidden"
      />
    </div>
  );
}