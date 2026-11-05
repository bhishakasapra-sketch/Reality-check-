export type Kind = "econ" | "biz" | "env" | "save" | "compare" | "chal" | "chal_reasoned" | "ai" | "badge" | "daily";
/** Keep in sync with public.xp_for() in supabase/schema.sql */
export const XP: Record<Kind, number> = { econ: 10, biz: 10, env: 10, save: 15, compare: 20, chal: 30, chal_reasoned: 10, ai: 5, badge: 25, daily: 0 };

export type Module = "economics" | "business" | "environment" | "challenges";
export type SavedSim = { id: string; module: Module; name: string; params: Record<string, unknown>; created_at: string };
export type HistoryItem = { id: string; module: Module; name: string; params: Record<string, unknown> | null; created_at: string };
export type ChallengeAnswer = { pick: string; why: string; words: number; t: string };

export type Progress = {
  xp: number;
  counts: Record<Kind, number>;
  badges: string[];
  saved: SavedSim[];
  history: HistoryItem[];
  chal: Record<string, ChallengeAnswer>;
  days: string[];
};
export const emptyCounts = (): Record<Kind, number> => ({ econ: 0, biz: 0, env: 0, save: 0, compare: 0, chal: 0, chal_reasoned: 0, ai: 0, badge: 0, daily: 0 });
export const emptyProgress = (): Progress => ({ xp: 0, counts: emptyCounts(), badges: [], saved: [], history: [], chal: {}, days: [] });

export const BADGES: { id: string; ic: string; name: string; desc: string; test: (p: Progress) => boolean }[] = [
  { id: "first", ic: "◎", name: "First look", desc: "Ran your first simulation", test: p => p.counts.econ + p.counts.biz + p.counts.env > 0 },
  { id: "wonk", ic: "%", name: "Policy wonk", desc: "Explored 5 economic scenarios", test: p => p.counts.econ >= 5 },
  { id: "founder", ic: "$", name: "Founder", desc: "Ran the business simulator", test: p => p.counts.biz >= 1 },
  { id: "green", ic: "❦", name: "Green ledger", desc: "Explored an environmental policy", test: p => p.counts.env >= 1 },
  { id: "judge", ic: "⚖", name: "Deliberator", desc: "Answered a challenge with written reasoning", test: p => p.counts.chal_reasoned >= 1 },
  { id: "compare", ic: "⇄", name: "Side by side", desc: "Compared two scenarios", test: p => p.counts.compare >= 1 },
  { id: "curious", ic: "?", name: "Asked why", desc: "Asked the explanation assistant", test: p => p.counts.ai >= 1 },
  { id: "all4", ic: "◈", name: "Full picture", desc: "Used all four modules", test: p => !!(p.counts.econ && p.counts.biz && p.counts.env && p.counts.chal) },
  { id: "daily3", ic: "☀", name: "Three-day habit", desc: "Took the daily challenge on 3 days", test: p => p.days.length >= 3 },
  { id: "archivist", ic: "▤", name: "Archivist", desc: "Saved 5 simulations", test: p => p.counts.save >= 5 }
];
export const earnedBadges = (p: Progress) => BADGES.filter(b => b.test(p)).map(b => b.id);
export const level = (xp: number) => Math.floor(xp / 150) + 1;
export const modName = (m: string) => ({ economics: "Economics", business: "Business", environment: "Environment", challenges: "Challenge" } as Record<string, string>)[m] || m;
export const modPath = (m: Module) => `/${m}`;
