"use client";
// Week 15 · The rule desk. Every piece follows the same five-block layout (playbook 12.3): series tag (+ Fictional
// stamp) → headline → fact rows colored by status → one next step → source · checked date. Pieces come from
// lib/content.ts, where the lint and the tests live. Tracking is anonymous (lib/track.ts → byp_content_events).
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PIECES, SERIES, cleanStoreName, pieceById, pieceLink, readSrc, type Piece, type Src, type Tone } from "@/lib/content";
import { requestStore, trackContent } from "@/lib/track";

const TONE: Record<Tone, string> = { ok: "text-ok", unknown: "text-warn", risk: "text-risk", plain: "text-ink" };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const nice = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
};
const FORMAT_LABEL = { image: "Image card", video: "Short video", text: "WhatsApp message" } as const;

export default function RuleDesk() {
  const params = useSearchParams();
  const src: Src = readSrc(params.get("src"));
  const focus = pieceById(params.get("p"))?.id ?? null;

  useEffect(() => {
    trackContent("rules_view", { src, piece: focus, onlyOnce: true });
    if (focus) {
      trackContent("piece_view", { src, piece: focus, onlyOnce: true });
      document.getElementById(focus)?.scrollIntoView({ block: "start" });
    }
  }, [src, focus]);

  return (
    <div className="space-y-10">
      <section className="pt-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-warn">The rule desk</p>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-navy sm:text-4xl">
          What the store doesn’t say counts as risk.
        </h1>
        <p className="mt-3 max-w-2xl text-mute">
          Return rules in each store’s own words, dated and linked. Fictional carts taken apart by the same engine you can run on
          yours. And what Mexican law gives you after delivery. One person runs this desk, and no store pays us.
        </p>
      </section>

      {SERIES.map((s) => (
        <section key={s.id} className="space-y-3" aria-labelledby={`series-${s.id}`}>
          <div>
            <h2 id={`series-${s.id}`} className="text-xs font-bold uppercase tracking-wider text-warn">{s.tag}</h2>
            <p className="text-sm text-mute">{s.blurb}</p>
          </div>
          <div className="grid gap-4">
            {PIECES.filter((p) => p.series === s.id).map((p) =>
              p.status === "finished" ? (
                <PieceCard key={p.id} piece={p} src={src} highlighted={p.id === focus} />
              ) : (
                <SketchCard key={p.id} piece={p} />
              ),
            )}
          </div>
        </section>
      ))}

      <NextActions src={src} focus={focus} />

      <section className="rounded-2xl border border-line bg-white p-5 text-sm text-mute">
        <h2 className="font-bold text-navy">How this desk works</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Every rule quotes the store’s own page and shows the day it was read. If the page doesn’t say, we say so, and we count it as risk.</li>
          <li>Carts here are fictional or the founder’s own. We never publish a buyer’s cart.</li>
          <li>Nothing here is a guarantee or legal advice. Stores can change their pages; the date tells you how fresh a rule is.</li>
          <li>No store, brand or marketplace pays us. No affiliate links. We never recommend a product.</li>
        </ul>
      </section>
    </div>
  );
}

