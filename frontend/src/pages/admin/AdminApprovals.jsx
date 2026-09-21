import React, { useEffect, useState } from "react";
import { api } from "../../api.js";
import { baadWhatsAppLink, penaltyReminderMessage } from "../../utils/whatsapp.js";

export default function AdminApprovals() {
	const [pending, setPending] = useState([]);
	const [penalties, setPenalties] = useState([]);
	const [busyId, setBusyId] = useState(null);

	useEffect(() => {
		load();
	}, []);

	function load() {
		api.getPendingPayments().then(setPending);
		api.getUnpaidPenalties().then(setPenalties);
	}

	async function approve(id) {
		setBusyId(id);
		try {
			await api.approvePayment(id);
			load();
		} catch (e) {
			alert(e.message);
		}
		setBusyId(null);
	}

	async function reject(id) {
		setBusyId(id);
		try {
			await api.rejectPayment(id);
			load();
		} catch (e) {
			alert(e.message);
		}
		setBusyId(null);
	}

	async function markPenaltyPaid(id, paid) {
		await api.setPenaltyPaid(id, paid);
		load();
	}

	function remindPenalty(p) {
		window.open(baadWhatsAppLink(penaltyReminderMessage(p)), "_blank");
	}

	const [backfilling, setBackfilling] = useState(false);
	async function backfillExpenses() {
		setBackfilling(true);
		try {
			const { backfilled } = await api.backfillInvestmentExpenses();
			alert(
				backfilled > 0
					? `Added ${backfilled} past investment payment(s) to the expense tracker!`
					: "Nothing to backfill — the expense tracker is already up to date."
			);
		} catch (e) {
			alert(e.message);
		}
		setBackfilling(false);
	}

	return (
		<div>
			<div className="card">
				<div className="admin-section-title">
					<h2>Payments waiting for you</h2>
					<span className="badge">{pending.length} pending</span>
				</div>

				{pending.length === 0 && <p className="empty-state">All caught up! 🎉</p>}

				<div className="admin-list">
					{pending.map((p) => (
						<div key={p.id} className="admin-row">
							<div>
								<strong>₹{p.amount}</strong> — {p.investments?.plan_name_snapshot || "Plan"} · due{" "}
								{new Date(p.due_date).toLocaleDateString()}
								<div>
									{p.status === "attempted" ? (
										<span className="badge ok">attempted via {p.method}</span>
									) : (
										<span className="badge warn">not attempted yet</span>
									)}
									{p.is_penalty && <span className="badge danger" style={{ marginLeft: 6 }}>🍔 late</span>}
								</div>
							</div>
							<div className="admin-row-actions">
								<button className="btn btn-mint" disabled={busyId === p.id} onClick={() => approve(p.id)}>
									✅ Approve
								</button>
								{p.status === "attempted" && (
									<button className="btn btn-ghost" disabled={busyId === p.id} onClick={() => reject(p.id)}>
										Reject attempt
									</button>
								)}
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="card" style={{ marginTop: 20 }}>
				<div className="admin-section-title">
					<h2>🍔 Unpaid penalties</h2>
					<span className="badge danger">{penalties.length}</span>
				</div>
				{penalties.length === 0 && <p className="empty-state">No penalties owed right now.</p>}
				<div className="admin-list">
					{penalties.map((p) => (
						<div key={p.id} className="admin-row">
							<div>
								{p.penalty_units} {p.penalty_item} owed — {p.investments?.plan_name_snapshot} (payment due{" "}
								{new Date(p.due_date).toLocaleDateString()})
							</div>
							<div className="admin-row-actions">
								<button className="btn btn-mint" onClick={() => remindPenalty(p)}>
									💌 Remind on WhatsApp
								</button>
								<button className="btn btn-secondary" onClick={() => markPenaltyPaid(p.id, true)}>
									Mark as paid
								</button>
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="card" style={{ marginTop: 20 }}>
				<div className="admin-section-title">
					<h2>💸 Expense tracker sync</h2>
				</div>
				<p>
					Approved investment payments are logged into Baad's expense tracker automatically
					going forward. If you're setting this up on an older account, run this once to
					backfill everything approved before this feature existed.
				</p>
				<button className="btn btn-secondary" disabled={backfilling} onClick={backfillExpenses}>
					{backfilling ? "Backfilling…" : "🔄 Backfill past investment payments"}
				</button>
			</div>
		</div>
	);
}
