import { supabase } from "../lib/supabase";

const NOT_CONFIGURED = "Sign-in isn't set up on this site yet.";

// Supabase reports network failures as "Failed to fetch". That usually means the
// project is paused or unreachable, so say that in plain words.
const describe = (message) =>
  /failed to fetch|network/i.test(message || "")
    ? "Can't reach the server right now. Please try again in a minute."
    : message;

export const signUp = async (email, password) => {
  if (!supabase) return { user: null, error: NOT_CONFIGURED };
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) return { user: null, error: describe(error.message) };
    // With "Confirm email" on in Supabase, sign-up returns no session until the
    // email link is clicked, so the person is not signed in yet
    if (!data.session) {
      return {
        user: null,
        error: "Account created. Confirm it from the email we sent, then sign in.",
      };
    }
    return { user: data.user, error: null };
  } catch (err) {
    return { user: null, error: describe(err?.message) };
  }
};

export const signIn = async (email, password) => {
  if (!supabase) return { user: null, error: NOT_CONFIGURED };
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) return { user: null, error: describe(error.message) };
    return { user: data.user, error: null };
  } catch (err) {
    return { user: null, error: describe(err?.message) };
  }
};

export const signOut = async () => {
  if (!supabase) return { error: null };
  const { error } = await supabase.auth.signOut();
  return { error: error?.message || null };
};
