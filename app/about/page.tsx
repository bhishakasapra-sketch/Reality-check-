import type { Metadata } from "next";

export const metadata: Metadata = { title: "About and methodology" };

export default function About() {
  return (
<div className="wrap" style={{maxWidth:860}}><div className="sim-head"><h1 style={{fontSize:"clamp(2.2rem,4.6vw,3.6rem)"}}>Decisions are easier to judge when you can see what they set in motion.</h1>
    <p style={{fontSize:"1.1rem"}}>Reality Check turns the questions behind the news into models you can take apart. Raise a rate, start a price war, tax carbon, then follow the chain of cause and effect to the people it reaches.</p></div>
    <div className="stack">
      <div className="panel"><h3 style={{marginBottom:10}}>What we believe</h3><div className="mech"><p>Most public arguments about economics and the environment are really arguments about trade-offs: who gains, who pays, and when. Those trade-offs are learnable. You don’t need a degree to see why a tariff raises prices, or why a profitable business can still run out of cash. You need a way to try it.</p><p>So every simulator here is transparent. The assumptions are written down, the mechanisms are explained in plain language, and every result is labelled for what it is.</p></div></div>
      <div className="panel"><h3 style={{marginBottom:10}}>How to read our numbers</h3>
        <div className="stack small">
          <div><span className="tier tier-hist">Historical record</span><p style={{margin:"6px 0 0"}}>Things that happened, stated with a named source you can check, such as the US Bureau of Labor Statistics, a central bank or a UN agency. We use these for context only.</p></div>
          <div><span className="tier tier-model">Model estimate</span><p style={{margin:"6px 0 0"}}>Outputs of our simplified models. Coefficients are chosen to be plausible and to make mechanisms visible. They are not forecasts and should not be quoted as facts about any real country.</p></div>
          <div><span className="tier tier-sim">Hypothetical scenario</span><p style={{margin:"6px 0 0"}}>Your settings, and fictional entities such as the company in the business simulator. Entirely invented, by design.</p></div>
        </div>
        <p className="small muted" style={{marginTop:14}}>No data on this site is live. Where we point to real data, we link to the original publisher: the <a href="https://data.worldbank.org" target="_blank" rel="noopener noreferrer">World Bank</a>, <a href="https://www.imf.org/en/Data" target="_blank" rel="noopener noreferrer">IMF</a>, <a href="https://data.oecd.org" target="_blank" rel="noopener noreferrer">OECD</a>, <a href="https://data.un.org" target="_blank" rel="noopener noreferrer">UN</a> and <a href="https://www.iea.org/data-and-statistics" target="_blank" rel="noopener noreferrer">IEA</a>.</p></div>
      <div className="panel"><h3 style={{marginBottom:10}}>The modules</h3><div className="mech">
        <p><strong>Economics</strong> traces six policy levers through a reduced-form model of demand, prices and jobs, with lags on monetary policy and a fading fiscal multiplier.</p>
        <p><strong>Business</strong> runs a fictional firm for twelve months with price-elastic demand, diminishing returns to marketing, efficiency wages, a reacting competitor and a cash-flow lag.</p>
        <p><strong>Environment</strong> projects emissions, air quality, forests, plastic and GDP to 2050 under a stylised policy mix.</p>
        <p><strong>Global challenges</strong> poses real dilemmas, asks you to commit and explain, then shows the trade-offs, evidence and how others decided.</p></div></div>
      <div className="panel"><h3 style={{marginBottom:10}}>The explanation assistant</h3><p className="small">“Ask why” sends your question, together with the current simulation’s settings and results, to an AI model (Claude, by Anthropic) through our server. It is instructed to explain mechanisms step by step, separate model assumptions from real-world evidence, flag genuine disagreements, and never invent statistics. Treat its answers as a tutor’s explanation, not a citation.</p></div>
      <div className="panel"><h3 style={{marginBottom:10}}>Accounts and privacy</h3><p className="small" style={{margin:0}}>When you sign in, your saved simulations, history and written reasoning are private to your account. Only your display name, your score and anonymous totals of challenge choices are shared. In guest mode everything stays in this browser.</p></div>
    </div></div>
  );
}
