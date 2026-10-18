"use client";

import { useEffect, useMemo, useState } from "react";
import type { Category, Extraction, FitRecord, Item, Outcome, PolicyNote, Reference } from "@/lib/types";
import { analyze, mxn } from "@/lib/rules";
import { classifyPolicyText, findPolicy, unknownPolicy } from "@/lib/policies";
import { DEMO_EXTRACTION, DEMO_MEMORY, DEMO_REFERENCE } from "@/lib/demo";

const today = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 9);
const MEM_KEY = "byp.fitMemory.v1";
const REF_KEY = "byp.reference.v1";
const EMPTY_REF: Reference = { chestCm: null, lengthCm: null, wristCm: null };
const CATS: Category[] = ["apparel", "footwear", "accessory", "other"];

function load<T>(k: string, fallback: T): T {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}

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
    return await new Promise<Blob>((res) => c.toBlob((b) => res(b!), "image/jpeg", 0.85));
  } finally {
    URL.revokeObjectURL(url);
  }
}

const num = (v: string): number | null => {
  if (v.trim() === "") return null;
  const n = Number(v.replace(/[^0-9.]/g, ""));
  return isFinite(n) ? n : null;
};

const Ret = ({ r }: { r: string }) => (
  <span className={`pill ${r === "yes" ? "ok" : r === "no" ? "bad" : "unk"}`}>{r === "yes" ? "returnable" : r === "no" ? "not returnable" : "unknown"}</span>
);

