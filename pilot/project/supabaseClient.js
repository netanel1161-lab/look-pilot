import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Supabase anon key is public by design; keep service keys server-side only.
const SUPABASE_URL = "https://jkqbnyzpwjeullsuqdou.supabase.co";
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcWJueXpwd2pldWxsc3VxZG91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MDU3NTgsImV4cCI6MjA3OTk4MTc1OH0.XL3QGlGbMUypHLIiA_g68FEllLWjbn-WZI4zAjczczE";

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const supabase = client;
export default client;

// expose for inline scripts if needed
window.supabase = client;

export async function getTable(tableName, options = "*") {
    const { data, error } = await client.from(tableName).select(options);
    if (error) {
        console.error("Failed to load table", tableName, error);
        return null;
    }
    return data;
}

export async function getUserByPhone(phone) {
    const { data, error } = await client
        .from("users")
        .select("*")
        .eq("phone", phone)
        .single();

    if (error) {
        console.warn("User lookup by phone failed:", error.message);
        return null;
    }

    return data;
}
