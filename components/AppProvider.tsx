"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase, supabaseConfigured } from "@/lib/supabase/client";
import {
  BADGES, XP, earnedBadges, emptyCounts, emptyProgress,
  type ChallengeAnswer, type HistoryItem, type Kind, type Module, type Progress, type SavedSim
} from "@/lib/progress";

const LS_KEY = "realitycheck-v1";
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const now = () => new Date().toISOString();

type AIContextData = { page: string; data: unknown };
type Ctx = {
  mode: "local" | "cloud";
  configured: boolean;
  user: User | null;
  displayName: string;
  ready: boolean;
  progress: Progress;
  award: (kind: Kind, hist?: { module: Module; name: string; params: Record<string, unknown> | null }) => void;
  updateLastHistory: (module: Module, params: Record<string, unknown>) => void;
  saveSim: (module: Module, name: string, params: Record<string, unknown>) => Promise<void>;
  deleteSim: (id: string) => Promise<void>;
  recordChallenge: (challengeId: string, answer: Omit<ChallengeAnswer, "t">, isDaily: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  toast: (msg: string) => void;
  ai: AIContextData;
  setAI: (page: string, data: unknown) => void;
  aiOpen: boolean;
  setAIOpen: (o: boolean) => void;
};
const AppCtx = createContext<Ctx | null>(null);
export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp must be used inside <AppProvider>");
  return c;
};

