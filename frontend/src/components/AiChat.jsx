import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Send,
  Sparkles,
  Loader2,
  Bot,
  User,
  Copy,
  Check,
  FolderPlus,
  FilePlus2,
  FilePen,
  TerminalSquare,
} from "lucide-react";

import { chatWithAI } from "../features/ai";

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="my-2 overflow-hidden rounded-lg border border-white/10 bg-black">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-white/40">
          {language || "text"}
        </span>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? (
            <>
              <Check size={11} className="text-brand-green" />
              Copied
            </>
          ) : (
            <>
              <Copy size={11} />
              Copy
            </>
          )}
        </button>
      </div>

      <SyntaxHighlighter
        language={language || "text"}
        style={oneDark}
        customStyle={{
          margin: 0,
          background: "transparent",
          padding: "10px 12px",
          fontSize: "12.5px",
        }}
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

function Markdown({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="mb-2 leading-relaxed last:mb-0">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-white">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-brand-lavender underline underline-offset-2 hover:text-brand-lime"
          >
            {children}
          </a>
        ),
        ul: ({ children }) => (
          <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        h1: ({ children }) => (
          <h1 className="mb-2 mt-3 text-[15px] font-bold text-white">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-2 mt-3 text-[14px] font-bold text-white">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-1.5 mt-2 text-[13px] font-semibold text-white">{children}</h3>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-2 border-l-2 border-brand-lavender/60 pl-3 text-white/60">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="my-3 border-white/10" />,
        table: ({ children }) => (
          <div className="my-2 overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-white/[0.05]">{children}</thead>,
        th: ({ children }) => (
          <th className="border border-white/10 px-2 py-1 text-left font-semibold text-white">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-white/10 px-2 py-1">{children}</td>
        ),
        pre: ({ children }) => <>{children}</>,
        code({ className, children }) {
          const match = /language-(\w+)/.exec(className || "");
          const code = String(children).replace(/\n$/, "");
          const isBlock = Boolean(match) || code.includes("\n");

          if (!isBlock) {
            return (
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-[12.5px] text-brand-lime">
                {code}
              </code>
            );
          }

          return <CodeBlock language={match?.[1]} code={code} />;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

const TOOL_META = {
  folder_created: { icon: FolderPlus, color: "text-brand-lavender", label: "Created folder" },
  file_created: { icon: FilePlus2, color: "text-brand-green", label: "Created file" },
  file_updated: { icon: FilePen, color: "text-brand-orange", label: "Updated file" },
  command_result: { icon: TerminalSquare, color: "text-brand-lime", label: "Ran command" },
};

function ToolBadge({ toolType, detail }) {
  const meta = TOOL_META[toolType];
  if (!meta) return null;

  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center"
    >
      <div className="flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/60">
        <Icon size={12} className={`shrink-0 ${meta.color}`} />
        <span className="shrink-0">{meta.label}</span>
        {detail && <span className="truncate text-white/40">&middot; {detail}</span>}
      </div>
    </motion.div>
  );
}

export default function AIChat({ projectId, terminalSocketId, onFilesChanged }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [input]);

  const pushToolBadge = (toolType, detail) => {
    setMessages((prev) => [...prev, { role: "tool", toolType, detail }]);
  };

  const handleSend = async () => {
    const message = input.trim();
    if (!message || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((msg) => ({ role: msg.role, content: msg.content }));

      await chatWithAI({
        projectId,
        message,
        history,
        terminalSocketId,

        onEvent: async (type, data) => {
          if (type === "start" || type === "tool_start") return;

          if (type === "folder_created") {
            pushToolBadge("folder_created", data?.folder?.name);
            await onFilesChanged?.();
            return;
          }

          if (type === "file_created") {
            pushToolBadge("file_created", data?.file?.name);
            await onFilesChanged?.();
            return;
          }

          if (type === "file_updated") {
            pushToolBadge("file_updated", data?.file?.name);
            await onFilesChanged?.();
            return;
          }

          if (type === "command_result") {
            pushToolBadge("command_result", data?.command);
            return;
          }

          if (type === "message") {
            const content = data?.content || "";
            if (!content) return;

            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];

              if (last?.role === "assistant") {
                copy[copy.length - 1] = { ...last, content };
              } else {
                copy.push({ role: "assistant", content });
              }

              return copy;
            });

            return;
          }

          if (type === "error") {
            throw new Error(data?.message || "AI error");
          }
        },
      });
    } catch (error) {
      console.error("AI chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: error?.message || "Something went wrong.", error: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = !loading && input.trim().length > 0;

  return (
    <div className="flex h-full w-full flex-col bg-black">
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-orange text-night">
          <Sparkles size={13} strokeWidth={2.5} />
        </span>

        <span className="text-xs font-semibold tracking-wider text-white/80">
          NextCode AI
        </span>

        {loading && (
          <span className="ml-auto flex items-center gap-1.5 text-[10.5px] text-white/50">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-green" />
            working
          </span>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 && (
          <div className="mt-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-lavender text-night">
              <Sparkles size={22} />
            </div>
            <p className="text-sm font-semibold text-white/80">What do you want to build?</p>
            <p className="mt-1.5 text-xs text-white/40">Ask me to create or modify files.</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((message, index) => {
            if (message.role === "tool") {
              return (
                <ToolBadge key={index} toolType={message.toolType} detail={message.detail} />
              );
            }

            const isUser = message.role === "user";

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    isUser ? "bg-white/10 text-white/70" : "bg-brand-orange text-night"
                  }`}
                >
                  {isUser ? <User size={12} /> : <Bot size={12} />}
                </div>

                <div
                  className={`min-w-0 max-w-[85%] rounded-xl px-3 py-2 text-[13px] ${
                    isUser
                      ? "bg-brand-lavender text-night"
                      : message.error
                      ? "border border-brand-coral/30 bg-brand-coral/10 text-brand-coral"
                      : "border border-white/10 bg-white/[0.04] text-white/75"
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap break-words font-medium leading-relaxed">
                      {message.content}
                    </p>
                  ) : (
                    <Markdown content={message.content || ""} />
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {loading && (
          <div className="flex items-center gap-2 pl-8 text-xs text-white/50">
            <Loader2 size={13} className="animate-spin" />
            <span>AI is working...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 border-t border-white/10 p-3">
        <div className="flex items-end gap-2 rounded-2xl border border-white/15 bg-white/[0.04] py-1.5 pl-3.5 pr-1.5 transition-colors focus-within:border-white/40">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Ask AI to build something..."
            rows={1}
            className="max-h-[140px] min-h-[28px] flex-1 resize-none self-center bg-transparent py-1 text-[16px] leading-[20px] text-white outline-none placeholder:text-white/40 disabled:opacity-60 md:text-[13px]"
          />

          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={handleSend}
            disabled={!canSend}
            aria-label="Send message"
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors motion-reduce:transition-none ${
              canSend
                ? "bg-brand-lime text-night hover:bg-white"
                : "bg-white/10 text-white/30"
            } disabled:cursor-not-allowed`}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </motion.button>
        </div>
      </div>
    </div>
  );
}