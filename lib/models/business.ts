import { clamp, type Lever } from "@/lib/format";

/** Fictional firm, 12 months. Every number is hypothetical. */
export type BizParams = { price: number; mkt: number; wage: number; cost: number; comp: "passive" | "match" | "aggressive"; demand: "weak" | "normal" | "strong" };
export const BIZ_DEFAULT: BizParams = { price: 50, mkt: 40, wage: 3.8, cost: 24, comp: "match", demand: "normal" };

export const BIZ_LEVERS: Lever[] = [
  { id: "price", label: "Product price", min: 30, max: 90, step: 1, unit: "", pre: "$", hint: "Competitor starts at $50" },
  { id: "mkt", label: "Marketing per month", min: 0, max: 150, step: 5, unit: "k", pre: "$", hint: "Brand awareness builds over time" },
  { id: "wage", label: "Average monthly wage", min: 2.5, max: 6, step: 0.1, unit: "k", pre: "$", hint: "Market rate is about $3.8k" },
  { id: "cost", label: "Unit production cost", min: 15, max: 40, step: 1, unit: "", pre: "$", hint: "Materials, energy and logistics per unit" }
];
export const BIZ_SELECTS: { id: "comp" | "demand"; label: string; opts: [string, string][] }[] = [
  { id: "comp", label: "Competitor behaviour", opts: [["passive", "Passive: keeps its price"], ["match", "Matches your price moves"], ["aggressive", "Aggressive: cuts price and outspends"]] },
  { id: "demand", label: "Consumer demand", opts: [["weak", "Recession: demand 15% lower"], ["normal", "Normal"], ["strong", "Boom: demand 15% higher"]] }
];

export type BizSeries = { labels: string[]; revenue: number[]; profit: number[]; share: number[]; cash: number[]; units: number[]; cumProfit: number[]; capacityBound: boolean; compPrice: number };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function bizModel(p: BizParams): BizSeries {
  const market = 100000, staff = 40, overhead = 60000;
  const dmd = { weak: 0.85, normal: 1, strong: 1.15 }[p.demand];
  let compPrice = 50, compMkt = 40, share = 0.2, aware = 0.5, cash = 500000, recv = 0, cum = 0, lastUnits = 0;
  const out: BizSeries = { labels: [], revenue: [], profit: [], share: [], cash: [], units: [], cumProfit: [], capacityBound: false, compPrice: 50 };
  const wageRel = p.wage / 3.8;
  // above-market pay improves retention and productivity (saturating); below market hurts
  const productivity = clamp(0.75 + 0.35 * Math.tanh((wageRel - 1) * 2.2) + 0.25, 0.55, 1.25);
  const capacity = staff * 700 * productivity;
  const quality = (0.92 + 0.12 * Math.tanh((wageRel - 1) * 2)) * Math.pow(p.cost / 24, 0.35);
  const turnover = staff * Math.max(0, 1 - wageRel) * 8000; // recruiting and training cost of churn
  for (let m = 1; m <= 12; m++) {
    if (p.comp === "match") compPrice += (Math.min(p.price, 50) - compPrice) * 0.35;
    if (p.comp === "aggressive") { compPrice = Math.max(compPrice * 0.985, 38); compMkt = 70; }
    aware += (clamp(0.35 + 0.18 * Math.log1p(p.mkt / 10), 0.2, 1) - aware) * 0.25;
    const ours = Math.pow(p.price / compPrice, -2.1) * aware * quality;
    const theirs = clamp(0.35 + 0.18 * Math.log1p(compMkt / 10), 0.2, 1);
    const target = ours / (ours + theirs * 4); // rival plus smaller brands hold the rest
    share += (target - share) * 0.3;           // customers switch gradually
    const season = 1 + 0.06 * Math.sin(((m - 3) / 12) * 2 * Math.PI);
    const totalDemand = market * dmd * season * Math.pow((p.price + compPrice) / 2 / 50, -0.4);
    const units = Math.min(totalDemand * share, capacity);
    const revenue = units * p.price;
    const costs = units * p.cost + staff * p.wage * 1000 + p.mkt * 1000 + overhead + turnover;
    const profit = revenue - costs;
    const cashIn = revenue * 0.7 + recv; recv = revenue * 0.3; // 30% of sales paid next month
    cash += cashIn - costs; cum += profit; lastUnits = units;
    out.labels.push(MONTHS[m - 1]);
    out.revenue.push(Math.round(revenue)); out.profit.push(Math.round(profit));
    out.share.push(+((units / (market * dmd * season)) * 100).toFixed(2));
    out.cash.push(Math.round(cash)); out.units.push(Math.round(units)); out.cumProfit.push(Math.round(cum));
  }
  out.capacityBound = lastUnits >= capacity - 1;
  out.compPrice = compPrice;
  return out;
}

export function bizSummary(r: BizSeries) {
  const q1 = r.revenue.slice(0, 3).reduce((a, b) => a + b, 0), q4 = r.revenue.slice(9).reduce((a, b) => a + b, 0);
  return { revenue: r.revenue.reduce((a, b) => a + b, 0), profit: r.cumProfit[11], share: r.share[11], cash: r.cash[11], growth: (q4 / q1 - 1) * 100, minCash: Math.min(...r.cash) };
}

export const BIZ_PRESETS: { id: string; name: string; q: string; p: Partial<BizParams> }[] = [
  { id: "b-prem", name: "Premium positioning", q: "High price, strong brand, well-paid team", p: { price: 68, mkt: 90, wage: 4.6, cost: 30, comp: "match", demand: "normal" } },
  { id: "b-pen", name: "Penetration pricing", q: "Undercut the rival to win share fast", p: { price: 40, mkt: 50, wage: 3.6, cost: 23, comp: "match", demand: "normal" } },
  { id: "b-blitz", name: "Marketing blitz", q: "Spend heavily to buy awareness", p: { price: 52, mkt: 150, wage: 3.8, cost: 24, comp: "passive", demand: "normal" } },
  { id: "b-lean", name: "Lean operator", q: "Cut costs and wages to protect margin", p: { price: 48, mkt: 15, wage: 2.9, cost: 20, comp: "passive", demand: "weak" } },
  { id: "b-war", name: "Price war", q: "What if the competitor fights back?", p: { price: 44, mkt: 60, wage: 3.8, cost: 24, comp: "aggressive", demand: "normal" } }
];
