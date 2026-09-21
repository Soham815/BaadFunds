// In dev, Vite's proxy (see vite.config.js) forwards "/api" to localhost:4000.
// In production (Netlify), there's no such proxy, so we point straight at the
// Render backend URL via an env variable set in Netlify's dashboard.
const BASE = `${import.meta.env.VITE_API_URL || ""}/api`;

function adminHeaders() {
	const token = localStorage.getItem("baadfunds_admin_token");
	return token ? { "x-admin-token": token } : {};
}

async function handle(res) {
	const contentType = res.headers.get("content-type") || "";
	if (!contentType.includes("application/json")) {
		// Almost always means VITE_API_URL is missing/wrong and the request
		// hit Netlify's own domain (which returns index.html, not JSON).
		throw new Error(
			"Got a non-JSON response from the API. Check that VITE_API_URL is set correctly in your deploy settings and points at your Render backend."
		);
	}
	const data = await res.json();
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
	getDueReminders: () =>
		fetch(`${BASE}/payments/due-reminders`, { headers: adminHeaders() }).then(handle),
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
	uploadCouponImage: (file) => {
		const formData = new FormData();
		formData.append("image", file);
		// No Content-Type header here on purpose — the browser sets the correct
		// multipart boundary itself; setting it manually breaks the upload.
		return fetch(`${BASE}/coupons/upload-image`, {
			method: "POST",
			headers: adminHeaders(),
			body: formData,
		}).then(handle);
	},
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

	// To-Do list
	getTodos: () => fetch(`${BASE}/todos`).then(handle),
	createTodo: (title, description) =>
		fetch(`${BASE}/todos`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title, description }),
		}).then(handle),
	completeTodo: (id, is_completed) =>
		fetch(`${BASE}/todos/${id}/complete`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ is_completed }),
		}).then(handle),
	deleteTodo: (id) => fetch(`${BASE}/todos/${id}`, { method: "DELETE" }).then(handle),

	// Generic media upload (Baad's own uploads — want/hangout photos etc.)
	uploadImage: (file) => {
		const formData = new FormData();
		formData.append("image", file);
		return fetch(`${BASE}/uploads/image`, { method: "POST", body: formData }).then(handle);
	},

	// Wants list
	getWants: () => fetch(`${BASE}/wants`).then(handle),
	createWant: (payload) =>
		fetch(`${BASE}/wants`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		}).then(handle),
	completeWant: (id) => fetch(`${BASE}/wants/${id}/complete`, { method: "PATCH" }).then(handle),
	deleteWant: (id) => fetch(`${BASE}/wants/${id}`, { method: "DELETE" }).then(handle),

	// Hangout list
	getHangouts: () => fetch(`${BASE}/hangouts`).then(handle),
	createHangout: (payload) =>
		fetch(`${BASE}/hangouts`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		}).then(handle),
	completeHangout: (id) =>
		fetch(`${BASE}/hangouts/${id}/complete`, { method: "PATCH" }).then(handle),
	saveHangoutFeedback: (id, payload) =>
		fetch(`${BASE}/hangouts/${id}/feedback`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		}).then(handle),
	deleteHangout: (id) => fetch(`${BASE}/hangouts/${id}`, { method: "DELETE" }).then(handle),

	// Expense tracker
	getExpenses: () => fetch(`${BASE}/expenses`).then(handle),
	createExpense: (payload) =>
		fetch(`${BASE}/expenses`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		}).then(handle),
	deleteExpense: (id) => fetch(`${BASE}/expenses/${id}`, { method: "DELETE" }).then(handle),
	getExpenseCategories: () => fetch(`${BASE}/expenses/categories`).then(handle),
	addExpenseCategory: (name) =>
		fetch(`${BASE}/expenses/categories`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name }),
		}).then(handle),
	getMonthSummary: (month) => fetch(`${BASE}/expenses/summary/month?month=${month}`).then(handle),
	getOverallSummary: () => fetch(`${BASE}/expenses/summary/overall`).then(handle),
	getYearSummary: (year) => fetch(`${BASE}/expenses/summary/year?year=${year}`).then(handle),
	backfillInvestmentExpenses: () =>
		fetch(`${BASE}/expenses/backfill-investments`, {
			method: "POST",
			headers: adminHeaders(),
		}).then(handle),

	// Friends (group expenses)
	getFriends: () => fetch(`${BASE}/friends`).then(handle),
	createFriend: (name, mobile_number) =>
		fetch(`${BASE}/friends`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name, mobile_number }),
		}).then(handle),
	deleteFriend: (id) => fetch(`${BASE}/friends/${id}`, { method: "DELETE" }).then(handle),

	// Activities (group expenses)
	getActivities: () => fetch(`${BASE}/activities`).then(handle),
	createActivity: (name, friend_ids) =>
		fetch(`${BASE}/activities`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name, friend_ids }),
		}).then(handle),
	addActivityMember: (activityId, friend_id) =>
		fetch(`${BASE}/activities/${activityId}/members`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ friend_id }),
		}).then(handle),
	removeActivityMember: (activityId, friendId) =>
		fetch(`${BASE}/activities/${activityId}/members/${friendId}`, { method: "DELETE" }).then(handle),
	addActivityPayment: (activityId, payload) =>
		fetch(`${BASE}/activities/${activityId}/payments`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		}).then(handle),
	deleteActivityPayment: (activityId, paymentId) =>
		fetch(`${BASE}/activities/${activityId}/payments/${paymentId}`, { method: "DELETE" }).then(handle),
	settleActivityDebt: (activityId, payload) =>
		fetch(`${BASE}/activities/${activityId}/settle`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		}).then(handle),
	toggleActivityComplete: (activityId) =>
		fetch(`${BASE}/activities/${activityId}/toggle-complete`, { method: "PATCH" }).then(handle),
	deleteActivity: (id) => fetch(`${BASE}/activities/${id}`, { method: "DELETE" }).then(handle),
};
