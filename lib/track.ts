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