export default function Home() {
  const [ex, setEx] = useState<Extraction | null>(null);
  const [edited, setEdited] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memory, setMemory] = useState<FitRecord[]>([]);
  const [ref, setRef] = useState<Reference>(EMPTY_REF);
  const [pasted, setPasted] = useState("");
  const [pastedPolicy, setPastedPolicy] = useState<PolicyNote | null>(null);
  const [decision, setDecision] = useState<"wait" | "buy" | null>(null);
  const [draft, setDraft] = useState<{ brand: string; category: Category; size: string; outcome: Outcome }>({
    brand: "",
    category: "apparel",
    size: "",
    outcome: "fit",
  });

  useEffect(() => {
    setMemory(load(MEM_KEY, []));
    setRef(load(REF_KEY, EMPTY_REF));
  }, []);
  const updMemory = (m: FitRecord[]) => {
    setMemory(m);
    save(MEM_KEY, m);
  };
  const updRef = (r: Reference) => {
    setRef(r);
    save(REF_KEY, r);
  };

  function start(e: Extraction) {
    setEx(e);
    setEdited(new Set());
    setDecision(null);
    setPastedPolicy(null);
    setPasted("");
  }

  async function onFile(f: File | undefined) {
    setError(null);
    if (!f) return;
    if (!f.type.startsWith("image/")) return setError("That isn't an image. Upload a PNG or JPG screenshot.");
    if (f.size > 15 * 1024 * 1024) return setError("That image is too large (over 15 MB).");
    setBusy(true);
    try {
      const blob = await shrink(f);
      if (blob.size > 4 * 1024 * 1024) throw new Error("Image is still over 4 MB after resizing.");
      setPreview(URL.createObjectURL(blob));
      const fd = new FormData();
      fd.append("image", blob, "checkout.jpg");
      const r = await fetch("/api/extract", { method: "POST", body: fd });
      // Bug fix: when the server function fails, Vercel returns an HTML/text error page and
      // r.json() threw "Unexpected token 'A'…" at the user. Parse defensively.
      const text = await r.text();
      let j: { error?: string } & Partial<Extraction> = {};
      try {
        j = JSON.parse(text);
      } catch {
        j = { error: "The reader is busy or timed out. Try again in a moment, or use the offline demo." };
      }
      if (r.status === 503 && j.error === "no_key") {
        setError("The AI reader isn't configured on this deployment, so we loaded the SIMULATED fictional demo instead.");
        setPreview(null);
        start({ ...DEMO_EXTRACTION, checkedAt: today() });
      } else if (!r.ok) setError(j.error || "Something went wrong.");
      else start(j as Extraction);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const mark = (k: string) => setEdited((s) => new Set(s).add(k));
  const setItem = (id: string, patch: Partial<Item>, key: string) => {
    if (!ex) return;
    setEx({ ...ex, items: ex.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
    mark(`${id}.${key}`);
    setDecision(null);
  };
  const setField = (patch: Partial<Extraction>, key: string) => {
    if (!ex) return;
    setEx({ ...ex, ...patch });
    mark(key);
    setDecision(null);
  };

  const policy: PolicyNote | null = useMemo(() => {
    if (!ex) return null;
    if (pastedPolicy) return pastedPolicy;
    if (ex.returnTermsVisible) {
      const c = classifyPolicyText(ex.returnTermsVisible);
      if (c.regular !== "unknown" || c.discounted !== "unknown")
        return {
          store: ex.store || "This store",
          regularReturnable: c.regular,
          discountedReturnable: c.discounted,
          status: "advertised",
          source: "Return wording visible on your screenshot (keyword reading)",
          checkedAt: ex.checkedAt,
          note: `"${ex.returnTermsVisible.slice(0, 160)}"`,
        };
    }
    return findPolicy(ex.store) ?? unknownPolicy(ex.store, today());
  }, [ex, pastedPolicy]);

  const analysis = useMemo(() => (ex && policy ? analyze(ex, memory, ref, policy) : null), [ex, memory, ref, policy]);

  function checkPasted() {
    const t = pasted.trim().slice(0, 3000);
    if (t.length < 15) return;
    const c = classifyPolicyText(t);
    setPastedPolicy({
      store: ex?.store || "This store",
      regularReturnable: c.regular,
      discountedReturnable: c.discounted,
      status: "advertised",
      source: "Policy text you pasted (keyword reading — read it yourself too)",
      checkedAt: today(),
      note: c.regular === "unknown" && c.discounted === "unknown" ? "No explicit return rule found in this text. Status stays unknown." : `"${t.slice(0, 160)}${t.length > 160 ? "…" : ""}"`,
    });
    setDecision(null);
  }

  function addRecord() {
    const brand = draft.brand.trim().slice(0, 60);
    const size = draft.size.trim().slice(0, 20);
    if (!brand || !size) return;
    updMemory([...memory, { id: uid(), brand, size, category: draft.category, outcome: draft.outcome }]);
    setDraft({ ...draft, brand: "", size: "" });
  }

  const status = (k: string, v: unknown) =>
    edited.has(k) ? <span className="st ed">edited by you</span> : v == null || v === "" ? <span className="st nv">not visible</span> : <span className="st rd">{ex?.source === "simulated" ? "simulated" : "read"}</span>;

  return (
    <main className="wrap">
      <header className="hero">
        <h1>Before You Pay</h1>
        <p>Check your size and what&apos;s really at risk before you pay for clothes online.</p>
        <p className="small">
          We never sell anything, never recommend products and never place an order. No affiliate links, no sponsored stores.
        </p>
      </header>

      {/* STEP 1 */}
      <section className="card">
        <h2>
          <span className="n">1</span> Upload your checkout screenshot
        </h2>
        <p className="small">Take a screenshot of your cart or checkout page. Only the image is sent to read it; your fit memory stays on this device.</p>
        <div className="row">
          <label className="btn primary">
            {busy ? "Reading…" : "Choose screenshot"}
            <input type="file" accept="image/png,image/jpeg,image/webp" hidden disabled={busy} onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          <button
            className="btn"
            disabled={busy}
            onClick={async () => {
              const b = await fetch("/sample-checkout.png").then((r) => r.blob());
              onFile(new File([b], "sample-checkout.png", { type: "image/png" }));
            }}
          >
            Try a sample screenshot (fictional store)
          </button>
          <button
            className="btn small"
            onClick={() => {
              setError(null);
              setPreview(null);
              start({ ...DEMO_EXTRACTION, checkedAt: today() });
            }}
          >
            Offline demo (no AI)
          </button>
        </div>
        {error && <p className="err">{error}</p>}
        {preview && <img className="thumb" src={preview} alt="Your checkout screenshot" />}
      </section>

      {ex && (
        <>
          {ex.source === "simulated" && (
            <div className="sim">
              <b>SIMULATED</b> — fictional store and invented products. No AI reading was made. Use it to see how the check works.
            </div>
          )}

          {/* STEP 2 */}
          <section className="card">
            <h2>
              <span className="n">2</span> Check what we read
            </h2>
            <p className="small">
              Fix anything that&apos;s wrong — every result below recalculates. Read on {ex.checkedAt} from {ex.source === "screenshot" ? "your screenshot" : "the simulated demo"}.
            </p>
            <div className="grid2">
              <label>
                Store {status("store", ex.store)}
                <input value={ex.store ?? ""} maxLength={80} onChange={(e) => setField({ store: e.target.value || null }, "store")} />
              </label>
              <label>
                Discount codes {status("codes", ex.discountCodes.join(""))}
                <input
                  value={ex.discountCodes.join(", ")}
                  maxLength={120}
                  onChange={(e) => setField({ discountCodes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 5) }, "codes")}
                />
              </label>
              <label>
                Shipping (MXN) {status("shipping", ex.shipping)}
                <input inputMode="decimal" value={ex.shipping ?? ""} onChange={(e) => setField({ shipping: num(e.target.value) }, "shipping")} />
              </label>
              <label>
                Total (MXN) {status("total", ex.total)}
                <input inputMode="decimal" value={ex.total ?? ""} onChange={(e) => setField({ total: num(e.target.value) }, "total")} />
              </label>
            </div>

            <div className="items">
              {ex.items.map((it) => (
                <div className="item" key={it.id}>
                  <div className="itemhead">
                    <input className="iname" value={it.name} maxLength={120} onChange={(e) => setItem(it.id, { name: e.target.value }, "name")} />
                    <button className="x" aria-label="Remove item" onClick={() => setField({ items: ex.items.filter((i) => i.id !== it.id) }, `${it.id}.removed`)}>
                      ×
                    </button>
                  </div>
                  <div className="grid4">
                    <label>
                      Brand {status(`${it.id}.brand`, it.brand)}
                      <input value={it.brand} maxLength={60} onChange={(e) => setItem(it.id, { brand: e.target.value }, "brand")} />
                    </label>
                    <label>
                      Size {status(`${it.id}.size`, it.size)}
                      <input value={it.size} maxLength={20} onChange={(e) => setItem(it.id, { size: e.target.value }, "size")} />
                    </label>
                    <label>
                      Type
                      <select value={it.category} onChange={(e) => setItem(it.id, { category: e.target.value as Category }, "category")}>
                        {CATS.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Qty
                      <input inputMode="numeric" value={it.qty} onChange={(e) => setItem(it.id, { qty: Math.min(50, Math.max(1, num(e.target.value) ?? 1)) }, "qty")} />
                    </label>
                    <label>
                      Original price {status(`${it.id}.listPrice`, it.listPrice)}
                      <input inputMode="decimal" value={it.listPrice ?? ""} onChange={(e) => setItem(it.id, { listPrice: num(e.target.value) }, "listPrice")} />
                    </label>
                    <label>
                      Price you pay {status(`${it.id}.paidPrice`, it.paidPrice)}
                      <input inputMode="decimal" value={it.paidPrice ?? ""} onChange={(e) => setItem(it.id, { paidPrice: num(e.target.value) }, "paidPrice")} />
                    </label>
                    <label className="check">
                      <input type="checkbox" checked={it.sizeHasCm === true} onChange={(e) => setItem(it.id, { sizeHasCm: e.target.checked }, "cm")} />
                      Size given in cm
                    </label>
                  </div>
                </div>
              ))}
              <button
                className="btn small"
                onClick={() =>
                  setField(
                    { items: [...ex.items, { id: uid(), name: "New item", brand: "", size: "", category: "apparel", listPrice: null, paidPrice: null, qty: 1, sizeHasCm: null }] },
                    "added"
                  )
                }
              >
                + Add an item we missed
              </button>
            </div>
          </section>

          {/* STEP 3 */}
          <section className="card">
            <h2>
              <span className="n">3</span> Your fit memory
            </h2>
            <p className="small">
              Which size fit you — or didn&apos;t — in each brand. Saved only on this device. No body photos, ever.
            </p>
            {memory.length > 0 ? (
              <ul className="mem">
                {memory.map((r) => (
                  <li key={r.id}>
                    <b>{r.brand}</b> · {r.category} · size {r.size} →{" "}
                    <span className={`pill ${r.outcome === "fit" ? "ok" : "bad"}`}>{r.outcome === "fit" ? "fit me" : r.outcome === "too_big" ? "too big" : "too small"}</span>
                    <button className="x" aria-label="Delete record" onClick={() => updMemory(memory.filter((m) => m.id !== r.id))}>
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty">No records yet. Add the last brand you bought, even if it didn&apos;t fit.</p>
            )}
            <div className="grid4">
              <label>
                Brand
                <input value={draft.brand} maxLength={60} placeholder="e.g. Zara" onChange={(e) => setDraft({ ...draft, brand: e.target.value })} />
              </label>
              <label>
                Type
                <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as Category })}>
                  {CATS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Size
                <input value={draft.size} maxLength={20} placeholder="e.g. M" onChange={(e) => setDraft({ ...draft, size: e.target.value })} />
              </label>
              <label>
                How it fit
                <select value={draft.outcome} onChange={(e) => setDraft({ ...draft, outcome: e.target.value as Outcome })}>
                  <option value="fit">Fit me</option>
                  <option value="too_big">Too big</option>
                  <option value="too_small">Too small</option>
                </select>
              </label>
            </div>
            <div className="row">
              <button className="btn" onClick={addRecord} disabled={!draft.brand.trim() || !draft.size.trim()}>
                Add to fit memory
              </button>
            </div>

            <h3>One garment that fits you (measure once)</h3>
            <p className="small">Lay a jacket or shirt that fits you flat. Measure armpit to armpit, and collar to hem. For bracelets, wrap a paper strip around your wrist.</p>
            <div className="grid3">
              <label>
                Chest width (cm)
                <input inputMode="decimal" value={ref.chestCm ?? ""} onChange={(e) => updRef({ ...ref, chestCm: num(e.target.value) })} />
              </label>
              <label>
                Length (cm)
                <input inputMode="decimal" value={ref.lengthCm ?? ""} onChange={(e) => updRef({ ...ref, lengthCm: num(e.target.value) })} />
              </label>
              <label>
                Wrist (cm)
                <input inputMode="decimal" value={ref.wristCm ?? ""} onChange={(e) => updRef({ ...ref, wristCm: num(e.target.value) })} />
              </label>
            </div>
            <div className="row">
              <button
                className="btn small"
                onClick={() => {
                  updMemory(DEMO_MEMORY);
                  updRef(DEMO_REFERENCE);
                }}
              >
                Load sample fit memory (fictional)
              </button>
              <button
                className="btn small danger"
                onClick={() => {
                  updMemory([]);
                  updRef(EMPTY_REF);
                }}
              >
                Delete all my fit data
              </button>
            </div>
          </section>

          {/* STEP 4 */}
          {policy && (
            <section className="card">
              <h2>
                <span className="n">4</span> Return rule for this store
              </h2>
              <div className="policy">
                <div>
                  <b>{policy.store}</b>
                  <span className={`badge ${policy.status}`}>{policy.status}</span>
                </div>
                <div>
                  Regular items: <Ret r={policy.regularReturnable} /> · Discounted items: <Ret r={policy.discountedReturnable} />
                </div>
                <div className="small">
                  Source: {policy.source} · checked {policy.checkedAt}
                </div>
                <div className="small">{policy.note}</div>
              </div>
              <label>
                Paste the store&apos;s return policy to check it
                <textarea rows={3} maxLength={3000} value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder="e.g. Items bought on sale are final sale…" />
              </label>
              <div className="row">
                <button className="btn" onClick={checkPasted} disabled={pasted.trim().length < 15}>
                  Check this text
                </button>
                {pastedPolicy && (
                  <button className="btn small" onClick={() => setPastedPolicy(null)}>
                    Remove pasted text
                  </button>
                )}
              </div>
            </section>
          )}

          {/* RESULTS */}
          {analysis && (
            <section className="card result">
              <h2>What&apos;s at stake</h2>
              <div className="nums">
                <div className="numcard">
                  <div className="lbl">Amount you&apos;d pay</div>
                  <div className="big">{analysis.amountPaid != null ? mxn(analysis.amountPaid) : "Unknown"}</div>
                  <div className="small">{analysis.amountPaidSource === "unknown" ? "Some prices are not visible — fill them in above." : `From the ${analysis.amountPaidSource}`}</div>
                </div>
                <div className={`numcard ${analysis.conditionalExposure > 0 ? "warn" : "okc"}`}>
                  <div className="lbl">Conditional exposure</div>
                  <div className="big">{mxn(analysis.conditionalExposure)}</div>
                  <div className="small">
                    Money you could be stuck with if the size fails.
                    {analysis.confirmedNonReturnable > 0 && <> {mxn(analysis.confirmedNonReturnable)} confirmed not returnable.</>}
                    {analysis.unconfirmed > 0 && <> {mxn(analysis.unconfirmed)} returns not confirmed.</>}
                  </div>
                </div>
              </div>

              <ul className="exp">
                {analysis.perItem.map((p) => {
                  const it = ex.items.find((i) => i.id === p.itemId)!;
                  return (
                    <li key={p.itemId}>
                      {it.name} — {mxn(p.amount)} {p.discounted ? "(discounted)" : ""} <Ret r={p.returnable} />
                    </li>
                  );
                })}
              </ul>

              <h3>Warnings</h3>
              {analysis.warnings.length === 0 && <p className="empty">No warnings from your evidence. That is not a guarantee of fit.</p>}
              {[...analysis.warnings]
                .sort((a, b) => ["high", "medium", "low", "info"].indexOf(a.level) - ["high", "medium", "low", "info"].indexOf(b.level))
                .map((w, i) => (
                  <div className={`warning ${w.level}`} key={i}>
                    <div className="wt">
                      <span className="lv">{w.level}</span> {w.title}
                    </div>
                    <div className="wd">{w.detail}</div>
                  </div>
                ))}

              {analysis.reasonsToWait.length > 0 && (
                <>
                  <h3>Reasons to wait</h3>
                  <ul className="reasons">
                    {analysis.reasonsToWait.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </>
              )}

              <h3>Your call</h3>
              <div className="row">
                <button className="btn primary" onClick={() => setDecision("wait")}>
                  I&apos;ll wait
                </button>
                <button className="btn" onClick={() => setDecision("buy")}>
                  Buy anyway — my call
                </button>
              </div>
              {decision === "wait" && <p className="ok-msg">Good. Check the size chart against your measured garment, or ask the store, before you come back.</p>}
              {decision === "buy" && <p className="ok-msg">Your decision. Go back to the store to pay — this app never places orders.</p>}
            </section>
          )}
        </>
      )}

      <footer className="foot">
        Before You Pay · prototype for a university course · Fit warnings are based on your own evidence and are never a guarantee. Policy findings show their source, date and status; unknown stays unknown.
      </footer>
    </main>
  );
}
