import Link from "next/link";
export default function NotFound() {
  return (
    <div className="wrap sim-head" style={{ minHeight: "50vh" }}>
      <h1 style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>This page doesn’t exist.</h1>
      <p>The link may be mistyped or out of date. Start from the homepage or explore the simulations.</p>
      <div className="row" style={{ marginTop: 18 }}><Link className="btn btn-primary" href="/">Go to the homepage</Link><Link className="btn btn-ghost" href="/explore">Explore simulations</Link></div>
    </div>
  );
}
