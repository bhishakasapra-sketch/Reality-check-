"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { useAIContext } from "@/components/AskWhy";
import { Refs, Tier } from "@/components/ui";
import { CHALLENGES, EVIDENCE, dailyIndex } from "@/lib/content";
import { fetchTallies } from "@/lib/community";

export default function Challenges() {
  const { progress, recordChallenge, mode } = useApp();
  const [idx, setIdx] = useState(dailyIndex());
  const [pick, setPick] = useState<string | null>(null);
  const [why, setWhy] = useState("");
  const [tallies, setTallies] = useState<Record<string, Record<string, number>> | null>(null);
  const [busy, setBusy] = useState(false);
  const ch = CHALLENGES[idx], mine = progress.chal[ch.id], today = dailyIndex();
  const words = (why.trim().match(/\S+/g) || []).length;

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const i = CHALLENGES.findIndex(c => c.id === qs.get("c"));
    if (i >= 0) setIdx(i);
  }, []);
  useEffect(() => { setPick(mine?.pick ?? null); setWhy(mine?.why ?? ""); }, [ch.id, mine?.pick, mine?.why]);
  useEffect(() => { fetchTallies().then(setTallies); }, [mode, mine?.pick]);
  useAIContext("challenges", { dilemma: ch.q, context: ch.ctx, options: ch.opts.map(o => o.t), my_choice: mine ? ch.opts.find(o => o.id === mine.pick)?.t : null, my_reasoning: mine?.why ?? null });

  async function submit() {
    if (!pick) return;
    setBusy(true);
    await recordChallenge(ch.id, { pick, why: why.trim().slice(0, 4000), words }, idx === today);
    setBusy(false);
  }

  const o = mine && ch.opts.find(x => x.id === mine.pick);
  const counts: Record<string, number> = Object.fromEntries(ch.opts.map(x => [x.id, tallies?.[ch.id]?.[x.id] ?? 0]));
  if (mine && (!tallies || !tallies[ch.id])) counts[mine.pick] = Math.max(1, counts[mine.pick]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="wrap">
      <div className="sim-head">
        <span className="mod">Module D</span>
        <h1 style={{ fontSize: "clamp(2rem,4vw,3.1rem)", marginTop: 6 }}>Global decision challenges</h1>
        <p>Real dilemmas with no clean answer. Make your call, explain your reasoning, then see the trade-offs, the evidence, and how everyone else decided.</p>
      </div>
      <div className="ch-list">
        <nav className="ch-nav" aria-label="Challenges">
          {CHALLENGES.map((c, i) => (
            <button key={c.id} aria-current={i === idx} onClick={() => setIdx(i)}>
              {c.q}
              {i === today && <span className="done" style={{ color: "var(--blue)" }}>Today’s challenge</span>}
              {progress.chal[c.id] && <span className="done">Answered</span>}
            </button>
          ))}
        </nav>
        <div>
          <div className="panel">
            <h2 style={{ fontSize: "clamp(1.5rem,2.6vw,2rem)" }}>{ch.q}</h2>
            <p className="muted" style={{ marginTop: 12, maxWidth: "64ch" }}>{ch.ctx}</p>
            <div className="opts" role="radiogroup" aria-label="Your decision">
              {ch.opts.map(x => (
                <label className="opt" key={x.id}>
                  <input type="radio" name="opt" value={x.id} checked={pick === x.id} onChange={() => setPick(x.id)} /><span>{x.t}</span>
                </label>
              ))}
            </div>
            <label htmlFor="why"><b>Your reasoning</b> <span className="small muted">Which stakeholders matter most to you, and why?</span></label>
            <textarea id="why" style={{ marginTop: 8 }} placeholder="I chose this because…" value={why} maxLength={4000} onChange={e => setWhy(e.target.value)} />
            <div className="spread" style={{ marginTop: 12 }}>
              <span className="small muted">{words} {words === 1 ? "word" : "words"}{words < 30 ? ". Thirty or more earns the Deliberator badge." : ""}</span>
              <button className="btn btn-primary" disabled={!pick || busy} onClick={submit}>{mine ? "Update my decision" : "Submit my decision"}</button>
            </div>
          </div>

          {mine && o && (
            <div className="stack" style={{ marginTop: 18 }}>
              <div className="panel">
                <div className="spread" style={{ marginBottom: 14 }}><h3>Your choice: {o.t}</h3><Tier kind="model">Analysis</Tier></div>
                <div className="an-grid">
                  <div className="panel-flat"><b className="up">Potential advantages</b><ul>{o.pros.map(x => <li key={x}>{x}</li>)}</ul></div>
                  <div className="panel-flat"><b className="down">Potential disadvantages</b><ul>{o.cons.map(x => <li key={x}>{x}</li>)}</ul></div>
                  <div className="panel-flat"><b>Short-term consequences</b><p style={{ margin: "6px 0 0" }}>{o.st}</p></div>
                  <div className="panel-flat"><b>Long-term consequences</b><p style={{ margin: "6px 0 0" }}>{o.lt}</p></div>
                </div>
                <p style={{ margin: "16px 0 6px" }}><b>Stakeholders affected</b></p>
                <div className="row">{o.stake.map(s => <span key={s} className="chip" style={{ cursor: "default" }}>{s}</span>)}</div>
                <details style={{ marginTop: 16 }}><summary>See the other options’ trade-offs</summary>
                  {ch.opts.filter(x => x.id !== o.id).map(x => (
                    <div key={x.id} style={{ marginTop: 12 }}><b>{x.t}</b><p className="small muted" style={{ margin: "4px 0 0" }}>For: {x.pros.join("; ")}. Against: {x.cons.join("; ")}.</p></div>
                  ))}
                </details>
              </div>
              <div className="panel"><h3>Evidence</h3><Refs items={ch.ev.map(k => EVIDENCE[k])} /><Link className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} href={ch.link}>Test it in the simulator</Link></div>
              <div className="panel">
                <div className="spread" style={{ marginBottom: 14 }}><h3>How others decided</h3><span className="small muted">{tallies ? `${total} ${total === 1 ? "decision" : "decisions"}` : "Your answer only"}</span></div>
                {ch.opts.map(x => {
                  const pc = total ? (counts[x.id] / total) * 100 : 0;
                  return (
                    <div key={x.id}>
                      <div className="spread small"><span>{x.t}{x.id === mine.pick && <b> (you)</b>}</span><b>{Math.round(pc)}%</b></div>
                      <div className={`bar ${x.id === mine.pick ? "g" : ""}`}><i style={{ width: `${pc}%` }} /></div>
                    </div>
                  );
                })}
                {!tallies && <p className="small muted" style={{ margin: "10px 0 0" }}>{mode === "local" ? "Sign in to compare with other people’s decisions." : "Community results couldn’t be loaded right now."}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
