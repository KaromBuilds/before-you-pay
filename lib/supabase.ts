import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Public client configuration. The publishable key is designed to ship to every browser (it is in the page's
// JavaScript either way); it grants nothing beyond what Row Level Security allows. The secret / service_role key
// is never in this repo or in the app. Security floor #1 is about secrets; see docs/DECISIONS.md.
const SUPABASE_URL = "https://cjzspprdnjqpoymlboxi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_YmYawKV9Obe7SZmQY7Nctg_ljq76BK3";

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
