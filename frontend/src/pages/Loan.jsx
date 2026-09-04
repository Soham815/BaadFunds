import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import "./Loan.css";

export default function Loan() {
	const [loans, setLoans] = useState([]);
	const [amount, setAmount] = useState("");
	const [notes, setNotes] = useState("");
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		load();
	}, []);

	function load() {
		api.getLoans().then(setLoans);
	}

	async function handleSubmit(e) {
		e.preventDefault();
		setBusy(true);
		try {
			await api.requestLoan(Number(amount), notes);
			setAmount("");
			setNotes("");
			load();
		} catch (err) {
			alert(err.message);
		}
		setBusy(false);
	}

	return (
		<div className="loan-page">
			<div className="card loan-intro">
				<h1>🐖 Emergency piggy loan</h1>
				<p>
					Short on cash before your next payment? You can request a small loan here. It
					carries <strong>50% interest a month</strong> — so it's really only for
					"paying back tomorrow" situations, not a long-term plan! Once approved, it'll
					automatically cover your next due SIP payment.
				</p>
			</div>

			<div className="card loan-form">
				<h2>Request a loan</h2>
				<form onSubmit={handleSubmit}>
					<div className="field">
						<label>How much do you need? (₹)</label>
						<input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required />
					</div>
					<div className="field">
						<label>Anything Soham should know? (optional)</label>
						<textarea rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} />
					</div>
					<button className="btn" disabled={busy}>
						{busy ? "Sending…" : "🙏 Ask Soham"}
					</button>
				</form>
			</div>

			<div className="loan-list">
				<h2>Your loans</h2>
				{loans.length === 0 && <p className="empty-state">No loans yet — good job staying afloat! 🌊</p>}
				{loans.map((loan) => (
					<div className="card loan-item" key={loan.id}>
						<div>
							<strong>₹{loan.amount}</strong> requested{" "}
							{new Date(loan.requested_at).toLocaleDateString()}
							{loan.notes && <p className="loan-notes">"{loan.notes}"</p>}
						</div>
						<div className="loan-status-block">
							<span className={`loan-status status-${loan.status}`}>{loan.status}</span>
							{loan.status !== "paid" && loan.approved_at && (
								<span className="loan-owed">Currently owe: ₹{loan.currentlyOwed}</span>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
