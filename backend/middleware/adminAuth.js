// Very small, deliberately simple admin gate.
// The admin logs in with the password ("Baad") via POST /api/admin/login,
// which returns a signed-ish token (just the password itself, base64'd,
// good enough for a private two-person project). Every protected admin
// route requires that token in the "x-admin-token" header.

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Baad";
export const ADMIN_TOKEN = Buffer.from(`admin:${ADMIN_PASSWORD}`).toString(
	"base64"
);

export function adminAuth(req, res, next) {
	const token = req.headers["x-admin-token"];
	if (token && token === ADMIN_TOKEN) {
		return next();
	}
	return res.status(401).json({ error: "Not authorized. Please log in again." });
}
