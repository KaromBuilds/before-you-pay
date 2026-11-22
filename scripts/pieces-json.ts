// Week 15 · dumps the rule-desk pieces (and the engine's flags for the fictional cart) as JSON for scripts/render_pieces.py.
import { PIECES } from "../lib/content.ts";
import { analyze } from "../lib/engine.ts";
import { DEMO_EXTRACTION } from "../lib/demo.ts";
import { RETURN_RULES } from "../lib/policies.ts";

const cumbre = RETURN_RULES.find((r) => r.store.startsWith("Cumbre"))!;
const r = analyze(DEMO_EXTRACTION, cumbre);
console.log(JSON.stringify({ pieces: PIECES, cart: DEMO_EXTRACTION, result: r }, null, 1));
