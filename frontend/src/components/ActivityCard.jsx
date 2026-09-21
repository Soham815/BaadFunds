import React, { useState } from "react";
import { api } from "../api.js";
import { whatsAppLinkTo, activityDebtMessage } from "../utils/whatsapp.js";
import "../styles/ActivityCard.css";

export default function ActivityCard({ activity, allFriends, onChange }) {
	const [expanded, setExpanded] = useState(false);
	const [amount, setAmount] = useState("");
	const [reason, setReason] = useState("");
	const [payerKey, setPayerKey] = useState("baad");
	const [busy, setBusy] = useState(false);
	const [addFriendId, setAddFriendId] = useState("");

	const memberKeys = new Set(activity.members.map((m) => m.key));
	const availableFriends = (allFriends || []).filter((f) => !memberKeys.has(f.id));

	async function handleAddPayment(e) {
		e.preventDefault();
		if (!amount) return;
		setBusy(true);
		try {
			await api.addActivityPayment(activity.id, {
				amount: Number(amount),
				reason,
				payer_type: payerKey === "baad" ? "baad" : "friend",
				payer_friend_id: payerKey === "baad" ? undefined : payerKey,
			});
			setAmount("");
			setReason("");
			onChange();
		} catch (err) {
			alert(err.message);
		}
		setBusy(false);
	}

	async function handleAddMember() {
		if (!addFriendId) return;
		await api.addActivityMember(activity.id, addFriendId);
		setAddFriendId("");
		onChange();
	}

	async function markSettled(settlement) {
		try {
			await api.settleActivityDebt(activity.id, {
				amount: settlement.amount,
				payer_type: settlement.from.type,
				payer_friend_id: settlement.from.type === "friend" ? settlement.from.key : undefined,
				receiver_type: settlement.to.type,
				receiver_friend_id: settlement.to.type === "friend" ? settlement.to.key : undefined,
				reason: activity.name,
			});
			onChange();
		} catch (err) {
			alert(err.message);
		}
	}

	function remindOnWhatsApp(settlement) {
		const message = activityDebtMessage({
			activityName: activity.name,
			amount: settlement.amount,
			toName: settlement.to.name,
		});
		window.open(whatsAppLinkTo(settlement.from.mobile_number, message), "_blank");
	}

	async function removePayment(paymentId) {
		if (!confirm("Remove this entry?")) return;
		await api.deleteActivityPayment(activity.id, paymentId);
		onChange();
	}

	async function toggleComplete() {
		await api.toggleActivityComplete(activity.id);
		onChange();
	}

	async function removeActivity() {
		if (!confirm(`Delete "${activity.name}" for good?`)) return;
		await api.deleteActivity(activity.id);
		onChange();
	}

	return (
		<div className={`card activity-card ${activity.is_completed ? "activity-card-done" : ""}`}>
			<div className="activity-card-head" onClick={() => setExpanded((v) => !v)}>
				<h3>{activity.name}</h3>
				<span className="pill-tag">{activity.members.length} member{activity.members.length === 1 ? "" : "s"}</span>
				<span className="activity-expand-arrow">{expanded ? "▲" : "▼"}</span>
			</div>

			{expanded && (
				<div className="activity-card-body">
					<div className="activity-members-row">
						{activity.members.map((m) => (
							<span key={m.key} className="pill-tag">
								{m.type === "baad" ? "🐷 You" : m.name}
							</span>
						))}
						{availableFriends.length > 0 && (
							<div className="activity-add-member">
								<select value={addFriendId} onChange={(e) => setAddFriendId(e.target.value)}>
									<option value="">+ Add friend...</option>
									{availableFriends.map((f) => (
										<option key={f.id} value={f.id}>
											{f.name}
										</option>
									))}
								</select>
								<button className="btn btn-ghost" onClick={handleAddMember} disabled={!addFriendId}>
									Add
								</button>
							</div>
						)}
					</div>

					<form onSubmit={handleAddPayment} className="activity-payment-form">
						<div className="grid cols-3">
							<div className="field">
								<label>Amount (₹)</label>
								<input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
							</div>
							<div className="field">
								<label>Who paid?</label>
								<select value={payerKey} onChange={(e) => setPayerKey(e.target.value)}>
									<option value="baad">🐷 You</option>
									{activity.members
										.filter((m) => m.type === "friend")
										.map((m) => (
											<option key={m.key} value={m.key}>
												{m.name}
											</option>
										))}
								</select>
							</div>
							<div className="field">
								<label>Reason (optional)</label>
								<input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Dinner" />
							</div>
						</div>
						<button className="btn btn-mint" disabled={busy}>
							➕ Split this cost
						</button>
					</form>

					<div className="activity-section">
						<h4>Who owes who</h4>
						{activity.settlements.length === 0 && <p className="empty-state">Everyone's settled up! 🎉</p>}
						<div className="activity-list">
							{activity.settlements.map((s, i) => (
								<div key={i} className="activity-row">
									<div>
										<strong>{s.from.name}</strong> owes <strong>{s.to.name}</strong> ₹{s.amount}
									</div>
									<div className="activity-row-actions">
										{s.from.type === "friend" && s.from.mobile_number && (
											<button className="btn btn-ghost" onClick={() => remindOnWhatsApp(s)}>
												💌 Remind
											</button>
										)}
										<button className="btn btn-secondary" onClick={() => markSettled(s)}>
											✓ Mark settled
										</button>
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="activity-section">
						<h4>Ledger</h4>
						<div className="activity-list">
							{activity.payments.map((p) => (
								<div key={p.id} className="activity-row activity-ledger-row">
									<div>
										{p.type === "settlement" ? "💸 Settlement" : "🧾"} ₹{p.amount}
										{p.reason && ` — ${p.reason}`}
										<span className="activity-ledger-date"> · {new Date(p.paid_at).toLocaleDateString()}</span>
									</div>
									<button className="expense-delete-btn" onClick={() => removePayment(p.id)}>
										🗑️
									</button>
								</div>
							))}
							{activity.payments.length === 0 && <p className="empty-state">No costs logged yet.</p>}
						</div>
					</div>

					<div className="activity-footer">
						<button className="btn btn-ghost" onClick={toggleComplete}>
							{activity.is_completed ? "↩️ Reopen activity" : "✅ Mark activity done"}
						</button>
						<button className="btn btn-ghost" onClick={removeActivity}>
							🗑️ Delete activity
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
