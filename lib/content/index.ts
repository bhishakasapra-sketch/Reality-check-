/* ─────────────────────────────────────────────────────────────
   Every "Historical record" here must be verifiable at its source.
   Add a new one only after checking it against the publisher.
   ───────────────────────────────────────────────────────────── */
export type Evidence = { t: string; src: string; url: string };

export const EVIDENCE: Record<string, Evidence> = {
  bls: { t: "US consumer price inflation reached 9.1% year on year in June 2022, the highest in about four decades.", src: "US Bureau of Labor Statistics", url: "https://www.bls.gov/cpi/" },
  fed: { t: "The US Federal Reserve raised its policy rate from near zero in March 2022 to a 5.25–5.50% target range by July 2023.", src: "Federal Reserve", url: "https://www.federalreserve.gov/monetarypolicy/openmarket.htm" },
  rbi: { t: "The Reserve Bank of India raised its repo rate from 4.00% to 6.50% between May 2022 and February 2023.", src: "Reserve Bank of India", url: "https://www.rbi.org.in" },
  s232: { t: "In 2018 the United States imposed tariffs of 25% on steel and 10% on aluminium imports under Section 232.", src: "US Department of Commerce", url: "https://www.commerce.gov" },
  germw: { t: "Germany introduced a national minimum wage of €8.50 per hour in January 2015.", src: "German Federal Statistical Office", url: "https://www.destatis.de" },
  sweden: { t: "Sweden introduced a carbon tax in 1991; it is one of the highest carbon prices in the world.", src: "Government Offices of Sweden", url: "https://www.government.se" },
  kenya: { t: "Kenya banned the manufacture, sale and use of plastic carrier bags in 2017; Rwanda introduced a ban in 2008.", src: "UN Environment Programme", url: "https://www.unep.org" },
  ireland: { t: "Ireland introduced a plastic bag levy in 2002, which was followed by a large drop in bag use.", src: "Government of Ireland", url: "https://www.gov.ie" },
  bhutan: { t: "Bhutan raised its Sustainable Development Fee for most international visitors to USD 200 per night in 2022, later reducing it to USD 100.", src: "Tourism Council of Bhutan", url: "https://www.bhutan.travel" },
  solar: { t: "IRENA reports the global average cost of electricity from new utility-scale solar fell by roughly 85% between 2010 and 2020.", src: "IRENA", url: "https://www.irena.org" },
  paris: { t: "The Paris Agreement (2015) aims to hold warming well below 2°C and pursue efforts to limit it to 1.5°C.", src: "UNFCCC", url: "https://unfccc.int" },
  smoot: { t: "The US Smoot–Hawley Tariff Act (1930) raised tariffs on thousands of goods and prompted retaliation; how much it worsened the Great Depression is still debated.", src: "US Office of the Historian", url: "https://history.state.gov" },
  cardk: { t: "Card and Krueger (1994) found no fall in fast-food employment in New Jersey after a minimum wage rise, starting a long and still unresolved debate.", src: "American Economic Review", url: "https://www.aeaweb.org" },
  eeg: { t: "Germany’s Renewable Energy Sources Act (EEG, 2000) used guaranteed feed-in tariffs to drive early solar and wind deployment.", src: "German Federal Government", url: "https://www.bundesregierung.de" },
  volcker: { t: "Under Paul Volcker the US Federal Reserve raised rates sharply around 1979–81; inflation fell substantially, alongside a deep recession.", src: "Federal Reserve History", url: "https://www.federalreservehistory.org" }
};
export const ECON_EVIDENCE = ["bls", "fed", "rbi", "s232", "germw"].map(k => EVIDENCE[k]);
export const ENV_EVIDENCE = ["sweden", "kenya", "ireland", "bhutan", "solar", "paris"].map(k => EVIDENCE[k]);
export const ECON_DATA_LINKS: [string, string][] = [
  ["Inflation, consumer prices (annual %)", "https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG"],
  ["GDP growth (annual %)", "https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG"],
  ["Unemployment (% of labour force)", "https://data.worldbank.org/indicator/SL.UEM.TOTL.ZS"],
  ["IMF World Economic Outlook database", "https://www.imf.org/en/Publications/WEO"]
];

