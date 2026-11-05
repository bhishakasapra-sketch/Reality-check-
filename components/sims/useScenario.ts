"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { decodeParams, encodeParams } from "@/lib/format";
import { useApp } from "@/components/AppProvider";
import type { Kind, Module } from "@/lib/progress";

/**
 * Holds a simulator's parameters and keeps them in the URL (?s=…), so every
 * state is a shareable link and the browser back button works. Also records
 * exploration for XP/history once per visit.
 */
export function useScenario<T extends Record<string, unknown>>(
  module: Module, kind: Kind, defaults: T, presets: { id: string; name: string; p: Partial<T> }[]
) {
  const { award, updateLastHistory } = useApp();
  const [p, setP] = useState<T>(defaults);
  const [name, setName] = useState("Custom scenario");
  const [presetId, setPresetId] = useState<string | null>(null);
  const touched = useRef(false);
  const latest = useRef(p);
  latest.current = p;

  // load from URL on first render: ?preset=id or ?s=encoded
  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const pre = presets.find(x => x.id === qs.get("preset"));
    if (pre) { setP({ ...defaults, ...pre.p }); setName(pre.name); setPresetId(pre.id); record(pre.name, { ...defaults, ...pre.p }); return; }
    const dec = decodeParams<T>(qs.get("s"));
    if (dec) {
      const clean = { ...defaults };
      (Object.keys(defaults) as (keyof T)[]).forEach(k => { if (typeof dec[k] === typeof defaults[k]) clean[k] = dec[k] as T[keyof T]; });
      setP(clean); setName(qs.get("n")?.slice(0, 80) || "Shared scenario"); record("Opened shared scenario", clean);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // mirror into the URL
  useEffect(() => {
    const t = setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("preset");
      url.searchParams.set("s", decodeURIComponent(encodeParams(p)));
      window.history.replaceState(null, "", url.toString());
    }, 250);
    return () => clearTimeout(t);
  }, [p]);

  function record(label: string, params: T) {
    touched.current = true;
    award(kind, { module, name: label, params });
  }

  const set = useCallback((k: keyof T, v: T[keyof T]) => {
    setP(prev => ({ ...prev, [k]: v })); setPresetId(null); setName("Custom scenario");
  }, []);
  const commit = useCallback(() => {
    if (!touched.current) record("Custom scenario", latest.current); else updateLastHistory(module, latest.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateLastHistory, module]);
  const applyPreset = useCallback((id: string) => {
    const pre = presets.find(x => x.id === id); if (!pre) return;
    const next = { ...defaults, ...pre.p };
    setP(next); setName(pre.name); setPresetId(id); record(pre.name, next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const reset = useCallback(() => { setP(defaults); setPresetId(null); setName("Custom scenario"); }, [defaults]);
  const shareLink = () => `${window.location.origin}/${module}?s=${encodeParams(p)}&n=${encodeURIComponent(name)}`;

  return { p, set, commit, name, presetId, applyPreset, reset, shareLink };
}
