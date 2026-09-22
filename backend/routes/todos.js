import express from "express";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

// Active tasks first (oldest first), completed tasks after (oldest-completed first)
router.get("/", async (req, res) => {
	const { data: active, error: e1 } = await supabase
		.from("todos")
		.select("*")
		.eq("is_completed", false)
		.order("created_at", { ascending: true });
	const { data: completed, error: e2 } = await supabase
		.from("todos")
		.select("*")
		.eq("is_completed", true)
		.order("completed_at", { ascending: true });
	if (e1 || e2) return res.status(500).json({ error: (e1 || e2).message });
	res.json([...(active || []), ...(completed || [])]);
});

router.post("/", async (req, res) => {
	const { title, description } = req.body;
	if (!title || !title.trim()) return res.status(400).json({ error: "title is required" });

	const { data, error } = await supabase
		.from("todos")
		.insert([{ title: title.trim(), description: description?.trim() || null }])
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

// Edit a task's title/description
router.patch("/:id", async (req, res) => {
	const { id } = req.params;
	const { title, description } = req.body;
	if (title !== undefined && !title.trim()) {
		return res.status(400).json({ error: "title cannot be empty" });
	}
	const updates = {};
	if (title !== undefined) updates.title = title.trim();
	if (description !== undefined) updates.description = description?.trim() || null;

	const { data, error } = await supabase
		.from("todos")
		.update(updates)
		.eq("id", id)
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

router.patch("/:id/complete", async (req, res) => {
	const { id } = req.params;
	const { is_completed } = req.body;
	const { data, error } = await supabase
		.from("todos")
		.update({
			is_completed: !!is_completed,
			completed_at: is_completed ? new Date().toISOString() : null,
		})
		.eq("id", id)
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

router.delete("/:id", async (req, res) => {
	const { id } = req.params;
	const { error } = await supabase.from("todos").delete().eq("id", id);
	if (error) return res.status(500).json({ error: error.message });
	res.json({ success: true });
});

export default router;
