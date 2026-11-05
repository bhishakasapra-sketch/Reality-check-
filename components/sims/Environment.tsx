"use client";
import { useMemo, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { useAIContext } from "@/components/AskWhy";
import { Chips, Kpi, Refs, SaveDialog, ShareDialog, SimChart, Slider, Tier, TierLegend, usePalette } from "@/components/ui";
import { ENV_EVIDENCE, ENV_MECH } from "@/lib/content";
import { arrow, fmt, leverValue, sgn, tone } from "@/lib/format";
import { ENV_DEFAULT, ENV_LEVERS, ENV_PRESETS, envModel, type EnvParams } from "@/lib/models/environment";
import { useScenario } from "./useScenario";

const METRICS = { emis: "Emissions", pm: "Urban air pollution", forest: "Forest cover", plastic: "Plastic leakage" } as const;
type Metric = keyof typeof METRICS;
const BASE = envModel(ENV_DEFAULT);

export default function Environment() {
  const { saveSim, setAIOpen } = useApp();
  const pal = usePalette();
  const sc = useScenario<EnvParams>("environment", "env", ENV_DEFAULT, ENV_PRESETS);
  const { p } = sc;
  const [metric, setMetric] = useState<Metric>("emis");
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const r = useMemo(() => envModel(p), [p]);
  const e50 = r.emis[24], b50 = BASE.emis[24], cut = (1 - e50 / 100) * 100;
  const worst = Math.min(...r.gdp);
  const active = ENV_LEVERS.filter(l => p[l.id as keyof EnvParams] !== ENV_DEFAULT[l.id as keyof EnvParams]);

  useAIContext("environment", {
    settings: p,
    results_2050: { emissions_index: e50, no_policy_emissions_index: b50, air_pollution_index: r.pm[24], forest_index: r.forest[24], plastic_leakage_index: r.plastic[24], gdp_vs_baseline_pct: r.gdp[24], worst_gdp_year_pct: worst, green_jobs_index: r.jobs[24], carbon_revenue_pct_gdp: r.crev[24] },
    model: "stylised economy, indices 2026 = 100, illustrative coefficients"
  });

  const shareText = `Reality Check · Environment simulator\n\nPolicies: ${ENV_LEVERS.map(l => `${l.label} ${leverValue(l, p[l.id as keyof EnvParams])}`).join("; ")}\n\nModel estimate for 2050 (2026 = 100):\nEmissions ${fmt(e50, 0)} (no new policy: ${fmt(b50, 0)})\nAir pollution ${fmt(r.pm[24], 0)}\nForest cover ${fmt(r.forest[24], 0)}\nGDP vs no-policy path ${sgn(r.gdp[24], 2)}%\n\nIllustrative teaching model, not a forecast.`;

  return (
    <div className="wrap">
      <div className="sim-head">
        <span className="mod">Module C</span>
        <h1 style={{ fontSize: "clamp(2rem,4vw,3.1rem)", marginTop: 6 }}>Environment simulator</h1>
        <p>Design a policy mix for a stylised economy from 2026 to 2050. Emissions are indexed so that 2026 equals 100; the dashed line shows what happens with no new policy.</p>
        <TierLegend />
      </div>
      <div className="presets"><Chips label="Scenarios" items={ENV_PRESETS.map(x => ({ id: x.id, name: x.name, title: x.q }))} value={sc.presetId} onPick={sc.applyPreset} /></div>
      <div className="sim-grid">
        <aside className="panel controls" aria-label="Environmental policies">
          <div className="spread"><b>Policies</b><button className="btn btn-ghost btn-sm" onClick={sc.reset}>Reset</button></div>
          {ENV_LEVERS.map(l => <Slider key={l.id} lever={l} value={p[l.id as keyof EnvParams]} onChange={v => sc.set(l.id as keyof EnvParams, v)} onCommit={sc.commit} />)}
        </aside>
        <div className="stack">
          <div className="kpis">
            <Kpi k="Emissions, 2050" v={fmt(e50, 0)} d={`${arrow(e50 - b50)} ${sgn(e50 - b50, 0)} vs no policy`} tone={tone(-(e50 - b50))} note={cut >= 0 ? `${fmt(cut, 0)}% below 2026` : `${fmt(-cut, 0)}% above 2026`} />
            <Kpi k="Air pollution, 2050" v={fmt(r.pm[24], 0)} d={`${sgn(r.pm[24] - BASE.pm[24], 0)} vs no policy`} tone={tone(-(r.pm[24] - BASE.pm[24]))} />
            <Kpi k="Forest cover, 2050" v={fmt(r.forest[24], 0)} d={`${sgn(r.forest[24] - BASE.forest[24])} vs no policy`} tone={tone(r.forest[24] - BASE.forest[24])} />
            <Kpi k="GDP effect, 2050" v={`${sgn(r.gdp[24], 2)}%`} d={`Worst year: ${sgn(worst, 2)}%`} tone={tone(r.gdp[24])} />
          </div>
          <div className="panel">
            <div className="spread" style={{ marginBottom: 12 }}>
              <Chips label="Chart metric" items={(Object.keys(METRICS) as Metric[]).map(k => ({ id: k, name: METRICS[k] }))} value={metric} onPick={setMetric} />
              <Tier kind="model" />
            </div>
            <SimChart labels={r.labels} format={v => fmt(v, 0)} series={[
              { key: "you", label: "Your policies", data: r[metric], color: pal.green, width: 2.6 },
              { key: "base", label: "No new policy", data: BASE[metric], color: pal.muted, dashed: true, width: 1.4 }
            ]} />
          </div>
          <div className="panel">
            <div className="spread" style={{ marginBottom: 12 }}><h3>The economic side</h3><span className="small muted">GDP vs a no-policy path, and green-sector jobs</span></div>
            <SimChart labels={r.labels} height={220} format={v => fmt(v, 2)} series={[
              { key: "gdp", label: "GDP vs no-policy path (%)", data: r.gdp, color: pal.blue },
              { key: "jobs", label: "Green jobs index ÷ 100", data: r.jobs.map(j => j / 100), color: pal.green, dashed: true }
            ]} />
          </div>
          <div className="panel"><h3 style={{ marginBottom: 12 }}>Why this happens</h3>
            <div className="mech">
              {active.length === 0 && <p className="muted" style={{ fontFamily: "var(--sans)", fontSize: ".95rem" }}>Choose a scenario or move a policy lever. The mechanism behind each policy will appear here.</p>}
              {active.map(l => (
                <div key={l.id}>
                  <p><strong>{l.label}: {leverValue(l, p[l.id as keyof EnvParams])}</strong></p>
                  <p>{l.id === "defor" && p.defor > 0 ? ENV_MECH.deforUp : ENV_MECH[l.id]}</p>
                </div>
              ))}
              {p.ctax > 0 && p.ren > 60 && <><p><strong>How your policies interact</strong></p><p>The carbon tax and the renewables target overlap: as the grid gets cleaner, there are fewer emissions left for the tax to price, so its revenue shrinks over time and each extra dollar of tax buys smaller cuts. This is why economists debate whether to combine instruments or rely on one.</p></>}
              {cut < 45 && active.length > 0 && <p className="small" style={{ fontFamily: "var(--sans)" }}>Global pathways consistent with limiting warming to 1.5°C generally require far deeper cuts by mid-century than this mix achieves. Try combining levers.</p>}
            </div>
          </div>
          <div className="row">
            <button className="btn btn-primary" onClick={() => setSaving(true)}>Save simulation</button>
            <button className="btn btn-ghost" onClick={() => setSharing(true)}>Share result</button>
            <button className="btn btn-ghost" onClick={() => setAIOpen(true)}>Ask why</button>
          </div>
          <div className="panel">
            <h3 style={{ marginBottom: 6 }}>Real-world reference points</h3>
            <p className="small muted">Verified policies and findings for context. They are not inputs to the model.</p>
            <Refs items={ENV_EVIDENCE} />
            <p className="small" style={{ marginTop: 14 }}><b>Explore real data:</b> <a href="https://www.iea.org/data-and-statistics" target="_blank" rel="noopener noreferrer">IEA data and statistics</a>, <a href="https://data.worldbank.org/topic/climate-change" target="_blank" rel="noopener noreferrer">World Bank climate data</a>, <a href="https://www.oecd.org/en/topics/environment.html" target="_blank" rel="noopener noreferrer">OECD environment</a>.</p>
            <details style={{ marginTop: 14 }}><summary>Model assumptions</summary>
              <div className="small muted" style={{ marginTop: 10 }}>
                <p>Emissions split into energy (73), land use (15) and other sources (12) in 2026, with energy demand drifting up 0.4% a year. Renewable share rises along an S-curve to your 2050 target. The carbon tax abates up to about a third of remaining energy emissions with diminishing returns and a few years of phase-in.</p>
                <p>Forest cover declines 0.35% a year at the current clearing rate. GDP effects are deliberately small and follow a common pattern: adjustment costs first, efficiency and avoided-damage gains later. Air quality and plastic leakage are indices, not measured concentrations. All coefficients are illustrative.</p>
              </div>
            </details>
          </div>
        </div>
      </div>
      <SaveDialog open={saving} initial={sc.name} onClose={() => setSaving(false)} onSave={n => saveSim("environment", n, { ...p })} />
      {sharing && <ShareDialog open onClose={() => setSharing(false)} text={shareText} link={sc.shareLink()} />}
    </div>
  );
}
