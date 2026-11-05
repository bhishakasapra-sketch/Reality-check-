"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { leverValue, type Lever } from "@/lib/format";
import type { Evidence } from "@/lib/content";

/* ── Theme colours for SVG charts (read from CSS tokens, follow light/dark) ── */
export type Palette = { blue: string; green: string; warn: string; muted: string; ink: string; line: string; amber: string; surface: string; bg: string };
const read = (): Palette => {
  const s = getComputedStyle(document.documentElement), g = (n: string) => s.getPropertyValue(`--${n}`).trim();
  return { blue: g("blue"), green: g("green"), warn: g("warn"), muted: g("muted"), ink: g("ink"), line: g("line"), amber: g("amber"), surface: g("surface"), bg: g("bg") };
};
export function usePalette(): Palette {
  const [p, setP] = useState<Palette>({ blue: "#1A62F2", green: "#0C9466", warn: "#B9470F", muted: "#5A6676", ink: "#0C1A2E", line: "#D8DEE4", amber: "#9A6A00", surface: "#fff", bg: "#F3F5F4" });
  useEffect(() => {
    setP(read());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => setP(read());
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return p;
}

/* ── Data-tier labels ── */
export function Tier({ kind, children }: { kind: "hist" | "model" | "sim"; children?: ReactNode }) {
  const label = { hist: "Historical record", model: "Model estimate", sim: "Hypothetical scenario" }[kind];
  return <span className={`tier tier-${kind}`}>{children ?? label}</span>;
}
export function TierLegend() {
  return (
    <div className="legend">
      <Tier kind="sim">Hypothetical scenario: your settings</Tier>
      <Tier kind="model">Model estimate: simplified, illustrative</Tier>
      <Tier kind="hist">Historical record: verifiable at the source</Tier>
    </div>
  );
}

/* ── Slider ── */
export function Slider({ lever, value, onChange, onCommit }: { lever: Lever; value: number; onChange: (v: number) => void; onCommit?: () => void }) {
  const pct = ((value - lever.min) / (lever.max - lever.min)) * 100;
  return (
    <div className="ctl">
      <div className="ctl-top"><label htmlFor={`s-${lever.id}`}>{lever.label}</label><output htmlFor={`s-${lever.id}`}>{leverValue(lever, value)}</output></div>
      <input id={`s-${lever.id}`} type="range" min={lever.min} max={lever.max} step={lever.step} value={value}
        style={{ ["--p" as string]: `${pct}%` }}
        onChange={e => onChange(+e.target.value)} onPointerUp={onCommit} onKeyUp={onCommit} />
      <div className="hint">{lever.hint}</div>
    </div>
  );
}

export function Chips<T extends string>({ items, value, onPick, label }: { items: { id: T; name: string; title?: string }[]; value: T | null; onPick: (id: T) => void; label: string }) {
  return (
    <div className="tabs" role="group" aria-label={label}>
      {items.map(i => <button key={i.id} className="chip" title={i.title} aria-pressed={value === i.id} onClick={() => onPick(i.id)}>{i.name}</button>)}
    </div>
  );
}

export function Kpi({ k, v, d, tone, note }: { k: string; v: string; d: string; tone: string; note?: string }) {
  return (
    <div className="kpi">
      <div className="k">{k}</div><div className="v">{v}</div><div className={`d ${tone}`}>{d}</div>
      {note && <div className="tiny muted">{note}</div>}
    </div>
  );
}

/* ── Line chart ── */
export type SeriesDef = { key: string; label: string; data: number[]; color: string; dashed?: boolean; width?: number };
export function SimChart({ labels, series, format, height = 310, minimal = false }: { labels: string[]; series: SeriesDef[]; format: (v: number) => string; height?: number; minimal?: boolean }) {
  const pal = usePalette();
  const rows = labels.map((l, i) => {
    const r: Record<string, number | string> = { label: l };
    series.forEach(s => (r[s.key] = s.data[i]));
    return r;
  });
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <LineChart data={rows} margin={{ top: 8, right: 8, left: minimal ? 0 : -8, bottom: 0 }}>
          {!minimal && <CartesianGrid stroke={pal.line} vertical={false} />}
          <XAxis dataKey="label" hide={minimal} tick={{ fill: pal.muted, fontSize: 11 }} tickLine={false} axisLine={{ stroke: pal.line }} minTickGap={14} />
          <YAxis hide={minimal} tick={{ fill: pal.muted, fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={format} width={58} domain={["auto", "auto"]} />
          {!minimal && (
            <Tooltip
              contentStyle={{ background: pal.ink, border: 0, borderRadius: 8, color: pal.bg, fontSize: 13 }}
              labelStyle={{ color: pal.bg, fontWeight: 600 }} itemStyle={{ color: pal.bg }}
              formatter={(v: number, name: string) => [format(v), name]} />
          )}
          {!minimal && series.length > 1 && <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, color: pal.muted }} />}
          {series.map(s => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={s.width ?? 2.2}
              strokeDasharray={s.dashed ? "5 5" : undefined} dot={false} isAnimationActive={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── References ── */
export function Refs({ items }: { items: Evidence[] }) {
  return (
    <ul className="refs">
      {items.map(r => (
        <li key={r.t}><Tier kind="hist" /> {r.t} <span className="muted small">Source: <a href={r.url} target="_blank" rel="noopener noreferrer">{r.src}</a></span></li>
      ))}
    </ul>
  );
}

/* ── Modal ── */
export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="spread" style={{ marginBottom: 12 }}><h3>{title}</h3><button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button></div>
        {children}
      </div>
    </div>
  );
}

export function SaveDialog({ open, initial, onClose, onSave }: { open: boolean; initial: string; onClose: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) { setName(initial); setTimeout(() => ref.current?.select(), 0); } }, [open, initial]);
  const go = () => { onSave(name.trim() || initial); onClose(); };
  return (
    <Modal open={open} title="Save simulation" onClose={onClose}>
      <label htmlFor="nm" className="small muted">Name it so you can find it on your dashboard</label>
      <input id="nm" ref={ref} type="text" value={name} maxLength={80} style={{ marginTop: 8 }} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} />
      <div className="row" style={{ marginTop: 12 }}><button className="btn btn-primary btn-sm" onClick={go}>Save simulation</button></div>
    </Modal>
  );
}

export function ShareDialog({ open, onClose, text, link }: { open: boolean; onClose: () => void; text: string; link: string }) {
  const [copied, setCopied] = useState("");
  const copy = async (s: string, what: string) => {
    try { await navigator.clipboard.writeText(s); setCopied(what); setTimeout(() => setCopied(""), 2000); } catch { setCopied("Press Ctrl+C to copy"); }
  };
  const full = `${text}\n\nTry it yourself: ${link}`;
  return (
    <Modal open={open} title="Share result" onClose={onClose}>
      <p className="small muted">The link reopens this exact scenario for anyone.</p>
      <input type="text" readOnly value={link} onFocus={e => e.target.select()} aria-label="Scenario link" />
      <textarea readOnly value={full} style={{ marginTop: 10, minHeight: 170 }} aria-label="Result summary" />
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn btn-primary btn-sm" onClick={() => copy(link, "Link copied")}>Copy link</button>
        <button className="btn btn-ghost btn-sm" onClick={() => copy(full, "Summary copied")}>Copy summary</button>
        {typeof navigator !== "undefined" && "share" in navigator && (
          <button className="btn btn-ghost btn-sm" onClick={() => navigator.share({ title: "Reality Check", text, url: link }).catch(() => {})}>Share…</button>
        )}
        <span className="small up">{copied}</span>
      </div>
    </Modal>
  );
}
