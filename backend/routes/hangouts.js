import express from "express";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

const VALID_TIMEFRAMES = ["days", "weeks", "months", "years"];

// Active hangouts first (oldest first), completed ones ("trophies") after
router.get("/", async (req, res) => {
	const { data: active, error: e1 } = await supabase
		.from("hangouts")
		.select("*")
		.eq("is_completed", false)
		.order("created_at", { ascending: true });
	const { data: completed, error: e2 } = await supabase
		.from("hangouts")
		.select("*")
		.eq("is_completed", true)
		.order("completed_at", { ascending: true });
	if (e1 || e2) return res.status(500).json({ error: (e1 || e2).message });
	res.json([...(active || []), ...(completed || [])]);
});

router.post("/", async (req, res) => {
	const { title, outing_type, expected_timeframe, image_url, description } = req.body;
	if (!title || !title.trim()) return res.status(400).json({ error: "title is required" });

	const timeframe = VALID_TIMEFRAMES.includes(expected_timeframe) ? expected_timeframe : null;

	const { data, error } = await supabase
		.from("hangouts")
		.insert([
			{
				title: title.trim(),
				outing_type: outing_type?.trim() || null,
				expected_timeframe: timeframe,
				image_url: image_url || null,
				description: description?.trim() || null,
			},
		])
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

// Edit a hangout's fields
router.patch("/:id", async (req, res) => {
	const { id } = req.params;
	const { title, outing_type, expected_timeframe, image_url, description } = req.body;
	const updates = {};
	if (title !== undefined) {
		if (!title.trim()) return res.status(400).json({ error: "title cannot be empty" });
		updates.title = title.trim();
	}
	if (outing_type !== undefined) updates.outing_type = outing_type?.trim() || null;
	if (expected_timeframe !== undefined) {
		updates.expected_timeframe = VALID_TIMEFRAMES.includes(expected_timeframe) ? expected_timeframe : null;
	}
	if (image_url !== undefined) updates.image_url = image_url || null;
	if (description !== undefined) updates.description = description?.trim() || null;

	const { data, error } = await supabase.from("hangouts").update(updates).eq("id", id).select().single();
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

// Mark a hangout as done (or undo that) — computes a trophy tag based on how long it took.
router.patch("/:id/complete", async (req, res) => {
	const { id } = req.params;
	const isCompleted = req.body.is_completed !== undefined ? !!req.body.is_completed : true;
	const { data: hangout, error: fetchErr } = await supabase
		.from("hangouts")
		.select("*")
		.eq("id", id)
		.single();
	if (fetchErr) return res.status(404).json({ error: "Hangout not found" });

	if (!isCompleted) {
		const { data, error } = await supabase
			.from("hangouts")
			.update({ is_completed: false, completed_at: null, completed_duration_days: null, tag_label: null })
			.eq("id", id)
			.select()
			.single();
		if (error) return res.status(500).json({ error: error.message });
		return res.json(data);
	}

	const completedAt = new Date();
	const createdAt = new Date(hangout.created_at);
	const durationDays = Math.max(
		0,
		Math.round((completedAt - createdAt) / (1000 * 60 * 60 * 24))
	);

	let tagLabel = "Spontaneous 🎈";
	if (durationDays > 365) tagLabel = "Bucket-list hangout 🏆";
	else if (durationDays > 90) tagLabel = "Long-awaited 🌅";
	else if (durationDays > 30) tagLabel = "Well-planned 🗓️";
	else if (durationDays > 7) tagLabel = "Worth planning 🎉";

	const { data, error } = await supabase
		.from("hangouts")
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

// Save (or update, any time later via clicking the trophy) her feedback
router.patch("/:id/feedback", async (req, res) => {
	const { id } = req.params;
	const { feedback_text, feedback_cost } = req.body;

	const { data, error } = await supabase
		.from("hangouts")
		.update({
			feedback_text: feedback_text?.trim() || null,
			feedback_cost:
				feedback_cost === "" || feedback_cost === undefined || feedback_cost === null
					? null
					: Number(feedback_cost),
		})
		.eq("id", id)
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

router.delete("/:id", async (req, res) => {
	const { id } = req.params;
	const { error } = await supabase.from("hangouts").delete().eq("id", id);
	if (error) return res.status(500).json({ error: error.message });
	res.json({ success: true });
});

export default router;
