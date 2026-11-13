"use client";
// Week 14 · How a buyer asks for a pack or pass without the founder's contact on the page.
// Personal data (Google email, optional WhatsApp) lives behind Google sign-in + RLS: only the buyer and the founder see it.
// Payment never happens on this site (pilot: bank transfer or cash), so nothing here can charge anyone.
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/track";
import { signIn, useUser } from "./AuthButton";

type Plan = "pack" | "pass";
const PENDING = "byp.request.pending";
const LABEL: Record<Plan, string> = { pack: "4-check pack (MX$60)", pass: "30-day pass (MX$49)" };

interface Req { id: string; plan: Plan; created_at: string; status: string }

export function RequestButton({ plan, primary }: { plan: Plan; primary?: boolean }) {
  const { user, ready } = useUser();
  const [open, setOpen] = useState(false);
  const [wa, setWa] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "dup" | "error">("idle");
  const [mine, setMine] = useState<Req[]>([]);

  // Reopen the panel after the Google sign-in redirect.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(PENDING) === plan) {
        sessionStorage.removeItem(PENDING);
        setOpen(true);
      }
    } catch {}
  }, [plan]);

  useEffect(() => {
    if (!open || !user) return;
    supabase.from("byp_pack_requests").select("id, plan, created_at, status").order("created_at", { ascending: false })
      .then(({ data }) => setMine((data as Req[]) ?? []), () => {});
  }, [open, user, state]);

  const waClean = wa.replace(/[^\d+]/g, "");
  const waOk = waClean === "" || /^\+?\d{10,13}$/.test(waClean);

  async function send() {
    if (!user || !consent || !waOk) return;
    setState("sending");
    const { error } = await supabase.from("byp_pack_requests").insert({ plan, whatsapp: waClean || null, consent: true });
    if (!error) { setState("sent"); track("pack_requested"); }
    else setState(error.code === "23505" ? "dup" : "error");
  }

  async function remove(id: string) {
    await supabase.from("byp_pack_requests").delete().eq("id", id);
    setMine((m) => m.filter((r) => r.id !== id));
    setState("idle");
  }

  return (
    <div className="mt-4">
      <button
        onClick={() => { setOpen((o) => !o); track(plan === "pack" ? "plan_pack_clicked" : "plan_pass_clicked"); }}
        className={`w-full rounded-xl px-4 py-3 font-semibold ${primary ? "bg-navy text-white hover:bg-navy-2" : "border border-navy text-navy hover:bg-paper"}`}
      >
        Request the {plan === "pack" ? "pack" : "pass"}
      </button>
      {open && (
        <div className="mt-3 rounded-xl bg-paper p-3 text-sm">
          <p className="text-mute">
            During this pilot the founder sells {plan === "pack" ? "packs" : "passes"} person to person while the price is tested.
            <b className="text-ink"> Payment is by bank transfer or cash, never on this site.</b> After you pay, you get a code to enter on the check page.
          </p>
          {!ready ? null : !user ? (
            <>
              <p className="mt-2 text-mute">Sign in with Google to send a request. We use your Google email only to write to you about it.</p>
              <button
                onClick={() => { try { sessionStorage.setItem(PENDING, plan); } catch {} signIn(); }}
                className="mt-2 rounded-lg bg-navy px-4 py-2 font-semibold text-white"
              >
                Sign in with Google to request
              </button>
            </>
          ) : state === "sent" ? (
            <p className="mt-2 font-semibold text-ok">
              Request sent for the {LABEL[plan]}. The founder will write to {user.email}. Nothing is charged until you agree.
            </p>
          ) : (
            <>
              <label className="mt-2 block text-xs text-mute">
                WhatsApp (optional, 10 digits)
                <input
                  value={wa}
                  onChange={(e) => setWa(e.target.value.slice(0, 18))}
                  inputMode="tel"
                  placeholder="55 1234 5678"
                  className="mt-1 w-full rounded-lg border border-line bg-white px-2.5 py-2 text-sm focus:border-navy focus:outline-none"
                />
              </label>
              {!waOk && <p className="mt-1 text-xs text-warn">Use 10 digits (or + and up to 13).</p>}
              <label className="mt-2 flex items-start gap-2 text-xs">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
                <span>I agree to be contacted at {user.email}{waClean ? " or by WhatsApp" : ""} about this request. I can delete it any time.</span>
              </label>
              <button
                onClick={send}
                disabled={!consent || !waOk || state === "sending"}
                className="mt-2 rounded-lg bg-navy px-4 py-2 font-semibold text-white disabled:opacity-40"
              >
                {state === "sending" ? "Sending…" : `Send request: ${LABEL[plan]}`}
              </button>
              {state === "dup" && <p className="mt-2 text-warn">You already have an open request for this plan.</p>}
              {state === "error" && <p className="mt-2 text-warn">We couldn’t send it right now. Try again in a moment.</p>}
            </>
          )}
          {user && mine.length > 0 && (
            <div className="mt-3 border-t border-line pt-2">
              <p className="text-xs font-semibold text-mute">Your requests (only you and the founder can see them)</p>
              <ul className="mt-1 space-y-1">
                {mine.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 text-xs">
                    <span>{LABEL[r.plan]} · {new Date(r.created_at).toLocaleDateString("en-GB")} · {r.status}</span>
                    <button onClick={() => remove(r.id)} className="text-warn underline">Delete</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function IssuerInterest() {
  const [done, setDone] = useState(false);
  return done ? (
    <p className="mt-4 text-sm font-semibold text-ok">Counted, anonymously. Thank you.</p>
  ) : (
    <button
      onClick={() => { track("plan_issuer_clicked"); setDone(true); }}
      className="mt-4 w-full rounded-xl border border-dashed border-navy px-4 py-3 text-sm font-semibold text-navy hover:bg-paper"
    >
      My bank or card should offer this
    </button>
  );
}

export function TrackView({ event }: { event: "pricing_view" | "simulator_view" }) {
  useEffect(() => { track(event, { onlyOnce: true }); }, [event]);
  return null;
}
