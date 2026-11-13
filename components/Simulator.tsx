"use client";
// Week 14 · Revenue simulator (stack floor: working calculator logic with saved scenarios).
// All math lives in lib/pricing.ts, the same file /pricing and the /about memo read, so the three always agree.
// Team 5 Condition 4: this is a SIMULATION, labeled as one. Only "Paid" on /pricing is revenue.
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/track";
import {
  F, INPUT_META, PAYMENT_LABEL, PRESETS, TAG_LABEL, aiCostPerCheck, cleanInputs, money, paymentFee, simulate,
  type PaymentMethod, type SimInputs,
} from "@/lib/pricing";
import { tally } from "@/lib/evidence";
import { signIn, useUser } from "./AuthButton";

interface Scenario { id: string; name: string; created_at: string; inputs: SimInputs }
const KEYS = Object.keys(INPUT_META) as (keyof typeof INPUT_META)[];
const PENDING = "byp.sim.pending";

export default function Simulator() {
  const { user } = useUser();
  const [inp, setInp] = useState<SimInputs>(PRESETS[2].inputs);
  const [preset, setPreset] = useState<string | null>("base");
  const [name, setName] = useState("");
  const [list, setList] = useState<Scenario[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const r = useMemo(() => simulate(inp), [inp]);
  const paid = tally().paid;

  useEffect(() => {
    track("simulator_view", { onlyOnce: true });
    try {
      const raw = sessionStorage.getItem(PENDING);
      if (raw) { sessionStorage.removeItem(PENDING); setInp(cleanInputs(JSON.parse(raw))); setPreset(null); }
    } catch {}
  }, []);

  const load = () =>
    supabase.from("byp_scenarios").select("id, name, created_at, inputs").order("created_at", { ascending: false })
      .then(({ data }) => setList((data as Scenario[]) ?? []), () => {});
  useEffect(() => { if (user) load(); else setList([]); }, [user]);

  const set = (k: keyof SimInputs, v: string) => {
    setPreset(null);
    setInp((p) => cleanInputs({ ...p, [k]: k === "payment" ? v : INPUT_META[k as keyof typeof INPUT_META]?.pct ? Number(v) / 100 : Number(v) }));
  };

  async function save() {
    const n = name.trim().slice(0, 60);
    if (!n) { setMsg("Give the scenario a name first."); return; }
    if (!user) {
      try { sessionStorage.setItem(PENDING, JSON.stringify(inp)); } catch {}
      signIn();
      return;
    }
    const { error } = await supabase.from("byp_scenarios").insert({ name: n, inputs: cleanInputs(inp) });
    if (error) { setMsg("We couldn't save it right now. Try again in a moment."); return; }
    setMsg(`Saved “${n}”.`);
    setName("");
    track("scenario_saved");
    load();
  }
  async function remove(id: string) {
    await supabase.from("byp_scenarios").delete().eq("id", id);
    setList((l) => l.filter((s) => s.id !== id));
  }

  const field = "w-full rounded-lg border border-line bg-white px-2.5 py-2 text-sm focus:border-navy focus:outline-none";
  const row = (label: string, value: string, strong = false, neg = false) => (
    <div className={`flex justify-between py-1.5 ${strong ? "font-bold" : ""} ${neg ? "text-mute" : ""}`}><dt>{label}</dt><dd>{value}</dd></div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-extrabold text-navy">Revenue simulator</h1>
        <p className="mt-2 rounded-lg bg-navy px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-white">
          Simulation: projections from assumptions, not revenue. Paid so far: {paid} · {money(0)}
        </p>
        <p className="mt-2 text-sm text-mute">Every number comes from the same file the pricing page and the 10:1 memo use. Change any assumption and the projection updates.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => { setInp(p.inputs); setPreset(p.id); setMsg(null); }}
            title={p.note}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${preset === p.id ? "border-navy bg-navy text-white" : "border-navy text-navy hover:bg-white"}`}
          >
            {p.name}
          </button>
        ))}
      </div>
      {preset && <p className="-mt-3 text-xs text-mute">{PRESETS.find((p) => p.id === preset)?.note}</p>}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-bold text-navy">Inputs</h2>
          <div className="mt-3 space-y-3">
            {KEYS.map((k) => {
              const m = INPUT_META[k];
              const v = m.pct ? +(inp[k] * 100).toFixed(2) : inp[k];
              return (
                <label key={k} className="block text-xs text-mute">
                  <span className="flex justify-between gap-2"><span>{m.label}{m.pct ? " (%)" : ""}</span><span className="font-semibold">{TAG_LABEL[m.tag]}</span></span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={m.pct ? m.min * 100 : m.min}
                    max={m.pct ? m.max * 100 : m.max}
                    step={m.pct ? m.step * 100 : m.step}
                    value={v}
                    onChange={(e) => set(k, e.target.value)}
                    className={field}
                  />
                  <span className="text-[11px]">{m.note}</span>
                </label>
              );
            })}
            <label className="block text-xs text-mute">
              How buyers pay
              <select value={inp.payment} onChange={(e) => set("payment", e.target.value as PaymentMethod)} className={field}>
                {(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((p) => <option key={p} value={p}>{PAYMENT_LABEL[p]}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-navy bg-white p-5">
            <h2 className="font-bold text-navy">Monthly projection</h2>
            <dl className="mt-2 divide-y divide-line text-sm">
              {row(`Packs sold (${r.packBuyers.toFixed(1)} buyers)`, money(r.revenue.pack))}
              {row(`Passes sold (${r.passBuyers.toFixed(1)} buyers)`, money(r.revenue.pass))}
              {row("Issuer (a bet)", money(r.revenue.issuer))}
              {row("Revenue", money(r.revenue.total), true)}
              {row("− Payment fees", money(-r.fees), false, true)}
              {row(`− AI reading (${Math.round(r.checks).toLocaleString("en-US")} checks)`, money(-r.aiCost), false, true)}
              {row("− Founder hours (rules, codes, support)", money(-r.upkeep), false, true)}
              {row("Net a month", money(r.net), true)}
            </dl>
          </div>
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-bold text-navy">Annual and break-even</h2>
            <dl className="mt-2 divide-y divide-line text-sm">
              {row("Revenue a year", money(r.annual.revenue), true)}
              {row("Net a year", money(r.annual.net), true)}
              {row("Revenue per checker a month", money(r.revenuePerChecker, 2))}
              {row("Checkers needed to cover founder hours", r.breakEvenCheckers == null ? "never, at these rates" : r.breakEvenCheckers.toLocaleString("en-US"))}
            </dl>
            <p className="mt-2 text-xs text-mute">
              Per sale, a {money(inp.packPrice)} pack loses {money(paymentFee(inp.packPrice, inp.payment), 2)} to fees and a check costs about {money(aiCostPerCheck(), 2)} of AI.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-bold text-navy">Saved scenarios</h2>
            <p className="text-xs text-mute">{user ? "Only you can see your scenarios. They hold numbers, never personal data." : "Sign in with Google to save scenarios. Only you can see them."}</p>
            <div className="mt-2 flex gap-2">
              <input value={name} onChange={(e) => setName(e.target.value.slice(0, 60))} maxLength={60} placeholder="e.g. Buen Fin, 5 packs" className={field} />
              <button onClick={save} className="shrink-0 rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-white">{user ? "Save" : "Sign in to save"}</button>
            </div>
            {msg && <p className="mt-2 text-sm text-navy">{msg}</p>}
            {list.length > 0 && (
              <ul className="mt-3 divide-y divide-line text-sm">
                {list.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 py-1.5">
                    <button onClick={() => { setInp(cleanInputs(s.inputs)); setPreset(null); setMsg(`Loaded “${s.name}”.`); }} className="text-left font-semibold text-navy underline">
                      {s.name}
                    </button>
                    <span className="flex items-center gap-3 text-xs text-mute">
                      {new Date(s.created_at).toLocaleDateString("en-GB")}
                      <button onClick={() => remove(s.id)} className="text-warn underline">Delete</button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-bold text-navy">Assumptions behind every number</h2>
        <p className="text-xs text-mute">Measured = we saw it. Sourced = a public source. Assumed = our guess, to be replaced by evidence.</p>
        <table className="mt-2 w-full text-left text-xs">
          <tbody className="divide-y divide-line align-top">
            {Object.values(F).map((f) => (
              <tr key={f.label}>
                <td className="py-1.5 pr-2 font-semibold">{f.label}</td>
                <td className="py-1.5 pr-2 whitespace-nowrap">{f.unit === "MXN" ? money(f.value) : f.unit === "%" ? `${+(f.value * 100).toFixed(2)}%` : f.value}</td>
                <td className="py-1.5 pr-2">{TAG_LABEL[f.tag]}</td>
                <td className="py-1.5 text-mute">{f.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
