import express from "express";
import { supabase } from "../supabaseClient.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { computeCurrentValue } from "../utils/calculations.js";
import { syncDuePayments, addMonths, toISODate } from "../utils/duePayments.js";

const router = express.Router();

// Public: list all investments (single-user app, no auth needed for Baad's own view)
router.get("/", async (req, res) => {
	const { data: investments, error } = await supabase
		.from("investments")
		.select("*")
		.order("created_at", { ascending: false });
	if (error) return res.status(500).json({ error: error.message });

	for (const inv of investments) {
		await syncDuePayments(inv);
	}

	res.json(investments);
});

// Public: full money-trail detail for one investment
router.get("/:id", async (req, res) => {
	const { id } = req.params;
	const { data: investment, error } = await supabase
		.from("investments")
		.select("*")
		.eq("id", id)
		.single();
	if (error) return res.status(404).json({ error: "Investment not found" });

	await syncDuePayments(investment);

	const { data: payments } = await supabase
		.from("payments")
		.select("*")
		.eq("investment_id", id)
		.order("due_date", { ascending: true });

	const approved = (payments || []).filter((p) => p.status === "approved");
	const valueInfo = computeCurrentValue(approved, investment.interest_rate);

	const unpaidPenalties = (payments || []).filter((p) => p.is_penalty && !p.penalty_paid);

	res.json({
		investment,
		payments,
		moneyTrail: valueInfo,
		unpaidPenalties,
	});
});

// Enroll into a plan -> creates an investment
router.post("/", async (req, res) => {
	const { plan_id, contribution_amount } = req.body;
	if (!plan_id || !contribution_amount) {
		return res.status(400).json({ error: "plan_id and contribution_amount are required" });
	}

	const { data: plan, error: planErr } = await supabase
		.from("plans")
		.select("*")
		.eq("id", plan_id)
		.single();
	if (planErr) return res.status(404).json({ error: "Plan not found" });

	if (contribution_amount < plan.min_amount) {
		return res
			.status(400)
			.json({ error: `Minimum amount for this plan is ₹${plan.min_amount}` });
	}

	const start = new Date();
	const maturity = addMonths(start, plan.maturity_months);

	const { data: investment, error } = await supabase
		.from("investments")
		.insert([
			{
				plan_id: plan.id,
				plan_name_snapshot: plan.name,
				interval_type: plan.interval_type,
				interest_rate: plan.interest_rate,
				maturity_months: plan.maturity_months,
				contribution_amount,
				start_date: toISODate(start),
				maturity_date: toISODate(maturity),
			},
		])
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });

	// First payment due immediately
	await supabase.from("payments").insert([
		{
			investment_id: investment.id,
			due_date: toISODate(start),
			amount:
				plan.interval_type === "lumpsum" ? contribution_amount : contribution_amount,
			status: "pending",
		},
	]);

	res.json(investment);
});

// Admin: mark whether a penalty has been "paid" (in burgers, obviously)
router.patch("/penalty/:paymentId", adminAuth, async (req, res) => {
	const { paymentId } = req.params;
	const { penalty_paid } = req.body;
	const { data, error } = await supabase
		.from("payments")
		.update({ penalty_paid: !!penalty_paid })
		.eq("id", paymentId)
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

export default router;
