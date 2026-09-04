import React, { useEffect, useState } from "react";
import { api } from "../../api.js";

export default function AdminWithdrawals() {
	const [withdrawals, setWithdrawals] = useState([]);
	const [busyId, setBusyId] = useState(null);

	useEffect(() => {
		load();
	}, []);

	function load() {
		api.getWithdrawals().then(setWithdrawals);
	}

	async function approve(id) {
		setBusyId(id);
		try {
			await api.approveWithdrawal(id);
			load();
		} catch (e) {
			alert(e.message);
		}
		setBusyId(null);
	}

	async function reject(id) {
		setBusyId(id);
		try {
			await api.rejectWithdrawal(id);
			load();
		} catch (e) {
			alert(e.message);
		}
		setBusyId(null);
	}

	async function toggleCharge(id, current) {
		await api.setChargePaid(id, !current);
		load();
	}

	return (
		<div className="card">
			<div className="admin-section-title">
				<h2>🥟 Withdrawal requests</h2>
				<span className="badge">{withdrawals.filter((w) => w.status === "pending").length} pending</span>
			</div>

			{withdrawals.length === 0 && <p className="empty-state">No withdrawal requests yet.</p>}

			<div className="admin-list">
				{withdrawals.map((w) => (
					<div key={w.id} className="admin-row">
						<div>
							<strong>{w.investments?.plan_name_snapshot}</strong> — requested{" "}
							{new Date(w.requested_at).toLocaleDateString()}
							<div>
								<span className={`badge ${w.status === "approved" ? "ok" : w.status === "rejected" ? "danger" : "warn"}`}>
									{w.status}
								</span>
								{w.is_before_maturity && (
									<span className="badge danger" style={{ marginLeft: 6 }}>
										early — {w.charge_units} {w.charge_item} owed
										{w.charge_paid ? " (paid)" : " (unpaid)"}
									</span>
								)}
							</div>
						</div>
						<div className="admin-row-actions">
							{w.status === "pending" && (
								<>
									<button className="btn btn-mint" disabled={busyId === w.id} onClick={() => approve(w.id)}>
										✅ Approve
									</button>
									<button className="btn btn-ghost" disabled={busyId === w.id} onClick={() => reject(w.id)}>
										Reject
									</button>
								</>
							)}
							{w.is_before_maturity && (
								<button className="btn btn-secondary" onClick={() => toggleCharge(w.id, w.charge_paid)}>
									{w.charge_paid ? "Mark unpaid" : "Mark charge paid"}
								</button>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
