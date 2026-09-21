import express from "express";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

const VALID_TIMEFRAMES = ["days", "weeks", "months", "years"];

// Active wants first (oldest first), completed after (oldest-completed first)
router.get("/", async (req, res) => {
	const { data: active, error: e1 } = await supabase
		.from("wants")
		.select("*")
		.eq("is_completed", false)
		.order("created_at", { ascending: true });
	const { data: completed, error: e2 } = await supabase
		.from("wants")
		.select("*")
		.eq("is_completed", true)
		.order("completed_at", { ascending: true });
	if (e1 || e2) return res.status(500).json({ error: (e1 || e2).message });
	res.json([...(active || []), ...(completed || [])]);
});

router.post("/", async (req, res) => {
	const { title, desire, image_url, purchase_link, description, expected_timeframe } = req.body;
	if (!title || !title.trim()) return res.status(400).json({ error: "title is required" });

	const timeframe = VALID_TIMEFRAMES.includes(expected_timeframe) ? expected_timeframe : null;
	const desireValue =
		typeof desire === "number" && desire >= 0 && desire <= 100 ? desire : 50;

	const { data, error } = await supabase
		.from("wants")
		.insert([
			{
				title: title.trim(),
				desire: desireValue,
				image_url: image_url || null,
				purchase_link: purchase_link?.trim() || null,
				description: description?.trim() || null,
				expected_timeframe: timeframe,
			},
		])
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

// Mark a want as gotten! Computes a tag based on how long it took.
router.patch("/:id/complete", async (req, res) => {
	const { id } = req.params;
	const { data: want, error: fetchErr } = await supabase
		.from("wants")
		.select("*")
		.eq("id", id)
		.single();
	if (fetchErr) return res.status(404).json({ error: "Want not found" });

	const completedAt = new Date();
	const createdAt = new Date(want.created_at);
	const durationDays = Math.max(
		0,
		Math.round((completedAt - createdAt) / (1000 * 60 * 60 * 24))
	);

	let tagLabel = "Quick win ⚡";
	if (durationDays > 365) tagLabel = "Dream fulfilled ✨";
	else if (durationDays > 90) tagLabel = "Long-time desire 🕰️";
	else if (durationDays > 30) tagLabel = "Patiently earned 💛";
	else if (durationDays > 7) tagLabel = "Worth the wait 🌸";

	const { data, error } = await supabase
		.from("wants")
		.update({
			is_completed: true,
			completed_at: completedAt.toISOString(),
			completed_duration_days: durationDays,
			tag_label: tagLabel,
		})
		.eq("id", id)
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

router.delete("/:id", async (req, res) => {
	const { id } = req.params;
	const { error } = await supabase.from("wants").delete().eq("id", id);
	if (error) return res.status(500).json({ error: error.message });
	res.json({ success: true });
});

export default router;
