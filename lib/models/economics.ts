import { avg, clamp, type Lever } from "@/lib/format";

/** Illustrative reduced-form model, quarterly, 12 quarters. Not a forecast. */
export type EconParams = { rate: number; tax: number; tariff: number; mw: number; spend: number; oil: number };
export const ECON_ZERO: EconParams = { rate: 0, tax: 0, tariff: 0, mw: 0, spend: 0, oil: 0 };
export const ECON_BASE = { infl: 4.0, growth: 3.0, unemp: 6.0 };

export const ECON_LEVERS: Lever[] = [
  { id: "rate", label: "Policy interest rate", min: -3, max: 5, step: 0.25, unit: " pp", hint: "Change to the central bank’s rate, in percentage points" },
  { id: "tax", label: "Income tax rate", min: -10, max: 10, step: 0.5, unit: " pp", hint: "Change to the average income tax rate" },
  { id: "tariff", label: "Import tariff", min: 0, max: 40, step: 1, unit: "%", hint: "New average tariff on imported goods" },
  { id: "mw", label: "Minimum wage", min: -10, max: 40, step: 1, unit: "%", hint: "Change to the statutory minimum wage" },
  { id: "spend", label: "Government spending", min: -5, max: 5, step: 0.25, unit: "% GDP", hint: "Change in public spending as a share of GDP" },
  { id: "oil", label: "Energy price shock", min: -30, max: 60, step: 5, unit: "%", hint: "Change in world energy prices (a supply shock)" }
];

export type EconSeries = { labels: string[]; infl: number[]; growth: number[]; unemp: number[]; rev: number[]; real: number[]; margin: number[] };

export function econModel(p: EconParams): EconSeries {
  const out: EconSeries = { labels: [], infl: [], growth: [], unemp: [], rev: [], real: [], margin: [] };
  let gap = 0;
  for (let t = 1; t <= 12; t++) {
    const fast = 1 - Math.exp(-t / 1.5), slow = 1 - Math.exp(-Math.max(0, t - 1) / 3.5), fade = Math.exp(-t / 9);
    const dg =
      0.65 * p.spend * fast * fade                 // fiscal impulse, fades
      - 0.11 * p.tax * fast                         // lower disposable income
      - 0.55 * p.rate * slow * Math.exp(-t / 16)    // monetary transmission with lags
      - 0.03 * p.tariff * slow                      // input costs, efficiency loss, retaliation risk
      - 0.018 * p.oil * fast * Math.exp(-t / 6)
      + 0.006 * p.mw * fast * Math.exp(-t / 5)      // spending by low-wage households
      - 0.007 * Math.max(0, p.mw) * slow;           // higher labour costs
    gap = gap * 0.8 + dg * 0.4;
    const infl = ECON_BASE.infl + 0.55 * gap
      + 0.085 * p.tariff * fast * Math.exp(-t / 6)  // one-off price-level jump
      + 0.05 * p.oil * fast * Math.exp(-t / 4.5)
      + 0.03 * p.mw * fast * Math.exp(-t / 7)
      - 0.18 * p.rate * slow;                        // expectations / exchange-rate channel
    const unemp = ECON_BASE.unemp - 0.5 * gap + 0.012 * Math.max(0, p.mw) * slow;
    const rev = 100 + 2.3 * p.tax * (1 - 0.15 * slow) + 0.32 * p.tariff * (1 - 0.35 * slow) + 1.6 * gap - 0.05 * p.oil * fast * Math.exp(-t / 6);
    const wageG = 3.5 + 0.45 * gap + 0.18 * p.mw * Math.exp(-t / 3) * (t <= 4 ? 1 : 0.3);
    const real = wageG - infl - 0.35 * p.tax * (t <= 4 ? fast : 1) * 0.4;
    const margin = 100 + 1.8 * gap - 0.22 * Math.max(0, p.mw) - 0.2 * p.oil * fast * Math.exp(-t / 6) - 0.9 * p.rate * slow - 0.18 * p.tariff;
    out.labels.push(`Q${t}`);
    out.infl.push(+infl.toFixed(2)); out.growth.push(+(ECON_BASE.growth + dg).toFixed(2)); out.unemp.push(+clamp(unemp, 1, 25).toFixed(2));
    out.rev.push(+rev.toFixed(1)); out.real.push(+real.toFixed(2)); out.margin.push(+margin.toFixed(1));
  }
  return out;
}

export function econSummary(r: EconSeries) {
  return { infl: avg(r.infl, 4, 8), growth: avg(r.growth, 4, 8), unemp: avg(r.unemp, 4, 8), rev: avg(r.rev, 4, 8), real: avg(r.real, 0, 8), margin: avg(r.margin, 0, 8) };
}

export const ECON_PRESETS: { id: string; name: string; q: string; p: Partial<EconParams> }[] = [
  { id: "e-oil", name: "Inflation shock", q: "What happens if inflation increases?", p: { oil: 40 } },
  { id: "e-rate", name: "Rates up 2 points", q: "What if interest rates rise by 2%?", p: { rate: 2 } },
  { id: "e-tax", name: "Income tax up 5 points", q: "What if a government increases income tax?", p: { tax: 5 } },
  { id: "e-tariff", name: "25% import tariff", q: "What happens if a country introduces import tariffs?", p: { tariff: 25 } },
  { id: "e-mw", name: "Minimum wage +20%", q: "What if the minimum wage increases by 20%?", p: { mw: 20 } },
  { id: "e-mix", name: "Shock and response", q: "Energy shock, and the central bank responds", p: { oil: 40, rate: 2.5 } },
  { id: "e-stim", name: "Stimulus package", q: "What if a government spends 2% of GDP more?", p: { spend: 2 } }
];

export function econInteractions(p: EconParams): string[] {
  const n: string[] = [];
  if (p.oil > 0 && p.rate > 0) n.push("You are fighting a supply shock with demand tools. Higher rates bring inflation down faster, but they cannot undo the energy shock’s cost increase, so output takes a double hit.");
  if (p.spend > 0 && p.rate > 0) n.push("Fiscal and monetary policy are pulling in opposite directions: spending adds demand while higher rates remove it, so each partly cancels the other.");
  if (p.tariff > 0 && p.rate < 0) n.push("Cutting rates while tariffs push prices up risks inflation getting stuck above target.");
  if (p.tax > 0 && p.spend > 0) n.push("Raising tax and spending together (a balanced budget expansion) can still lift output slightly, because government spends all of the money while households would have saved part of it.");
  if (p.mw > 15 && p.oil > 0) n.push("A large minimum wage rise during an energy shock adds to firms’ costs at the same moment, increasing the risk of price rises feeding into wages and back again.");
  return n;
}
