"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Category, Decision, Extraction, Flag, Item, Returnable } from "@/lib/types";
import { analyze, mxn } from "@/lib/engine";
import { findRule, resolveRule } from "@/lib/policies";
import { mergeExtractions } from "@/lib/merge";
import { track } from "@/lib/track";
import { DEMO_EXTRACTION } from "@/lib/demo";
import { supabase } from "@/lib/supabase";
import { toRow } from "@/lib/validate";
import { signIn, useUser } from "./AuthButton";
import { freeLeft, markFreeUsed, monthKey, normalizeCode } from "@/lib/quota";
import { codeStatus, describeCode, saveCode, savedCode, type CodeStatus } from "@/lib/codes";
import { FREE_LIMIT_ON } from "@/lib/pricing";

const today = () => new Date().toISOString().slice(0, 10);
const PENDING = "byp.pending.v2";
const CATS: Category[] = ["apparel", "footwear", "accessory", "other"];

async function shrink(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Couldn't read that image."))), "image/jpeg", 0.85));
  } finally {
    URL.revokeObjectURL(url);
  }
}

const num = (v: string): number | null => {
  if (v.trim() === "") return null;
  const n = Number(v.replace(/[^0-9.]/g, ""));
  return isFinite(n) && n < 10_000_000 ? n : null;
};

