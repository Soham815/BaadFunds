import express from "express";
import { supabase } from "../supabaseClient.js";
import { adminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

// Public: list active plans for Baad to browse
router.get("/", async (req, res) => {
	const { data, error } = await supabase
		.from("plans")
		.select("*")
		.eq("is_active", true)
		.order("created_at", { ascending: true });
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

// Admin: list ALL plans (including inactive)
router.get("/all", adminAuth, async (req, res) => {
	const { data, error } = await supabase
		.from("plans")
		.select("*")
		.order("created_at", { ascending: true });
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

// Admin: create a plan
router.post("/", adminAuth, async (req, res) => {
	const { name, description, interval_type, min_amount, interest_rate, maturity_months } =
		req.body;

	if (!name || !interval_type) {
		return res.status(400).json({ error: "name and interval_type are required" });
	}

	const { data, error } = await supabase
		.from("plans")
		.insert([
			{
				name,
				description: description || "",
				interval_type,
				min_amount: min_amount || 0,
				interest_rate: interest_rate ?? 8,
				maturity_months: maturity_months ?? 12,
			},
		])
		.select()
		.single();

	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

// Admin: update a plan (name, rate, maturity, active state...)
router.patch("/:id", adminAuth, async (req, res) => {
	const { id } = req.params;
	const updates = req.body;
	const { data, error } = await supabase
		.from("plans")
		.update(updates)
		.eq("id", id)
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

// Admin: delete (soft-delete by deactivating) a plan
router.delete("/:id", adminAuth, async (req, res) => {
	const { id } = req.params;
	const { error } = await supabase.from("plans").update({ is_active: false }).eq("id", id);
	if (error) return res.status(500).json({ error: error.message });
	res.json({ success: true });
});

export default router;
