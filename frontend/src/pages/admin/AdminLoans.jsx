import React, { useEffect, useState } from "react";
import { api } from "../../api.js";

export default function AdminLoans() {
	const [loans, setLoans] = useState([]);
	const [busyId, setBusyId] = useState(null);

	useEffect(() => {
		load();
	}, []);

	function load() {
		api.getLoans().then(setLoans);
	}

	async function approve(id) {
		setBusyId(id);
		try {
			const { autoPaidPayment } = await api.approveLoan(id);
			load();
			if (autoPaidPayment) {
				alert(`Loan approved — it auto-paid a due SIP payment of ₹${autoPaidPayment.amount}!`);
			}
		} catch (e) {
			alert(e.message);
		}
		setBusyId(null);
	}

	async function reject(id) {
		setBusyId(id);
		await api.rejectLoan(id);
		load();
		setBusyId(null);
	}

	async function markPaid(id) {
		setBusyId(id);
		await api.markLoanPaid(id);
		load();
		setBusyId(null);
	}

	return (
		<div className="card">
			<div className="admin-section-title">
				<h2>🐖 Loan requests</h2>
				<span className="badge">{loans.filter((l) => l.status === "requested").length} pending</span>
			</div>

			{loans.length === 0 && <p className="empty-state">No loan requests yet.</p>}

			<div className="admin-list">
				{loans.map((l) => (
					<div key={l.id} className="admin-row">
						<div>
							<strong>₹{l.amount}</strong> requested {new Date(l.requested_at).toLocaleDateString()}
							{l.notes && <p style={{ fontSize: 13, fontStyle: "italic", margin: "4px 0 0" }}>"{l.notes}"</p>}
							<div>
								<span
									className={`badge ${
										l.status === "paid" ? "ok" : l.status === "rejected" ? "danger" : l.status === "approved" ? "warn" : ""
									}`}
								>
									{l.status}
								</span>
								{l.status === "approved" && (
									<span className="badge warn" style={{ marginLeft: 6 }}>
										owes ₹{l.currentlyOwed} now
									</span>
								)}
							</div>
						</div>
						<div className="admin-row-actions">
							{l.status === "requested" && (
								<>
									<button className="btn btn-mint" disabled={busyId === l.id} onClick={() => approve(l.id)}>
										✅ Approve
									</button>
									<button className="btn btn-ghost" disabled={busyId === l.id} onClick={() => reject(l.id)}>
										Reject
									</button>
								</>
							)}
							{l.status === "approved" && (
								<button className="btn btn-secondary" disabled={busyId === l.id} onClick={() => markPaid(l.id)}>
									Mark fully paid back
								</button>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
