"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { mxn } from "@/lib/engine";
import type { CheckRow } from "@/lib/validate";
import { signIn, useUser } from "./AuthButton";

const LABEL = { wait: "Waited", change_size: "Changed the size first", buy_anyway: "Bought anyway" } as const;

export default function History() {
  const { user, ready } = useUser();
  const [rows, setRows] = useState<CheckRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !supabase) return;
    supabase
      .from("byp_checks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) setError("We couldn't load your history.");
        else setRows((data ?? []) as CheckRow[]);
      });
  }, [user]);

  async function remove(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from("byp_checks").delete().eq("id", id);
    if (!error) setRows((r) => (r ?? []).filter((x) => x.id !== id));
  }

  if (!supabase) return <p className="text-mute">Saving isn’t configured on this deployment yet.</p>;
  if (!ready) return null;
  if (!user)
    return (
      <div className="rounded-2xl border border-line bg-white p-6">
        <h1 className="text-2xl font-extrabold text-navy">My history</h1>
        <p className="mt-2 text-mute">Sign in with Google to see the checks you saved. Only you can see them.</p>
        <button onClick={signIn} className="mt-4 rounded-xl bg-navy px-5 py-3 font-semibold text-white">Sign in with Google</button>
      </div>
    );

  // North Star: pesos kept = money at risk on checks where the buyer chose to wait or change the size.
  const kept = (rows ?? []).filter((r) => r.decision !== "buy_anyway").reduce((a, r) => a + Number(r.money_at_risk), 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-navy">My history</h1>
      <section className="rounded-2xl border border-ok bg-white p-5">
        <p className="text-4xl font-extrabold text-ok">{mxn(kept)}</p>
        <p className="text-sm text-mute">pesos kept: money at risk on checks where you chose to wait or change the size</p>
      </section>
      {error && <p className="text-warn">{error}</p>}
      {rows && rows.length === 0 && (
        <p className="text-mute">No saved checks yet. <Link href="/product" className="font-semibold text-navy underline">Check a checkout</Link></p>
      )}
      <ul className="space-y-3">
        {(rows ?? []).map((r) => (
          <li key={r.id} className="rounded-2xl border border-line bg-white p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <b className="text-navy">{r.store || "Unknown store"}</b>
              <span className="text-xs text-mute">{new Date(r.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}{r.source === "simulated" ? " · simulated" : ""}</span>
            </div>
            <p className="mt-1 text-sm">
              <span className="font-bold text-risk">{mxn(Number(r.money_at_risk))}</span> at risk ·{" "}
              <span className="font-semibold">{LABEL[r.decision]}</span>
            </p>
            <p className="mt-1 text-xs text-mute">{r.items.map((i) => `${i.name}${i.size ? ` (${i.size})` : ""}`).join(" · ")}</p>
            <button onClick={() => remove(r.id)} className="mt-2 text-xs text-mute underline hover:text-risk">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