function loadLocal(): Progress {
  try {
    const v = JSON.parse(localStorage.getItem(LS_KEY) || "null");
    if (!v) return emptyProgress();
    return { ...emptyProgress(), ...v, counts: { ...emptyCounts(), ...(v.counts || {}) } };
  } catch { return emptyProgress(); }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [ready, setReady] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [ai, setAIState] = useState<AIContextData>({ page: "home", data: null });
  const [aiOpen, setAIOpen] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const mode: "local" | "cloud" = user ? "cloud" : "local";

  const toast = useCallback((msg: string) => {
    setToastMsg(msg); clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 2600);
  }, []);
  const setAI = useCallback((page: string, data: unknown) => setAIState({ page, data }), []);

  /* ── load progress for the current identity ── */
  const loadCloud = useCallback(async (u: User) => {
    if (!supabase) return;
    const [prof, ev, sims, hist, resp] = await Promise.all([
      supabase.from("profiles").select("display_name, xp").eq("id", u.id).maybeSingle(),
      supabase.from("events").select("kind, created_at").eq("user_id", u.id).limit(5000),
      supabase.from("simulations").select("id, module, name, params, created_at").order("created_at", { ascending: false }).limit(50),
      supabase.from("history").select("id, module, name, params, created_at").order("created_at", { ascending: false }).limit(40),
      supabase.from("challenge_responses").select("challenge_id, choice, reasoning, words, updated_at")
    ]);
    const counts = emptyCounts(); const days = new Set<string>();
    (ev.data || []).forEach((e: { kind: Kind; created_at: string }) => {
      counts[e.kind] = (counts[e.kind] || 0) + 1;
      if (e.kind === "daily") days.add(e.created_at.slice(0, 10));
    });
    const chal: Progress["chal"] = {};
    (resp.data || []).forEach((r: { challenge_id: string; choice: string; reasoning: string; words: number; updated_at: string }) => {
      chal[r.challenge_id] = { pick: r.choice, why: r.reasoning || "", words: r.words, t: r.updated_at };
    });
    const p: Progress = {
      xp: prof.data?.xp ?? 0, counts, days: [...days], chal,
      saved: (sims.data || []) as SavedSim[], history: (hist.data || []) as HistoryItem[], badges: []
    };
    p.badges = earnedBadges(p);
    setDisplayName(prof.data?.display_name || u.email?.split("@")[0] || "You");
    setProgress(p);
  }, [supabase]);

  useEffect(() => {
    if (!supabase) { setProgress(loadLocal()); setReady(true); return; }
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) await loadCloud(data.user); else setProgress(loadLocal());
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setUser(prev => {
        if ((prev?.id ?? null) !== (u?.id ?? null)) {
          if (u) loadCloud(u); else { setProgress(loadLocal()); setDisplayName(""); }
        }
        return u;
      });
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase, loadCloud]);

  // local mode persists to this browser
  useEffect(() => {
    if (ready && mode === "local") { try { localStorage.setItem(LS_KEY, JSON.stringify(progress)); } catch { /* storage full or blocked */ } }
  }, [progress, mode, ready]);

  /* ── mutations ── */
  const pushEvent = useCallback((kind: Kind) => {
    if (user && supabase) supabase.from("events").insert({ kind }).then(({ error }) => { if (error) console.warn("event not recorded", error.message); });
  }, [user, supabase]);

  const applyBadges = useCallback((p: Progress): Progress => {
    const fresh = earnedBadges(p).filter(b => !p.badges.includes(b));
    if (!fresh.length) return p;
    fresh.forEach(() => pushEvent("badge"));
    const names = BADGES.filter(b => fresh.includes(b.id)).map(b => b.name).join(", ");
    setTimeout(() => toast(`Badge earned: ${names}`), 0);
    return { ...p, badges: [...p.badges, ...fresh], xp: p.xp + XP.badge * fresh.length, counts: { ...p.counts, badge: p.counts.badge + fresh.length } };
  }, [pushEvent, toast]);

  const award: Ctx["award"] = useCallback((kind, hist) => {
    pushEvent(kind);
    let item: HistoryItem | null = null;
    if (hist) {
      item = { id: uid(), created_at: now(), ...hist };
      if (user && supabase) {
        const local = item;
        supabase.from("history").insert({ module: hist.module, name: hist.name, params: hist.params }).select("id").single()
          .then(({ data }) => { if (data) setProgress(p => ({ ...p, history: p.history.map(h => (h.id === local.id ? { ...h, id: data.id } : h)) })); });
      }
    }
    setProgress(p => applyBadges({
      ...p, xp: p.xp + XP[kind], counts: { ...p.counts, [kind]: p.counts[kind] + 1 },
      history: item ? [item, ...p.history].slice(0, 40) : p.history
    }));
  }, [pushEvent, applyBadges, user, supabase]);

  const updateLastHistory: Ctx["updateLastHistory"] = useCallback((module, params) => {
    setProgress(p => {
      const h = p.history[0];
      if (!h || h.module !== module) return p;
      if (user && supabase && !/^[a-z0-9]+$/.test(h.id)) supabase.from("history").update({ params }).eq("id", h.id).then(() => {});
      return { ...p, history: [{ ...h, params }, ...p.history.slice(1)] };
    });
  }, [user, supabase]);

  const saveSim: Ctx["saveSim"] = useCallback(async (module, name, params) => {
    let id = uid(), created_at = now();
    if (user && supabase) {
      const { data, error } = await supabase.from("simulations").insert({ module, name, params }).select("id, created_at").single();
      if (error) { toast("Couldn’t save to your account. Check your connection and try again."); return; }
      id = data.id; created_at = data.created_at;
    }
    setProgress(p => ({ ...p, saved: [{ id, module, name, params, created_at }, ...p.saved].slice(0, 50) }));
    award("save", { module, name: `Saved: ${name}`, params });
    toast("Simulation saved to your dashboard");
  }, [user, supabase, award, toast]);

  const deleteSim: Ctx["deleteSim"] = useCallback(async id => {
    if (user && supabase) await supabase.from("simulations").delete().eq("id", id);
    setProgress(p => ({ ...p, saved: p.saved.filter(s => s.id !== id) }));
  }, [user, supabase]);

  const recordChallenge: Ctx["recordChallenge"] = useCallback(async (challengeId, answer, isDaily) => {
    const first = !progress.chal[challengeId];
    const today = now().slice(0, 10);
    if (user && supabase) {
      const { error } = await supabase.from("challenge_responses").upsert({ user_id: user.id, challenge_id: challengeId, choice: answer.pick, reasoning: answer.why, words: answer.words });
      if (error) { toast("Couldn’t save your decision. Try again."); return; }
    }
    setProgress(p => ({ ...p, chal: { ...p.chal, [challengeId]: { ...answer, t: now() } } }));
    if (isDaily && !progress.days.includes(today)) {
      pushEvent("daily");
      setProgress(p => applyBadges({ ...p, days: [...p.days, today] }));
    }
    if (first) {
      award("chal", { module: "challenges", name: challengeId, params: { id: challengeId } });
      if (answer.words >= 30) award("chal_reasoned");
    }
  }, [progress.chal, progress.days, user, supabase, toast, award, pushEvent, applyBadges]);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    toast("Signed out");
  }, [supabase, toast]);

  const value = useMemo<Ctx>(() => ({
    mode, configured: supabaseConfigured, user, displayName, ready, progress,
    award, updateLastHistory, saveSim, deleteSim, recordChallenge, signOut, toast, ai, setAI, aiOpen, setAIOpen
  }), [mode, user, displayName, ready, progress, award, updateLastHistory, saveSim, deleteSim, recordChallenge, signOut, toast, ai, setAI, aiOpen]);

  return (
    <AppCtx.Provider value={value}>
      {children}
      <div className={`toast ${toastMsg ? "show" : ""}`} role="status" aria-live="polite">{toastMsg}</div>
    </AppCtx.Provider>
  );
}
