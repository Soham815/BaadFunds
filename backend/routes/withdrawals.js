import express from "express";
import { supabase } from "../supabaseClient.js";
import { adminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

// Baad requests to withdraw an investment
router.post("/", async (req, res) => {
	const { investment_id } = req.body;
	const { data: inv, error: invErr } = await supabase
		.from("investments")
		.select("*")
		.eq("id", investment_id)
		.single();
	if (invErr) return res.status(404).json({ error: "Investment not found" });

	const isBeforeMaturity = new Date() < new Date(inv.maturity_date);

	const { data, error } = await supabase
		.from("withdrawal_requests")
		.insert([
			{
				investment_id,
				is_before_maturity: isBeforeMaturity,
				charge_units: isBeforeMaturity ? 2 : 0,
				charge_item: "steamed momos",
			},
		])
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

// Baad's / public view of her withdrawal requests
router.get("/", async (req, res) => {
	const { data, error } = await supabase
		.from("withdrawal_requests")
		.select("*, investments(plan_name_snapshot, contribution_amount)")
		.order("requested_at", { ascending: false });
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

// Admin: approve a withdrawal
router.patch("/:id/approve", adminAuth, async (req, res) => {
	const { id } = req.params;
	const { data: wr, error } = await supabase
		.from("withdrawal_requests")
		.update({ status: "approved", approved_at: new Date().toISOString() })
		.eq("id", id)
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });

	await supabase
		.from("investments")
		.update({ status: "withdrawn" })
		.eq("id", wr.investment_id);

	res.json(wr);
});

// Admin: reject a withdrawal
router.patch("/:id/reject", adminAuth, async (req, res) => {
	const { id } = req.params;
	const { data, error } = await supabase
		.from("withdrawal_requests")
		.update({ status: "rejected" })
		.eq("id", id)
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

// Admin: mark the early-exit charge as paid/unpaid
router.patch("/:id/charge-paid", adminAuth, async (req, res) => {
	const { id } = req.params;
	const { charge_paid } = req.body;
	const { data, error } = await supabase
		.from("withdrawal_requests")
		.update({ charge_paid: !!charge_paid })
		.eq("id", id)
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

export default router;
