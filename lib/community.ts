"use client";
import { getSupabase } from "@/lib/supabase/client";

/** Aggregate challenge votes across all users (reasoning stays private). Null in local mode. */
export async function fetchTallies(): Promise<Record<string, Record<string, number>> | null> {
  const sb = getSupabase(); if (!sb) return null;
  const { data, error } = await sb.rpc("challenge_tallies");
  if (error || !data) return null;
  const out: Record<string, Record<string, number>> = {};
  (data as { challenge_id: string; choice: string; n: number }[]).forEach(r => {
    (out[r.challenge_id] ||= {})[r.choice] = Number(r.n);
  });
  return out;
}

export type LeaderRow = { display_name: string; xp: number; is_me: boolean };
export async function fetchLeaderboard(limit = 10): Promise<LeaderRow[] | null> {
  const sb = getSupabase(); if (!sb) return null;
  const { data, error } = await sb.rpc("leaderboard", { lim: limit });
  return error ? null : (data as LeaderRow[]);
}
