import express from "express";
import { ADMIN_TOKEN } from "../middleware/adminAuth.js";

const router = express.Router();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Baad";

router.post("/login", (req, res) => {
	const { password } = req.body;
	if (password === ADMIN_PASSWORD) {
		return res.json({ token: ADMIN_TOKEN });
	}
	return res.status(401).json({ error: "Wrong password, try again." });
});

export default router;
