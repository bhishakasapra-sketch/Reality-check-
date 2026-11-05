"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { useAIContext } from "@/components/AskWhy";
import { SimChart, Tier, usePalette } from "@/components/ui";
import { fetchTallies } from "@/lib/community";
import { CHALLENGES, RIPPLE, dailyIndex } from "@/lib/content";
import { arrow, fmt } from "@/lib/format";
import { ECON_ZERO, econModel } from "@/lib/models/economics";
import { modName } from "@/lib/progress";
import { histLabel, simHref } from "./Dashboard";

function HeroDemo() {
  const pal = usePalette();
  const [rate, setRate] = useState(0);
  const base = useMemo(() => econModel(ECON_ZERO), []);
  const r = useMemo(() => econModel({ ...ECON_ZERO, rate }), [rate]);
  const pct = ((rate + 3) / 8) * 100;
  const say = rate === 0 ? "Move the slider. A higher rate cools demand; the effect builds over several quarters."
    : rate > 0 ? `Inflation ends ${fmt(Math.abs(r.infl[7] - 4))} points lower, at the cost of unemployment ${fmt(r.unemp[7] - 6)} points higher. That trade-off is the central bank’s dilemma.`
      : `Cheaper money lifts demand: unemployment falls ${fmt(6 - r.unemp[7])} points, but inflation rises ${fmt(r.infl[7] - 4)} points.`;
  return (
    <div className="demo" aria-label="Try it: interest rate demo">
      <div className="demo-top"><span className="demo-q">You run the central bank. Where do you set the rate?</span><Tier kind="model" /></div>
      <div className="spread" style={{ marginTop: 14 }}><span className="demo-rate">{rate >= 0 ? "+" : "−"}{fmt(Math.abs(rate), 2)} pp</span><span className="small muted">change to the policy rate</span></div>
      <input type="range" min={-3} max={5} step={0.25} value={rate} aria-label="Policy rate change" style={{ ["--p" as string]: `${pct}%` }} onChange={e => setRate(+e.target.value)} />
      <SimChart labels={r.labels} height={220} format={v => `${fmt(v)}%`} series={[
        { key: "i", label: "Inflation", data: r.infl, color: pal.blue },
        { key: "u", label: "Unemployment", data: r.unemp, color: pal.green },
        { key: "b", label: "Inflation, no change", data: base.infl, color: pal.muted, dashed: true, width: 1.4 }
      ]} />
      <div className="demo-read">
        <div><span className="small muted">Inflation after 2 years</span><b>{fmt(r.infl[7])}%</b></div>
        <div><span className="small muted">Unemployment after 2 years</span><b>{fmt(r.unemp[7])}%</b></div>
      </div>
      <p className="small muted" style={{ margin: "12px 0 0" }}>{say}</p>
    </div>
  );
}

