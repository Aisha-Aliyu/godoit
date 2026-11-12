import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signIn, signUp } from "../../services/authService";
import styles from "./AuthModal.module.css";
import clsx from "clsx";

// Magic link sign-in was removed: Supabase's free built-in email only reaches the
// project's own team, at 2 emails an hour, so visitors never received their link.
const TABS = [
  { id: "login",  label: "Sign in" },
  { id: "signup", label: "Sign up" },
];

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [tab,      setTab]      = useState("login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const changeTab = (t) => { setTab(t); setError(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const fn = tab === "signup" ? signUp : signIn;
      const { user, error: err } = await fn(email, password);
      if (err) { setError(err); return; }
      onSuccess(user);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className={styles.modal}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Logo */}
          <div className={styles.header}>
            <div className={styles.logo}>
              <span className={styles.logoMark}>✓</span>
              <span className={styles.logoText}>GoDoIt</span>
            </div>
            <p className={styles.tagline}>Your tasks, beautifully organized.</p>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            {TABS.map((t) => (
              <button
                key={t.id}
                className={clsx(styles.tab, { [styles.tabActive]: tab === t.id })}
                onClick={() => changeTab(t.id)}
              >
                {t.label}
                {tab === t.id && (
                  <motion.div className={styles.tabBar} layoutId="auth-tab-bar" />
                )}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className={styles.body}>
            <AnimatePresence mode="wait">
                <motion.form
                  key={tab}
                  className={styles.form}
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.16 }}
                  noValidate
                >
                  <div className={styles.field}>
                    <label className={styles.label}>Email</label>
                    <input
                      className={styles.input}
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Password</label>
                    <input
                      className={styles.input}
                      type="password"
                      placeholder={tab === "signup" ? "Min. 8 characters" : "Your password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={tab === "signup" ? "new-password" : "current-password"}
                      required
                    />
                  </div>

                  {error && (
                    <motion.p
                      className={styles.error}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {error}
                    </motion.p>
                  )}

                  <button type="submit" className={styles.submitBtn} disabled={loading}>
                    {loading ? <span className={styles.spinner} /> : (
                      <>
                        {tab === "login"  && "Sign In"}
                        {tab === "signup" && "Create Account"}
                      </>
                    )}
                  </button>
                </motion.form>
            </AnimatePresence>
          </div>

          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
