import express from "express";
import { supabase } from "../supabaseClient.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { round2 } from "../utils/calculations.js";

const router = express.Router();

// Baad requests a loan
router.post("/", async (req, res) => {
	const { amount, notes } = req.body;
	if (!amount || amount <= 0) return res.status(400).json({ error: "amount is required" });

	const { data, error } = await supabase
		.from("loans")
		.insert([{ amount, notes: notes || "" }])
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

// Public: list loans (single-user app)
router.get("/", async (req, res) => {
	const { data, error } = await supabase
		.from("loans")
		.select("*")
		.order("requested_at", { ascending: false });
	if (error) return res.status(500).json({ error: error.message });

	// compute what's currently owed with 50%/month simple-per-month accrual
	const withDue = (data || []).map((loan) => {
		if (loan.status === "paid" || !loan.approved_at) return { ...loan, currentlyOwed: loan.amount };
		const monthsElapsed = Math.max(
			0,
			(Date.now() - new Date(loan.approved_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
		);
		const owed = loan.amount * Math.pow(1 + loan.monthly_interest_rate / 100, monthsElapsed);
		return { ...loan, currentlyOwed: round2(owed) };
	});

	res.json(withDue);
});

// Admin: approve a loan. This also auto-pays the next due SIP payment, if any.
router.patch("/:id/approve", adminAuth, async (req, res) => {
	const { id } = req.params;
	const { data: loan, error } = await supabase
		.from("loans")
		.update({ status: "approved", approved_at: new Date().toISOString() })
		.eq("id", id)
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });

	// Find the earliest still-unpaid due payment across active investments
	const { data: duePayments } = await supabase
		.from("payments")
		.select("*")
		.in("status", ["pending", "attempted"])
		.order("due_date", { ascending: true })
		.limit(1);

	let autoPaidPayment = null;
	if (duePayments && duePayments.length) {
		const p = duePayments[0];
		const { data: updatedPayment } = await supabase
			.from("payments")
			.update({
				status: "approved",
				method: "cash",
				approved_at: new Date().toISOString(),
				paid_via_loan_id: loan.id,
				is_penalty: false,
			})
			.eq("id", p.id)
			.select()
			.single();
		autoPaidPayment = updatedPayment;

		const { data: inv } = await supabase
			.from("investments")
			.select("*")
			.eq("id", p.investment_id)
			.single();
		if (inv) {
			await supabase
				.from("investments")
				.update({
					total_invested: Number(inv.total_invested) + Number(p.amount),
					last_payment_date: p.due_date,
				})
				.eq("id", inv.id);

			await supabase
				.from("loans")
				.update({ auto_paid_investment_id: inv.id })
				.eq("id", loan.id);
		}
	}

	res.json({ loan, autoPaidPayment });
});

router.patch("/:id/reject", adminAuth, async (req, res) => {
	const { id } = req.params;
	const { data, error } = await supabase
		.from("loans")
		.update({ status: "rejected" })
		.eq("id", id)
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

// Admin: mark a loan as fully paid back
router.patch("/:id/mark-paid", adminAuth, async (req, res) => {
	const { id } = req.params;
	const { data, error } = await supabase
		.from("loans")
		.update({ status: "paid", paid_at: new Date().toISOString() })
		.eq("id", id)
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

export default router;
