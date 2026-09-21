import express from "express";
import { supabase } from "../supabaseClient.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { syncAllActiveInvestments, addDays, toISODate } from "../utils/duePayments.js";

const router = express.Router();

// NOTE: literal routes (/pending, /penalties/unpaid, /due-reminders) MUST be
// registered before the dynamic "/:id" route below, or Express will match
// them as an :id param instead. Keep any new literal GET routes up here.

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

// Admin: due-date reminders — anything not yet approved, due within the
// window from 5 days before to 5 days after its due date. Once a payment
// is approved it drops out of this list automatically (query filters that
// out), which is exactly how the "popups stop once marked paid" rule works.
router.get("/due-reminders", adminAuth, async (req, res) => {
	// make sure every active investment's due payment rows actually exist —
	// otherwise a due date could be "coming" without a row to find yet
	await syncAllActiveInvestments();

	const today = new Date();
	const windowStart = toISODate(addDays(today, -5));
	const windowEnd = toISODate(addDays(today, 5));

	const { data, error } = await supabase
		.from("payments")
		.select("*, investments(plan_name_snapshot, interval_type)")
		.neq("status", "approved")
		.gte("due_date", windowStart)
		.lte("due_date", windowEnd)
		.order("due_date", { ascending: true });
	if (error) return res.status(500).json({ error: error.message });

	const todayIso = toISODate(today);
	const withMeta = (data || []).map((p) => ({
		...p,
		days_until_due: Math.round(
			(new Date(p.due_date) - new Date(todayIso)) / (1000 * 60 * 60 * 24)
		),
		is_overdue: p.due_date < todayIso,
	}));

	res.json(withMeta);
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

		// Also log it in Baad's personal expense tracker, category "Investments" —
		// guard against duplicates in case approve is ever re-triggered
		const { data: existingExpense } = await supabase
			.from("expenses")
			.select("id")
			.eq("source_ref_id", payment.id)
			.eq("source", "investment")
			.maybeSingle();
		if (!existingExpense) {
			await supabase.from("expenses").insert([
				{
					amount: payment.amount,
					category: "Investments",
					note: inv.plan_name_snapshot || "Investment payment",
					expense_date: payment.due_date,
					source: "investment",
					source_ref_id: payment.id,
				},
			]);
		}
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
