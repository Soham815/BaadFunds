import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
	console.warn(
		"⚠️  SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are missing. Add them to backend/.env"
	);
}

export const supabase = createClient(url, key, {
	auth: { persistSession: false },
});
