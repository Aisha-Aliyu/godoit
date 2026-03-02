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
  const [user,        setUser]        = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthOpen,  setIsAuthOpen]  = useState(false);
  const [projects,        setProjects]        = useState([]);
  const [activeView,      setActiveView]      = useState("today");
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [taskCounts,      setTaskCounts]      = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [focusOpen,   setFocusOpen]   = useState(false);
  const [statsOpen,   setStatsOpen]   = useState(false);

  const music    = useAmbientMusic();
  const pomodoro = usePomodoro();
  const { toggle: toggleTheme, isDark } = useTheme();

  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.id) { setProjects([]); return; }
    fetchProjects(user.id).then(({ projects: p }) => {
      setProjects(p);
      if (p.length === 0 && supabase) {
        supabase
          .rpc("seed_default_projects", { p_user_id: user.id })
          .then(() => {
            fetchProjects(user.id).then(({ projects: fresh }) => setProjects(fresh));
          });
      }
    });
  }, [user?.id]);

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

  if (authLoading) {
    return (
      <div style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--paper)",
        gap: 16,
      }}>
        <div style={{
          width: 48, height: 48,
          background: "var(--terracotta)",
          borderRadius: 14,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: "1.6rem", fontWeight: 700,
          boxShadow: "var(--shadow-md)",
        }}>✓</div>
        <p style={{
          fontFamily: "var(--font-display)",
          color: "var(--ink-3)",
          fontSize: "0.9rem",
          fontStyle: "italic",
        }}>
          Opening your notebook…
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--paper)",
          gap: 28,
          padding: "40px 20px",
          textAlign: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 56, height: 56,
              background: "var(--terracotta)",
              borderRadius: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: "1.8rem", fontWeight: 700,
              boxShadow: "var(--shadow-md)",
            }}>✓</div>
            <span style={{
              fontFamily: "var(--font-display)",
              fontSize: "2.4rem",
              fontWeight: 600,
              color: "var(--ink)",
              letterSpacing: "-0.03em",
            }}>GoDoIt</span>
          </div>

          <p style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.1rem",
            color: "var(--ink-3)",
            fontStyle: "italic",
            maxWidth: 360,
            lineHeight: 1.7,
          }}>
            A calm, beautiful place to manage your days.<br />
            Tasks, music, focus — all in one notebook.
          </p>

          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "center",
            maxWidth: 360,
          }}>
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
              <span key={f} style={{
                background: "var(--parchment)",
                border: "var(--border-dark)",
                borderRadius: "var(--radius-full)",
                padding: "5px 12px",
                fontSize: "0.78rem",
                color: "var(--ink-2)",
                fontWeight: 600,
              }}>{f}</span>
            ))}
          </div>

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
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--terracotta)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Start your notebook →
          </button>

          <p style={{
            fontSize: "0.75rem",
            color: "var(--ink-4)",
            fontStyle: "italic",
            fontFamily: "var(--font-display)",
          }}>
            Free forever · No credit card needed
          </p>
        </div>

        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={(u) => { setUser(u); setIsAuthOpen(false); }}
        />
      </>
    );
  }

  return (
    <>
      <style>{`
        .app-layout {
          display: flex;
          min-height: 100dvh;
        }
        .app-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        @media (max-width: 768px) {
          .app-main {
            padding-bottom: 60px;
          }
        }
      `}</style>

      <div className="app-layout">
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

        <main className="app-main">
          <TaskList
            user={user}
            activeView={activeView}
            activeProjectId={activeProjectId}
            projects={projects}
            onCountsChange={setTaskCounts}
          />
        </main>
      </div>

      <BottomNav
        activeView={activeView}
        onViewChange={handleViewChange}
        onFocusOpen={() => setFocusOpen(true)}
        onMenuOpen={() => setSidebarOpen(true)}
        taskCounts={taskCounts}
      />

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

      <AnimatePresence>
        {statsOpen && (
          <StatsPanel
            userId={user?.id}
            isOpen={statsOpen}
            onClose={() => setStatsOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAuthOpen && (
          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
            onSuccess={(u) => { setUser(u); setIsAuthOpen(false); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
