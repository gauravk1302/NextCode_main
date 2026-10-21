import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  FolderOpen,
  Search,
  X,
  ArrowUpRight,
  Clock,
  FolderGit2,
  Rocket,
  Sparkles,
} from "lucide-react";

import Navbar from "../components/Nav";
import CreateProjectModal from "../components/CreateProjectModal";
import { ProjectCard } from "../components/ProjectCard";

import { logout } from "../features/logout";
import { createRoot } from "../features/file";
import {
  createProject,
  getProjects,
  getStarredProjects,
  toggleProjectStar,
  deleteProject,
} from "../features/project";

import { setUserdata } from "../redux/userSlice";
import { setProjects } from "../redux/projectSlice";
import { timeAgo } from "../utils/TimeAgo";

// Cards cycle through these; ProjectCard reads the `accent` prop.
const ACCENTS = ["orange", "lavender", "coral", "green"];

// `tone` is a full Tailwind bg class (must be written out in full so Tailwind can see it).
function StatCard({ icon: Icon, label, value, hint, tone }) {
  return (
    <div className={`cut rounded-2xl p-4 text-night ${tone}`}>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold">{label}</span>
        <Icon size={16} strokeWidth={2} />
      </div>

      <div className="mt-3 font-display text-[44px] leading-none tabular-nums">
        {value}
      </div>

      <p className="mt-2 text-[12px] font-medium opacity-75">{hint}</p>
    </div>
  );
}

const primaryBtn = `
  inline-flex items-center justify-center gap-2 rounded-full bg-white
  px-6 py-3 text-[14px] font-semibold text-black transition-colors
  hover:bg-brand-lime focus-visible:outline-2 focus-visible:outline-offset-2
  focus-visible:outline-white motion-reduce:transition-none
`;

