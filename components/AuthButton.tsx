"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export function signIn() {
  if (!supabase) return;
  supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + window.location.pathname },
  });
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!supabase) return setReady(true);
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  return { user, ready };
}

export default function AuthButton() {
  const { user, ready } = useUser();
  if (!supabase || !ready) return null;
  if (user)
    return (
      <button
        onClick={() => supabase!.auth.signOut()}
        className="rounded-full border border-line px-3 py-1.5 text-xs text-mute hover:border-navy hover:text-navy"
        title={user.email ?? ""}
      >
        Sign out
      </button>
    );
  return (
    <button onClick={signIn} className="rounded-full border border-navy px-3 py-1.5 text-xs font-semibold text-navy hover:bg-navy hover:text-white">
      Sign in
    </button>
  );
}
