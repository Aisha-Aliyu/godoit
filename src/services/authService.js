import { supabase } from "../lib/supabase";

export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) return { user: null, error: error.message };
  return { user: data.user, error: null };
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) return { user: null, error: error.message };
  return { user: data.user, error: null };
};

export const sendMagicLink = async (email) => {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: true },
  });
  return { error: error?.message || null };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error: error?.message || null };
};
