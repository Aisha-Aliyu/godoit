import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { supabase } from "./lib/supabase";
import { signOut } from "./services/authService";
import { fetchProjects } from "./services/taskService";
import { useAmbientMusic } from "./hooks/useAmbientMusic";
import { usePomodoro } from "./hooks/usePomodoro";
import { useTheme } from "./hooks/useTheme";
import AuthModal from "./components/Auth/AuthModal";
import Sidebar from "./components/Sidebar/Sidebar";
import TaskList from "./components/TaskList/TaskList";
import BottomNav from "./components/BottomNav/BottomNav";
import FocusMode from "./components/FocusMode/FocusMode";
import StatsPanel from "./components/Stats/StatsPanel";

function App() {
  // ── Auth ──────────────────────────────────────────────────────────
  const [user,         setUser]         = useState(null);
  const [authLoading,  setAuthLoading]  = useState(true);
  const [isAuthOpen,   setIsAuthOpen]   = useState(false);

  // ── Navigation ────────────────────────────────────────────────────
  const [projects,        setProjects]        = useState([]);
  const [activeView,      setActiveView]      = useState("today");
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [taskCounts,      setTaskCounts]      = useState({});

  // ── UI Panels ─────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [focusOpen,   setFocusOpen]   = useState(false);
  const [statsOpen,   setStatsOpen]   = useState(false);

  // ── Feature Hooks ─────────────────────────────────────────────────
  const music    = useAmbientMusic();
  const pomodoro = usePomodoro();
  const { theme, toggle: toggleTheme, isDark } = useTheme();

  // ── Auth Listener ─────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setAuthLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // ── Load Projects ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) {
      setProjects([]);
      return;
    }

    fetchProjects(user.id).then(({ projects: p }) => {
      setProjects(p);

      // Seed default projects on first login
      if (p.length === 0 && supabase) {
        supabase
          .rpc("seed_default_projects", { p_user_id: user.id })
          .then(() => {
            fetchProjects(user.id).then(({ projects: fresh }) =>
              setProjects(fresh)
            );
          });
      }
    });
  }, [user?.id]);

  // ── Navigation Handlers ───────────────────────────────────────────
  const handleViewChange = (view) => {
    setActiveView(view);
    setActiveProjectId(null);
    setSidebarOpen(false);
  };

  const handleProjectSelect = (id) => {
    setActiveProjectId(id);
    setActiveView(null);
    setSidebarOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setProjects([]);
    setActiveView("today");
    setActiveProjectId(null);
    setSidebarOpen(false);
  };

  // ── Prop Bundles ──────────────────────────────────────────────────
  const musicProps = {
    isPlaying:    music.isPlaying,
    currentTrack: music.currentTrack,
    volume:       music.volume,
    setVolume:    music.setVolume,
    loading:      music.loading,
    visualizer:   music.visualizer,
    toggle:       music.toggle,
    switchTrack:  music.switchTrack,
  };

  const pomodoroProps = {
    preset:       pomodoro.preset,
    phase:        pomodoro.phase,
    display:      pomodoro.display,
    progress:     pomodoro.progress,
    isRunning:    pomodoro.isRunning,
    sessions:     pomodoro.sessions,
    toggle:       pomodoro.toggle,
    reset:        pomodoro.reset,
    changePreset: pomodoro.changePreset,
  };

  // ── Loading Screen ────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div
        style={{
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--paper)",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            background: "var(--terracotta)",
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: "1.6rem",
            fontWeight: 700,
            boxShadow: "var(--shadow-md)",
          }}
        >
          ✓
        </div>
        <p
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--ink-3)",
            fontSize: "0.9rem",
            fontStyle: "italic",
          }}
        >
          Opening your notebook…
        </p>
      </div>
    );
  }

  // ── Landing Page (not logged in) ──────────────────────────────────
  if (!user) {
    return (
      <>
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--paper)",
            gap: 28,
            padding: "40px 20px",
            textAlign: "center",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 56,
                height: 56,
                background: "var(--terracotta)",
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: "1.8rem",
                fontWeight: 700,
                boxShadow: "var(--shadow-md)",
              }}
            >
              ✓
            </div>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2.4rem",
                fontWeight: 600,
                color: "var(--ink)",
                letterSpacing: "-0.03em",
              }}
            >
              GoDoIt
            </span>
          </div>

          {/* Tagline */}
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.1rem",
              color: "var(--ink-3)",
              fontStyle: "italic",
              maxWidth: 360,
              lineHeight: 1.7,
            }}
          >
            A calm, beautiful place to manage your days.
            <br />
            Tasks, music, focus — all in one notebook.
          </p>

          {/* Feature pills */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              justifyContent: "center",
              maxWidth: 360,
            }}
          >
            {[
              "✓ Projects & priorities",
              "↻ Recurring tasks",
              "🎵 Ambient music",
              "🎯 Pomodoro timer",
              "◉ Subtasks",
              "📅 Due dates",
              "🌙 Dark mode",
              "📊 Progress stats",
            ].map((f) => (
              <span
                key={f}
                style={{
                  background: "var(--parchment)",
                  border: "var(--border-dark)",
                  borderRadius: "var(--radius-full)",
                  padding: "5px 12px",
                  fontSize: "0.78rem",
                  color: "var(--ink-2)",
                  fontWeight: 600,
                }}
              >
                {f}
              </span>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => setIsAuthOpen(true)}
            style={{
              background: "var(--terracotta)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-full)",
              padding: "14px 40px",
              fontSize: "1rem",
              fontWeight: 700,
              fontFamily: "var(--font-body)",
              cursor: "pointer",
              boxShadow: "var(--shadow-md)",
              transition: "all 0.18s ease",
              letterSpacing: "0.02em",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--terracotta-dark)";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "var(--shadow-lg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--terracotta)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "var(--shadow-md)";
            }}
          >
            Start your notebook →
          </button>

          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--ink-4)",
              fontStyle: "italic",
              fontFamily: "var(--font-display)",
            }}
          >
            Free forever · No credit card needed
          </p>
        </div>

        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={(u) => {
            setUser(u);
            setIsAuthOpen(false);
          }}
        />
      </>
    );
  }

  // ── Main App ──────────────────────────────────────────────────────
  return (
    <>
{/* Mobile backdrop */}
<div
  onClick={() => setSidebarOpen(false)}
  className="mobile-backdrop"
  style={{
    position: "fixed",
    inset: 0,
    background: "rgba(26,21,16,0.4)",
    backdropFilter: "blur(4px)",
    zIndex: 199,
    display: sidebarOpen ? "block" : "none",   // ← JS controls this directly
  }}
/>


      {/* Responsive layout: sidebar + main */}
      <div style={{ display: "flex", minHeight: "100dvh" }}>

        {/* Sidebar — sticky on desktop, drawer on mobile */}
        <div
          style={{
            position: "sticky",
            top: 0,
            height: "100dvh",
            flexShrink: 0,
            width: "var(--sidebar-w)",
          }}
        >
<style>{`
  @media (max-width: 768px) {
    .mobile-backdrop { display: block !important; }
    .desktop-sidebar {
      position: fixed !important;
      left: 0; top: 0; bottom: 0;
      z-index: 200;
      transform: translateX(${sidebarOpen ? "0" : "-100%"});
      transition: transform 0.28s cubic-bezier(0.22,1,0.36,1);
      box-shadow: 0 8px 32px rgba(26,21,16,0.15);
    }
    .app-main { margin-left: 0 !important; }
  }
  @media (min-width: 769px) {
    .mobile-backdrop { display: none !important; }
    .desktop-sidebar {
      position: sticky !important;
      transform: none !important;
      box-shadow: none !important;
    }
  }
`}</style>

          <Sidebar
            user={user}
            projects={projects}
            activeView={activeView}
            onViewChange={handleViewChange}
            onProjectSelect={handleProjectSelect}
            activeProjectId={activeProjectId}
            onProjectsChange={setProjects}
            onSignOut={handleSignOut}
            taskCounts={taskCounts}
            pomodoroProps={pomodoroProps}
            musicProps={musicProps}
            onThemeToggle={toggleTheme}
            isDark={isDark}
            onStatsOpen={() => setStatsOpen(true)}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        {/* Main content area */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <TaskList
            user={user}
            activeView={activeView}
            activeProjectId={activeProjectId}
            projects={projects}
            onCountsChange={setTaskCounts}
          />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav
        activeView={activeView}
        onViewChange={handleViewChange}
        onFocusOpen={() => setFocusOpen(true)}
        onMenuOpen={() => setSidebarOpen(true)}
        taskCounts={taskCounts}
      />

      {/* Focus Mode overlay */}
      <AnimatePresence>
        {focusOpen && (
          <FocusMode
            isOpen={focusOpen}
            onClose={() => setFocusOpen(false)}
            pomodoroProps={pomodoroProps}
            musicProps={musicProps}
            taskCount={
              activeProjectId
                ? taskCounts[activeProjectId] || 0
                : taskCounts[activeView] || 0
            }
          />
        )}
      </AnimatePresence>

      {/* Stats panel */}
      <AnimatePresence>
        {statsOpen && (
          <StatsPanel
            userId={user?.id}
            isOpen={statsOpen}
            onClose={() => setStatsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Auth modal (shown if session expires mid-session) */}
      <AnimatePresence>
        {isAuthOpen && (
          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
            onSuccess={(u) => {
              setUser(u);
              setIsAuthOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
