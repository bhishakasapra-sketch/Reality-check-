"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { useApp } from "@/components/AppProvider";

export default function Login() {
  const sb = getSupabase();
  const { user } = useApp();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [err, setErr] = useState("");
  useEffect(() => { if (new URLSearchParams(window.location.search).get("error")) setErr("That sign-in link has expired or was already used. Request a new one."); }, []);

  if (!sb) return (
    <div className="wrap auth-card panel">
      <h2>Accounts aren’t set up yet</h2>
      <p className="muted" style={{ marginTop: 10 }}>This copy of Reality Check is running in guest mode, so progress is saved in this browser. To enable sign-in, add your Supabase keys as described in the README.</p>
      <Link className="btn btn-primary" href="/dashboard">Go to my dashboard</Link>
    </div>
  );
  if (user) return (
    <div className="wrap auth-card panel">
      <h2>You’re signed in</h2>
      <p className="muted" style={{ marginTop: 10 }}>As {user.email}.</p>
      <Link className="btn btn-primary" href="/dashboard">Go to my dashboard</Link>
    </div>
  );

  const redirect = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
  async function magic() {
    setErr("");
    if (!/^\S+@\S+\.\S+$/.test(email)) { setErr("Enter a valid email address."); return; }
    setState("sending");
    const { error } = await sb!.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } });
    if (error) { setErr(error.message); setState("idle"); } else setState("sent");
  }
  async function google() {
    setErr("");
    const { error } = await sb!.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirect } });
    if (error) setErr(error.message);
  }

  return (
    <div className="wrap auth-card panel">
      <h2>Sign in to Reality Check</h2>
      <p className="muted" style={{ marginTop: 10 }}>Save simulations to your account, track progress across devices, join the leaderboard and compare decisions with others. New here? Signing in creates your account.</p>
      {state === "sent" ? (
        <p style={{ marginTop: 16 }}><b>Check your inbox.</b> We sent a sign-in link to {email}. Open it on this device.</p>
      ) : (
        <>
          <label htmlFor="em" className="small" style={{ display: "block", marginTop: 16 }}><b>Email</b></label>
          <input id="em" type="text" inputMode="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && magic()} style={{ marginTop: 6 }} />
          <button className="btn btn-primary" style={{ width: "100%", marginTop: 12 }} disabled={state === "sending"} onClick={magic}>{state === "sending" ? "Sending link…" : "Email me a sign-in link"}</button>
          <button className="btn btn-ghost" style={{ width: "100%", marginTop: 10 }} onClick={google}>Continue with Google</button>
        </>
      )}
      {err && <p className="small err" style={{ marginTop: 12 }}>{err}</p>}
      <p className="tiny muted" style={{ marginTop: 16 }}>You can keep using everything without an account; progress is then saved in this browser only.</p>
    </div>
  );
}
