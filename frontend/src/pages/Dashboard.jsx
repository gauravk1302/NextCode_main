import React, { useEffect, useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../utils/firebase";
import { login } from "../features/login";
import { logout } from "../features/logout";
import { useDispatch, useSelector } from "react-redux";

import Navbar from "../components/Nav";
import Sidebar from "../components/Sidebar";

import { Plus, FolderOpen, Loader2, Menu, X } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

import { setUserdata } from "../redux/userSlice";
import { setProjects, starProject } from "../redux/projectSlice";

import CreateProjectModal from "../components/CreateProjectModal";
import { ProjectCard } from "../components/ProjectCard";
import { useNavigate } from "react-router-dom";
import { createRoot } from "../features/file";
import {
  createProject,
  getProjects,
  getStarredProjects,
  toggleProjectStar,
  deleteProject,
} from "../features/project";

// =====================================================
// DASHBOARD
// =====================================================

function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ===================================================
  // REDUX
  // ===================================================

  const userdata = useSelector((state) => state.user.userData);
  const { projects = [] } = useSelector((state) => state.project);

  // ===================================================
  // STATE
  // ===================================================

  const [activeSection, setActiveSection] = useState("Projects");
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ===================================================
  // LOGIN
  // ===================================================

  const handleLogin = async () => {
    setLoggingIn(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      const data = await login(token);
      dispatch(setUserdata(data));
    } catch (error) {
      console.log("Login error:", error);
    } finally {
      setLoggingIn(false);
    }
  };

  // ===================================================
  // LOGOUT
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

  // ===================================================
  // FETCH ALL PROJECTS
  // ===================================================

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      const data = await getProjects();
      dispatch(setProjects(data?.projects || []));
    } catch (error) {
      console.log("Get projects error:", error);
      dispatch(setProjects([]));
    } finally {
      setLoadingProjects(false);
    }
  };

  // ===================================================
  // FETCH STARRED PROJECTS
  // ===================================================

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

  // ===================================================
  // LOAD PROJECTS
  // ===================================================

  useEffect(() => {
    if (!userdata) {
      return;
    }

    if (activeSection === "Starred") {
      fetchStarredProjects();
    } else {
      fetchProjects();
    }
  }, [userdata, activeSection]);

  // ===================================================
  // TOGGLE STAR
  // ===================================================

  const handleToggleStar = async (project) => {
    try {
      const data = await toggleProjectStar(project._id);

      dispatch(starProject(project?._id));

      if (!data?.success) {
        return;
      }

      // STARRED PAGE
      if (activeSection === "Starred") {
        if (!data.project.starred) {
          dispatch(setProjects(projects.filter((p) => p._id !== project._id)));
        }
        return;
      }

      // ALL PROJECTS PAGE
      dispatch(
        setProjects(
          projects.map((p) => (p._id === project._id ? data.project : p))
        )
      );
    } catch (error) {
      console.log("Toggle star error:", error);
    }
  };

  // ===================================================
  // DELETE PROJECT
  // ===================================================

  const handleDelete = async (project) => {
    try {
      const data = await deleteProject(project._id);

      if (!data?.success) {
        return;
      }

      dispatch(setProjects(projects.filter((p) => p._id !== project._id)));
    } catch (error) {
      console.log("Delete project error:", error);
    }
  };

  // ===================================================
  // OPEN PROJECT
  // ===================================================

  const handleOpenProject = (project) => {
    if (!project?._id) {
      return;
    }

    navigate(`/project/${project._id}`);
  };

  // ===================================================
  // CREATE PROJECT
  // ===================================================

  const handleCreateProject = async (projectData) => {
    try {
      const result = await createProject(projectData);

      if (!result?.success || !result?.project) {
        console.log("Project creation failed");
        return;
      }

      // CREATE ROOT FOLDER
      await createRoot({
        projectId: result.project._id,
        projectName: result.project.name,
      });

      // CLOSE MODAL
      setOpenModal(false);

      // RETURN TO PROJECTS
      setActiveSection("Projects");

      // REFRESH PROJECTS
      await fetchProjects();
    } catch (error) {
      console.log("Create project error:", error);
    }
  };

  // ===================================================
  // NOT LOGGED IN
  // ===================================================

  if (!userdata) {
    return (
      <div
        className="
          relative
          flex
          h-screen
          w-full
          items-center
          justify-center
          overflow-hidden
          bg-black
          px-4
          font-['DM_Sans',sans-serif]
        "
      >
        {/* Ambient glow */}

        <div
          className="
            pointer-events-none
            absolute
            -top-32
            left-1/2
            h-[600px]
            w-[600px]
            -translate-x-1/2
            rounded-full
            bg-[#A78BFA]/[0.12]
            blur-[120px]
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -bottom-40
            right-0
            h-[420px]
            w-[420px]
            rounded-full
            bg-[#FF9A22]/[0.08]
            blur-[120px]
          "
        />

        {/* Login Card */}

        <div
          className="
            relative
            w-full
            max-w-sm
            rounded-2xl
            border
            border-white/10
            bg-white/[0.03]
            p-6
            sm:p-8
            text-center
            shadow-xl
            shadow-black/60
            backdrop-blur-xl
          "
        >
          <div
            className="
              mx-auto
              mb-5
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-xl
              bg-[#E8FF3F]
              shadow-lg
              shadow-[#E8FF3F]/20
            "
          >
            <span
              className="
                font-['Anton',sans-serif]
                text-xl
                tracking-wide
                text-black
              "
            >
              AI
            </span>
          </div>

          <h2
            className="
              mb-2
              font-['Anton',sans-serif]
              text-2xl
              sm:text-3xl
              font-normal
              uppercase
              tracking-wide
              text-white
            "
          >
            Welcome to <span className="text-[#E8FF3F]">NextCode</span>
          </h2>

          <p
            className="
              mb-6
              text-[13px]
              sm:text-[13.5px]
              leading-relaxed
              text-zinc-400
            "
          >
            Sign in to access your projects
            and continue building.
          </p>

          <button
            onClick={handleLogin}
            disabled={loggingIn}
            className="
              flex
              w-full
              items-center
              justify-center
              gap-3
              rounded-lg
              bg-white
              py-2.5
              text-[13.5px]
              font-semibold
              text-black
              shadow-sm
              transition-colors
              duration-150
              hover:bg-[#E8FF3F]
              disabled:opacity-70
            "
          >
            {loggingIn ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <FcGoogle size={18} />
            )}

            {loggingIn ? "Signing in..." : "Continue with Google"}
          </button>

          <p
            className="
              mt-5
              text-[11px]
              text-zinc-600
            "
          >
            By continuing you agree to our
            Terms & Privacy Policy.
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // DASHBOARD
  // ===================================================

  return (
    <div
      className="
        relative
        flex
        h-screen
        w-full
        flex-col
        overflow-hidden
        bg-black
        font-['DM_Sans',sans-serif]
      "
    >
      {/* Ambient glow */}

      <div
        className="
          pointer-events-none
          absolute
          -top-40
          left-1/3
          hidden
          h-[700px]
          w-[700px]
          rounded-full
          bg-[#A78BFA]/[0.10]
          blur-[140px]
          md:block
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          right-0
          top-1/3
          hidden
          h-[500px]
          w-[500px]
          rounded-full
          bg-[#FF9A22]/[0.07]
          blur-[130px]
          md:block
        "
      />

      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* NAVBAR */}

        <Navbar
          user={userdata}
          onLogout={handleLogout}
          onToggleSidebar={() => setMobileSidebarOpen((v) => !v)}
        />

        <div className="relative flex min-h-0 flex-1">
          {/* SIDEBAR — DESKTOP */}

          <div className="hidden md:block">
            <Sidebar
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              credits={userdata.credits || 0}
            />
          </div>

          {/* SIDEBAR — MOBILE DRAWER */}

          {mobileSidebarOpen && (
            <div className="fixed inset-0 z-40 md:hidden">
              {/* backdrop */}
              <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => setMobileSidebarOpen(false)}
              />

              {/* drawer panel */}
              <div className="absolute left-0 top-0 h-full w-72 max-w-[80vw] border-r border-white/10 bg-black shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
                  <span className="font-['Anton',sans-serif] text-lg uppercase tracking-wide text-[#E8FF3F]">
                    Menu
                  </span>
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/[0.08] hover:text-white"
                    aria-label="Close menu"
                  >
                    <X size={18} />
                  </button>
                </div>

                <Sidebar
                  activeSection={activeSection}
                  setActiveSection={(section) => {
                    setActiveSection(section);
                    setMobileSidebarOpen(false);
                  }}
                  credits={userdata.credits || 0}
                />
              </div>
            </div>
          )}

          {/* MAIN */}

          <main
            className="
              min-h-0
              flex-1
              overflow-y-auto
              px-4
              py-5
              sm:px-6
              sm:py-6
              lg:px-8
              lg:py-8
              [scrollbar-width:thin]
              [scrollbar-color:rgba(167,139,250,0.45)_transparent]
              [&::-webkit-scrollbar]:w-2
              [&::-webkit-scrollbar-track]:bg-transparent
              [&::-webkit-scrollbar-thumb]:rounded-full
              [&::-webkit-scrollbar-thumb]:bg-[#A78BFA]/40
              [&::-webkit-scrollbar-thumb]:border-2
              [&::-webkit-scrollbar-thumb]:border-solid
              [&::-webkit-scrollbar-thumb]:border-transparent
              [&::-webkit-scrollbar-thumb]:bg-clip-padding
              hover:[&::-webkit-scrollbar-thumb]:bg-[#A78BFA]/70
            "
          >
            {/* MOBILE MENU BUTTON */}

            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="
                mb-4
                flex
                items-center
                gap-2
                rounded-lg
                border
                border-white/10
                bg-white/[0.04]
                px-3
                py-2
                text-[12.5px]
                font-medium
                text-zinc-300
                shadow-sm
                md:hidden
              "
            >
              <Menu size={15} className="text-[#E8FF3F]" />
              Menu
            </button>

            {/* HEADER */}

            <div
              className="
                mb-6
                sm:mb-8
                flex
                flex-col
                sm:flex-row
                sm:items-start
                sm:justify-between
                gap-3
                sm:gap-4
              "
            >
              <div>
                <h1
                  className="
                    flex
                    items-center
                    gap-2
                    font-['Anton',sans-serif]
                    text-2xl
                    sm:text-3xl
                    lg:text-[34px]
                    font-normal
                    uppercase
                    tracking-wide
                    text-white
                  "
                >
                  Welcome back,{" "}
                  <span className="text-[#A78BFA]">
                    {userdata?.name?.split(" ")[0] || "there"}
                  </span>
                  <span>👋</span>
                </h1>

                <p
                  className="
                    mt-1
                    text-[13px]
                    sm:text-[13.5px]
                    text-zinc-400
                  "
                >
                  Ready to build something
                  amazing today?
                </p>
              </div>

              {/* NEW PROJECT */}

              <button
                onClick={() => setOpenModal(true)}
                className="
                  flex
                  w-full
                  sm:w-auto
                  shrink-0
                  items-center
                  justify-center
                  gap-1.5
                  rounded-lg
                  bg-[#E8FF3F]
                  px-4
                  py-2.5
                  text-[13.5px]
                  font-bold
                  text-black
                  shadow-sm
                  shadow-[#E8FF3F]/20
                  transition-all
                  duration-150
                  hover:bg-[#FF9A22]
                "
              >
                <Plus size={16} />
                New Project
              </button>
            </div>

            {/* PROJECT HEADING */}

            <div className="mb-4 flex items-center justify-between">
              <h2
                className="
                  font-['Anton',sans-serif]
                  text-lg
                  sm:text-xl
                  font-normal
                  uppercase
                  tracking-wide
                  text-white
                "
              >
                {activeSection === "Starred"
                  ? "Starred Projects"
                  : "Recent Projects"}
              </h2>
            </div>

            {/* LOADING */}

            {loadingProjects ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <Loader2 size={28} className="animate-spin text-[#E8FF3F]" />
              </div>
            ) : projects?.length > 0 ? (
              /* PROJECTS */

              <div
                className="
                  mb-8
                  grid
                  grid-cols-1
                  gap-3
                  sm:grid-cols-2
                  sm:gap-4
                  lg:grid-cols-3
                  xl:grid-cols-4
                "
              >
                {projects.map((p) => (
                  <ProjectCard
                    key={p._id}
                    project={p}
                    onOpen={handleOpenProject}
                    onToggleStar={handleToggleStar}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              /* EMPTY */

              <div
                className="
                  mb-8
                  flex
                  flex-col
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-dashed
                  border-[#A78BFA]/30
                  bg-white/[0.02]
                  px-4
                  py-12
                  sm:py-16
                  text-center
                "
              >
                <div
                  className="
                    mb-4
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-full
                    bg-[#A78BFA]/15
                  "
                >
                  <FolderOpen size={24} className="text-[#A78BFA]" />
                </div>

                <h3
                  className="
                    mb-1.5
                    font-['Anton',sans-serif]
                    text-xl
                    font-normal
                    uppercase
                    tracking-wide
                    text-white
                  "
                >
                  {activeSection === "Starred"
                    ? "No starred projects"
                    : "No projects yet"}
                </h3>

                <p
                  className="
                    mb-5
                    max-w-xs
                    text-[13px]
                    text-zinc-500
                  "
                >
                  {activeSection === "Starred"
                    ? "Star a project to see it here."
                    : "Create your first project and start building something amazing!"}
                </p>

                {activeSection === "Projects" && (
                  <button
                    onClick={() => setOpenModal(true)}
                    className="
                      flex
                      items-center
                      gap-1.5
                      rounded-lg
                      bg-[#E8FF3F]
                      px-4
                      py-2.5
                      text-[13.5px]
                      font-bold
                      text-black
                      shadow-sm
                      shadow-[#E8FF3F]/20
                      transition-all
                      duration-150
                      hover:bg-[#FF9A22]
                    "
                  >
                    <Plus size={16} />
                    Create Project
                  </button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* =================================================
          CREATE PROJECT MODAL
      ================================================= */}

      <CreateProjectModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreate={handleCreateProject}
      />
    </div>
  );
}

export default Dashboard;