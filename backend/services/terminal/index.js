import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import { Server } from "socket.io";
import fs from "fs/promises";
import { watch as fsWatch } from "fs";
import path from "path";
import os from "os";
import pty from "node-pty";

// =====================================================
// CONFIG
// =====================================================

const PORT = process.env.PORT || 8004;

const FILE_SERVICE_URL =
  process.env.FILE_SERVICE_URL || "http://localhost:8003";

const WORKSPACE_ROOT =
  process.env.WORKSPACE_ROOT ||
  path.join(os.tmpdir(), "virtual-code-projects");

// Real shell — bash/zsh on Linux/Mac, PowerShell on Windows.
const SHELL =
  process.env.SHELL ||
  (process.platform === "win32"
    ? "powershell.exe"
    : "bash");

// PowerShell mein exit code "$?" se nahi milta (wo True/False deta hai),
// isliye alag expression use hota hai.
const IS_POWERSHELL = /powershell|pwsh/i.test(SHELL);

const EXIT_CODE_EXPR = IS_POWERSHELL
  ? "$(if ($?) { 0 } elseif ($LASTEXITCODE) { $LASTEXITCODE } else { 1 })"
  : "$?";

// -----------------------------------------------------
// WATCHER CONFIG
// -----------------------------------------------------

// Ye folders/files Mongo mein sync nahi honge
const IGNORE_NAMES = new Set([
  "node_modules",
  ".git",
  ".angular",
  ".next",
  ".nuxt",
  ".vite",
  ".cache",
  ".turbo",
  ".idea",
  ".gradle",
  ".venv",
  "venv",
  "__pycache__",
  "dist",
  "build",
  "out",
  "target",
  "coverage",
  ".DS_Store",
  "Thumbs.db",
]);

// Itni der changes ruk jayein, tab sync hoga
const WATCH_DEBOUNCE_MS = 1000;

// Isse badi ya binary files Mongo mein nahi jayengi
const MAX_TEXT_SIZE = 1024 * 1024;

// =====================================================
// APP
// =====================================================

const app = express();

app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

// =====================================================
// STATE
// One real PTY process per connected socket.
// =====================================================

const sessions = new Map();

// socket.id -> {
//   projectId,
//   userId,
//   cwd,
//   ptyProcess,
//   socket,
//   known,        // Map: relPath -> { id, type, content }
//   rootId,       // Mongo wrapper folder id
//   syncing,      // true jab Mongo -> disk sync chal raha ho
//   timer,        // debounce timer
//   watcher,      // fs.watch handle
//   flushChain    // promise chain (ek time par ek hi sync)
// }

// =====================================================
// HELPERS
// =====================================================

const send = (socket, data) => {
  if (!socket?.connected) return;

  socket.emit(
    "terminal:data",
    String(data ?? "")
  );
};

// -----------------------------------------------------
// Safe file/folder name
// -----------------------------------------------------

const safeName = (name) => {
  if (
    !name ||
    name === "." ||
    name === ".." ||
    name.includes("/") ||
    name.includes("\\")
  ) {
    throw new Error(
      `Invalid file/folder name: ${name}`
    );
  }

  return name;
};

// -----------------------------------------------------
// Workspace
// -----------------------------------------------------

const workspace = (projectId) => {
  return path.join(
    WORKSPACE_ROOT,
    String(projectId)
  );
};

// -----------------------------------------------------
// Normalize terminal dimensions
// -----------------------------------------------------

const normalizeCols = (cols) => {
  const value = Number(cols);

  if (!Number.isFinite(value)) {
    return 80;
  }

  return Math.max(
    20,
    Math.min(Math.floor(value), 500)
  );
};

const normalizeRows = (rows) => {
  const value = Number(rows);

  if (!Number.isFinite(value)) {
    return 30;
  }

  return Math.max(
    5,
    Math.min(Math.floor(value), 200)
  );
};

// =====================================================
// FILE SERVICE
// =====================================================

