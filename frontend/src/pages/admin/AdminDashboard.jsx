import React, { useState } from "react";
import "../../styles/Admin.css";
import AdminPlans from "./AdminPlans.jsx";
import AdminApprovals from "./AdminApprovals.jsx";
import AdminWithdrawals from "./AdminWithdrawals.jsx";
import AdminLoans from "./AdminLoans.jsx";
import AdminCoupons from "./AdminCoupons.jsx";
import AdminDueReminderPopup from "../../components/AdminDueReminderPopup.jsx";

const TABS = [
	{ id: "approvals", label: "💰 Payments", Component: AdminApprovals },
	{ id: "plans", label: "🌱 Plans", Component: AdminPlans },
	{ id: "withdrawals", label: "🥟 Withdrawals", Component: AdminWithdrawals },
	{ id: "loans", label: "🐖 Loans", Component: AdminLoans },
	{ id: "coupons", label: "🎁 Coupons", Component: AdminCoupons },
];

export default function AdminDashboard() {
	const [tab, setTab] = useState("approvals");
	const Active = TABS.find((t) => t.id === tab).Component;

	function logout() {
		localStorage.removeItem("baadfunds_admin_token");
		window.location.reload();
	}

	return (
		<div className="admin-shell">
			<AdminDueReminderPopup />

			<div className="admin-header">
				<h1>🧑‍💻 Soham's Control Room</h1>
				<button className="admin-logout" onClick={logout}>
					Log out
				</button>
			</div>

			<div className="admin-tabs">
				{TABS.map((t) => (
					<button
						key={t.id}
						className={`admin-tab ${tab === t.id ? "active" : ""}`}
						onClick={() => setTab(t.id)}
					>
						{t.label}
					</button>
				))}
			</div>

			<Active />
		</div>
	);
}
