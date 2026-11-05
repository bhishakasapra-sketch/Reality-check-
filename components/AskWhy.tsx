"use client";
import { useEffect, useRef, useState } from "react";
import { useApp } from "./AppProvider";

type Turn = { role: "user" | "assistant"; content: string };
const SUGG: Record<string, string[]> = {
  home: ["How does an interest rate rise actually reduce inflation?", "What is the difference between a model estimate and real data?"],
  economics: ["Why did raising interest rates reduce inflation here?", "Could this policy have unexpected consequences?", "Why does the effect take several quarters to appear?"],
  business: ["Why did the business lose market share after raising prices?", "Why is cash different from profit in this simulation?", "Is the higher-wage strategy worth it?"],
  environment: ["Why does a carbon tax cut emissions more cheaply than regulation?", "Why does GDP dip first and then recover in this scenario?"],
  challenges: ["What are the strongest arguments against my choice?", "Which stakeholders are most often overlooked here?"]
};
const CTX: Record<string, string> = {
  economics: "Sees your current economic policy settings", business: "Sees your current business strategy",
  environment: "Sees your current environmental policies", challenges: "Sees the current dilemma and your answer"
};

function Rich({ text }: { text: string }) {
  const blocks: JSX.Element[] = []; let list: string[] = [];
  const flush = () => { if (list.length) { blocks.push(<ul key={blocks.length}>{list.map((l, i) => <li key={i}>{bold(l)}</li>)}</ul>); list = []; } };
  text.split("\n").forEach(l => {
    if (/^\s*[-•]\s+/.test(l)) list.push(l.replace(/^\s*[-•]\s+/, ""));
    else { flush(); if (l.trim()) blocks.push(<p key={blocks.length}>{bold(l)}</p>); }
  });
  flush();
  return <>{blocks}</>;
}
function bold(s: string) { return s.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : part)); }

export function AskWhy() {
  const { ai, aiOpen, setAIOpen, award, user, configured } = useApp();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const body = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => { body.current?.scrollTo(0, 1e9); }, [turns]);
  useEffect(() => () => abort.current?.abort(), []);

  async function ask(question: string) {
    question = question.trim(); if (!question || busy) return;
    const history = [...turns, { role: "user" as const, content: question }];
    setTurns([...history, { role: "assistant", content: "Thinking…" }]); setQ(""); setBusy(true);
    abort.current = new AbortController();
    const setLast = (content: string) => setTurns(t => [...t.slice(0, -1), { role: "assistant", content }]);
    try {
      const res = await fetch("/api/explain", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: abort.current.signal,
        body: JSON.stringify({ page: ai.page, context: ai.data, messages: history.slice(-7) })
      });
      if (!res.ok || !res.body) {
        const msg = await res.json().catch(() => ({ error: "" }));
        setLast(msg.error || "The explanation couldn’t be generated. Try asking again.");
      } else {
        const reader = res.body.getReader(), dec = new TextDecoder(); let acc = "";
        for (;;) { const { done, value } = await reader.read(); if (done) break; acc += dec.decode(value, { stream: true }); setLast(acc); }
        award("ai");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setLast("Couldn’t reach the explanation service. Check your connection and try again.");
    }
    setBusy(false);
  }

  const needsSignIn = configured && !user;
  return (
    <>
      <button className="btn btn-primary ai-fab" aria-expanded={aiOpen} aria-controls="aiPanel" onClick={() => setAIOpen(!aiOpen)}>Ask why</button>
      <div id="aiPanel" className={`ai-panel ${aiOpen ? "open" : ""}`} role="dialog" aria-label="Explanation assistant">
        <div className="ai-head spread">
          <div><b>Ask why</b><div className="tiny muted">{CTX[ai.page] || "Explains concepts on Reality Check"}</div></div>
          <div className="row">
            {turns.length > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setTurns([])}>Clear</button>}
            <button className="btn btn-ghost btn-sm" onClick={() => setAIOpen(false)}>Close</button>
          </div>
        </div>
        <div className="ai-body" ref={body}>
          {turns.length === 0 ? (
            <>
              <p className="small muted">Ask about what you’re seeing. The assistant receives the current simulation’s settings and results, so it can explain this specific outcome.{needsSignIn && " You may need to sign in first."}</p>
              <div className="sugg">{(SUGG[ai.page] || SUGG.home).map(s => <button key={s} onClick={() => ask(s)}>{s}</button>)}</div>
            </>
          ) : turns.map((t, i) => (
            <div key={i} className={`ai-msg ${t.role === "user" ? "u" : "a"}`}>{t.role === "user" ? t.content : <Rich text={t.content} />}</div>
          ))}
        </div>
        <div className="ai-foot">
          <input type="text" value={q} maxLength={500} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && ask(q)} placeholder="Why did inflation fall after rates rose?" aria-label="Your question" />
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => ask(q)}>Ask</button>
        </div>
      </div>
    </>
  );
}

/** Pages call this to tell the assistant what is on screen. */
export function useAIContext(page: string, data: unknown) {
  const { setAI } = useApp();
  const json = JSON.stringify(data ?? null);
  useEffect(() => { setAI(page, JSON.parse(json)); }, [page, json, setAI]);
}
