import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import type { Category, Extraction, Item } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODELS = (process.env.GEMINI_MODELS || "gemini-3.8-flash,gemini-3.6-flash").split(",").map((m) => m.trim()).filter(Boolean);
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);

const PROMPT = `You read a screenshot of an online-store checkout or cart (Mexico, prices in MXN).
Extract ONLY what is visible. Never guess. If a field is not visible, use null (or an empty list).
- items: every product line. name, brand (only if visible in the name or page; else ""), size exactly as shown (else ""),
  category (apparel, footwear, accessory, other), listPrice = crossed-out/original unit price, paidPrice = unit price actually charged,
  qty, sizeHasCm = true only if the size is given in centimeters.
- discountCodes: promo/discount codes shown.
- shipping, total: numbers in MXN, no symbols.
- returnTermsVisible: any return/exchange/refund wording visible, copied verbatim; else null.
- pressureCues: urgency or scarcity text copied verbatim (e.g. "Only 2 left", countdown timers, "Ends today").
- store: store name if visible (logo text, domain), else null.`;

const schema = {
  type: Type.OBJECT,
  properties: {
    store: { type: Type.STRING, nullable: true },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          brand: { type: Type.STRING },
          size: { type: Type.STRING },
          category: { type: Type.STRING, enum: ["apparel", "footwear", "accessory", "other"] },
          listPrice: { type: Type.NUMBER, nullable: true },
          paidPrice: { type: Type.NUMBER, nullable: true },
          qty: { type: Type.INTEGER },
          sizeHasCm: { type: Type.BOOLEAN, nullable: true },
        },
        required: ["name", "brand", "size", "category", "listPrice", "paidPrice", "qty", "sizeHasCm"],
      },
    },
    discountCodes: { type: Type.ARRAY, items: { type: Type.STRING } },
    shipping: { type: Type.NUMBER, nullable: true },
    total: { type: Type.NUMBER, nullable: true },
    returnTermsVisible: { type: Type.STRING, nullable: true },
    pressureCues: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["store", "items", "discountCodes", "shipping", "total", "returnTermsVisible", "pressureCues"],
};

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const money = (v: unknown) => (typeof v === "number" && isFinite(v) && v >= 0 && v < 10_000_000 ? Math.round(v * 100) / 100 : null);
const CATS: Category[] = ["apparel", "footwear", "accessory", "other"];

function sanitize(raw: Record<string, unknown>): Extraction {
  const items: Item[] = (Array.isArray(raw.items) ? raw.items : []).slice(0, 20).map((r: Record<string, unknown>, i: number) => ({
    id: `x${i + 1}`,
    name: str(r.name, 120) || `Item ${i + 1}`,
    brand: str(r.brand, 60),
    size: str(r.size, 20),
    category: CATS.includes(r.category as Category) ? (r.category as Category) : "other",
    listPrice: money(r.listPrice),
    paidPrice: money(r.paidPrice),
    qty: typeof r.qty === "number" && r.qty >= 1 && r.qty <= 50 ? Math.floor(r.qty) : 1,
    sizeHasCm: typeof r.sizeHasCm === "boolean" ? r.sizeHasCm : null,
  }));
  const list = (v: unknown, n: number, max: number) =>
    (Array.isArray(v) ? v : []).map((x) => str(x, max)).filter(Boolean).slice(0, n);
  return {
    store: str(raw.store, 80) || null,
    items,
    discountCodes: list(raw.discountCodes, 5, 40),
    shipping: money(raw.shipping),
    total: money(raw.total),
    returnTermsVisible: str(raw.returnTermsVisible, 1500) || null,
    pressureCues: list(raw.pressureCues, 6, 120),
    source: "screenshot",
    checkedAt: new Date().toISOString().slice(0, 10),
  };
}

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "no_key" }, { status: 503 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Send the screenshot as a file." }, { status: 400 });
  }
  const file = form.get("image");
  if (!(file instanceof File)) return NextResponse.json({ error: "No image received." }, { status: 400 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "Use a PNG, JPG or WEBP screenshot." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image is over 4 MB." }, { status: 400 });

  try {
    const data = Buffer.from(await file.arrayBuffer()).toString("base64");
    const ai = new GoogleGenAI({ apiKey: key });
    // gemini-2.5-flash now returns 404 for new keys; try current Flash models in order.
    let lastErr: unknown = null;
    for (const model of MODELS) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: [{ role: "user", parts: [{ text: PROMPT }, { inlineData: { mimeType: file.type, data } }] }],
          config: { responseMimeType: "application/json", responseSchema: schema, temperature: 0 },
        });
        const raw = JSON.parse(res.text ?? "{}");
        return NextResponse.json(sanitize(raw));
      } catch (e) {
        lastErr = e;
        console.error(`extract failed on ${model}`, e instanceof Error ? e.message.slice(0, 200) : e);
      }
    }
    throw lastErr;
  } catch (e) {
    console.error("extract failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "We couldn't read that screenshot. Try a clearer one or use the demo." }, { status: 502 });
  }
}
