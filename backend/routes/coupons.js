import express from "express";
import { supabase } from "../supabaseClient.js";
import { adminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

// Public: the next coupon waiting to be scratched (if any)
router.get("/next", async (req, res) => {
	const { data, error } = await supabase
		.from("coupons")
		.select("*")
		.eq("is_active", true)
		.eq("is_revealed", false)
		.order("created_at", { ascending: true })
		.limit(1);
	if (error) return res.status(500).json({ error: error.message });
	res.json(data && data.length ? data[0] : null);
});

// Public: mark a coupon as scratched/revealed
router.patch("/:id/reveal", async (req, res) => {
	const { id } = req.params;
	const { data, error } = await supabase
		.from("coupons")
		.update({ is_revealed: true, revealed_at: new Date().toISOString() })
		.eq("id", id)
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

// Admin: list all coupons
router.get("/", adminAuth, async (req, res) => {
	const { data, error } = await supabase
		.from("coupons")
		.select("*")
		.order("created_at", { ascending: false });
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

// Admin: create a new coupon (image_url can be an uploaded/hosted image link)
router.post("/", adminAuth, async (req, res) => {
	const { title, description, image_url } = req.body;
	if (!title || !description) {
		return res.status(400).json({ error: "title and description are required" });
	}
	const { data, error } = await supabase
		.from("coupons")
		.insert([{ title, description, image_url: image_url || null }])
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

router.delete("/:id", adminAuth, async (req, res) => {
	const { id } = req.params;
	const { error } = await supabase.from("coupons").update({ is_active: false }).eq("id", id);
	if (error) return res.status(500).json({ error: error.message });
	res.json({ success: true });
});

export default router;
