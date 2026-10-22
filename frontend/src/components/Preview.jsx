import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";

export default function Preview({ tree = [] }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const srcDoc = useMemo(() => {
    let html = "";
    let css = "";
    let js = "";

    const walk = (items = []) => {
      for (const item of items) {
        if (item.type === "file") {
          if (item.name === "index.html") html = item.content || "";
          if (item.name.endsWith(".css")) css += `\n${item.content || ""}`;
          if (item.name.endsWith(".js")) js += `\n${item.content || ""}`;
        }

        if (item.children?.length) walk(item.children);
      }
    };

    walk(tree);

    if (!html) {
      return `
        <!DOCTYPE html>
        <html>
          <body style="
            margin:0;
            background:#000000;
            color:rgba(255,255,255,0.7);
            font-family:Arial,sans-serif;
            display:flex;
            align-items:center;
            justify-content:center;
            height:100vh;
          ">
            <div style="text-align:center;">
              <h3 style="margin:0 0 6px;color:#ffffff;font-size:15px;font-weight:600;">No index.html found</h3>
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.4);">Create an HTML project to see the preview.</p>
            </div>
          </body>
        </html>
      `;
    }

    if (css) {
      html = html.includes("</head>")
        ? html.replace("</head>", `<style>${css}</style></head>`)
        : `<style>${css}</style>${html}`;
    }

    if (js) {
      const script = `<script>\n${js}\n<\/script>`;
      html = html.includes("</body>") ? html.replace("</body>", `${script}</body>`) : html + script;
    }

    return html;
  }, [tree, refreshKey]);

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/10 bg-black px-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-brand-green" />
          <span className="text-xs font-semibold text-white/80">Preview</span>
        </div>

        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          title="Refresh"
          className="flex items-center gap-1.5 rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      <div className="min-h-0 flex-1 bg-white">
        <iframe
          key={refreshKey}
          title="Project Preview"
          srcDoc={srcDoc}
          sandbox="allow-scripts allow-forms allow-modals"
          className="h-full w-full border-0"
        />
      </div>
    </div>
  );
}