function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const userdata = useSelector((state) => state.user.userData);
  const { projects = [] } = useSelector((state) => state.project);

  const [activeSection, setActiveSection] = useState("Projects");
  // Stats + "continue" strip always use the full list, even while the grid shows Starred.
  const [allProjects, setAllProjects] = useState([]);
  const [statsReady, setStatsReady] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  const searchRef = useRef(null);

  // "/" focuses the search box
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "/") return;

      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      e.preventDefault();
      searchRef.current?.focus();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ===================================================
  // API HANDLERS (logic unchanged)
  // ===================================================

  const handleLogout = async () => {
    try {
      await logout();
      dispatch(setUserdata(null));
      dispatch(setProjects([]));
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      const data = await getProjects();
      const list = data?.projects || [];
      dispatch(setProjects(list));
      setAllProjects(list);
    } catch (error) {
      console.log("Get projects error:", error);
      dispatch(setProjects([]));
    } finally {
      setLoadingProjects(false);
      setStatsReady(true);
    }
  };

  const fetchStarredProjects = async () => {
    try {
      setLoadingProjects(true);
      const data = await getStarredProjects();
      dispatch(setProjects(data?.projects || []));
    } catch (error) {
      console.log("Get starred projects error:", error);
      dispatch(setProjects([]));
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (!userdata) return;

    if (activeSection === "Starred") {
      fetchStarredProjects();
    } else {
      fetchProjects();
    }
  }, [userdata, activeSection]);

  const handleToggleStar = async (project) => {
    try {
      const data = await toggleProjectStar(project._id);

      if (!data?.success) return;

      setAllProjects((prev) =>
        prev.map((p) => (p._id === project._id ? data.project : p)),
      );

      // Starred page: an unstarred project leaves the list immediately.
      if (activeSection === "Starred") {
        if (!data.project.starred) {
          dispatch(setProjects(projects.filter((p) => p._id !== project._id)));
        }
        return;
      }

      dispatch(
        setProjects(
          projects.map((p) => (p._id === project._id ? data.project : p)),
        ),
      );
    } catch (error) {
      console.log("Toggle star error:", error);
    }
  };

  const handleDelete = async (project) => {
    try {
      const data = await deleteProject(project._id);

      if (!data?.success) return;

      setAllProjects((prev) => prev.filter((p) => p._id !== project._id));
      dispatch(setProjects(projects.filter((p) => p._id !== project._id)));
    } catch (error) {
      console.log("Delete project error:", error);
    }
  };

  const handleOpenProject = (project) => {
    if (!project?._id) return;
    navigate(`/project/${project._id}`);
  };

  const handleCreateProject = async (projectData) => {
    try {
      const result = await createProject(projectData);

      if (!result?.success || !result?.project) {
        console.log("Project creation failed");
        return;
      }

      await createRoot({
        projectId: result.project._id,
        projectName: result.project.name,
      });

      setOpenModal(false);
      setActiveSection("Projects");
      await fetchProjects();
    } catch (error) {
      console.log("Create project error:", error);
    }
  };

  // ===================================================
  // DERIVED DATA
  // ===================================================

  const now = new Date();

  const projectsThisMonth = allProjects.filter((p) => {
    if (!p?.createdAt) return false;
    const d = new Date(p.createdAt);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  }).length;

  const deploymentsCount = userdata?.deployments ?? 0;
  const creditsCount = userdata?.credits ?? 0;
  const firstName = userdata?.name?.split(" ")[0] || "there";

  const showStats = statsReady;

  const byRecent = (a, b) =>
    new Date(b?.updatedAt || b?.createdAt || 0) -
    new Date(a?.updatedAt || a?.createdAt || 0);

  const visibleProjects = useMemo(() => {
    const q = query.trim().toLowerCase();

    const list = q
      ? projects.filter(
          (p) =>
            (p?.name || "").toLowerCase().includes(q) ||
            (p?.description || "").toLowerCase().includes(q),
        )
      : [...projects];

    if (sortBy === "name") {
      list.sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));
    } else {
      list.sort(byRecent);
    }

    return list;
  }, [projects, query, sortBy]);

  const lastProject =
    showStats && allProjects.length > 0
      ? [...allProjects].sort(byRecent)[0]
      : null;

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar user={userdata} onLogout={handleLogout} credits={creditsCount} />

      <main className="mx-auto w-full max-w-[1200px] px-4 pb-20 sm:px-6 lg:px-8">
        {/* HERO */}
        <section className="grid gap-8 pb-10 pt-10 sm:pt-14 lg:grid-cols-[1.15fr_1fr] lg:items-end">
          <div>
            <h1 className="font-display text-[46px] uppercase leading-[0.98] sm:text-[68px] lg:text-[80px]">
              Welcome back,
              <br />
              {firstName}.
            </h1>

            <p className="mt-4 max-w-md text-[15px] text-white/60">
              What are you building today?
            </p>

            <button
              onClick={() => setOpenModal(true)}
              className={`${primaryBtn} mt-7`}
            >
              <Plus size={16} strokeWidth={2.5} />
              New project
            </button>
          </div>

          {showStats && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard
                icon={FolderGit2}
                label="Projects"
                value={allProjects.length}
                hint={`+${projectsThisMonth} this month`}
                tone="bg-brand-green"
              />

              <StatCard
                icon={Sparkles}
                label="AI credits"
                value={creditsCount}
                hint="credits remaining"
                tone="bg-brand-lime"
              />

              <StatCard
                icon={Rocket}
                label="Deployments"
                value={deploymentsCount}
                hint={
                  deploymentsCount > 0
                    ? "total deployments"
                    : "no deployments yet"
                }
                tone="bg-brand-orange"
              />
            </div>
          )}
        </section>

        {/* CONTINUE WHERE YOU LEFT OFF */}
        {lastProject && !query && (
          <button
            onClick={() => handleOpenProject(lastProject)}
            className="cut group mb-12 flex w-full items-center justify-between gap-4 rounded-2xl bg-brand-lavender px-5 py-4 text-left text-night transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-night motion-reduce:transition-none"
          >
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-night text-white">
                <Clock size={18} />
              </span>

              <div className="min-w-0">
                <p className="text-[12.5px] font-semibold opacity-70">
                  Continue where you left off
                </p>

                <p className="truncate font-display text-[28px] uppercase leading-tight">
                  {lastProject.name}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span className="hidden text-[13px] font-medium sm:inline">
                Updated{" "}
                {timeAgo(lastProject.updatedAt || lastProject.createdAt)}
              </span>

              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-night text-white">
                <ArrowUpRight
                  size={18}
                  className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
                />
              </span>
            </div>
          </button>
        )}

        {/* PROJECTS HEADER + CONTROLS */}
        <section>
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-[34px] uppercase leading-none sm:text-[44px]">
                {activeSection === "Starred"
                  ? "Starred projects"
                  : "Recent projects"}
              </h2>

              {!loadingProjects && projects.length > 0 && (
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[12px] tabular-nums text-white/70">
                  {visibleProjects.length}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* section switch */}
              <div className="flex rounded-full border border-white/10 p-1">
                {[
                  { key: "Projects", label: "All" },
                  { key: "Starred", label: "Starred" },
                ].map((s) => (
                  <button
                    key={s.key}
                    aria-pressed={activeSection === s.key}
                    onClick={() => {
                      setQuery("");
                      setActiveSection(s.key);
                    }}
                    className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors motion-reduce:transition-none ${
                      activeSection === s.key
                        ? "bg-white text-black"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {!loadingProjects && projects.length > 0 && (
                <>
                  <div className="relative flex-1 sm:flex-none">
                    <Search
                      size={14}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                    />

                    <input
                      ref={searchRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search projects"
                      className="h-10 w-full rounded-full border border-white/10 bg-white/[0.04] pl-9 pr-10 text-[13px] text-white outline-none transition-colors placeholder:text-white/40 focus:border-white/40 motion-reduce:transition-none sm:w-60"
                    />

                    {query ? (
                      <button
                        onClick={() => setQuery("")}
                        aria-label="Clear search"
                        className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-white/50 hover:text-white"
                      >
                        <X size={13} />
                      </button>
                    ) : (
                      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-white/15 px-1.5 text-[11px] text-white/40 sm:block">
                        /
                      </kbd>
                    )}
                  </div>

                  <div className="relative inline-flex w-[130px] shrink-0">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      aria-label="Sort projects"
                      className="
      h-10 w-full appearance-none
      rounded-full border border-white/10
      bg-[#050505] pl-5 pr-10
      text-[13px] font-medium text-white
      outline-none transition-all duration-200
      hover:border-white/20
      focus:border-white/30
      cursor-pointer
      [color-scheme:dark]
    "
                    >
                      <option value="recent">Recent</option>
                      <option value="name">Name</option>
                    </select>

                    <svg
                      className="pointer-events-none absolute right-4 top-1/2
      h-4 w-4 -translate-y-1/2 text-white/70"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m7 10 5 5 5-5" />
                    </svg>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* LIST */}
          {loadingProjects ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[176px] animate-pulse rounded-2xl bg-white/[0.06]"
                />
              ))}
            </div>
          ) : visibleProjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleProjects.map((p, i) => (
                <ProjectCard
                  key={p._id}
                  project={p}
                  accent={ACCENTS[i % ACCENTS.length]}
                  onOpen={handleOpenProject}
                  onToggleStar={handleToggleStar}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 px-4 py-14 text-center sm:py-20">
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <FolderOpen
                  size={22}
                  strokeWidth={1.75}
                  className="text-white/70"
                />
              </span>

              <h3 className="mb-1.5 text-[16px] font-semibold">
                {query
                  ? "No matching projects"
                  : activeSection === "Starred"
                    ? "No starred projects"
                    : "No projects yet"}
              </h3>

              <p className="mb-6 max-w-xs text-[13.5px] text-white/50">
                {query
                  ? `Nothing found for "${query}". Try a different name.`
                  : activeSection === "Starred"
                    ? "Star a project and it will show up here."
                    : "Create your first project and start coding."}
              </p>

              {activeSection === "Projects" && !query && (
                <button
                  onClick={() => setOpenModal(true)}
                  className={primaryBtn}
                >
                  <Plus size={16} strokeWidth={2.5} />
                  Create project
                </button>
              )}
            </div>
          )}
        </section>
      </main>

      <CreateProjectModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreate={handleCreateProject}
      />
    </div>
  );
}

export default Dashboard;
