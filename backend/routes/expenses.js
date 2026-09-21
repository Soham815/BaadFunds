import express from "express";
import { supabase } from "../supabaseClient.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { round2 } from "../utils/calculations.js";

const router = express.Router();

// ---------- categories ----------

router.get("/categories", async (req, res) => {
	const { data, error } = await supabase
		.from("expense_categories")
		.select("*")
		.order("name", { ascending: true });
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

router.post("/categories", async (req, res) => {
	const { name } = req.body;
	if (!name || !name.trim()) return res.status(400).json({ error: "name is required" });
	const { data, error } = await supabase
		.from("expense_categories")
		.insert([{ name: name.trim() }])
		.select()
		.single();
	if (error) {
		// unique violation just means it already exists — treat as success
		if (error.code === "23505") {
			const { data: existing } = await supabase
				.from("expense_categories")
				.select("*")
				.eq("name", name.trim())
				.single();
			return res.json(existing);
		}
		return res.status(500).json({ error: error.message });
	}
	res.json(data);
});

// ---------- summaries (literal routes before "/:id") ----------

router.get("/summary/month", async (req, res) => {
	const month = req.query.month || new Date().toISOString().slice(0, 7); // "YYYY-MM"
	const start = `${month}-01`;
	const end = new Date(new Date(start).getFullYear(), new Date(start).getMonth() + 1, 1)
		.toISOString()
		.slice(0, 10);

	const { data, error } = await supabase
		.from("expenses")
		.select("*")
		.gte("expense_date", start)
		.lt("expense_date", end);
	if (error) return res.status(500).json({ error: error.message });

	res.json(buildSummary(data));
});

router.get("/summary/overall", async (req, res) => {
	const { data, error } = await supabase.from("expenses").select("*");
	if (error) return res.status(500).json({ error: error.message });
	res.json(buildSummary(data));
});

router.get("/summary/year", async (req, res) => {
	const year = req.query.year || new Date().getFullYear();
	const start = `${year}-01-01`;
	const end = `${Number(year) + 1}-01-01`;

	const { data, error } = await supabase
		.from("expenses")
		.select("*")
		.gte("expense_date", start)
		.lt("expense_date", end);
	if (error) return res.status(500).json({ error: error.message });

	const monthlyTotals = Array.from({ length: 12 }, (_, i) => ({
		month: i + 1,
		total: 0,
	}));
	for (const e of data || []) {
		const m = new Date(e.expense_date).getMonth();
		monthlyTotals[m].total += Number(e.amount);
	}
	monthlyTotals.forEach((m) => (m.total = round2(m.total)));

	const highest = monthlyTotals.reduce(
		(best, m) => (m.total > best.total ? m : best),
		monthlyTotals[0]
	);

	res.json({ year: Number(year), monthlyTotals, highestMonth: highest.total > 0 ? highest : null });
});

function buildSummary(expenses) {
	const byCategory = {};
	let total = 0;
	for (const e of expenses || []) {
		total += Number(e.amount);
		byCategory[e.category] = round2((byCategory[e.category] || 0) + Number(e.amount));
	}
	return {
		total: round2(total),
		byCategory: Object.entries(byCategory).map(([category, amount]) => ({ category, amount })),
	};
}

// ---------- admin: backfill approved investment payments as expenses ----------

router.post("/backfill-investments", adminAuth, async (req, res) => {
	const { data: approvedPayments, error: payErr } = await supabase
		.from("payments")
		.select("*, investments(plan_name_snapshot)")
		.eq("status", "approved");
	if (payErr) return res.status(500).json({ error: payErr.message });

	const { data: existing, error: existErr } = await supabase
		.from("expenses")
		.select("source_ref_id")
		.eq("source", "investment");
	if (existErr) return res.status(500).json({ error: existErr.message });
	const already = new Set((existing || []).map((e) => e.source_ref_id));

	const toInsert = (approvedPayments || [])
		.filter((p) => !already.has(p.id))
		.map((p) => ({
			amount: p.amount,
			category: "Investments",
			note: p.investments?.plan_name_snapshot || "Investment payment",
			expense_date: p.approved_at ? p.approved_at.slice(0, 10) : p.due_date,
			source: "investment",
			source_ref_id: p.id,
		}));

	if (toInsert.length) {
		const { error: insertErr } = await supabase.from("expenses").insert(toInsert);
		if (insertErr) return res.status(500).json({ error: insertErr.message });
	}

	res.json({ backfilled: toInsert.length });
});

// ---------- crud ----------

router.get("/", async (req, res) => {
	const { data, error } = await supabase
		.from("expenses")
		.select("*")
		.order("expense_date", { ascending: false })
		.order("created_at", { ascending: false });
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

router.post("/", async (req, res) => {
	const { amount, category, note, expense_date } = req.body;
	if (!amount || !category) return res.status(400).json({ error: "amount and category are required" });

	const { data, error } = await supabase
		.from("expenses")
		.insert([
			{
				amount: Number(amount),
				category,
				note: note?.trim() || null,
				expense_date: expense_date || new Date().toISOString().slice(0, 10),
				source: "manual",
			},
		])
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

router.delete("/:id", async (req, res) => {
	const { id } = req.params;
	const { error } = await supabase.from("expenses").delete().eq("id", id);
	if (error) return res.status(500).json({ error: error.message });
	res.json({ success: true });
});

export default router;
