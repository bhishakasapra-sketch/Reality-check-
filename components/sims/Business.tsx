"use client";
import { useMemo, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { useAIContext } from "@/components/AskWhy";
import { Chips, Kpi, SaveDialog, ShareDialog, SimChart, Slider, Tier, TierLegend, usePalette } from "@/components/ui";
import { fmt, sgn, tone, usd } from "@/lib/format";
import { BIZ_DEFAULT, BIZ_LEVERS, BIZ_PRESETS, BIZ_SELECTS, bizModel, bizSummary, type BizParams, type BizSeries } from "@/lib/models/business";
import { useScenario } from "./useScenario";

const METRICS = { revenue: "Revenue", profit: "Monthly profit", share: "Market share", cash: "Cash balance" } as const;
type Metric = keyof typeof METRICS;

function drivers(p: BizParams, r: BizSeries, s: ReturnType<typeof bizSummary>) {
  const out: [string, string][] = [];
  const rel = p.price / r.compPrice;
  if (rel > 1.15) out.push(["Premium price, smaller share.", `At $${p.price} you are ${Math.round((rel - 1) * 100)}% above your rival. Demand here is price-elastic (each 1% price premium costs roughly 2% of attractiveness), so customers drift away gradually. A higher margin per unit can still mean more profit if the lost volume is small enough: that is the trade-off between margin and volume.`]);
  else if (rel < 0.92) out.push(["Undercutting the rival.", `Your lower price wins customers, but ${p.comp === "passive" ? "your passive rival lets you keep the gap, so the share gain sticks." : "your rival responds by cutting its own price, eroding your advantage. Price wars often transfer value to customers rather than to either firm."}`]);
  else out.push(["Price close to the rival.", "Competition happens on brand and quality rather than price."]);
  if (p.mkt >= 90) out.push(["Heavy marketing.", `Awareness builds over several months and each extra dollar buys less than the last (diminishing marginal returns). Check whether the extra gross profit covers the $${p.mkt}k monthly bill.`]);
  if (p.mkt <= 15) out.push(["Little marketing.", "Awareness decays, so share slips even if price is competitive. The savings show up immediately; the lost customers show up later."]);
  if (p.wage >= 4.3) out.push(["Above-market pay.", `This adds about $${Math.round((p.wage - 3.8) * 40)}k a month to costs, but in the model it lifts productivity and product quality (an efficiency-wage effect: less turnover, more experienced staff).`]);
  if (p.wage <= 3.3) out.push(["Below-market pay.", `Wage savings are offset by lower productivity and quality as experienced staff leave, plus about $${Math.round(40 * (1 - p.wage / 3.8) * 8)}k a month spent recruiting and training replacements.`]);
  if (r.capacityBound) out.push(["At full capacity.", "Demand exceeds what 40 staff can produce, so revenue is capped. Raising price would cost few sales; hiring would be the next decision."]);
  if (p.cost <= 20) out.push(["Cheaper inputs.", "Lower unit cost raises margin, but cheaper materials slightly reduce quality, so some customers drift away."]);
  const margin = p.price - p.cost;
  out.push(["Unit economics.", `Each unit contributes $${margin} toward fixed costs (${Math.round((margin / p.price) * 100)}% of price).${margin < 15 ? " That is thin: small drops in volume quickly turn into losses." : ""}`]);
  if (s.minCash < 0) out.push(["Cash crunch.", "Because 30% of each month’s sales arrive a month later, cash lags profit. You would have needed a loan or overdraft. Many profitable businesses fail this way: profit is an accounting measure, cash pays the bills."]);
  if (p.demand === "weak") out.push(["Recession.", "Demand is 15% lower across the market, so fixed costs weigh more heavily on each unit sold."]);
  return out;
}

export default function Business() {
  const { saveSim, award, setAIOpen } = useApp();
  const pal = usePalette();
  const sc = useScenario<BizParams>("business", "biz", BIZ_DEFAULT, BIZ_PRESETS);
  const { p } = sc;
  const [metric, setMetric] = useState<Metric>("revenue");
  const [pins, setPins] = useState<{ A?: BizParams; B?: BizParams }>({});
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const r = useMemo(() => bizModel(p), [p]);
  const s = bizSummary(r);
  const fmtY = (v: number) => (metric === "share" ? `${fmt(v)}%` : usd(v));
  const sa = pins.A && bizSummary(bizModel(pins.A)), sb = pins.B && bizSummary(bizModel(pins.B));

  useAIContext("business", {
    settings: p,
    results: { annual_revenue: Math.round(s.revenue), annual_profit: Math.round(s.profit), dec_market_share_pct: +s.share.toFixed(2), start_share_pct: 20, dec_cash: Math.round(s.cash), lowest_cash: Math.round(s.minCash), revenue_growth_q4_vs_q1_pct: +s.growth.toFixed(1), competitor_final_price: +r.compPrice.toFixed(2), capacity_constrained: r.capacityBound },
    model: "hypothetical firm; price elasticity about -2.1 vs rival; marketing has diminishing returns; above-market wages raise productivity and quality; below-market wages add turnover costs; 30% of sales paid next month"
  });

  const pin = (slot: "A" | "B") => { const next = { ...pins, [slot]: { ...p } }; setPins(next); if (next.A && next.B) award("compare"); };
  const series = [
    { key: "you", label: "Your strategy", data: r[metric], color: pal.blue, width: 2.6 },
    ...(pins.A ? [{ key: "a", label: "Strategy A", data: bizModel(pins.A)[metric], color: pal.green, width: 1.8 }] : []),
    ...(pins.B ? [{ key: "b", label: "Strategy B", data: bizModel(pins.B)[metric], color: pal.amber, width: 1.8 }] : [])
  ];
  const shareText = `Reality Check · Business simulator\n\nStrategy: price $${p.price}, marketing $${p.mkt}k/month, wage $${fmt(p.wage)}k, unit cost $${p.cost}, competitor ${p.comp}, demand ${p.demand}\n\nAfter 12 months (hypothetical firm):\nRevenue ${usd(s.revenue)}\nProfit ${usd(s.profit)}\nMarket share ${fmt(s.share)}% (started at 20%)\nCash ${usd(s.cash)}\n\nIllustrative simulation, not real company data.`;

  return (
    <div className="wrap">
      <div className="sim-head">
        <span className="mod">Module B</span>
        <h1 style={{ fontSize: "clamp(2rem,4vw,3.1rem)", marginTop: 6 }}>Business simulator</h1>
        <p>You run a mid-sized consumer brand with 40 staff, $500k in the bank and 20% of a 100,000-unit monthly market. A rival sells at $50. Set your strategy and play out the year.</p>
        <TierLegend />
      </div>
      <div className="presets"><Chips label="Strategies" items={BIZ_PRESETS.map(x => ({ id: x.id, name: x.name, title: x.q }))} value={sc.presetId} onPick={sc.applyPreset} /></div>
      <div className="sim-grid">
        <aside className="panel controls" aria-label="Strategy decisions">
          <div className="spread"><b>Your decisions</b><button className="btn btn-ghost btn-sm" onClick={sc.reset}>Reset</button></div>
          {BIZ_LEVERS.map(l => <Slider key={l.id} lever={l} value={p[l.id as "price"]} onChange={v => sc.set(l.id as keyof BizParams, v as never)} onCommit={sc.commit} />)}
          {BIZ_SELECTS.map(sel => (
            <div className="ctl" key={sel.id}>
              <label htmlFor={`sel-${sel.id}`}>{sel.label}</label>
              <select id={`sel-${sel.id}`} style={{ marginTop: 8 }} value={p[sel.id]} onChange={e => { sc.set(sel.id, e.target.value as never); setTimeout(sc.commit, 0); }}>
                {sel.opts.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
              </select>
            </div>
          ))}
        </aside>
        <div className="stack">
          <div className="kpis">
            <Kpi k="Annual revenue" v={usd(s.revenue)} d={`${sgn(s.growth, 0)}% Q4 vs Q1`} tone={tone(s.growth)} />
            <Kpi k="Annual profit" v={usd(s.profit)} d={s.profit >= 0 ? "Profitable" : "Loss-making"} tone={tone(s.profit)} />
            <Kpi k="Market share, Dec" v={`${fmt(s.share)}%`} d={`${sgn(s.share - 20)} pts from 20%`} tone={tone(s.share - 20)} />
            <Kpi k="Cash, Dec" v={usd(s.cash)} d={s.minCash < 0 ? "Ran out of cash mid-year" : `Lowest: ${usd(s.minCash)}`} tone={s.minCash < 0 ? "down" : tone(s.cash - 500000)} />
          </div>
          <div className="panel">
            <div className="spread" style={{ marginBottom: 12 }}>
              <Chips label="Chart metric" items={(Object.keys(METRICS) as Metric[]).map(k => ({ id: k, name: METRICS[k] }))} value={metric} onPick={setMetric} />
              <Tier kind="sim" />
            </div>
            <SimChart labels={r.labels} series={series} format={fmtY} />
          </div>
          <div className="panel"><h3 style={{ marginBottom: 12 }}>What drove the result</h3>
            <div className="mech">{drivers(p, r, s).map(([h, t]) => <p key={h}><strong>{h}</strong> {t}</p>)}</div>
          </div>
          <div className="panel">
            <div className="spread" style={{ marginBottom: 12 }}>
              <h3>Strategy face-off</h3>
              <div className="row"><button className="btn btn-ghost btn-sm" onClick={() => pin("A")}>Pin as A</button><button className="btn btn-ghost btn-sm" onClick={() => pin("B")}>Pin as B</button></div>
            </div>
            {!pins.A && !pins.B ? <p className="muted small" style={{ margin: 0 }}>Pin two strategies to see which wins on profit, share and cash.</p> : (
              <>
                <div className="scroll-x"><table>
                  <thead><tr><th /><th>Strategy A</th><th>Strategy B</th></tr></thead>
                  <tbody>
                    {([["Price", (q: BizParams) => `$${q.price}`], ["Marketing / month", (q: BizParams) => `$${q.mkt}k`], ["Wage", (q: BizParams) => `$${fmt(q.wage)}k`], ["Competitor", (q: BizParams) => q.comp]] as const).map(([n, f]) => (
                      <tr key={n}><td className="muted small">{n}</td><td>{pins.A ? f(pins.A) : "–"}</td><td>{pins.B ? f(pins.B) : "–"}</td></tr>
                    ))}
                    {([["Annual revenue", "revenue", usd], ["Annual profit", "profit", usd], ["Market share, Dec", "share", (v: number) => `${fmt(v)}%`], ["Cash, Dec", "cash", usd]] as const).map(([n, k, f]) => (
                      <tr key={k}><td>{n}</td><td><b>{sa ? f(sa[k]) : "–"}</b></td><td><b>{sb ? f(sb[k]) : "–"}</b></td></tr>
                    ))}
                  </tbody>
                </table></div>
                {sa && sb && <p className="small" style={{ margin: "12px 0 0" }}><b>{sa.profit >= sb.profit ? "Strategy A" : "Strategy B"} earns more profit</b>, while {sa.share >= sb.share ? "A" : "B"} ends with the larger market share{(sa.profit >= sb.profit) !== (sa.share >= sb.share) ? ": a classic profit-versus-growth trade-off." : "."}</p>}
              </>
            )}
          </div>
          <div className="row">
            <button className="btn btn-primary" onClick={() => setSaving(true)}>Save simulation</button>
            <button className="btn btn-ghost" onClick={() => setSharing(true)}>Share result</button>
            <button className="btn btn-ghost" onClick={() => setAIOpen(true)}>Ask why</button>
          </div>
          <details className="panel"><summary>Model assumptions</summary>
            <div className="small muted" style={{ marginTop: 10 }}>
              <p>A fictional company in a sample market, so every number here is hypothetical. Your share of the market moves toward an attractiveness score each month (30% of the way per month, because customers switch gradually).</p>
              <p>Attractiveness falls with your price relative to the rival’s (price elasticity of about −2.1), rises with brand awareness (marketing has diminishing returns) and with product quality, which improves when wages are above the $3.8k market rate. Paying below market adds a recruiting and training cost for staff who leave. Cheaper inputs slightly reduce quality. Capacity is about 700 units per worker per month, scaled by productivity. Fixed overhead is $60k a month. Customers pay 70% of a month’s sales immediately and 30% the following month, so cash lags profit.</p>
              <p>A matching competitor moves 35% of the way to your price whenever you undercut it. An aggressive competitor cuts 1.5% a month (to a floor of $38) and raises its marketing.</p>
            </div>
          </details>
        </div>
      </div>
      <SaveDialog open={saving} initial={sc.name} onClose={() => setSaving(false)} onSave={n => saveSim("business", n, { ...p })} />
      {sharing && <ShareDialog open onClose={() => setSharing(false)} text={shareText} link={sc.shareLink()} />}
    </div>
  );
}
