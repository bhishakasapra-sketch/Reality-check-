"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "./AppProvider";

const LINKS = [
  ["/explore", "Explore"], ["/economics", "Economics"], ["/business", "Business"], ["/environment", "Environment"],
  ["/challenges", "Global challenges"], ["/dashboard", "My dashboard"], ["/about", "About"]
] as const;

export function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
      <circle cx="13" cy="13" r="11.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 16c3-1 5-6 8-6s4 4 6 4 3-2 4-3" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="18" cy="14" r="2.2" fill="var(--green)" />
    </svg>
  );
}

export function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { user, displayName, configured, signOut, ready } = useApp();
  useEffect(() => setOpen(false), [path]);
  return (
    <header className="nav">
      <div className="wrap nav-in">
        <Link className="brand" href="/" aria-label="Reality Check home"><Logo />Reality Check</Link>
        <button className="menu-btn" aria-expanded={open} aria-controls="links" onClick={() => setOpen(o => !o)}>Menu</button>
        <nav id="links" className={`links ${open ? "open" : ""}`} aria-label="Main">
          {LINKS.map(([href, label]) => <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>{label}</Link>)}
          <span className="who-mobile">
            {configured && (user ? <button className="btn btn-ghost btn-sm" onClick={signOut}>Sign out</button> : <Link className="btn btn-primary btn-sm" href="/login">Sign in</Link>)}
          </span>
        </nav>
        <div className="who">
          {!ready ? null : user ? (
            <>
              <span className="dot on" /><span>{displayName}</span>
              <button className="btn btn-ghost btn-sm" onClick={signOut}>Sign out</button>
            </>
          ) : configured ? (
            <Link className="btn btn-primary btn-sm" href="/login">Sign in</Link>
          ) : (
            <><span className="dot" /><span>Guest, saved on this device</span></>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer>
      <div className="wrap foot">
        <div>
          <div className="brand" style={{ marginBottom: 10 }}><Logo />Reality Check</div>
          <p className="muted small" style={{ maxWidth: "42ch" }}>Understand the world. One decision at a time. Simulations here are simplified teaching models: they show mechanisms and trade-offs, not forecasts.</p>
          <div className="legend"><span className="tier tier-hist">Historical record</span><span className="tier tier-model">Model estimate</span><span className="tier tier-sim">Hypothetical scenario</span></div>
        </div>
        <div><b className="small">Simulators</b><div style={{ height: 8 }} />
          <Link href="/economics">Economics</Link><Link href="/business">Business</Link><Link href="/environment">Environment</Link><Link href="/challenges">Global challenges</Link>
        </div>
        <div><b className="small">Reality Check</b><div style={{ height: 8 }} />
          <Link href="/explore">Explore simulations</Link><Link href="/dashboard">My dashboard</Link><Link href="/about">About and methodology</Link>
        </div>
      </div>
    </footer>
  );
}