function Ripple() {
  const pal = usePalette();
  const [key, setKey] = useState<keyof typeof RIPPLE>("rate");
  const d = RIPPLE[key];
  const [sel, setSel] = useState(0);
  useEffect(() => setSel(0), [key]);
  const cx = 320, cy = 200, R = 150;
  const pos = (i: number) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / d.nodes.length; return [cx + R * 1.35 * Math.cos(a), cy + R * Math.sin(a)]; };
  const col = (s: number) => (s > 0 ? pal.green : s < 0 ? pal.warn : pal.muted);
  const [n, s, t] = d.nodes[sel];
  return (
    <div className="panel ripple">
      <div>
        <div className="tabs" style={{ marginBottom: 14 }}>
          {(Object.keys(RIPPLE) as (keyof typeof RIPPLE)[]).map(k => <button key={k} className="chip" aria-pressed={k === key} onClick={() => setKey(k)}>{RIPPLE[k].name}</button>)}
        </div>
        <svg viewBox="0 0 640 400" role="img" aria-label="Ripple diagram of a decision’s effects">
          {d.nodes.map((nd, i) => { const [x, y] = pos(i); return <line key={nd[0]} x1={cx} y1={cy} x2={x} y2={y} stroke={col(nd[1])} strokeWidth={nd[1] ? 2 : 1.2} strokeDasharray={nd[1] ? undefined : "4 4"} opacity={0.7} />; })}
          <circle cx={cx} cy={cy} r={54} fill={pal.ink} />
          <text x={cx} y={cy - 4} textAnchor="middle" fill={pal.bg} fontSize={12} fontWeight={600}>Decision</text>
          <text x={cx} y={cy + 14} textAnchor="middle" fill={pal.bg} fontSize={11} opacity={0.8}>{d.name.split(" ").slice(0, 2).join(" ")}</text>
          {d.nodes.map((nd, i) => {
            const [x, y] = pos(i);
            return (
              <g key={nd[0]} tabIndex={0} role="button" aria-pressed={i === sel} style={{ cursor: "pointer" }} onClick={() => setSel(i)} onKeyDown={e => e.key === "Enter" && setSel(i)}>
                <rect x={x - 62} y={y - 22} width={124} height={44} rx={22} fill={pal.surface} stroke={col(nd[1])} strokeWidth={i === sel ? 3 : 1.6} />
                <text x={x} y={y + 5} textAnchor="middle" fontSize={13} fontWeight={600} fill={pal.ink}>{arrow(nd[1])} {nd[0]}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div>
        <span className={`tier ${s > 0 ? "tier-hist" : s < 0 ? "tier-sim" : "tier-model"}`}>{s > 0 ? "Tends to gain" : s < 0 ? "Tends to lose" : "Mixed or small"}</span>
        <h3 style={{ margin: "12px 0 8px" }}>{n}</h3>
        <p className="mech" style={{ fontSize: "1.05rem" }}>{t}</p>
        <p className="small muted">Direction of first-round effects only. Real outcomes depend on how large the change is and how everyone else responds.</p>
      </div>
    </div>
  );
}

function Trending() {
  const { progress, mode } = useApp();
  const [t, setT] = useState<Record<string, Record<string, number>> | null>(null);
  useEffect(() => { fetchTallies().then(setT); }, [mode]);
  return (
    <>
      <div className="sec-head"><div><h2>Trending global challenges</h2>
        <p className="muted">{t ? "How people using Reality Check have decided so far." : "Sign in to see how the community decided. Showing your own answers."}</p></div>
        <Link className="btn btn-ghost btn-sm" href="/challenges">Make your call</Link></div>
      <div className="trend">
        {CHALLENGES.slice(0, 3).map(ch => {
          const counts = Object.fromEntries(ch.opts.map(o => [o.id, t?.[ch.id]?.[o.id] ?? 0]));
          const mine = progress.chal[ch.id];
          if (!t && mine) counts[mine.pick] = 1;
          const total = Object.values(counts).reduce((a, b) => a + b, 0);
          return (
            <Link key={ch.id} href={`/challenges?c=${ch.id}`} className="panel" style={{ textDecoration: "none", color: "var(--ink)" }}>
              <h3 style={{ fontSize: "1.12rem", marginBottom: 14 }}>{ch.q}</h3>
              {ch.opts.map(o => { const pc = total ? (counts[o.id] / total) * 100 : 0; return (
                <div key={o.id}><div className="small spread"><span>{o.t}</span><b>{total ? `${Math.round(pc)}%` : ""}</b></div><div className="bar"><i style={{ width: `${pc}%` }} /></div></div>
              ); })}
              <div className="tiny muted">{total ? `${total} ${total === 1 ? "decision" : "decisions"}` : "No decisions yet. Be the first."}</div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

export default function Home() {
  const { progress } = useApp();
  const pal = usePalette();
  const day = CHALLENGES[dailyIndex()];
  const mw = useMemo(() => econModel({ ...ECON_ZERO, mw: 20 }), []);
  const recent = progress.history.filter(h => h.params).slice(0, 6);
  useAIContext("home", null);
  return (
    <>
      <div className="wrap hero"><div className="hero-grid">
        <div>
          <h1>The world is shaped by decisions. Understand yours.</h1>
          <p className="sub">Explore global challenges, simulate real-world scenarios and discover the consequences of the choices that shape our future.</p>
          <div className="hero-ctas">
            <Link className="btn btn-primary" href="/explore">Explore simulations</Link>
            <Link className="btn btn-ghost" href={`/challenges?c=${day.id}`}>Take today’s challenge</Link>
          </div>
        </div>
        <HeroDemo />
      </div></div>

      <section><div className="wrap">
        <div className="sec-head"><div><h2>Featured simulations</h2><p className="muted">Each simulator is a simplified model you can take apart: move a lever, watch the chain of effects, then read why it happened.</p></div><Link className="btn btn-ghost btn-sm" href="/explore">See all scenarios</Link></div>
        <div className="feature-grid">
          <Link className="feat big" href="/economics?preset=e-mw">
            <div><span className="mod">Economics simulator</span><h3>Set the policy. Watch the economy respond.</h3><p className="q">“What if the minimum wage rises by 20%?”</p></div>
            <div className="mini-spark"><SimChart minimal height={120} labels={mw.labels} format={v => fmt(v)} series={[
              { key: "r", label: "Real income", data: mw.real, color: pal.green }, { key: "m", label: "Margins", data: mw.margin.map(x => x - 100), color: pal.warn }]} /></div>
            <span className="small muted">Interest rates, taxes, tariffs, minimum wage, spending and energy shocks</span>
          </Link>
          <Link className="feat" href="/business"><span className="mod">Business simulator</span><h3>Run a company for a year</h3><p className="q">“Why did we lose market share after raising prices?”</p><span className="small muted">Price, marketing, wages, costs and a competitor that reacts</span></Link>
          <Link className="feat" href="/environment"><span className="mod">Environment simulator</span><h3>Design a path to 2050</h3><p className="q">“Can a carbon tax cut emissions without hurting growth?”</p><span className="small muted">Carbon pricing, renewables, forests, plastic, tourism and clean air</span></Link>
        </div>
      </div></section>

      <section style={{ paddingTop: 0 }}><div className="wrap"><Trending /></div></section>

      <section style={{ paddingTop: 0 }}><div className="wrap">
        <div className="sec-head"><div><h2>Follow one decision through the world</h2><p className="muted">Pick a decision to see who feels it first. Select any group for the reasoning.</p></div><Tier kind="model">Qualitative first-round effects</Tier></div>
        <Ripple />
      </div></section>

      <section style={{ paddingTop: 0 }}><div className="wrap">
        <div className="sec-head"><div><h2>Recently explored</h2><p className="muted">Pick up where you left off.</p></div></div>
        {recent.length ? (
          <div className="recent">{recent.map(h => (
            <Link key={h.id} href={simHref(h)} className="recent-item"><span className="mod">{modName(h.module)}</span><div style={{ fontWeight: 600, margin: "4px 0" }}>{histLabel(h)}</div><span className="tiny muted">{new Date(h.created_at).toLocaleString()}</span></Link>
          ))}</div>
        ) : <div className="empty">Nothing here yet. Run a simulation and it will appear here so you can return to it.<div style={{ marginTop: 12 }}><Link className="btn btn-primary btn-sm" href="/economics">Open the economics simulator</Link></div></div>}
      </div></section>

      <section style={{ paddingTop: 0 }}><div className="wrap">
        <div className="sec-head"><div><h2>How Reality Check works</h2></div></div>
        <div className="steps">
          <div><div className="n">1</div><h3 style={{ margin: "10px 0 6px" }}>Choose a question</h3><p className="muted">Start from a real dilemma: a rate rise, a price war, a carbon tax. Or build your own scenario from scratch.</p></div>
          <div><div className="n">2</div><h3 style={{ margin: "10px 0 6px" }}>Pull the levers</h3><p className="muted">Every slider feeds a transparent model. Charts update instantly, and you can pin two scenarios side by side.</p></div>
          <div><div className="n">3</div><h3 style={{ margin: "10px 0 6px" }}>Understand why</h3><p className="muted">Read the causal chain, check it against historical records with sources, and ask the assistant to explain anything.</p></div>
        </div>
        <div className="panel-flat" style={{ marginTop: 30 }}><div className="spread"><div><b>Today’s challenge</b><div className="muted">{day.q}</div></div><Link className="btn btn-primary btn-sm" href={`/challenges?c=${day.id}`}>Answer it</Link></div></div>
      </div></section>
    </>
  );
}
