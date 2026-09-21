import express from "express";
import multer from "multer";
import { supabase } from "../supabaseClient.js";
import { adminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

// Files are held in memory only briefly, then streamed straight to Supabase
// Storage — never written to disk, never sent as base64 in a JSON body.
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per image is plenty for a coupon
});
const BUCKET = process.env.SUPABASE_COUPON_BUCKET || "coupon-images";

// Admin: upload a coupon image to Supabase Storage, get back a public URL
router.post("/upload-image", adminAuth, upload.single("image"), async (req, res) => {
	if (!req.file) return res.status(400).json({ error: "No image file provided" });

	const ext = (req.file.originalname.split(".").pop() || "jpg").toLowerCase();
	const path = `coupons/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

	const { error: uploadError } = await supabase.storage
		.from(BUCKET)
		.upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: false });

	if (uploadError) {
		return res.status(500).json({
			error: `Upload failed: ${uploadError.message}. Did you create the "${BUCKET}" bucket in Supabase Storage and make it public?`,
		});
	}

	const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
	res.json({ url: data.publicUrl });
});

// Public: the next coupon waiting to be scratched (if any)
router.get("/next", async (req, res) => {
	const { data, error } = await supabase
		.from("coupons")
		.select("*")
		.eq("is_active", true)
		.eq("is_revealed", false)
		.order("created_at", { ascending: true })
		.limit(1);
	if (error) return res.status(500).json({ error: error.message });
	res.json(data && data.length ? data[0] : null);
});

// Public: mark a coupon as scratched/revealed
router.patch("/:id/reveal", async (req, res) => {
	const { id } = req.params;
	const { data, error } = await supabase
		.from("coupons")
		.update({ is_revealed: true, revealed_at: new Date().toISOString() })
		.eq("id", id)
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

// Admin: list all coupons
router.get("/", adminAuth, async (req, res) => {
	const { data, error } = await supabase
		.from("coupons")
		.select("*")
		.order("created_at", { ascending: false });
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

// Admin: create a new coupon (image_url can be an uploaded/hosted image link)
router.post("/", adminAuth, async (req, res) => {
	const { title, description, image_url } = req.body;
	if (!title || !description) {
		return res.status(400).json({ error: "title and description are required" });
	}
	const { data, error } = await supabase
		.from("coupons")
		.insert([{ title, description, image_url: image_url || null }])
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

router.delete("/:id", adminAuth, async (req, res) => {
	const { id } = req.params;
	const { error } = await supabase.from("coupons").update({ is_active: false }).eq("id", id);
	if (error) return res.status(500).json({ error: error.message });
	res.json({ success: true });
});

export default router;
