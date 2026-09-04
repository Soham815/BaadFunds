// In dev, Vite's proxy (see vite.config.js) forwards "/api" to localhost:4000.
// In production (Netlify), there's no such proxy, so we point straight at the
// Render backend URL via an env variable set in Netlify's dashboard.
const BASE = `${import.meta.env.VITE_API_URL || ""}/api`;

function adminHeaders() {
	const token = localStorage.getItem("baadfunds_admin_token");
	return token ? { "x-admin-token": token } : {};
}

async function handle(res) {
	const data = await res.json().catch(() => ({}));
	if (!res.ok) throw new Error(data.error || "Something went wrong");
	return data;
}

export const api = {
	// Plans
	getPlans: () => fetch(`${BASE}/plans`).then(handle),
	getAllPlansAdmin: () => fetch(`${BASE}/plans/all`, { headers: adminHeaders() }).then(handle),
	createPlan: (payload) =>
		fetch(`${BASE}/plans`, {
			method: "POST",
			headers: { "Content-Type": "application/json", ...adminHeaders() },
			body: JSON.stringify(payload),
		}).then(handle),
	updatePlan: (id, payload) =>
		fetch(`${BASE}/plans/${id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json", ...adminHeaders() },
			body: JSON.stringify(payload),
		}).then(handle),
	deletePlan: (id) =>
		fetch(`${BASE}/plans/${id}`, { method: "DELETE", headers: adminHeaders() }).then(handle),

	// Investments
	getInvestments: () => fetch(`${BASE}/investments`).then(handle),
	getInvestment: (id) => fetch(`${BASE}/investments/${id}`).then(handle),
	enroll: (payload) =>
		fetch(`${BASE}/investments`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		}).then(handle),
	setPenaltyPaid: (paymentId, penalty_paid) =>
		fetch(`${BASE}/investments/penalty/${paymentId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json", ...adminHeaders() },
			body: JSON.stringify({ penalty_paid }),
		}).then(handle),

	// Payments
	getPayment: (id) => fetch(`${BASE}/payments/${id}`).then(handle),
	attemptPayment: (id, method) =>
		fetch(`${BASE}/payments/${id}/attempt`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ method }),
		}).then(handle),
	getPendingPayments: () =>
		fetch(`${BASE}/payments/pending`, { headers: adminHeaders() }).then(handle),
	getUnpaidPenalties: () =>
		fetch(`${BASE}/payments/penalties/unpaid`, { headers: adminHeaders() }).then(handle),
	approvePayment: (id) =>
		fetch(`${BASE}/payments/${id}/approve`, { method: "PATCH", headers: adminHeaders() }).then(
			handle
		),
	rejectPayment: (id) =>
		fetch(`${BASE}/payments/${id}/reject`, { method: "PATCH", headers: adminHeaders() }).then(
			handle
		),

	// Withdrawals
	getWithdrawals: () => fetch(`${BASE}/withdrawals`).then(handle),
	requestWithdrawal: (investment_id) =>
		fetch(`${BASE}/withdrawals`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ investment_id }),
		}).then(handle),
	approveWithdrawal: (id) =>
		fetch(`${BASE}/withdrawals/${id}/approve`, { method: "PATCH", headers: adminHeaders() }).then(
			handle
		),
	rejectWithdrawal: (id) =>
		fetch(`${BASE}/withdrawals/${id}/reject`, { method: "PATCH", headers: adminHeaders() }).then(
			handle
		),
	setChargePaid: (id, charge_paid) =>
		fetch(`${BASE}/withdrawals/${id}/charge-paid`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json", ...adminHeaders() },
			body: JSON.stringify({ charge_paid }),
		}).then(handle),

	// Loans
	getLoans: () => fetch(`${BASE}/loans`).then(handle),
	requestLoan: (amount, notes) =>
		fetch(`${BASE}/loans`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ amount, notes }),
		}).then(handle),
	approveLoan: (id) =>
		fetch(`${BASE}/loans/${id}/approve`, { method: "PATCH", headers: adminHeaders() }).then(
			handle
		),
	rejectLoan: (id) =>
		fetch(`${BASE}/loans/${id}/reject`, { method: "PATCH", headers: adminHeaders() }).then(
			handle
		),
	markLoanPaid: (id) =>
		fetch(`${BASE}/loans/${id}/mark-paid`, { method: "PATCH", headers: adminHeaders() }).then(
			handle
		),

	// Coupons
	getNextCoupon: () => fetch(`${BASE}/coupons/next`).then(handle),
	revealCoupon: (id) =>
		fetch(`${BASE}/coupons/${id}/reveal`, { method: "PATCH" }).then(handle),
	getAllCoupons: () => fetch(`${BASE}/coupons`, { headers: adminHeaders() }).then(handle),
	createCoupon: (payload) =>
		fetch(`${BASE}/coupons`, {
			method: "POST",
			headers: { "Content-Type": "application/json", ...adminHeaders() },
			body: JSON.stringify(payload),
		}).then(handle),
	deleteCoupon: (id) =>
		fetch(`${BASE}/coupons/${id}`, { method: "DELETE", headers: adminHeaders() }).then(handle),

	// Admin auth
	adminLogin: (password) =>
		fetch(`${BASE}/admin/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ password }),
		}).then(handle),

	// Chatbot
	askSoham: (message) =>
		fetch(`${BASE}/chatbot`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ message }),
		}).then(handle),
};