/* ── Causal chains ─────────────────────────────────────────── */
export const ECON_MECH: Record<string, { chain: string[]; text: string; down: string }> = {
  rate: {
    chain: ["Higher policy rate", "Dearer loans and mortgages", "Saving pays more", "Less borrowing, investment and big-ticket spending", "Currency tends to strengthen", "Demand falls below capacity", "Price pressure eases"],
    text: "When the central bank raises its rate, commercial banks pass the higher cost of money on to borrowers. A firm deciding whether to build a factory now compares the expected return against a higher interest bill, so marginal projects are cancelled. Households with variable-rate mortgages have less left over to spend, and saving becomes more attractive than consuming today. Higher rates also tend to attract foreign capital, strengthening the currency, which makes imports cheaper and exports less competitive. All of this shifts aggregate demand left. Firms facing weaker demand raise prices less aggressively and hire less, so inflation falls, but with long and variable lags, and at the cost of slower growth and higher unemployment in the meantime.",
    down: "Cutting the rate runs the mechanism in reverse: cheaper credit encourages borrowing, investment and consumption, lifting demand. If the economy has spare capacity this raises output and jobs; if it is already near capacity, more of the boost leaks into inflation."
  },
  tax: {
    chain: ["Higher income tax", "Lower disposable income", "Households cut consumption", "Weaker demand", "Revenue rises, partly offset"],
    text: "A higher income tax rate takes a larger share of each pay cheque, so households’ disposable income falls. Because consumption depends on disposable income, spending drops, by more for lower-income households who spend most of what they earn. The government collects more revenue, but some of the gain is clawed back as weaker activity shrinks the tax base. Over longer horizons a higher marginal rate can also reduce the incentive to work extra hours, though the size of this effect is debated.",
    down: "A tax cut raises disposable income and consumption. Revenue falls by less than the static estimate if activity picks up, but it rarely pays for itself entirely."
  },
  tariff: {
    chain: ["Tariff on imports", "Imported goods cost more", "Domestic producers face less competition", "Consumers pay higher prices", "One-off jump in inflation", "Efficiency losses, possible retaliation"],
    text: "A tariff is a tax on imports. It raises the domestic price of imported goods, so consumers pay more and buy less, and domestic producers of competing goods can raise prices and output behind the barrier. The government gains tariff revenue. The losses come from two directions: consumers lose more surplus than producers and government gain together (the deadweight loss), and firms that use imported inputs face higher costs. Trading partners may retaliate, hurting exporters. In the model the price jump shows up as a temporary rise in inflation that fades once the new price level is absorbed.",
    down: ""
  },
  mw: {
    chain: ["Higher minimum wage", "Pay rises for the lowest earners", "More spending by low-wage households", "Labour costs rise for some firms", "Possible fewer hours or hires, or higher prices"],
    text: "Raising the wage floor transfers income to the lowest-paid workers, who tend to spend a large share of extra income, so local demand rises. For employers it raises labour costs; they can absorb this in profits, raise prices, improve productivity, or reduce hours and hiring. Which response dominates depends on how much market power employers have: where a few firms dominate local hiring (monopsony), a moderate increase can even raise employment. The empirical literature is genuinely divided, and effects grow with the size of the rise relative to the median wage. The model uses a small negative employment effect as a middle-ground assumption.",
    down: "Cutting the minimum wage lowers labour costs and may encourage some hiring, but reduces pay for the lowest earners and their spending."
  },
  spend: {
    chain: ["Higher government spending", "Direct demand for goods and services", "Incomes rise and are partly re-spent", "Output and jobs rise", "Higher inflation if near capacity"],
    text: "Extra government spending is a direct injection into aggregate demand. The firms and workers who receive it spend part of their new income, creating further rounds of demand: the multiplier. The multiplier is larger when there is spare capacity and when the central bank does not offset it with higher rates, and smaller when the economy is near full employment or when households save the extra income expecting future taxes.",
    down: "Austerity removes demand. The short-run hit to output is larger in a downturn, while the long-run effect depends on how debt and interest costs evolve."
  },
  oil: {
    chain: ["Energy prices jump", "Production and transport costs rise", "Firms raise prices (cost-push)", "Real incomes squeezed", "Output falls while inflation rises"],
    text: "An energy price shock is a supply shock: it raises costs for almost every producer, shifting short-run aggregate supply left. The result is the uncomfortable combination of higher inflation and lower output. Households paying more for fuel and heating have less to spend on everything else. Central banks face a dilemma: raising rates fights the inflation but deepens the slowdown; looking through it risks inflation expectations drifting upward.",
    down: "Cheaper energy lowers costs across the economy, raising real incomes and output while easing inflation."
  }
};