const RET: Record<Returnable, [string, string]> = {
  yes: ["returnable", "bg-ok-bg text-ok"],
  no: ["final sale", "bg-risk-bg text-risk"],
  unknown: ["not confirmed", "bg-warn-bg text-warn"],
};
const Pill = ({ r }: { r: Returnable }) => (
  <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${RET[r][1]}`}>{RET[r][0]}</span>
);

const FLAG_STYLE: Record<Flag["level"], string> = {
  high: "border-risk bg-risk-bg",
  medium: "border-warn bg-warn-bg",
  info: "border-navy-2 bg-white",
};

const DECISIONS: [Decision, string][] = [
  ["wait", "I'll wait"],
  ["change_size", "I'll change the size first"],
  ["buy_anyway", "Buy anyway, my call"],
];

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <section className={`rounded-2xl border border-line bg-white p-4 sm:p-5 ${className}`}>{children}</section>
);

export default function Checker() {
  const params = useSearchParams();
  const { user } = useUser();
  const [ex, setEx] = useState<Extraction | null>(null);
  const [edited, setEdited] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasted, setPasted] = useState("");
  const [pastedApplied, setPastedApplied] = useState<string | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMsg, setSaveMsg] = useState("");
  // Week 14 · free/paid line. These decide HOW MANY checks, never WHAT a check says (the engine never sees them).
  const [gate, setGate] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [codeInfo, setCodeInfo] = useState<CodeStatus | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [codeBusy, setCodeBusy] = useState(false);
  const [free, setFree] = useState<number>(1);
  const resultRef = useRef<HTMLDivElement>(null);

  function start(e: Extraction) {
    setEx(e);
    setEdited(new Set());
    setDecision(null);
    setPasted("");
    setPastedApplied(null);
    setSaveState("idle");
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  // Fictional sample from ?sample=1, or a check restored after the Google sign-in redirect.
  useEffect(() => {
    // Week 14 mechanical-pass fix: read the free counter and any saved code BEFORE the sign-in restore below returns,
    // or the status line said "1 left" after a Google sign-in even when the free check was already used.
    setFree(freeLeft());
    const c = savedCode();
    if (c) { setCode(c); codeStatus(c).then(setCodeInfo); }
    try {
      const raw = sessionStorage.getItem(PENDING);
      if (raw) {
        const p = JSON.parse(raw) as { ex: Extraction; pasted: string | null; decision: Decision | null };
        sessionStorage.removeItem(PENDING);
        setEx(p.ex);
        setPastedApplied(p.pasted);
        setPasted(p.pasted ?? "");
        setDecision(p.decision);
        return;
      }
    } catch {}
    track("page_view", { onlyOnce: true });
    if (params.get("sample") === "1") { track("sample_used"); start({ ...DEMO_EXTRACTION, checkedAt: today() }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Week 13 fix #1: one cart can take several screenshots (up to 4). Each is read, then merged into one check.
  // Reading a screenshot returns an Extraction, or an error message for the buyer.
  async function readOne(f: File): Promise<Extraction | { error: string; noKey?: boolean }> {
    if (!f.type.startsWith("image/")) return { error: "That isn't an image. Upload a PNG or JPG screenshot of your checkout." };
    if (f.size > 15 * 1024 * 1024) return { error: "That image is too large (over 15 MB)." };
    const blob = await shrink(f);
    if (blob.size > 4 * 1024 * 1024) return { error: "The image is still over 4 MB after resizing. Try a smaller screenshot." };
    const fd = new FormData();
    fd.append("image", blob, "checkout.jpg");
    const r = await fetch("/api/extract", { method: "POST", body: fd });
    const text = await r.text();
    let j: { error?: string } & Partial<Extraction> = {};
    try {
      j = JSON.parse(text);
    } catch {
      return { error: "The reader is busy or timed out. Try again in a moment, or try the fictional sample." };
    }
    if (r.status === 503 && j.error === "no_key") return { error: "no_key", noKey: true };
    if (!r.ok) return { error: j.error || "Something went wrong." };
    if (!j.items?.length) return { error: "We couldn't find any products on that screenshot. Use a screenshot of the cart or payment screen, with the items visible." };
    if (!previewSet) {
      setPreview(URL.createObjectURL(blob));
      previewSet = true;
    }
    return j as Extraction;
  }
  let previewSet = false;

  async function applyCode() {
    setCodeBusy(true);
    const s = await codeStatus(codeInput);
    setCodeBusy(false);
    setCodeInfo(s);
    if (s.ok) {
      const norm = normalizeCode(codeInput)!;
      setCode(norm);
      saveCode(norm);
      setGate(false);
      setCodeInput("");
      track("code_ok");
    } else track("code_bad");
  }

  /** Which allowance pays for a NEW cart: the free check, a code, or nothing (gate). Adding screenshots to the same cart is free. */
  async function allowance(): Promise<"free" | "code" | null> {
    if (!FREE_LIMIT_ON || freeLeft() > 0) return "free";
    if (code) {
      const s = await codeStatus(code);
      setCodeInfo(s);
      if (s.ok) return "code";
    }
    return null;
  }

  async function onFiles(list: FileList | null, append: boolean) {
    setError(null);
    const files = list ? Array.from(list).slice(0, 4) : [];
    if (!files.length) return;
    let paidBy: "free" | "code" | null = null;
    if (!append || !ex || ex.source !== "screenshot") {
      paidBy = await allowance();
      if (!paidBy) {
        setGate(true);
        track("gate_shown");
        return;
      }
    }
    setBusy(true);
    track("upload_started");
    previewSet = append;
    try {
      const results = await Promise.all(files.map((f) => readOne(f).catch((e) => ({ error: e instanceof Error ? e.message : "Something went wrong." }))));
      if (results.some((r) => "noKey" in r && r.noKey)) {
        setError("The screenshot reader isn't configured on this deployment, so we loaded the SIMULATED fictional sample instead.");
        setPreview(null);
        start({ ...DEMO_EXTRACTION, checkedAt: today() });
        return;
      }
      const ok = results.filter((r): r is Extraction => !("error" in r));
      const bad = results.filter((r): r is { error: string } => "error" in r);
      if (!ok.length) {
        track("read_failed");
        setError(bad[0]?.error || "Something went wrong.");
        return;
      }
      if (bad.length) setError(`We read ${ok.length} of ${files.length} screenshots. ${bad[0].error}`);
      const merged = mergeExtractions(append && ex && ex.source === "screenshot" ? [ex, ...ok] : ok);
      track("read_ok", { ruleKnown: !!findRule(merged.store) });
      // A check is used only when a screenshot was actually read.
      if (paidBy === "free") { markFreeUsed(); setFree(freeLeft()); }
      if (paidBy === "code" && code) { codeStatus(code, true).then(setCodeInfo); track("paid_check"); }
      if (append && ex) {
        setEx(merged);
        setDecision(null);
        setSaveState("idle");
      } else start(merged);
    } finally {
      setBusy(false);
    }
  }

  const touch = (k: string) => {
    if (!edited.has(k)) track("field_edited");
    setEdited((s) => new Set(s).add(k));
    setDecision(null);
    setSaveState("idle");
  };
  const setItem = (id: string, patch: Partial<Item>, key: string) => {
    if (!ex) return;
    setEx({ ...ex, items: ex.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
    touch(`${id}.${key}`);
  };

  const rule = useMemo(
    () => (ex ? resolveRule(ex.store, ex.returnTermsVisible, pastedApplied, ex.checkedAt || today()) : null),
    [ex, pastedApplied]
  );
  const result = useMemo(() => (ex && rule ? analyze(ex, rule) : null), [ex, rule]);

  async function save() {
    if (!ex || !result || !decision) return;
    if (!supabase) {
      setSaveState("error");
      setSaveMsg("Saving isn't configured on this deployment yet.");
      return;
    }
    if (!user) {
      try {
        sessionStorage.setItem(PENDING, JSON.stringify({ ex, pasted: pastedApplied, decision }));
      } catch {}
      signIn();
      return;
    }
    setSaveState("saving");
    const { error } = await supabase.from("byp_checks").insert(toRow(ex, result, decision));
    if (error) {
      setSaveState("error");
      setSaveMsg("We couldn't save this check. Try again in a moment.");
      console.error(error.message);
    } else { setSaveState("saved"); track("saved"); }
  }

  const st = (k: string, v: unknown) =>
    edited.has(k) ? (
      <span className="text-[11px] font-semibold text-navy-2">edited by you</span>
    ) : v == null || v === "" ? (
      <span className="text-[11px] font-semibold text-warn">not visible</span>
    ) : (
      <span className="text-[11px] text-mute">{ex?.source === "simulated" ? "" : "read"}</span>
    );

  const input = "w-full rounded-lg border border-line bg-white px-2.5 py-2 text-sm focus:border-navy focus:outline-none";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">Check before you pay</h1>
        <p className="mt-1 text-mute">Upload a screenshot of your cart or payment screen. We read it and never keep the image.</p>
        <p className="mt-1 text-sm font-semibold text-ok">No account needed to check. 1 full check a month is free.</p>
      </div>

      <Card>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line px-4 py-8 text-center hover:border-navy">
          <span className="text-base font-semibold text-navy">{busy ? "Reading your checkout…" : "Upload checkout screenshots"}</span>
          <span className="text-xs text-mute">The screen with your cart and the total · any store</span>
          <span className="text-xs font-semibold text-navy-2">Long cart? Select up to 4 screenshots of the same cart.</span>
          <span className="text-xs text-mute">iPhone: side button + volume up · Android: power + volume down</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              onFiles(e.target.files, false);
              e.target.value = "";
            }}
          />
        </label>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <button onClick={() => { setPreview(null); track("sample_used"); start({ ...DEMO_EXTRACTION, checkedAt: today() }); }} className="font-semibold text-navy underline">
            No screenshot? Try the fictional sample
          </button>
          <a href="/sample-checkout.png" download className="text-xs text-mute underline">Download a fictional checkout to upload</a>
        </div>
        {error && <p className="mt-3 rounded-lg bg-warn-bg px-3 py-2 text-sm text-warn">{error}</p>}
        {FREE_LIMIT_ON && (
          <p className="mt-3 text-xs text-mute">
            {free > 0 ? "Your free check this month: 1 left on this device." : "Free check this month: used."}
            {code && codeInfo ? ` ${describeCode(codeInfo)}` : ""}{" "}
            <Link href="/pricing" className="underline">Plans</Link> · paying never changes the answer.
          </p>
        )}
      </Card>

      {gate && (
        <Card className="border-warn">
          <h2 className="font-bold text-navy">Your free check for {new Date(monthKey() + "-01T12:00:00").toLocaleDateString("en-US", { month: "long" })} is used on this device</h2>
          <p className="mt-1 text-sm text-mute">
            A paid check gives exactly the same answer as the free one. Enter a pack or pass code, or see the plans. The fictional sample is always free.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.slice(0, 20))}
              placeholder="BYP-XXXX-XXXX"
              autoCapitalize="characters"
              className={input}
            />
            <button onClick={applyCode} disabled={codeBusy || codeInput.trim().length < 8} className="shrink-0 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
              {codeBusy ? "Checking…" : "Use code"}
            </button>
          </div>
          {codeInfo && !codeInfo.ok && <p className="mt-2 text-sm text-warn">{describeCode(codeInfo)}</p>}
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <Link href="/pricing" className="font-semibold text-navy underline">See plans: 4 checks for MX$60 · 30 days for MX$49</Link>
            <button onClick={() => { setGate(false); setPreview(null); track("sample_used"); start({ ...DEMO_EXTRACTION, checkedAt: today() }); }} className="text-navy underline">
              Try the fictional sample
            </button>
          </div>
        </Card>
      )}


      {ex && result && rule && (
        <div ref={resultRef} className="scroll-mt-20 space-y-4">
          {ex.source === "simulated" && (
            <p className="rounded-lg bg-navy px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-white">
              Simulated: fictional store and products, not a real reading
            </p>
          )}

          {/* Summary first: the answer must be visible right after upload (Week 10 persona-test fix). */}
          <Card className={result.moneyAtRisk > 0 ? "border-risk" : "border-ok"}>
            <div className="flex items-start gap-4">
              {preview && <img src={preview} alt="Your checkout screenshot" className="h-24 w-16 shrink-0 rounded-md border border-line object-cover" />}
              <div className="min-w-0 flex-1">
                <p className={`text-4xl font-extrabold tracking-tight ${result.moneyAtRisk > 0 ? "text-risk" : "text-ok"}`}>{mxn(result.moneyAtRisk)}</p>
                <p className="text-sm text-mute">at risk if the size fails</p>
                {result.unread > 0 && (
                  <p className="mt-1 text-sm font-semibold text-warn">So far: part of your cart wasn’t read, so the real number may be higher.</p>
                )}
              </div>
            </div>
            <dl className="mt-3 divide-y divide-line text-sm">
              <div className="flex justify-between py-1.5"><dt>Confirmed final sale</dt><dd className="font-bold">{mxn(result.finalSale)}</dd></div>
              <div className="flex justify-between py-1.5"><dt>Return not confirmed</dt><dd className="font-bold">{mxn(result.notConfirmed)}</dd></div>
              {result.unread > 0 && (
                <div className="flex justify-between py-1.5 text-warn"><dt>Not read from your screenshot yet</dt><dd className="font-bold">{mxn(result.unread)}</dd></div>
              )}
              <div className="flex justify-between py-1.5 text-mute">
                <dt>You’d pay {result.amountPaidSource !== "unknown" && <span className="text-xs">({result.amountPaidSource})</span>}</dt>
                <dd>{result.amountPaid != null ? mxn(result.amountPaid) : "not visible"}</dd>
              </div>
            </dl>
            <p className="mt-3 rounded-lg bg-paper px-3 py-2 text-sm">
              <b className="text-navy">Next step:</b> {result.nextStep}
            </p>
            {ex.source === "screenshot" && (
              <label className={`mt-3 block cursor-pointer rounded-lg border border-dashed px-3 py-2 text-center text-sm font-semibold ${result.unread > 0 ? "border-warn text-warn" : "border-line text-navy"} hover:bg-paper`}>
                {busy ? "Reading…" : "+ Add another screenshot of this cart"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  className="sr-only"
                  disabled={busy}
                  onChange={(e) => {
                    onFiles(e.target.files, true);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </Card>

          {result.flags.length > 0 && (
            <Card>
              <h2 className="font-bold text-navy">What’s pushing this purchase</h2>
              <ul className="mt-3 space-y-2">
                {result.flags.map((f) => (
                  <li key={f.id} className={`rounded-lg border-l-4 px-3 py-2 text-sm ${FLAG_STYLE[f.level]}`}>
                    <b className="block">{f.title}</b>
                    <span className="text-mute">{f.detail}</span>
                    <span className="mt-1 block font-semibold text-navy">Next step: {f.nextStep}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Card>
            <h2 className="font-bold text-navy">Your call</h2>
            <p className="text-sm text-mute">We never place an order and never tell you what to buy.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {DECISIONS.map(([d, label]) => (
                <button
                  key={d}
                  onClick={() => { setDecision(d); setSaveState("idle"); track(`decision_${d}`, { ruleKnown: rule?.status === "advertised" }); }}
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold ${decision === d ? "border-navy bg-navy text-white" : "border-navy text-navy hover:bg-paper"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {decision && (
              <div className="mt-4 rounded-xl bg-paper p-3 text-sm">
                {saveState === "saved" ? (
                  <p>Saved. <Link href="/history" className="font-semibold text-navy underline">See my history</Link></p>
                ) : (
                  <>
                    <p className="text-mute">
                      {user
                        ? "Save this check to your private history. We save the item names, sizes, prices, result and your choice. Never the screenshot."
                        : "Want to keep this? Sign in with Google to save it to a private history only you can see. We never save the screenshot."}
                    </p>
                    <button
                      onClick={save}
                      disabled={saveState === "saving"}
                      className="mt-2 rounded-lg bg-navy px-4 py-2 font-semibold text-white disabled:opacity-50"
                    >
                      {saveState === "saving" ? "Saving…" : user ? "Save to my history" : "Sign in with Google to save"}
                    </button>
                    {saveState === "error" && <p className="mt-2 text-warn">{saveMsg}</p>}
                  </>
                )}
              </div>
            )}
          </Card>
          <Card>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-bold text-navy">{rule.store}: return rule</h2>
              <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${rule.status === "advertised" ? "bg-paper text-navy" : "bg-warn-bg text-warn"}`}>
                {rule.status === "advertised" ? "advertised · the store’s own words" : "unverified"}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>Full-price items <Pill r={rule.regularReturnable} /></div>
              <div>Discounted items <Pill r={rule.discountedReturnable} /></div>
            </div>
            {(rule.windowDays || rule.costNote) && (
              <p className="mt-2 text-sm">{rule.windowDays ? `${rule.windowDays} days. ` : ""}{rule.costNote}</p>
            )}
            <p className="mt-2 text-sm text-mute">{rule.note}</p>
            <p className="mt-2 text-xs text-mute">
              Source:{" "}
              {rule.sourceUrl ? <a href={rule.sourceUrl} target="_blank" rel="noreferrer" onClick={() => track("policy_link_opened")} className="underline">{rule.source}</a> : rule.source} · checked {rule.checkedAt}
            </p>
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer font-semibold text-navy">Have the store’s policy text? Paste it</summary>
              <textarea
                value={pasted}
                onChange={(e) => setPasted(e.target.value.slice(0, 3000))}
                rows={3}
                maxLength={3000}
                placeholder="e.g. Los artículos en promoción no aceptan devoluciones."
                className={`${input} mt-2`}
              />
              <button
                onClick={() => { if (pasted.trim().length >= 15) track("policy_pasted"); setPastedApplied(pasted.trim().length >= 15 ? pasted.trim() : null); setDecision(null); setSaveState("idle"); }}
                className="mt-2 rounded-lg border border-navy px-3 py-1.5 text-sm font-semibold text-navy"
              >
                Read this policy
              </button>
              <p className="mt-1 text-xs text-mute">We look for explicit wording only. Read it yourself too.</p>
            </details>
          </Card>


          <Card>
            <details open={ex.items.some((i) => !i.size || i.paidPrice == null)}>
            <summary onClick={() => track("details_opened", { onlyOnce: true })} className="cursor-pointer font-bold text-navy">
              What we read: {ex.items.length} item{ex.items.length === 1 ? "" : "s"}{" "}
              <span className="text-sm font-normal text-mute">· tap to check or fix</span>
            </summary>
            <label className="mt-3 block text-xs text-mute">
              Store {st("store", ex.store)}
              <input
                value={ex.store ?? ""}
                maxLength={80}
                onChange={(e) => { setEx({ ...ex, store: e.target.value.slice(0, 80) || null }); touch("store"); }}
                className={input}
              />
            </label>
            <div className="mt-3 space-y-3">
              {ex.items.map((it) => {
                const risk = result.perItem.find((p) => p.itemId === it.id)!;
                return (
                  <div key={it.id} className="rounded-xl border border-line bg-paper p-3">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-mute">{risk.discounted ? "discounted" : "full price"} · {mxn(risk.amount)}</span>
                      <Pill r={risk.returnable} />
                    </div>
                    <label className="mt-2 block text-xs text-mute">
                      Item {st(`${it.id}.name`, it.name)}
                      <input value={it.name} maxLength={120} onChange={(e) => setItem(it.id, { name: e.target.value.slice(0, 120) }, "name")} className={input} />
                    </label>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <label className="text-xs text-mute">
                        Size {st(`${it.id}.size`, it.size)}
                        <input value={it.size} maxLength={20} onChange={(e) => setItem(it.id, { size: e.target.value.slice(0, 20) }, "size")} className={input} />
                      </label>
                      <label className="text-xs text-mute">
                        Paid (MXN) {st(`${it.id}.paid`, it.paidPrice)}
                        <input inputMode="decimal" value={it.paidPrice ?? ""} onChange={(e) => setItem(it.id, { paidPrice: num(e.target.value) }, "paid")} className={input} />
                      </label>
                      <label className="text-xs text-mute">
                        Before discount {st(`${it.id}.list`, it.listPrice)}
                        <input inputMode="decimal" value={it.listPrice ?? ""} onChange={(e) => setItem(it.id, { listPrice: num(e.target.value) }, "list")} className={input} />
                      </label>
                      <label className="text-xs text-mute">
                        Qty
                        <input
                          inputMode="numeric"
                          value={it.qty}
                          onChange={(e) => setItem(it.id, { qty: Math.min(50, Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1)) }, "qty")}
                          className={input}
                        />
                      </label>
                    </div>
                    <label className="mt-2 block text-xs text-mute">
                      Type
                      <select value={it.category} onChange={(e) => setItem(it.id, { category: e.target.value as Category }, "cat")} className={input}>
                        {CATS.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </label>
                  </div>
                );
              })}
            </div>
            {ex.discountCodes.length > 0 && <p className="mt-2 text-xs text-mute">Codes read: {ex.discountCodes.join(", ")}</p>}
            </details>
          </Card>

        </div>
      )}
    </div>
  );
}
