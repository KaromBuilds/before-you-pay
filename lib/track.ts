import { supabase } from "./supabase";

// Week 13 · anonymous event log. Judge sessions by what people DID, not what they SAID.
// Stores only: a random per-tab visit id, the event name, whether the store's rule was known, language, device.
// Never the screenshot, item names, prices, store name or account. Failures are silent: logging never blocks a check.
export type TrackEvent =
  | "page_view" | "upload_started" | "read_ok" | "read_failed" | "sample_used"
  | "field_edited" | "details_opened" | "policy_pasted" | "policy_link_opened"
  | "decision_wait" | "decision_change_size" | "decision_buy_anyway" | "saved" | "lang_switched"
  // Week 14 · pricing: page views, plan buttons, the free/paid gate, codes, requests, simulator. Still no personal data.
  | "pricing_view" | "plan_pack_clicked" | "plan_pass_clicked" | "plan_issuer_clicked"
  | "gate_shown" | "code_ok" | "code_bad" | "paid_check" | "pack_requested"
  | "simulator_view" | "scenario_saved";

let visit: string | null = null;
const visitId = () => {
  if (visit) return visit;
  try {
    visit = sessionStorage.getItem("byp.visit");
    if (!visit) {
      visit = Math.random().toString(36).slice(2, 12).padEnd(10, "0");
      sessionStorage.setItem("byp.visit", visit);
    }
  } catch {
    visit = Math.random().toString(36).slice(2, 12).padEnd(10, "0");
  }
  return visit;
};

const once = new Set<string>();

export function track(event: TrackEvent, opts: { ruleKnown?: boolean | null; lang?: "en" | "es"; onlyOnce?: boolean } = {}) {
  if (typeof window === "undefined" || !supabase) return;
  if (opts.onlyOnce) {
    if (once.has(event)) return;
    once.add(event);
  }
  const device = window.matchMedia?.("(max-width: 640px)").matches ? "phone" : "desktop";
  supabase
    .from("byp_events_v2")
    .insert({ visit: visitId(), event, rule_known: opts.ruleKnown ?? null, lang: opts.lang ?? null, device })
    .then(() => {}, () => {});
}

// Week 15 · rule desk funnel. Same anonymous visit id as above, so a /rules visit and a later check can be joined
// without knowing who anyone is. Stores only: event, piece id, channel (wa | share | direct), device.
export type ContentEvent =
  | "rules_view" | "piece_view" | "share" | "message_copied" | "card_opened" | "video_played" | "check_clicked" | "store_requested";

export function trackContent(event: ContentEvent, opts: { piece?: string | null; src?: "wa" | "share" | "direct"; onlyOnce?: boolean } = {}) {
  if (typeof window === "undefined" || !supabase) return;
  const key = `c:${event}:${opts.piece ?? ""}`;
  if (opts.onlyOnce) {
    if (once.has(key)) return;
    once.add(key);
  }
  const device = window.matchMedia?.("(max-width: 640px)").matches ? "phone" : "desktop";
  const piece = opts.piece && /^[a-z0-9-]{1,24}$/.test(opts.piece) ? opts.piece : null;
  supabase
    .from("byp_content_events")
    .insert({ visit: visitId(), event, piece, src: opts.src ?? "direct", device })
    .then(() => {}, () => {});
}

/** "Ask for your store's rule": the store's name only. Returns false if the database refused it. */
export async function requestStore(store: string, src: "wa" | "share" | "direct"): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("byp_store_requests").insert({ store, src });
  return !error;
}