export const ENV_MECH: Record<string, string> = {
  ctax: "A carbon tax puts a price on the external cost of emissions that polluters otherwise ignore. Every firm then compares the tax with its own cost of cutting a tonne: where cutting is cheaper than paying, it cuts. That is why a carbon tax finds the cheapest reductions first without the government needing to know where they are. Energy-intensive goods become dearer, so consumers also shift toward lower-carbon alternatives. The revenue can be returned as dividends or tax cuts to offset the regressive effect on poorer households.",
  ren: "Shifting electricity to wind and solar cuts emissions from the power sector, which also reduces urban air pollution from fossil plants. The economics are front-loaded: large upfront capital costs for generation, storage and grids, then very low running costs because the fuel is free. That is why the model shows a small early GDP cost turning into a gain later.",
  plastic: "A ban removes single-use items from the market, cutting the plastic that leaks into rivers and oceans. Unlike a levy, it gives certainty about the outcome but not about cost: some substitutes (paper, heavier reusable bags) carry their own environmental footprint, and enforcement matters. Small retailers bear short-term adjustment costs.",
  defor: "Forests store carbon and provide services markets do not price: rainfall regulation, soil protection, biodiversity, flood control. Clearing land brings short-term gains from timber and agriculture, but releases stored carbon and erodes those services over time. Stopping deforestation is one of the cheaper ways to avoid emissions, but it requires compensating the people whose income depends on clearing.",
  deforUp: "Faster clearing brings short-term income from timber and farmland but releases stored carbon and erodes services such as rainfall regulation and flood protection, which is why the GDP line turns negative later.",
  tour: "Tourism brings income but creates congestion, waste and habitat damage at fragile sites: a classic tragedy of the commons. Visitor fees and caps make tourists pay for the damage they cause and fund conservation, at the cost of fewer visitors and some lost revenue in the short term. Quality-over-quantity models aim to keep the asset valuable for the long run.",
  urban: "Urban air pollution comes mostly from vehicles, industry and burning fuels. Emission standards, clean public transport and industrial rules cut fine particulates (PM2.5), which are linked to respiratory and heart disease. Compliance costs fall on firms and drivers first; the gains in health and productivity arrive gradually."
};

/* ── Global decision challenges ────────────────────────────── */
export type ChallengeOption = { id: string; t: string; pros: string[]; cons: string[]; stake: string[]; st: string; lt: string };
export type Challenge = { id: string; q: string; ctx: string; opts: ChallengeOption[]; ev: string[]; link: string };

