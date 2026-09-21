import express from "express";
import multer from "multer";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

// This is for Baad's own uploads (want photos, hangout photos, etc.) — no
// admin auth, since she needs to use it herself. Kept separate from the
// coupon upload route, which stays admin-only.
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 8 * 1024 * 1024 }, // 8MB — enough for phone photos, not huge dumps
});
const BUCKET = process.env.SUPABASE_MEDIA_BUCKET || "baadfunds-media";

router.post("/image", upload.single("image"), async (req, res) => {
	if (!req.file) return res.status(400).json({ error: "No image file provided" });

	const ext = (req.file.originalname.split(".").pop() || "jpg").toLowerCase();
	const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

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

export default router;