const getTree = async (projectId, userId) => {
  const url =
    `${FILE_SERVICE_URL}/tree/${projectId}`;

  const response = await fetch(url, {
    headers: {
      "x-user-id": String(userId),
    },
  });

  const text = await response.text();

  let data = {};

  try {
    data = text
      ? JSON.parse(text)
      : {};
  } catch {
    data = {
      message: text,
    };
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `File service returned ${response.status}`
    );
  }

  return Array.isArray(data.tree)
    ? data.tree
    : [];
};

// Generic file service call (create / update / delete)
const api = async (
  method,
  urlPath,
  userId,
  body
) => {
  const response = await fetch(
    `${FILE_SERVICE_URL}${urlPath}`,
    {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-user-id": String(userId),
      },
      body: body
        ? JSON.stringify(body)
        : undefined,
    }
  );

  const text = await response.text();

  let data = {};

  try {
    data = text
      ? JSON.parse(text)
      : {};
  } catch {
    data = {
      message: text,
    };
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
};

// Tree node ki id (Mongo _id ya id)
const idOf = (node) => {
  const value = node?._id ?? node?.id;

  return value === undefined || value === null
    ? null
    : String(value);
};

// =====================================================
// WRITE TREE TO DISK
// =====================================================

const writeNodes = async (
  nodes,
  directory
) => {
  if (!Array.isArray(nodes)) return;

  for (const node of nodes) {
    const name = safeName(node.name);

    const target = path.join(
      directory,
      name
    );

    // -----------------------------------------------
    // FOLDER
    // -----------------------------------------------

    if (node.type === "folder") {
      await fs.mkdir(target, {
        recursive: true,
      });

      await writeNodes(
        node.children || [],
        target
      );

      continue;
    }

    // -----------------------------------------------
    // FILE
    // -----------------------------------------------

    if (node.type === "file") {
      await fs.mkdir(
        path.dirname(target),
        {
          recursive: true,
        }
      );

      await fs.writeFile(
        target,
        node.content || "",
        "utf8"
      );
    }
  }
};