export const CHALLENGES: Challenge[] = [
  {
    id: "growth-env", q: "Should governments prioritise economic growth or environmental protection?",
    ctx: "A fast-growing middle-income country has to choose its development path for the next decade. Coal power is cheap now; renewables need upfront investment; air quality in its cities is poor.",
    opts: [
      { id: "growth", t: "Prioritise growth now, clean up later", pros: ["Faster income growth and poverty reduction in the short run", "Cheaper energy keeps manufacturing competitive"], cons: ["Locks in long-lived polluting infrastructure", "Health costs from air pollution fall on the poorest", "Higher future transition costs"], stake: ["Factory workers", "Energy-intensive firms", "Urban residents", "Future generations"], st: "Higher GDP growth, more jobs in heavy industry, worsening air quality.", lt: "Stranded assets and expensive retrofits; climate damages affect agriculture and coasts." },
      { id: "env", t: "Prioritise environmental protection", pros: ["Avoids irreversible damage to ecosystems", "Health gains from cleaner air", "Early mover in clean industries"], cons: ["Slower short-run growth", "Higher energy prices hurt poorer households", "Jobs lost in fossil-fuel regions"], stake: ["Coal-region workers", "Households paying energy bills", "Farmers", "Public health system"], st: "Higher costs and slower industrial growth; visible air-quality gains.", lt: "Lower climate and health risk; competitiveness in growing green markets." },
      { id: "green", t: "Green growth: price pollution and invest in clean energy", pros: ["Uses markets to find the cheapest cuts", "Revenue can fund a just transition", "Growth and lower emissions can coexist"], cons: ["Hard to get the price right politically", "Requires strong institutions and enforcement", "Benefits are slower to show"], stake: ["Firms", "Taxpayers", "Investors", "Workers who need retraining"], st: "Adjustment costs; investment rises; some price increases.", lt: "Decoupling of growth from emissions if policy is credible and sustained." }
    ], ev: ["sweden", "paris", "solar"], link: "/environment"
  },
  {
    id: "protect", q: "Should countries introduce protectionist trade policies?",
    ctx: "Cheap imports are undercutting a domestic steel industry that employs tens of thousands in one region. Workers are demanding protection.",
    opts: [
      { id: "tariff", t: "Introduce tariffs on imports", pros: ["Protects jobs in the targeted industry", "Raises government revenue", "May support strategic or infant industries"], cons: ["Consumers and downstream firms pay higher prices", "Risk of retaliation against exporters", "Reduces competitive pressure to innovate"], stake: ["Steel workers", "Car and construction firms that buy steel", "Exporters", "Consumers"], st: "Steel output and prices rise; car makers’ costs rise.", lt: "Protected industry may stay inefficient; trade partners may retaliate." },
      { id: "open", t: "Keep trade open", pros: ["Cheaper inputs and goods", "Resources move to more productive sectors", "Maintains good relations with trading partners"], cons: ["Concentrated job losses in one region", "Adjustment can take years and leave lasting scars", "Dependence on foreign supply for a strategic good"], stake: ["Steel communities", "Consumers", "Manufacturers", "Taxpayers funding support"], st: "Plant closures and regional unemployment.", lt: "Higher overall efficiency if displaced workers find new jobs." },
      { id: "targeted", t: "Keep trade open, but fund retraining and regional support", pros: ["Keeps efficiency gains of trade", "Directly helps those who lose out", "Avoids retaliation"], cons: ["Costs public money", "Retraining programmes have mixed track records", "Slower to deliver than a tariff"], stake: ["Displaced workers", "Local governments", "Taxpayers"], st: "Fiscal cost; slower but less distorting adjustment.", lt: "Depends on whether new industries take root in the region." }
    ], ev: ["s232", "smoot"], link: "/economics"
  },
  {
    id: "wages", q: "Should businesses increase wages if it reduces profits?",
    ctx: "A retailer with thin margins faces high staff turnover. Raising wages by 15% would cut this year’s profit by about a third.",
    opts: [
      { id: "raise", t: "Raise wages now", pros: ["Lower turnover and hiring costs", "Higher morale and productivity (efficiency wage effect)", "Better reputation with customers"], cons: ["Lower profit and dividends this year", "May need to raise prices", "Rivals with lower costs may undercut"], stake: ["Employees", "Shareholders", "Customers", "Competitors"], st: "Profit falls; retention improves.", lt: "Can pay for itself if productivity and service quality rise enough." },
      { id: "hold", t: "Hold wages and protect margins", pros: ["Preserves profit and investment funds", "Keeps prices competitive"], cons: ["Turnover stays high, with recruiting and training costs", "Weaker service quality", "Risk of industrial action"], stake: ["Shareholders", "Employees", "Customers"], st: "Margins protected.", lt: "Hidden costs of churn and poor service can erode market share." },
      { id: "link", t: "Raise wages linked to productivity and performance", pros: ["Aligns pay with value created", "Shares gains without locking in fixed costs"], cons: ["Hard to measure fairly in service jobs", "Can feel insecure to workers"], stake: ["Employees", "Managers", "Shareholders"], st: "Smaller immediate cost.", lt: "Works if targets are seen as fair and achievable." }
    ], ev: ["germw", "cardk"], link: "/business"
  },
  {
    id: "subsidy", q: "Should governments subsidise renewable energy?",
    ctx: "A government has a limited budget and wants to cut power-sector emissions quickly.",
    opts: [
      { id: "yes", t: "Yes, subsidise renewables", pros: ["Speeds up deployment and learning-by-doing that lowers costs", "Creates jobs in installation and manufacturing", "Corrects for the unpriced cost of fossil fuels"], cons: ["Costs taxpayers or bill payers", "Government may back the wrong technologies", "Hard to remove once in place"], stake: ["Taxpayers", "Energy firms", "Households", "Fossil-fuel workers"], st: "Fiscal cost; rapid growth in installations.", lt: "Lower technology costs globally; cleaner grid." },
      { id: "no", t: "No, let the market decide", pros: ["No fiscal cost", "Avoids picking winners"], cons: ["Fossil fuels’ pollution stays unpriced, so the market is tilted", "Slower emissions cuts"], stake: ["Taxpayers", "Fossil-fuel producers", "Future generations"], st: "No change in budget; slower transition.", lt: "Higher climate risk unless another policy fills the gap." },
      { id: "price", t: "Price carbon instead and let technologies compete", pros: ["Technology-neutral", "Raises revenue rather than spending it"], cons: ["Politically difficult", "Raises energy bills unless revenue is returned"], stake: ["Households", "Industry", "Government"], st: "Higher fossil energy prices.", lt: "Efficient emissions cuts if the price is credible." }
    ], ev: ["solar", "eeg", "sweden"], link: "/environment"
  },
  {
    id: "plastic", q: "Should single-use plastics be banned or taxed?",
    ctx: "A coastal city’s beaches and drains are clogged with plastic bags and packaging.",
    opts: [
      { id: "ban", t: "Ban single-use plastics", pros: ["Certain, fast reduction", "Simple message to the public"], cons: ["Substitutes have their own footprint", "Enforcement and informal markets", "Cost to small vendors"], stake: ["Retailers", "Street vendors", "Plastics manufacturers", "Fishing and tourism"], st: "Sharp drop in visible litter if enforced.", lt: "Behaviour change; substitute markets develop." },
      { id: "levy", t: "Charge a levy per item", pros: ["Keeps choice but changes behaviour", "Raises revenue for clean-up"], cons: ["Some people simply pay", "Regressive if poorer households rely on cheap bags"], stake: ["Shoppers", "Retailers", "Local government"], st: "Fast fall in use where the charge is visible.", lt: "Durable if the charge rises with inflation." },
      { id: "vol", t: "Voluntary industry commitments", pros: ["Low cost to government", "Flexible for firms"], cons: ["Weak incentives to comply", "Hard to monitor"], stake: ["Large firms", "Consumers", "Regulators"], st: "Little change.", lt: "Depends on public pressure and reporting." }
    ], ev: ["kenya", "ireland"], link: "/environment"
  },
  {
    id: "rates", q: "Inflation is 7% and growth is slowing. Should the central bank raise rates?",
    ctx: "Prices are rising fast, partly because of an energy shock. Unemployment is low but starting to rise.",
    opts: [
      { id: "hike", t: "Raise rates firmly", pros: ["Anchors inflation expectations", "Protects real incomes over time", "Builds credibility"], cons: ["Deepens the slowdown", "Higher mortgage costs", "Raises government interest bill"], stake: ["Borrowers", "Savers", "Workers", "Government"], st: "Weaker demand and rising unemployment.", lt: "Lower inflation, if the bank stays credible." },
      { id: "hold", t: "Hold and look through the energy shock", pros: ["Avoids worsening a supply-driven slowdown", "Energy prices may fall back by themselves"], cons: ["Risk that inflation becomes entrenched in wage and price setting", "Credibility at risk"], stake: ["Workers", "Firms", "Savers"], st: "Growth protected for now.", lt: "If expectations drift, larger rate rises may be needed later." },
      { id: "cut", t: "Cut rates to support growth", pros: ["Supports jobs and borrowing"], cons: ["Likely to push inflation higher", "Weakens the currency, raising import prices further"], stake: ["Borrowers", "Importers", "Savers"], st: "Short-term boost to demand.", lt: "High risk of persistent inflation." }
    ], ev: ["bls", "fed", "rbi", "volcker"], link: "/economics"
  }
];

