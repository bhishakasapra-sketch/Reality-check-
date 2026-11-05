import { clamp, type Lever } from "@/lib/format";

/** Stylised economy 2026–2050, indices 2026 = 100. Illustrative only. */
export type EnvParams = { ctax: number; ren: number; plastic: number; defor: number; tour: number; urban: number };
export const ENV_DEFAULT: EnvParams = { ctax: 0, ren: 30, plastic: 0, defor: 0, tour: 0, urban: 0 };

export const ENV_LEVERS: Lever[] = [
  { id: "ctax", label: "Carbon tax", min: 0, max: 200, step: 5, unit: "/t CO₂", pre: "$", hint: "Price on each tonne of carbon dioxide emitted" },
  { id: "ren", label: "Renewable electricity by 2050", min: 30, max: 95, step: 1, unit: "%", hint: "Model starts at 30% of electricity" },
  { id: "plastic", label: "Single-use plastic ban", min: 0, max: 100, step: 5, unit: "%", hint: "Share of single-use items covered" },
  { id: "defor", label: "Deforestation rate", min: -100, max: 100, step: 5, unit: "%", hint: "Change vs current clearing rate (−100% = none)" },
  { id: "tour", label: "Sustainable tourism policy", min: 0, max: 100, step: 5, unit: "", hint: "Strength of visitor fees and caps (0 to 100)" },
  { id: "urban", label: "Urban pollution controls", min: 0, max: 100, step: 5, unit: "", hint: "Vehicle standards, clean transport, industry rules" }
];

export type EnvSeries = { labels: string[]; emis: number[]; pm: number[]; forest: number[]; plastic: number[]; gdp: number[]; jobs: number[]; crev: number[] };

export function envModel(p: EnvParams): EnvSeries {
  const out: EnvSeries = { labels: [], emis: [], pm: [], forest: [], plastic: [], gdp: [], jobs: [], crev: [] };
  let forest = 100;
  for (let i = 0; i <= 24; i++) {
    const frac = i / 24, ramp = 1 - Math.exp(-i / 4), ease = frac * frac * (3 - 2 * frac);
    const rs = 30 + (p.ren - 30) * ease;                                // renewable share follows an S-curve
    const taxAbate = 0.32 * (1 - Math.exp(-p.ctax / 90)) * ramp;       // diminishing abatement per dollar
    const drift = 1 + 0.004 * i;                                       // underlying demand growth
    const energy = 73 * drift * (1 - (0.8 * (rs - 30)) / 70) * (1 - taxAbate) * (1 - ((0.06 * p.urban) / 100) * ramp);
    const land = 15 * (1 + ((0.7 * p.defor) / 100) * ramp);
    const other = 12 * drift * (1 - ((0.08 * p.plastic) / 100) * ramp) * (1 - 0.15 * taxAbate);
    forest = Math.max(0, forest - (0.35 * (1 + p.defor / 100) - (0.06 * p.tour) / 100));
    const pm = 100 * (1 - ((0.38 * p.urban) / 100) * ramp - (0.22 * (rs - 30)) / 70 - (0.08 * taxAbate) / 0.32);
    const plast = 100 * (1 + 0.022 * i) * (1 - ((0.72 * p.plastic) / 100) * ramp);
    const gdp = -0.012 * p.ctax * ramp * (1 - 0.7 * frac)                // adjustment costs that shrink as firms adapt
      + 0.028 * (rs - 30) * frac * (frac - 0.25)                         // early investment, later fuel savings
      - ((0.5 * p.tour) / 100) * ramp * (1 - frac) + ((0.25 * p.tour) / 100) * frac
      + ((0.25 * p.defor) / 100) * (1 - frac) - ((0.6 * p.defor) / 100) * frac // short-run gains vs lost ecosystem services
      + 0.006 * p.urban * frac - 0.004 * p.urban * (1 - frac) - 0.003 * p.plastic * (1 - frac);
    const jobs = 100 + 1.6 * (rs - 30) * ease + 0.12 * p.ctax * ramp + 0.08 * p.urban * ramp;
    out.labels.push(String(2026 + i));
    out.emis.push(+(energy + land + other).toFixed(1)); out.pm.push(+clamp(pm, 20, 140).toFixed(1));
    out.forest.push(+forest.toFixed(1)); out.plastic.push(+Math.max(0, plast).toFixed(1));
    out.gdp.push(+gdp.toFixed(2)); out.jobs.push(+jobs.toFixed(1)); out.crev.push(+(((p.ctax * (energy + other)) / 100) * 0.011).toFixed(2));
  }
  return out;
}

export const ENV_PRESETS: { id: string; name: string; q: string; p: Partial<EnvParams> }[] = [
  { id: "v-ctax", name: "$100 carbon tax", q: "What does a strong carbon price do?", p: { ctax: 100 } },
  { id: "v-ren", name: "80% renewable grid", q: "Can renewables alone cut emissions?", p: { ren: 80 } },
  { id: "v-plastic", name: "Plastic ban", q: "What does a full single-use plastic ban change?", p: { plastic: 100 } },
  { id: "v-defor", name: "End deforestation", q: "What if forest clearing stopped?", p: { defor: -100 } },
  { id: "v-tour", name: "Sustainable tourism", q: "Visitor fees and caps for fragile places", p: { tour: 80, defor: -20 } },
  { id: "v-city", name: "Clean air cities", q: "Tackling urban pollution head-on", p: { urban: 85, ren: 50 } },
  { id: "v-all", name: "Full transition", q: "Every lever pulled at once", p: { ctax: 120, ren: 90, plastic: 80, defor: -90, tour: 60, urban: 80 } }
];