// =====================================================
// FIX index.html PATHS
//
// Kab kaam aata hai:
// - Explorer mein files ek wrapper folder ke andar
//   hoti hain, aur backend wo wrapper skip karta hai.
// - Isse kabhi kabhi index.html mein "/src/main.jsx"
//   likha hota hai par file disk par root mein hoti hai
//   (ya ulta).
//
// Kya karta hai:
// - index.html ke local src/href check karta hai
// - Agar file nahi mili, to "src/" lagake ya hatake
//   dhundta hai, aur mil jaye to path theek kar deta hai
//
// Safe kyun hai:
// - http/https/CDN links ko haath nahi lagata
// - Jo path pehle se sahi hai use nahi badalta
// - Angular, Next, Python, Java etc. mein index.html
//   root par na ho to kuch nahi karta
// =====================================================

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const fixIndexHtmlPaths = async (root) => {
  const indexPath = path.join(root, "index.html");

  let html;

  try {
    html = await fs.readFile(indexPath, "utf8");
  } catch {
    return; // index.html root par nahi hai, kuch nahi karna
  }

  // src="..." ya href="..." (colon wale = http: links skip)
  const refRegex =
    /(src|href)=(["'])((?:\.\/|\/)?[^"'#?:\s]+)\2/g;

  const matches = [...html.matchAll(refRegex)];

  let changed = false;

  for (const match of matches) {
    const [full, attr, quote, value] = match;

    // //cdn.example.com jaise links skip
    if (value.startsWith("//")) continue;

    const prefix = value.startsWith("/")
      ? "/"
      : value.startsWith("./")
        ? "./"
        : "";

    const rel = value.slice(prefix.length);

    // Sirf file jaise paths (extension wale)
    if (!rel || !path.extname(rel)) continue;

    // Path pehle se sahi hai
    if (await fileExists(path.join(root, rel))) continue;

    // Dusra option: src/ hatao ya src/ lagao
    const alt = rel.startsWith("src/")
      ? rel.slice(4)
      : `src/${rel}`;

    if (await fileExists(path.join(root, alt))) {
      html = html
        .split(full)
        .join(`${attr}=${quote}${prefix}${alt}${quote}`);

      changed = true;
    }
  }

  if (changed) {
    await fs.writeFile(indexPath, html, "utf8");
    console.log("INDEX.HTML PATH FIXED");
  }
};

// =====================================================
// SYNC PROJECT
// Mongo -> Disk
// =====================================================

const syncProject = async (
  projectId,
  userId
) => {
  const tree = await getTree(
    projectId,
    userId
  );

  const root = workspace(projectId);

  await fs.mkdir(root, {
    recursive: true,
  });

  // Mongo tree has an artificial root folder
  // wrapping the real project.
  //
  // Skip that wrapper so disk layout matches
  // the actual project root.

  if (
    tree.length === 1 &&
    tree[0]?.type === "folder"
  ) {
    await writeNodes(
      tree[0].children || [],
      root
    );
  } else {
    await writeNodes(
      tree,
      root
    );
  }

  // index.html ke paths theek karo (agar zarurat ho)
  try {
    await fixIndexHtmlPaths(root);
  } catch (error) {
    console.error(
      "INDEX.HTML FIX ERROR:",
      error
    );
  }

  console.log(
    "PROJECT SYNCED:",
    root
  );

  return {
    tree,
    root,
  };
};

// =====================================================
// DISK -> MONGO SYNC (WATCHER)
//
// Flow:
// 1. fs.watch disk ko dekhta hai
// 2. Change ruk jaye (debounce) to disk scan hota hai
// 3. Scan ko "known" list se compare karte hain
// 4. Naya = create, badla = update, gaya = delete
// 5. Frontend ko "terminal:files-changed" event jata hai
// =====================================================

// Path ya uske kisi folder ka naam ignore list mein hai?
const isIgnored = (relPath) =>
  String(relPath)
    .split("/")
    .some((part) => IGNORE_NAMES.has(part));

// Text file padho. Binary ya badi file ho to null.
const readText = async (absPath) => {
  try {
    const stat = await fs.stat(absPath);

    if (stat.size > MAX_TEXT_SIZE) return null;

    const buffer = await fs.readFile(absPath);

    if (buffer.includes(0)) return null;

    return buffer.toString("utf8");
  } catch {
    return null;
  }
};

// Extension se editor language
const LANGUAGES = {
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  ts: "typescript",
  tsx: "typescript",
  json: "json",
  html: "html",
  css: "css",
  scss: "scss",
  md: "markdown",
  py: "python",
  java: "java",
  xml: "xml",
  yml: "yaml",
  yaml: "yaml",
  sh: "shell",
  sql: "sql",
};

const languageOf = (name) => {
  const ext = name.includes(".")
    ? name.split(".").pop().toLowerCase()
    : "";

  return LANGUAGES[ext] || "plaintext";
};

// Mongo tree se "known" map banao
// relPath (jaise "components/App.jsx") -> { id, type }
const buildKnown = (tree) => {
  const known = new Map();

  let rootId = null;
  let nodes = tree;

  // syncProject ki tarah wrapper folder skip
  if (
    tree.length === 1 &&
    tree[0]?.type === "folder"
  ) {
    rootId = idOf(tree[0]);
    nodes = tree[0].children || [];
  }

  const walk = (list, prefix) => {
    for (const node of list) {
      const rel = prefix
        ? `${prefix}/${node.name}`
        : node.name;

      if (isIgnored(rel)) continue;

      known.set(rel, {
        id: idOf(node),
        type: node.type,
        content: null,
      });

      if (node.type === "folder") {
        walk(node.children || [], rel);
      }
    }
  };

  walk(nodes, "");

  return {
    known,
    rootId,
  };
};

// Sync ke baad disk jaisi hai wahi "baseline" hai.
// prune = true: jo Explorer se delete hua, use disk se bhi hatao.
const refreshBaseline = async (
  session,
  tree,
  { prune = false } = {}
) => {
  const { known, rootId } = buildKnown(tree);

  if (prune) {
    for (const rel of session.known.keys()) {
      if (!known.has(rel)) {
        await fs
          .rm(path.join(session.cwd, rel), {
            recursive: true,
            force: true,
          })
          .catch(() => {});
      }
    }
  }

  for (const [rel, entry] of known) {
    if (entry.type === "file") {
      entry.content = await readText(
        path.join(session.cwd, rel)
      );
    }
  }

  session.known = known;
  session.rootId = rootId;
};

// Disk ka poora scan (ignored folders chhodke)
const scanDisk = async (root) => {
  const found = new Map();

  const walk = async (dir, prefix) => {
    let entries;

    try {
      entries = await fs.readdir(dir, {
        withFileTypes: true,
      });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (IGNORE_NAMES.has(entry.name)) continue;

      const rel = prefix
        ? `${prefix}/${entry.name}`
        : entry.name;

      const abs = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        found.set(rel, {
          type: "folder",
          abs,
        });

        await walk(abs, rel);
      } else if (entry.isFile()) {
        found.set(rel, {
          type: "file",
          abs,
        });
      }
    }
  };

  await walk(root, "");

  return found;
};

// Disk aur Mongo ka fark nikalke Mongo update karo
const pushDiskChanges = async (session) => {
  const { projectId, userId, cwd: root } = session;

  const disk = await scanDisk(root);
  const known = session.known;

  let changed = false;
  let needResync = false;

  const parentIdOf = (rel) => {
    const index = rel.lastIndexOf("/");

    if (index === -1) return session.rootId;

    const parent = known.get(rel.slice(0, index));

    return parent ? parent.id : undefined;
  };

  // ---------------------------------------------
  // 1. CREATE (pehle parent folder, phir child)
  // ---------------------------------------------

  const toCreate = [...disk.keys()]
    .filter((rel) => !known.has(rel))
    .sort(
      (a, b) =>
        a.split("/").length -
        b.split("/").length
    );

  for (const rel of toCreate) {
    const item = disk.get(rel);
    const parentId = parentIdOf(rel);

    // Parent Mongo mein nahi bana to skip
    if (parentId === undefined) continue;

    const name = rel.split("/").pop();

    // ----- folder -----

    if (item.type === "folder") {
      const result = await api(
        "POST",
        "/folder",
        userId,
        { projectId, parentId, name }
      );

      if (result.ok) {
        known.set(rel, {
          id: idOf(result.data.folder),
          type: "folder",
          content: null,
        });

        changed = true;
      } else if (result.status === 409) {
        needResync = true;
      } else {
        console.error(
          "CREATE FOLDER FAILED:",
          rel,
          result.data?.message
        );
      }

      continue;
    }

    // ----- file -----

    const content = await readText(item.abs);

    // Binary / badi file Mongo mein nahi jayegi
    if (content === null) continue;

    let result = await api(
      "POST",
      "/file",
      userId,
      {
        projectId,
        parentId,
        name,
        language: languageOf(name),
        content,
      }
    );

    // Language accept na ho to plaintext se retry
    if (
      !result.ok &&
      result.status !== 409
    ) {
      result = await api(
        "POST",
        "/file",
        userId,
        {
          projectId,
          parentId,
          name,
          language: "plaintext",
          content,
        }
      );
    }

    if (result.ok) {
      known.set(rel, {
        id: idOf(result.data.file),
        type: "file",
        content,
      });

      changed = true;
    } else if (result.status === 409) {
      needResync = true;
    } else {
      console.error(
        "CREATE FILE FAILED:",
        rel,
        result.data?.message
      );
    }
  }

  // ---------------------------------------------
  // 2. UPDATE (content badla ho)
  // ---------------------------------------------

  for (const [rel, entry] of known) {
    if (entry.type !== "file") continue;

    const item = disk.get(rel);

    if (!item || item.type !== "file") continue;

    const content = await readText(item.abs);

    if (content === null) continue;

    if (content === entry.content) continue;

    const result = await api(
      "PUT",
      `/${entry.id}`,
      userId,
      { content }
    );

    if (result.ok) {
      entry.content = content;
      changed = true;
    } else {
      console.error(
        "UPDATE FAILED:",
        rel,
        result.data?.message
      );
    }
  }

  // ---------------------------------------------
  // 3. DELETE (disk se gayab hui)
  //
  // Safety: disk bilkul khali ho (workspace
  // saaf ho gaya) to kuch delete nahi karte.
  // Deepest pehle, kyunki delete API sirf ek
  // item ko delete karti hai.
  // ---------------------------------------------

  if (disk.size > 0) {
    const toDelete = [...known.keys()]
      .filter((rel) => !disk.has(rel))
      .sort(
        (a, b) =>
          b.split("/").length -
          a.split("/").length
      );

    for (const rel of toDelete) {
      const entry = known.get(rel);

      const result = await api(
        "DELETE",
        `/${entry.id}`,
        userId
      );

      if (result.ok) {
        known.delete(rel);
        changed = true;
      } else {
        console.error(
          "DELETE FAILED:",
          rel,
          result.data?.message
        );
      }
    }
  }

  // ---------------------------------------------
  // 4. Agar "already exists" aaya to known list
  //    Mongo se dobara bana lo
  // ---------------------------------------------

  if (needResync) {
    try {
      const tree = await getTree(
        projectId,
        userId
      );

      await refreshBaseline(session, tree);
    } catch (error) {
      console.error(
        "WATCHER RESYNC ERROR:",
        error
      );
    }
  }

  // ---------------------------------------------
  // 5. Frontend ko batao (Explorer refresh)
  // ---------------------------------------------

  if (changed && session.socket?.connected) {
    session.socket.emit(
      "terminal:files-changed",
      { projectId }
    );

    console.log(
      "DISK -> MONGO SYNCED:",
      projectId
    );
  }
};

// Ek time par ek hi sync chale (queue)
const flushChanges = (session) => {
  session.flushChain = session.flushChain
    .then(() => pushDiskChanges(session))
    .catch((error) => {
      console.error(
        "WATCHER ERROR:",
        error
      );
    });

  return session.flushChain;
};

const stopWatcher = (session) => {
  if (!session) return;

  clearTimeout(session.timer);

  try {
    session.watcher?.close();
  } catch {}

  session.watcher = null;
};

const startWatcher = (session) => {
  stopWatcher(session);

  try {
    session.watcher = fsWatch(
      session.cwd,
      { recursive: true },
      (event, filename) => {
        // Mongo -> disk sync ke time ignore
        if (session.syncing || !filename) return;

        const rel = String(filename)
          .split(path.sep)
          .join("/");

        if (isIgnored(rel)) return;

        clearTimeout(session.timer);

        session.timer = setTimeout(() => {
          flushChanges(session);
        }, WATCH_DEBOUNCE_MS);
      }
    );

    session.watcher.on("error", (error) => {
      console.error("WATCHER ERROR:", error);
    });
  } catch (error) {
    console.error(
      "WATCHER START ERROR:",
      error
    );
  }
};

// =====================================================
// SOCKET CONNECTION
// =====================================================

io.on("connection", (socket) => {
  console.log(
    "TERMINAL CONNECTED:",
    socket.id
  );

  // =================================================
  // INIT
  // Spawn a real PTY for this socket
  // =================================================

  socket.on(
    "terminal:init",
    async ({
      projectId,
      userId,
      cols = 80,
      rows = 30,
    }) => {
      try {
        projectId = String(projectId);
        userId = String(userId);

        // -------------------------------------------
        // VALIDATION
        // -------------------------------------------

        if (!projectId || !userId) {
          throw new Error(
            "Project ID and User ID are required"
          );
        }

        // -------------------------------------------
        // If a session already exists for this
        // socket, clean it before creating another.
        // -------------------------------------------

        const existingSession =
          sessions.get(socket.id);

        if (existingSession) {
          stopWatcher(existingSession);

          try {
            existingSession.ptyProcess.kill();
          } catch {}

          sessions.delete(socket.id);
        }

        // -------------------------------------------
        // TERMINAL SIZE
        // -------------------------------------------

        cols = normalizeCols(cols);
        rows = normalizeRows(rows);

        // -------------------------------------------
        // SYNC PROJECT
        // Mongo -> disk
        // -------------------------------------------

        const { root, tree } =
          await syncProject(
            projectId,
            userId
          );

        // -------------------------------------------
        // SPAWN REAL SHELL
        // -------------------------------------------

        const ptyProcess = pty.spawn(
          SHELL,
          [],
          {
            name: "xterm-256color",

            // IMPORTANT:
            // Use the dimensions coming from xterm.
            // This prevents the initial 80-column
            // PowerShell prompt from being rendered
            // against a differently sized terminal.

            cols,
            rows,

            cwd: root,

            env: {
              ...process.env,
              FORCE_COLOR: "1",
            },
          }
        );

        // -------------------------------------------
        // PTY OUTPUT -> CLIENT
        // -------------------------------------------

        ptyProcess.onData((data) => {
          send(socket, data);
        });

        // -------------------------------------------
        // SAVE SESSION
        // -------------------------------------------

        const session = {
          projectId,
          userId,
          cwd: root,
          ptyProcess,
          socket,
          known: new Map(),
          rootId: null,
          syncing: false,
          timer: null,
          watcher: null,
          flushChain: Promise.resolve(),
        };

        sessions.set(socket.id, session);

        // -------------------------------------------
        // PTY EXIT
        // -------------------------------------------

        ptyProcess.onExit(
          ({ exitCode }) => {
            send(
              socket,
              `\r\n\x1b[90m[shell exited: ${exitCode}]\x1b[0m\r\n`
            );

            const current =
              sessions.get(socket.id);

            if (
              current?.ptyProcess ===
              ptyProcess
            ) {
              stopWatcher(current);

              sessions.delete(
                socket.id
              );
            }
          }
        );

        // -------------------------------------------
        // WATCHER
        // Baseline banao, phir disk dekhna shuru
        // -------------------------------------------

        await refreshBaseline(session, tree);

        startWatcher(session);

        console.log(
          "TERMINAL INIT:",
          {
            socketId: socket.id,
            projectId,
            userId,
            cwd: root,
            cols,
            rows,
          }
        );

        // -------------------------------------------
        // IMPORTANT:
        // Tell frontend that PTY is ready.
        // Frontend can now perform the final resize
        // and focus the terminal.
        // -------------------------------------------

        socket.emit(
          "terminal:ready",
          {
            cols,
            rows,
          }
        );
      } catch (error) {
        console.error(
          "TERMINAL INIT ERROR:",
          error
        );

        send(
          socket,
          `\r\n\x1b[31m${error.message}\x1b[0m\r\n`
        );
      }
    }
  );

  // =================================================
  // USER INPUT
  //
  // Raw keystrokes go straight to PTY.
  //
  // PowerShell/bash handles:
  // - typing
  // - backspace
  // - history
  // - ctrl+c
  // - tab completion
  // - arrows
  // - command editing
  //
  // No manual buffer required.
  // =================================================

  socket.on(
    "terminal:write",
    (data) => {
      const session =
        sessions.get(socket.id);

      if (!session) return;

      if (
        data === undefined ||
        data === null
      ) {
        return;
      }

      try {
        session.ptyProcess.write(
          String(data)
        );
      } catch (error) {
        console.error(
          "PTY WRITE ERROR:",
          error
        );
      }
    }
  );

  // =================================================
  // RESIZE
  // =================================================

  socket.on(
    "terminal:resize",
    ({ cols, rows }) => {
      const session =
        sessions.get(socket.id);

      if (!session) return;

      cols = Number(cols);
      rows = Number(rows);

      // -------------------------------------------
      // Validate
      // -------------------------------------------

      if (
        !Number.isFinite(cols) ||
        !Number.isFinite(rows)
      ) {
        return;
      }

      cols = normalizeCols(cols);
      rows = normalizeRows(rows);

      try {
        session.ptyProcess.resize(
          cols,
          rows
        );
      } catch (error) {
        console.error(
          "PTY RESIZE ERROR:",
          error
        );
      }
    }
  );

  // =================================================
  // AI-DRIVEN COMMAND
  //
  // Runs command on the same PTY.
  //
  // A unique marker is appended so we know when
  // the command has finished and what its exit code is.
  // =================================================

  socket.on(
    "terminal:run-command",
    async ({
      projectId:
        requestedProjectId,
      userId:
        requestedUserId,
      command,
      requestId,
    }) => {
      const session =
        sessions.get(socket.id);

      try {
        // -------------------------------------------
        // SESSION
        // -------------------------------------------

        if (!session) {
          throw new Error(
            "Terminal not initialized"
          );
        }

        // -------------------------------------------
        // PROJECT SECURITY
        // -------------------------------------------

        if (
          String(requestedProjectId) !==
          String(session.projectId)
        ) {
          throw new Error(
            "Project mismatch"
          );
        }

        // -------------------------------------------
        // USER SECURITY
        // -------------------------------------------

        if (
          String(requestedUserId) !==
          String(session.userId)
        ) {
          throw new Error(
            "User mismatch"
          );
        }

        // -------------------------------------------
        // PEHLE terminal ke changes Mongo mein bhejo
        // (warna sync unhe overwrite kar dega)
        // -------------------------------------------

        await flushChanges(session);

        // -------------------------------------------
        // REFRESH DISK FROM MONGO
        //
        // This makes newly created files,
        // package.json etc. available to the shell.
        // -------------------------------------------

        session.syncing = true;

        try {
          const { tree } =
            await syncProject(
              session.projectId,
              session.userId
            );

          // prune: Explorer se delete hui files
          // disk se bhi hat jayengi
          await refreshBaseline(
            session,
            tree,
            { prune: true }
          );
        } finally {
          session.syncing = false;
        }

        // -------------------------------------------
        // COMMAND
        // -------------------------------------------

        const commandText =
          String(command || "").trim();

        if (!commandText) {
          socket.emit(
            "terminal:command-result",
            {
              success: true,
              requestId,
            }
          );

          return;
        }

        // -------------------------------------------
        // UNIQUE MARKER
        // -------------------------------------------

        const marker =
          `__CMD_DONE_${requestId}__`;

        let buffer = "";

        let exitCode = null;

        // -------------------------------------------
        // LISTEN FOR COMMAND COMPLETION
        // -------------------------------------------

        const onData = (chunk) => {
          buffer += chunk;

          const markerIndex =
            buffer.indexOf(marker);

          if (markerIndex === -1) {
            return;
          }

          const markerOutput =
            buffer.slice(markerIndex);

          const match =
            markerOutput.match(
              new RegExp(
                `${marker}:(\\d+)`
              )
            );

          if (!match) {
            return;
          }

          exitCode =
            Number(match[1]);

          cleanup();

          socket.emit(
            "terminal:command-result",
            {
              success:
                exitCode === 0,

              requestId,

              command:
                commandText,

              code:
                exitCode,
            }
          );
        };

        const disposable =
          session.ptyProcess.onData(
            onData
          );

        // -------------------------------------------
        // TIMEOUT
        // -------------------------------------------

        const timeout =
          setTimeout(() => {
            cleanup();

            socket.emit(
              "terminal:command-result",
              {
                success: false,
                requestId,
                error:
                  "Command timeout",
              }
            );
          }, 120000);

        // -------------------------------------------
        // CLEANUP
        // -------------------------------------------

        function cleanup() {
          clearTimeout(timeout);

          try {
            disposable.dispose();
          } catch {}
        }

        // -------------------------------------------
        // RUN COMMAND
        //
        // The marker contains the exit code.
        //
        // bash:
        //   npm install; echo "__CMD_DONE_xxx__:$?"
        //
        // PowerShell:
        //   npm install; echo "__CMD_DONE_xxx__:$(...)"
        //
        // -------------------------------------------

        session.ptyProcess.write(
          commandText +
            '; echo "' +
            marker +
            ":" +
            EXIT_CODE_EXPR +
            '"\r'
        );
      } catch (error) {
        console.error(
          "AI COMMAND ERROR:",
          error
        );

        socket.emit(
          "terminal:command-result",
          {
            success: false,
            requestId,
            error: error.message,
          }
        );
      }
    }
  );

  // =================================================
  // DISCONNECT
  // =================================================

  socket.on(
    "disconnect",
    async () => {
      console.log(
        "TERMINAL DISCONNECTED:",
        socket.id
      );

      const session =
        sessions.get(socket.id);

      if (session) {
        // Jaate jaate pending changes save kar do
        stopWatcher(session);

        try {
          await flushChanges(session);
        } catch {}

        try {
          session.ptyProcess.kill();
        } catch {}

        sessions.delete(
          socket.id
        );
      }
    }
  );
});

// =====================================================
// HTTP EXECUTE
//
// Same external API as before.
// =====================================================

app.post(
  "/execute",
  async (req, res) => {
    try {
      const {
        socketId,
        projectId,
        userId,
        command,
      } = req.body;

      // -------------------------------------------
      // VALIDATION
      // -------------------------------------------

      if (
        !socketId ||
        !projectId ||
        !userId ||
        !command
      ) {
        return res.status(400).json({
          success: false,
          message:
            "socketId, projectId, userId and command are required",
        });
      }

      // -------------------------------------------
      // SOCKET
      // -------------------------------------------

      const socket =
        io.sockets.sockets.get(
          socketId
        );

      if (!socket) {
        return res.status(404).json({
          success: false,
          message:
            "Terminal socket not connected",
        });
      }

      // -------------------------------------------
      // SESSION
      // -------------------------------------------

      const session =
        sessions.get(socketId);

      if (!session) {
        return res.status(400).json({
          success: false,
          message:
            "Terminal session not initialized",
        });
      }

      // -------------------------------------------
      // PROJECT SECURITY
      // -------------------------------------------

      if (
        String(session.projectId) !==
        String(projectId)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Project mismatch",
        });
      }

      // -------------------------------------------
      // USER SECURITY
      // -------------------------------------------

      if (
        String(session.userId) !==
        String(userId)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "User mismatch",
        });
      }

      // -------------------------------------------
      // REQUEST ID
      // -------------------------------------------

      const requestId =
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

      // -------------------------------------------
      // WAIT FOR COMMAND RESULT
      // -------------------------------------------

      const result =
        await new Promise(
          (resolve) => {
            const timeout =
              setTimeout(() => {
                socket.off(
                  "terminal:command-result",
                  handler
                );

                resolve({
                  success: false,
                  requestId,
                  error:
                    "Command timeout",
                });
              }, 120000);

            const handler = (
              data
            ) => {
              if (
                data?.requestId !==
                requestId
              ) {
                return;
              }

              clearTimeout(
                timeout
              );

              socket.off(
                "terminal:command-result",
                handler
              );

              resolve(data);
            };

            socket.on(
              "terminal:command-result",
              handler
            );

            socket.emit(
              "terminal:run-command",
              {
                projectId,
                userId,
                command,
                requestId,
              }
            );
          }
        );

      return res.json(result);
    } catch (error) {
      console.error(
        "EXECUTE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// =====================================================
// HEALTH
// =====================================================

app.get(
  "/",
  (req, res) => {
    res.json({
      success: true,
      message:
        "Terminal service running",
    });
  }
);

app.get(
  "/health",
  (req, res) => {
    res.json({
      success: true,
      service: "terminal",
      port: PORT,
    });
  }
);

// =====================================================
// START
// =====================================================

await fs.mkdir(
  WORKSPACE_ROOT,
  {
    recursive: true,
  }
);

server.listen(
  PORT,
  () => {
    console.log(
      "================================="
    );

    console.log(
      `TERMINAL SERVICE : ${PORT}`
    );

    console.log(
      `FILE SERVICE     : ${FILE_SERVICE_URL}`
    );

    console.log(
      `WORKSPACE ROOT   : ${WORKSPACE_ROOT}`
    );

    console.log(
      `SHELL            : ${SHELL}`
    );

    console.log(
      "================================="
    );
  }
);