export function dailyIndex(d = new Date()) {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  return Math.floor((d.getTime() - start) / 864e5) % CHALLENGES.length;
}

/* ── Homepage ripple diagram (qualitative first-round effects) ── */
export const RIPPLE: Record<string, { name: string; nodes: [string, -1 | 0 | 1, string][] }> = {
  rate: { name: "Raise interest rates", nodes: [
    ["Households", -1, "Mortgage and loan payments rise; saving pays more, so spending falls."],
    ["Firms", -1, "Borrowing to invest costs more, and customers spend less."],
    ["Workers", -1, "Slower hiring as demand cools; unemployment tends to rise with a lag."],
    ["Government", -1, "Higher interest on public debt; tax receipts soften."],
    ["Environment", 0, "Little direct effect; lower investment can slow both polluting and green projects."],
    ["Trade partners", 1, "Currency tends to strengthen, making their exports cheaper for this country to buy."]] },
  ctax: { name: "Introduce a carbon tax", nodes: [
    ["Households", -1, "Energy and fuel bills rise, hitting poorer households hardest unless revenue is returned."],
    ["Firms", 0, "Costs rise for heavy emitters; clean producers gain a competitive edge."],
    ["Workers", 0, "Jobs shift from fossil sectors to clean energy and efficiency."],
    ["Government", 1, "New revenue that can fund dividends, tax cuts or investment."],
    ["Environment", 1, "Emissions fall where cutting is cheaper than paying the tax."],
    ["Trade partners", -1, "Risk of carbon leakage, or border adjustments on their exports."]] },
  tariff: { name: "Impose import tariffs", nodes: [
    ["Households", -1, "Imported goods, and competing domestic goods, cost more."],
    ["Firms", 0, "Protected producers gain; firms using imported inputs lose."],
    ["Workers", 0, "Jobs protected in shielded sectors; jobs at risk in exporters if partners retaliate."],
    ["Government", 1, "Collects tariff revenue."],
    ["Environment", 0, "Mixed: less long-distance trade but possibly less efficient production."],
    ["Trade partners", -1, "Lose sales and may retaliate with tariffs of their own."]] },
  mw: { name: "Raise the minimum wage 20%", nodes: [
    ["Households", 1, "Low-wage households earn and spend more."],
    ["Firms", -1, "Labour costs rise, especially in retail and hospitality."],
    ["Workers", 0, "Higher pay for most low earners; some may face fewer hours or hires."],
    ["Government", 1, "Higher income tax receipts, lower spending on wage top-ups."],
    ["Environment", 0, "No direct effect."],
    ["Trade partners", 0, "Small effect on competitiveness of labour-intensive exports."]] }
};
