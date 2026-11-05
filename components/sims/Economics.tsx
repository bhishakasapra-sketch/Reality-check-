"use client";
import { useMemo, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { useAIContext } from "@/components/AskWhy";
import { Chips, Kpi, Refs, SaveDialog, ShareDialog, SimChart, Slider, Tier, TierLegend, usePalette } from "@/components/ui";
import { ECON_DATA_LINKS, ECON_EVIDENCE, ECON_MECH } from "@/lib/content";
import { arrow, fmt, leverValue, sgn, tone } from "@/lib/format";
import { ECON_BASE, ECON_LEVERS, ECON_PRESETS, ECON_ZERO, econInteractions, econModel, econSummary, type EconParams, type EconSeries } from "@/lib/models/economics";
import { useScenario } from "./useScenario";

const METRICS = { infl: ["Inflation", "%"], growth: ["GDP growth", "%"], unemp: ["Unemployment", "%"], rev: ["Government revenue", ""] } as const;
type Metric = keyof typeof METRICS;
const BASE = econModel(ECON_ZERO);
const BASE_S = econSummary(BASE);

export default function Economics() {
  const { saveSim, award, setAIOpen } = useApp();
  const pal = usePalette();
  const sc = useScenario<EconParams>("economics", "econ", ECON_ZERO, ECON_PRESETS);
  const { p } = sc;
  const [metric, setMetric] = useState<Metric>("infl");
  const [pins, setPins] = useState<{ A?: EconParams; B?: EconParams }>({});
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);

  const r = useMemo(() => econModel(p), [p]);
  const s = econSummary(r);
  const unit = METRICS[metric][1];

  useAIContext("economics", {
    baseline: ECON_BASE, settings: p,
    year2_results: Object.fromEntries(Object.entries(s).map(([k, v]) => [k, +v.toFixed(2)])),
    no_change_year2: Object.fromEntries(Object.entries(BASE_S).map(([k, v]) => [k, +v.toFixed(2)])),
    model_assumptions: "reduced-form; monetary lags peak Q4–8; fiscal multiplier ~0.65 fading; small negative minimum-wage employment effect"
  });

  const peak = (key: keyof EconSeries) => {
    let bv = 0, bi = 0;
    (r[key] as number[]).forEach((v, i) => { const d = v - (BASE[key] as number[])[i]; if (Math.abs(d) > Math.abs(bv)) { bv = d; bi = i; } });
    return Math.abs(bv) < 0.05 ? "No change at any point" : `Largest effect ${sgn(bv)} in Q${bi + 1}`;
  };
  const pin = (slot: "A" | "B") => {
    const next = { ...pins, [slot]: { ...p } }; setPins(next);
    if (next.A && next.B) award("compare");
  };
  const series = [
    { key: "you", label: "Your scenario", data: r[metric], color: pal.blue, width: 2.6 },
    { key: "base", label: "No change", data: BASE[metric], color: pal.muted, dashed: true, width: 1.4 },
    ...(pins.A ? [{ key: "a", label: "Scenario A", data: econModel(pins.A)[metric], color: pal.green, width: 1.8 }] : []),
    ...(pins.B ? [{ key: "b", label: "Scenario B", data: econModel(pins.B)[metric], color: pal.amber, width: 1.8 }] : [])
  ];
  const active = ECON_LEVERS.filter(l => Math.abs(p[l.id as keyof EconParams]) > 1e-9);
  const notes = econInteractions(p);
  const stake: [string, number, string, string][] = [
    ["Consumers", s.real - BASE_S.real, "Real income growth", " pts"],
    ["Producers", s.margin - BASE_S.margin, "Profit margin index", ""],
    ["Employment", -(s.unemp - BASE_S.unemp), "Jobs (inverse of unemployment)", " pts"],
    ["Government", s.rev - BASE_S.rev, "Revenue index", ""]
  ];
  const describe = (q?: EconParams) => q ? ECON_LEVERS.filter(l => q[l.id as keyof EconParams]).map(l => `${l.label.toLowerCase()} ${leverValue(l, q[l.id as keyof EconParams])}`).join(", ") || "no change" : "not pinned";
  const shareText = `Reality Check · Economics simulator\n\nMy policy:\n${active.map(l => `${l.label}: ${leverValue(l, p[l.id as keyof EconParams])}`).join("\n") || "No policy change"}\n\nModel estimate, year 2 (vs no change):\nInflation ${fmt(s.infl)}% (${sgn(s.infl - BASE_S.infl)} pts)\nGDP growth ${fmt(s.growth)}% (${sgn(s.growth - BASE_S.growth)} pts)\nUnemployment ${fmt(s.unemp)}% (${sgn(s.unemp - BASE_S.unemp)} pts)\n\nIllustrative teaching model, not a forecast.`;

  return (
    <div className="wrap">
      <div className="sim-head">
        <span className="mod">Module A</span>
        <h1 style={{ fontSize: "clamp(2rem,4vw,3.1rem)", marginTop: 6 }}>Economics simulator</h1>
        <p>Set policy for an economy starting with 4% inflation, 3% growth and 6% unemployment. The model traces each lever through demand, prices and jobs over three years.</p>
        <TierLegend />
      </div>
      <div className="presets"><Chips label="Scenarios" items={ECON_PRESETS.map(x => ({ id: x.id, name: x.name, title: x.q }))} value={sc.presetId} onPick={sc.applyPreset} /></div>
      <div className="sim-grid">
        <aside className="panel controls" aria-label="Policy levers">
          <div className="spread"><b>Policy levers</b><button className="btn btn-ghost btn-sm" onClick={sc.reset}>Reset</button></div>
          {ECON_LEVERS.map(l => <Slider key={l.id} lever={l} value={p[l.id as keyof EconParams]} onChange={v => sc.set(l.id as keyof EconParams, v)} onCommit={sc.commit} />)}
        </aside>
        <div className="stack">
          <div className="kpis">
            {([["Inflation", "infl", "%", true], ["GDP growth", "growth", "%", false], ["Unemployment", "unemp", "%", true], ["Gov. revenue index", "rev", "", false]] as const).map(([n, k, u, inv]) => {
              const d = s[k] - BASE_S[k];
              return <Kpi key={k} k={`${n}, year 2`} v={fmt(s[k]) + u} d={`${arrow(d)} ${sgn(d)}${u ? " pts" : ""} vs no change`} tone={tone(d, inv)} note={peak(k)} />;
            })}
          </div>
          <div className="panel">
            <div className="spread" style={{ marginBottom: 12 }}>
              <Chips label="Chart metric" items={(Object.keys(METRICS) as Metric[]).map(k => ({ id: k, name: METRICS[k][0] }))} value={metric} onPick={setMetric} />
              <Tier kind="model" />
            </div>
            <SimChart labels={r.labels} series={series} format={v => `${fmt(v)}${unit}`} />
            <p className="tiny muted" style={{ margin: "10px 0 0" }}>Dashed line: no policy change. Annualised rates by quarter.</p>
          </div>
          <div className="panel">
            <div className="spread" style={{ marginBottom: 12 }}><h3>Who feels it</h3><span className="small muted">Average over the first two years vs no change</span></div>
            <div className="stake">
              {stake.map(([n, d, l, u]) => (
                <div key={n} className={Math.abs(d) < 0.05 ? "" : d > 0 ? "pos" : "neg"}>
                  <b>{n}</b><span className="small muted">{l}</span>
                  <div className={tone(d)} style={{ fontWeight: 600, marginTop: 4 }}>{arrow(d)} {sgn(d)}{u}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <h3 style={{ marginBottom: 12 }}>Why this happens</h3>
            <div className="mech">
              {active.length === 0 && <p className="muted" style={{ fontFamily: "var(--sans)", fontSize: ".95rem" }}>Move a lever or choose a scenario above. The causal chain for each policy you change will appear here, along with how the policies interact.</p>}
              {active.map(l => {
                const m = ECON_MECH[l.id], v = p[l.id as keyof EconParams];
                return (
                  <div key={l.id}>
                    <p><strong>{l.label} {leverValue(l, v)}</strong></p>
                    {v > 0 ? (
                      <>
                        <div className="chain">{m.chain.map((c, i) => <span key={c} style={{ display: "contents" }}>{i > 0 && <i>›</i>}<span>{c}</span></span>)}</div>
                        <p>{m.text}</p>
                      </>
                    ) : <p>{m.down || m.text}</p>}
                  </div>
                );
              })}
              {notes.length > 0 && <><p><strong>How your policies interact</strong></p>{notes.map(n => <p key={n}>{n}</p>)}</>}
            </div>
          </div>
          <div className="panel">
            <div className="spread" style={{ marginBottom: 12 }}>
              <h3>Compare scenarios</h3>
              <div className="row"><button className="btn btn-ghost btn-sm" onClick={() => pin("A")}>Pin as A</button><button className="btn btn-ghost btn-sm" onClick={() => pin("B")}>Pin as B</button></div>
            </div>
            {!pins.A && !pins.B ? <p className="muted small" style={{ margin: 0 }}>Pin the current settings as A, change the levers, then pin B. Both appear on the chart as well.</p> : (
              <div className="scroll-x"><table>
                <thead><tr><th /><th>Scenario A</th><th>Scenario B</th></tr></thead>
                <tbody>
                  <tr><td className="muted small">Settings</td><td className="small" style={{ whiteSpace: "normal" }}>{describe(pins.A)}</td><td className="small" style={{ whiteSpace: "normal" }}>{describe(pins.B)}</td></tr>
                  {([["Inflation, year 2", "infl", "%"], ["GDP growth, year 2", "growth", "%"], ["Unemployment, year 2", "unemp", "%"], ["Revenue index, year 2", "rev", ""], ["Real income growth, avg", "real", " pts"], ["Firm margins, avg", "margin", ""]] as const).map(([n, k, u]) => (
                    <tr key={k}><td>{n}</td>
                      <td>{pins.A ? fmt(econSummary(econModel(pins.A))[k]) + u : "–"}</td>
                      <td>{pins.B ? fmt(econSummary(econModel(pins.B))[k]) + u : "–"}</td></tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </div>
          <div className="row">
            <button className="btn btn-primary" onClick={() => setSaving(true)}>Save simulation</button>
            <button className="btn btn-ghost" onClick={() => setSharing(true)}>Share result</button>
            <button className="btn btn-ghost" onClick={() => setAIOpen(true)}>Ask why</button>
          </div>
          <div className="panel">
            <h3 style={{ marginBottom: 6 }}>Real-world reference points</h3>
            <p className="small muted">Verified historical events for context. They are not inputs to the model.</p>
            <Refs items={ECON_EVIDENCE} />
            <p className="small" style={{ marginTop: 14 }}><b>Explore real data:</b> {ECON_DATA_LINKS.map(([t, u], i) => <span key={u}>{i > 0 && ", "}<a href={u} target="_blank" rel="noopener noreferrer">{t}</a></span>)}.</p>
            <details style={{ marginTop: 14 }}><summary>Model assumptions</summary>
              <div className="small muted" style={{ marginTop: 10 }}>
                <p>This is a reduced-form teaching model, not a forecast. Starting point: 4% inflation, 3% growth, 6% unemployment, government revenue indexed to 100. Effects are deviations from that baseline.</p>
                <p>Monetary policy works with a lag (peak effect around quarters 4 to 8). The fiscal multiplier on spending is about 0.65 at first and fades. Tariffs raise the price level once (shown as temporary inflation) and reduce efficiency. The minimum-wage employment effect is small and negative by assumption; the evidence on its sign and size is contested.</p>
                <p>Unemployment follows the output gap with an Okun-style coefficient of about 0.5. Coefficients sit within plausible textbook ranges but are chosen for clarity. Real economies have expectations, exchange rates, global conditions and policy reactions that this model simplifies.</p>
              </div>
            </details>
          </div>
        </div>
      </div>
      <SaveDialog open={saving} initial={sc.name} onClose={() => setSaving(false)} onSave={n => saveSim("economics", n, { ...p })} />
      {sharing && <ShareDialog open onClose={() => setSharing(false)} text={shareText} link={sc.shareLink()} />}
    </div>
  );
}