function PieceCard({ piece: p, src, highlighted }: { piece: Piece; src: Src; highlighted: boolean }) {
  const tag = SERIES.find((s) => s.id === p.series)!.tag;
  const [copied, setCopied] = useState<"link" | "text" | null>(null);
  const played = useRef(false);

  async function share() {
    const url = pieceLink(p.id, "share");
    trackContent("share", { piece: p.id, src });
    try {
      if (navigator.share) {
        await navigator.share({ title: `${p.title} · Before You Pay`, url });
        return;
      }
    } catch {
      return; // the person closed the share sheet
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied("link");
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  async function copyText() {
    if (!p.body) return;
    trackContent("message_copied", { piece: p.id, src });
    try {
      await navigator.clipboard.writeText(p.body);
      setCopied("text");
    } catch {
      window.prompt("Copy this message:", p.body);
    }
  }

  return (
    <article
      id={p.id}
      className={`scroll-mt-20 rounded-2xl border bg-white p-5 ${highlighted ? "border-navy ring-2 ring-navy/20" : "border-line"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-warn">{tag}</span>
        <span className="flex items-center gap-2">
          {p.fictional && <span className="rounded bg-paper px-2 py-0.5 text-xs font-semibold text-mute">Fictional</span>}
          <span className="text-xs text-mute">{FORMAT_LABEL[p.format]}</span>
        </span>
      </div>
      <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-navy">{p.title}</h3>

      {p.format === "video" && p.asset && (
        <video
          className="mx-auto mt-4 aspect-[9/16] w-full max-w-[280px] rounded-xl border border-line bg-paper"
          src={p.asset}
          poster={p.asset.replace(".mp4", "-poster.png")}
          controls
          muted
          playsInline
          preload="metadata"
          onPlay={() => {
            if (!played.current) trackContent("video_played", { piece: p.id, src });
            played.current = true;
          }}
        >
          {p.alt}
        </video>
      )}

      <dl className="mt-4 divide-y divide-line">
        {p.facts.map((f) => (
          <div key={f.label} className="grid gap-0.5 py-2 sm:grid-cols-[11rem_1fr] sm:gap-3">
            <dt className="text-sm text-mute">{f.label}</dt>
            <dd className={`font-semibold ${TONE[f.tone]}`}>{f.value}</dd>
          </div>
        ))}
      </dl>

      {p.body && (
        <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-paper p-4 font-sans text-sm leading-relaxed text-ink">{p.body}</pre>
      )}

      <p className="mt-3 rounded-xl border border-navy px-4 py-3 text-sm font-semibold text-navy">Next step: {p.nextStep}</p>
      {p.series === "store" && (
        // Persona-test fix (Diego): someone who already paid had no path from a store's rule to what they can do now.
        <a href="#five-days" className="mt-2 block rounded-xl bg-warn-bg px-4 py-3 text-sm font-semibold text-warn">
          Already paid and it doesn’t fit? See your five days after delivery ↓
        </a>
      )}

      {p.source && (
        <p className="mt-3 text-xs text-mute">
          Source:{" "}
          {p.source.url ? (
            <a href={p.source.url} className="underline" target="_blank" rel="noopener noreferrer">{p.source.label}</a>
          ) : (
            p.source.label
          )}{" "}
          · checked {nice(p.source.checkedAt)}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {p.format === "image" && p.asset && (
          <a
            href={p.asset}
            target="_blank"
            rel="noopener"
            onClick={() => trackContent("card_opened", { piece: p.id, src })}
            className="rounded-lg border border-line px-3 py-2 font-semibold text-navy hover:border-navy"
          >
            Open the card (image)
          </a>
        )}
        {p.body && (
          <button onClick={copyText} className="rounded-lg border border-line px-3 py-2 font-semibold text-navy hover:border-navy">
            {copied === "text" ? "Message copied" : "Copy message"}
          </button>
        )}
        <button onClick={share} className="rounded-lg border border-line px-3 py-2 font-semibold text-navy hover:border-navy">
          {copied === "link" ? "Link copied" : "Share"}
        </button>
      </div>
    </article>
  );
}

function SketchCard({ piece: p }: { piece: Piece }) {
  const tag = SERIES.find((s) => s.id === p.series)!.tag;
  return (
    <article id={p.id} className="rounded-2xl border border-dashed border-line bg-paper/60 p-5 text-mute">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider">{tag}</span>
        <span className="rounded border border-line px-2 py-0.5 text-xs font-semibold">Sketch · coming next</span>
      </div>
      <h3 className="mt-2 text-lg font-bold text-ink/70">{p.title}</h3>
      <ul className="mt-2 space-y-1 text-sm">
        {p.facts.map((f) => (
          <li key={f.label}>
            <span className="text-mute">{f.label}:</span> <span className="text-ink/70">{f.value}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs">{FORMAT_LABEL[p.format]} · not published yet</p>
    </article>
  );
}

function NextActions({ src, focus }: { src: Src; focus: string | null }) {
  const [store, setStore] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "bad" | "limit" | "error">("idle");
  const [sentName, setSentName] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = cleanStoreName(store);
    if (!clean) return setState("bad");
    let n = 0;
    try {
      n = Number(sessionStorage.getItem("byp.storeReq") || 0);
    } catch {}
    if (n >= 3) return setState("limit");
    setState("sending");
    const ok = await requestStore(clean, src);
    if (!ok) return setState("error");
    try {
      sessionStorage.setItem("byp.storeReq", String(n + 1));
    } catch {}
    trackContent("store_requested", { src, piece: focus });
    setSentName(clean);
    setStore("");
    setState("sent");
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2" aria-label="What you can do next">
      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-bold text-navy">Check your next cart</h2>
        <p className="mt-1 text-sm text-mute">Upload the checkout screenshot before you pay. 1 full check a month is free; no account needed.</p>
        <Link
          href="/product?from=rules"
          onClick={() => trackContent("check_clicked", { src, piece: focus })}
          className="mt-3 inline-block rounded-xl bg-navy px-5 py-3 font-semibold text-white hover:bg-navy-2"
        >
          Check my next cart
        </Link>
      </div>
      <form onSubmit={submit} className="rounded-2xl border border-line bg-white p-5" noValidate>
        <h2 className="font-bold text-navy">Ask for your store’s rule</h2>
        <p className="mt-1 text-sm text-mute">Just the store’s name. No account, no contact details. One person reads each page: up to 10 new stores a week.</p>
        <label htmlFor="store" className="sr-only">Store name</label>
        <input
          id="store"
          value={store}
          onChange={(e) => {
            setStore(e.target.value);
            if (state !== "sending") setState("idle");
          }}
          maxLength={60}
          placeholder="For example: Liverpool"
          autoComplete="off"
          className="mt-3 w-full rounded-xl border border-line px-4 py-3"
        />
        <button
          disabled={state === "sending"}
          className="mt-2 w-full rounded-xl border border-navy px-5 py-3 font-semibold text-navy hover:bg-paper disabled:opacity-60"
        >
          {state === "sending" ? "Sending…" : "Ask for this store"}
        </button>
        <p className="mt-2 min-h-5 text-sm" role="status">
          {state === "sent" && <span className="text-ok">Got it: {sentName}. It joins the queue; this page shows it once it’s read and dated.</span>}
          {state === "bad" && <span className="text-risk">Type only the store’s name (2–60 letters or numbers), no links.</span>}
          {state === "limit" && <span className="text-warn">That’s three stores from this visit. Thank you; that’s plenty for this week.</span>}
          {state === "error" && <span className="text-risk">That didn’t go through. Try again in a minute.</span>}
        </p>
      </form>
    </section>
  );
}
