import express from "express";
import { supabase } from "../supabaseClient.js";
import { computeBalances } from "../utils/splitCalculations.js";
import { round2 } from "../utils/calculations.js";

const router = express.Router();

router.get("/", async (req, res) => {
	const { data: friends, error } = await supabase.from("friends").select("*").order("name");
	if (error) return res.status(500).json({ error: error.message });

	// overall "money trail" — sum each friend's net balance across every
	// activity they're part of, so Baad can see a running total per friend
	const { data: memberships } = await supabase.from("activity_members").select("*");
	const { data: activities } = await supabase.from("activities").select("*");
	const { data: allPayments } = await supabase.from("activity_payments").select("*");

	const withBalances = (friends || []).map((friend) => {
		let overallBalance = 0;
		const friendActivityIds = (memberships || [])
			.filter((m) => m.friend_id === friend.id)
			.map((m) => m.activity_id);

		for (const activityId of friendActivityIds) {
			const members = (memberships || []).filter((m) => m.activity_id === activityId);
			const payments = (allPayments || []).filter((p) => p.activity_id === activityId);
			const balances = computeBalances(members, payments);
			overallBalance += balances[friend.id] || 0;
		}

		return { ...friend, overallBalance: round2(overallBalance) };
	});

	res.json(withBalances);
});

router.post("/", async (req, res) => {
	const { name, mobile_number } = req.body;
	if (!name || !name.trim()) return res.status(400).json({ error: "name is required" });

	const { data, error } = await supabase
		.from("friends")
		.insert([{ name: name.trim(), mobile_number: mobile_number?.trim() || null }])
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

router.delete("/:id", async (req, res) => {
	const { id } = req.params;
	const { error } = await supabase.from("friends").delete().eq("id", id);
	if (error) return res.status(500).json({ error: error.message });
	res.json({ success: true });
});

export default router;
