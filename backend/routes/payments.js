import express from "express";
import { supabase } from "../supabaseClient.js";
import { adminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

// NOTE: literal routes (/pending, /penalties/unpaid) MUST be registered
// before the dynamic "/:id" route below, or Express will match them as
// an :id param instead. Keep any new literal GET routes up here.

// Admin: list everything awaiting approval
router.get("/pending", adminAuth, async (req, res) => {
	const { data, error } = await supabase
		.from("payments")
		.select("*, investments(plan_name_snapshot, interval_type)")
		.in("status", ["attempted", "pending"])
		.order("due_date", { ascending: true });
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

// Admin: list all unpaid penalties across investments
router.get("/penalties/unpaid", adminAuth, async (req, res) => {
	const { data, error } = await supabase
		.from("payments")
		.select("*, investments(plan_name_snapshot)")
		.eq("is_penalty", true)
		.eq("penalty_paid", false)
		.order("due_date", { ascending: true });
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

// Get a single payment (with its investment's plan name) - used by the Payment page
router.get("/:id", async (req, res) => {
	const { id } = req.params;
	const { data, error } = await supabase
		.from("payments")
		.select("*, investments(plan_name_snapshot, interval_type)")
		.eq("id", id)
		.single();
	if (error) return res.status(404).json({ error: "Payment not found" });
	res.json(data);
});

// Baad marks that she has attempted a payment (chose UPI or Cash)
router.patch("/:id/attempt", async (req, res) => {
	const { id } = req.params;
	const { method } = req.body;
	if (!["upi", "cash"].includes(method)) {
		return res.status(400).json({ error: "method must be upi or cash" });
	}
	const { data, error } = await supabase
		.from("payments")
		.update({ method, status: "attempted", attempted_at: new Date().toISOString() })
		.eq("id", id)
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

// Admin: approve a payment (money confirmed received)
router.patch("/:id/approve", adminAuth, async (req, res) => {
	const { id } = req.params;
	const { data: payment, error } = await supabase
		.from("payments")
		.update({ status: "approved", approved_at: new Date().toISOString() })
		.eq("id", id)
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });

	// Bump the investment's running totals
	const { data: inv } = await supabase
		.from("investments")
		.select("*")
		.eq("id", payment.investment_id)
		.single();
	if (inv) {
		await supabase
			.from("investments")
			.update({
				total_invested: Number(inv.total_invested) + Number(payment.amount),
				last_payment_date: payment.due_date,
			})
			.eq("id", inv.id);
	}

	res.json(payment);
});

// Admin: reject a payment attempt (money not actually received)
router.patch("/:id/reject", adminAuth, async (req, res) => {
	const { id } = req.params;
	const { data, error } = await supabase
		.from("payments")
		.update({ status: "pending", method: null, attempted_at: null })
		.eq("id", id)
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

export default router;
