import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// The anon key is public by design; Row Level Security protects every row.
export const supabase: SupabaseClient | null = url && anon ? createClient(url, anon) : null;
