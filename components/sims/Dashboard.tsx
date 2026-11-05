"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { fetchLeaderboard, type LeaderRow } from "@/lib/community";
import { CHALLENGES } from "@/lib/content";
import { encodeParams } from "@/lib/format";
import { BADGES, level, modName, type HistoryItem, type SavedSim } from "@/lib/progress";
import { BIZ_PRESETS } from "@/lib/models/business";
import { ECON_PRESETS } from "@/lib/models/economics";
import { ENV_PRESETS } from "@/lib/models/environment";

export function simHref(item: { module: SavedSim["module"]; name: string; params: Record<string, unknown> | null }) {
  if (item.module === "challenges") return `/challenges?c=${encodeURIComponent(String(item.params?.id ?? ""))}`;
  return `/${item.module}?s=${encodeParams(item.params || {})}&n=${encodeURIComponent(item.name.replace(/^Saved: /, ""))}`;
}
export function histLabel(h: HistoryItem) {
  return h.module === "challenges" ? CHALLENGES.find(c => c.id === h.name)?.q ?? h.name : h.name;
}

export default function Dashboard() {
  const { progress, user, displayName, configured, mode, deleteSim, ready } = useApp();
  const [board, setBoard] = useState<LeaderRow[] | null>(null);
  useEffect(() => { if (mode === "cloud") fetchLeaderboard(10).then(setBoard); else setBoard(null); }, [mode, progress.xp]);
  const lv = level(progress.xp), into = progress.xp % 150;
  if (!ready) return <div className="wrap sim-head"><p className="muted">Loading your progress…</p></div>;

  return (
    <div className="wrap">
      <div className="sim-head">
        <h1 style={{ fontSize: "clamp(2rem,4vw,3.1rem)" }}>My dashboard</h1>
        <p>{user ? `Signed in as ${displayName}. Your progress is saved to your account and follows you between devices.` :
          configured ? <>You’re in guest mode, so progress is saved on this device only. <Link href="/login">Sign in</Link> to save it to your account and join the leaderboard.</> :
            "You’re in guest mode, so progress is saved on this device only."}</p>
      </div>
      <div className="dash-top">
        <div className="panel">
          <div className="spread">
            <div><span className="small muted">Level</span><div className="lvl">{lv}</div></div>
            <div style={{ textAlign: "right" }}><span className="small muted">Experience</span><div style={{ fontSize: "1.6rem", fontWeight: 600 }}>{progress.xp} XP</div></div>
          </div>
          <div className="bar g" style={{ marginTop: 16 }}><i style={{ width: `${(into / 150) * 100}%` }} /></div>
          <div className="tiny muted">{150 - into} XP to level {lv + 1}</div>
          <div className="kpis" style={{ marginTop: 18 }}>
            {([["Economics", progress.counts.econ], ["Business", progress.counts.biz], ["Environment", progress.counts.env], ["Challenges", progress.counts.chal]] as const).map(([n, v]) => (
              <div className="kpi" key={n} style={{ padding: "10px 12px" }}><div className="k">{n}</div><div className="v" style={{ fontSize: "1.3rem" }}>{v}</div></div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="spread" style={{ marginBottom: 10 }}><h3>Leaderboard</h3><span className="small muted">{board ? "Top 10" : "Guest mode"}</span></div>
          {board ? (board.length ? board.map((r, i) => (
            <div className="list-row" key={i}><span><b>{i + 1}</b>&nbsp;&nbsp;{r.display_name || "Someone"}{r.is_me && <span className="tiny muted"> (you)</span>}</span><b>{r.xp} XP</b></div>
          )) : <div className="empty small">No scores yet. Run a simulation to put your name on the board.</div>) : (
            <><div className="list-row"><span><b>1</b>&nbsp;&nbsp;You</span><b>{progress.xp} XP</b></div>
              <p className="small muted" style={{ margin: "10px 0 0" }}>The shared leaderboard appears when you’re signed in.</p></>
          )}
        </div>
      </div>
      <section style={{ padding: "30px 0" }}>
        <h3 style={{ marginBottom: 14 }}>Badges <span className="small muted" style={{ fontFamily: "var(--sans)" }}>{progress.badges.length} of {BADGES.length}</span></h3>
        <div className="badges">
          {BADGES.map(b => (
            <div key={b.id} className={`badge ${progress.badges.includes(b.id) ? "got" : ""}`}>
              <div className="ic" aria-hidden="true">{b.ic}</div><b className="small">{b.name}</b><div className="tiny muted">{b.desc}</div>
            </div>
          ))}
        </div>
      </section>
      <div className="dash-top" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="panel"><h3 style={{ marginBottom: 8 }}>Saved simulations</h3>
          {progress.saved.length ? progress.saved.map(s => (
            <div className="list-row" key={s.id}>
              <div><span className="mod">{modName(s.module)}</span><div style={{ fontWeight: 600 }}>{s.name}</div><span className="tiny muted">{new Date(s.created_at).toLocaleDateString()}</span></div>
              <div className="row"><Link className="btn btn-ghost btn-sm" href={simHref(s)}>Open</Link><button className="btn btn-ghost btn-sm" onClick={() => deleteSim(s.id)} aria-label={`Remove ${s.name}`}>Remove</button></div>
            </div>
          )) : <div className="empty small">No saved simulations yet. Use “Save simulation” in any simulator to keep a scenario here.</div>}
        </div>
        <div className="panel"><h3 style={{ marginBottom: 8 }}>History</h3>
          {progress.history.length ? progress.history.slice(0, 15).map(h => (
            <div className="list-row" key={h.id}>
              <div><span className="mod">{modName(h.module)}</span><div>{histLabel(h)}</div><span className="tiny muted">{new Date(h.created_at).toLocaleString()}</span></div>
              {h.params && <Link className="btn btn-ghost btn-sm" href={simHref(h)}>Return</Link>}
            </div>
          )) : <div className="empty small">Your simulation history will build up here as you explore.</div>}
        </div>
      </div>
    </div>
  );
}

export function Explore() {
  const all = useMemo(() => [
    ...ECON_PRESETS.map(p => ({ mod: "economics", id: p.id, name: p.name, q: p.q, href: `/economics?preset=${p.id}` })),
    ...BIZ_PRESETS.map(p => ({ mod: "business", id: p.id, name: p.name, q: p.q, href: `/business?preset=${p.id}` })),
    ...ENV_PRESETS.map(p => ({ mod: "environment", id: p.id, name: p.name, q: p.q, href: `/environment?preset=${p.id}` })),
    ...CHALLENGES.map(c => ({ mod: "challenges", id: c.id, name: c.q, q: "", href: `/challenges?c=${c.id}` }))
  ], []);
  const [f, setF] = useState("all");
  const [q, setQ] = useState("");
  const list = all.filter(x => (f === "all" || x.mod === f) && (x.name + x.q).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="wrap">
      <div className="sim-head"><h1 style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>Explore simulations</h1>
        <p>{all.length} ready-made scenarios across four modules. Each opens with its levers set; change anything once you’re inside.</p></div>
      <div className="spread" style={{ marginBottom: 20 }}>
        <div className="tabs">
          {[["all", "All"], ["economics", "Economics"], ["business", "Business"], ["environment", "Environment"], ["challenges", "Challenges"]].map(([k, l]) => (
            <button key={k} className="chip" aria-pressed={f === k} onClick={() => setF(k)}>{l}</button>
          ))}
        </div>
        <input type="text" placeholder="Search scenarios" style={{ maxWidth: 280 }} aria-label="Search scenarios" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <div className="ex-grid">
        {list.length ? list.map(x => (
          <Link key={x.id} className="ex-card" href={x.href} style={{ textDecoration: "none", color: "var(--ink)" }}>
            <span className="mod">{modName(x.mod)}</span><h3>{x.name}</h3>{x.q && <span className="muted small">{x.q}</span>}
          </Link>
        )) : <div className="empty">No scenarios match “{q}”. Try a broader word such as tax or price.</div>}
      </div>
    </div>
  );
}
