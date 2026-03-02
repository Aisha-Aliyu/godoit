import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signIn, signUp, sendMagicLink } from "../../services/authService";
import styles from "./AuthModal.module.css";
import clsx from "clsx";

const TABS = [
  { id: "login",  label: "Sign in" },
  { id: "signup", label: "Sign up" },
  { id: "magic",  label: "✦ Magic link" },
];

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [tab,      setTab]      = useState("login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [magicSent,setMagicSent]= useState(false);

  const changeTab = (t) => { setTab(t); setError(""); setMagicSent(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");

    if (tab === "magic") {
      const { error: err } = await sendMagicLink(email);
      setLoading(false);
      if (err) { setError(err); return; }
      setMagicSent(true);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false); return;
    }

    const fn = tab === "signup" ? signUp : signIn;
    const { user, error: err } = await fn(email, password);
    setLoading(false);
    if (err) { setError(err); return; }
    onSuccess(user);
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
              {magicSent ? (
                <motion.div
                  key="sent"
                  className={styles.magicSent}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <div className={styles.magicIcon}>📬</div>
                  <p className={styles.magicTitle}>Check your inbox</p>
                  <p className={styles.magicSub}>Magic link sent to <strong>{email}</strong></p>
                  <button className={styles.backLink} onClick={() => setMagicSent(false)}>
                    Use different email
                  </button>
                </motion.div>
              ) : (
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

                  {tab !== "magic" && (
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
                  )}

                  {tab === "magic" && (
                    <p className={styles.magicHint}>
                      We'll send a one-click sign-in link to your email.
                    </p>
                  )}

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
                        {tab === "magic"  && "Send Magic Link"}
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
